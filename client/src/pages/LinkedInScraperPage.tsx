import React, { useState, useEffect } from 'react';
import { 
  Linkedin, 
  Search, 
  Download, 
  RefreshCw, 
  Trash2, 
  Eye,
  Clock,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2
} from 'lucide-react';

// Use relative URL in production, full URL in development
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

interface LinkedInProfile {
  _id: string;
  profileUrl: string;
  userProfile: {
    fullName: string;
    title?: string;
    location?: {
      city?: string;
      province?: string;
      country?: string;
    };
    photo?: string;
    description?: string;
    url: string;
  };
  experiences: Array<{
    title: string;
    company: string;
    employmentType?: string;
    location?: any;
    startDate?: string;
    endDate?: string;
    endDateIsPresent: boolean;
    description?: string;
    durationInDays?: number;
  }>;
  education: Array<{
    schoolName: string;
    degreeName?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    durationInDays?: number;
  }>;
  skills: Array<{
    skillName: string;
    endorsementCount: number;
  }>;
  scrapedAt: string;
  scrapedBy?: string;
}

const LinkedInScraperPage: React.FC = () => {
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/linkedin/profiles?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!res.ok) {
        // Don't show error for empty profiles, just log it
        console.warn('Could not fetch profiles:', res.status);
        setProfiles([]);
        return;
      }

      const data = await res.json();
      setProfiles(data.data.profiles || []);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      // Don't display error to user on initial load, just set empty array
      setProfiles([]);
    }
  };

  const handleScrape = async () => {
    if (!profileUrl.trim()) {
      setError('Please enter a LinkedIn profile URL');
      return;
    }

    if (!profileUrl.includes('linkedin.com/in/')) {
      setError('Invalid LinkedIn URL. Must contain "linkedin.com/in/"');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/linkedin/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ profileUrl })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scrape profile');
      }

      setSuccess('Profile scraped successfully!');
      setProfileUrl('');
      await fetchProfiles();
    } catch (err: any) {
      console.error('Error scraping profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/linkedin/profile/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to delete profile');

      setSuccess('Profile deleted successfully');
      await fetchProfiles();
      if (selectedProfile?._id === profileId) {
        setSelectedProfile(null);
      }
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setError(err.message);
    }
  };

  const downloadJson = (profile: LinkedInProfile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `linkedin_${profile.userProfile.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatLocation = (location?: { city?: string; province?: string; country?: string }) => {
    if (!location) return 'N/A';
    const parts = [location.city, location.province, location.country].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Linkedin size={28} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-coolWhite">LinkedIn Scraper</h1>
                <p className="text-gray-400 mt-1">Extract and analyze LinkedIn profiles</p>
              </div>
            </div>
            <button
              onClick={fetchProfiles}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-green-400">
            {success}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-400" />
            Scrape LinkedIn Profile
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter LinkedIn profile URL (e.g., https://www.linkedin.com/in/username/)"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-coolWhite placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Scrape Profile
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Make sure the LinkedIn session cookie is configured in the server environment variables.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Profiles List */}
          <div className="xl:col-span-1">
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold">Scraped Profiles ({profiles.length})</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {profiles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Linkedin size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No profiles scraped yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {profiles.map((profile) => (
                      <div
                        key={profile._id}
                        className={`p-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                          selectedProfile?._id === profile._id ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedProfile(profile)}
                      >
                        <div className="flex items-start gap-3">
                          {profile.userProfile.photo ? (
                            <img
                              src={profile.userProfile.photo}
                              alt={profile.userProfile.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                              <Linkedin size={24} className="text-blue-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{profile.userProfile.fullName}</h3>
                            <p className="text-xs text-gray-400 truncate">{profile.userProfile.title || 'No title'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={12} className="text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {new Date(profile.scrapedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadJson(profile);
                              }}
                              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400"
                              title="Download JSON"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(profile._id);
                              }}
                              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="xl:col-span-2">
            {selectedProfile ? (
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye size={20} className="text-blue-400" />
                    Profile Details
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowJson(!showJson)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        showJson ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {showJson ? 'Show Details' : 'Show JSON'}
                    </button>
                    <a
                      href={selectedProfile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View on LinkedIn
                    </a>
                  </div>
                </div>

                <div className="p-6 max-h-[700px] overflow-y-auto">
                  {showJson ? (
                    <pre className="bg-gray-950 rounded p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedProfile, null, 2)}
                    </pre>
                  ) : (
                    <div className="space-y-6">
                      {/* User Profile */}
                      <div>
                        <div className="flex items-start gap-4 mb-4">
                          {selectedProfile.userProfile.photo ? (
                            <img
                              src={selectedProfile.userProfile.photo}
                              alt={selectedProfile.userProfile.fullName}
                              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-600/20 flex items-center justify-center border-2 border-blue-500">
                              <Linkedin size={40} className="text-blue-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold">{selectedProfile.userProfile.fullName}</h3>
                            <p className="text-lg text-gray-300 mt-1">{selectedProfile.userProfile.title}</p>
                            <div className="flex items-center gap-2 mt-2 text-gray-400">
                              <MapPin size={16} />
                              <span>{formatLocation(selectedProfile.userProfile.location)}</span>
                            </div>
                            {selectedProfile.userProfile.description && (
                              <p className="mt-3 text-sm text-gray-400">{selectedProfile.userProfile.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Experience */}
                      {selectedProfile.experiences.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Briefcase size={20} className="text-amber-400" />
                            Experience
                          </h4>
                          <div className="space-y-4">
                            {selectedProfile.experiences.slice(0, 5).map((exp, idx) => (
                              <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                                <h5 className="font-semibold">{exp.title}</h5>
                                <p className="text-sm text-gray-300">{exp.company}</p>
                                {exp.location && (
                                  <p className="text-xs text-gray-400">{formatLocation(exp.location)}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <Calendar size={12} />
                                  <span>
                                    {formatDate(exp.startDate)} - {exp.endDateIsPresent ? 'Present' : formatDate(exp.endDate)}
                                  </span>
                                  {exp.durationInDays && (
                                    <span className="ml-2">
                                      ({Math.round(exp.durationInDays / 365)} years)
                                    </span>
                                  )}
                                </div>
                                {exp.description && (
                                  <p className="text-xs text-gray-400 mt-2 line-clamp-3">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {selectedProfile.education.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <GraduationCap size={20} className="text-emerald-400" />
                            Education
                          </h4>
                          <div className="space-y-3">
                            {selectedProfile.education.map((edu, idx) => (
                              <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                                <h5 className="font-semibold">{edu.schoolName}</h5>
                                <p className="text-sm text-gray-300">
                                  {edu.degreeName} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <Calendar size={12} />
                                  <span>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {selectedProfile.skills.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Award size={20} className="text-purple-400" />
                            Skills ({selectedProfile.skills.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedProfile.skills.slice(0, 20).map((skill, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-sm"
                              >
                                <span className="font-medium">{skill.skillName}</span>
                                {skill.endorsementCount > 0 && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    {skill.endorsementCount} endorsements
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-12 text-center">
                <Linkedin size={64} className="mx-auto mb-4 text-blue-400 opacity-30" />
                <h3 className="text-xl font-semibold mb-2">No Profile Selected</h3>
                <p className="text-gray-500">Select a profile from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInScraperPage;
