import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  Globe,
  Database,
  Activity,
  MapPin,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

interface BreachData {
  id: string;
  name: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  modifiedDate?: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  isSpamList: boolean;
  isMalware: boolean;
  logoPath?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface TimelineData {
  month: string;
  count: number;
  totalAccounts: number;
  breaches?: string[];
}

interface TrendingDatabase {
  name: string;
  domain: string;
  pwnCount: number;
  addedDate: string;
  severity: string;
  dataTypes: number;
}

interface GeoData {
  country: string;
  count: number;
  percentage: string;
}

interface LiveStats {
  totalBreaches: number;
  totalAccounts: number;
  recentBreaches: number;
  criticalBreaches: number;
  verifiedBreaches: number;
  verificationRate: string;
}

const ThreatIntelligencePage: React.FC = () => {
  const [breaches, setBreaches] = useState<BreachData[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [trending, setTrending] = useState<TrendingDatabase[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedBreach, setSelectedBreach] = useState<BreachData | null>(null);

  // Fetch all data
  const fetchThreatData = async () => {
    setLoading(true);
    try {
      // Add timestamp to prevent caching issues
      const timestamp = Date.now();
      const [breachesRes, timelineRes, trendingRes, geoRes, statsRes] = await Promise.all([
        axios.get(`/api/v1/threat-intel/recent-breaches?_t=${timestamp}`),
        axios.get(`/api/v1/threat-intel/breach-timeline?days=365&_t=${timestamp}`),
        axios.get(`/api/v1/threat-intel/trending-databases?_t=${timestamp}`),
        axios.get(`/api/v1/threat-intel/geographic-distribution?_t=${timestamp}`),
        axios.get(`/api/v1/threat-intel/live-stats?_t=${timestamp}`)
      ]);

      console.log('📊 API Responses:', {
        breaches: breachesRes.data,
        breachCount: breachesRes.data.data?.length || 0,
        timeline: timelineRes.data.data?.length || 0,
        trending: trendingRes.data.data?.length || 0,
        geo: geoRes.data.data?.length || 0,
        stats: statsRes.data.data
      });

      const breachesData = breachesRes.data.data || [];
      console.log('🔍 Setting breaches state:', breachesData.length, 'items');
      console.log('First breach:', breachesData[0]);

      setBreaches(breachesData);
      setTimeline(timelineRes.data.data || []);
      setTrending(trendingRes.data.data || []);
      setGeoData(geoRes.data.data || []);
      setLiveStats(statsRes.data.data || null);
      setLastUpdate(new Date());
      
      console.log('✅ State updated');
    } catch (error) {
      console.error('Error fetching threat intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchThreatData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading && breaches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading Threat Intelligence Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="w-10 h-10 text-cyan-400" />
              Threat Intelligence Feed
            </h1>
            <p className="text-gray-400 mt-2">Real-time monitoring of global security breaches and threats</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-300">{lastUpdate.toLocaleTimeString()}</p>
            </div>
            <button
              onClick={fetchThreatData}
              className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
            >
              <RefreshCw className={`w-5 h-5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-3 rounded-lg border transition-all ${
                autoRefresh
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
              }`}
            >
              <Activity className="w-5 h-5 inline mr-2" />
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Live Stats Cards */}
        {liveStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <Database className="w-8 h-8 text-cyan-400" />
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Total</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{liveStats.totalBreaches}</h3>
              <p className="text-xs text-gray-400">Total Breaches</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <Eye className="w-8 h-8 text-purple-400" />
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Exposed</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{formatNumber(liveStats.totalAccounts)}</h3>
              <p className="text-xs text-gray-400">Accounts Compromised</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <Zap className="w-8 h-8 text-orange-400" />
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">30d</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{liveStats.recentBreaches}</h3>
              <p className="text-xs text-gray-400">Recent Breaches</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Critical</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{liveStats.criticalBreaches}</h3>
              <p className="text-xs text-gray-400">Critical Severity</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Verified</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{liveStats.verifiedBreaches}</h3>
              <p className="text-xs text-gray-400">Verified Breaches</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-blue-400" />
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Rate</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{liveStats.verificationRate}%</h3>
              <p className="text-xs text-gray-400">Verification Rate</p>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live-feed" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-700/50">
          <TabsTrigger value="live-feed" className="data-[state=active]:bg-cyan-500/20">
            <Activity className="w-4 h-4 mr-2" />
            Live Feed
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-purple-500/20">
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-orange-500/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="geographic" className="data-[state=active]:bg-green-500/20">
            <Globe className="w-4 h-4 mr-2" />
            Geographic
          </TabsTrigger>
        </TabsList>

        {/* Live Feed Tab */}
        <TabsContent value="live-feed" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Breach List */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Recent Breach Discoveries
                  </CardTitle>
                  <CardDescription>Live feed of newly discovered security breaches worldwide</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {(() => {
                      console.log('🎨 Rendering Live Feed - Breaches count:', breaches.length);
                      console.log('🎨 Breaches array:', breaches);
                      return null;
                    })()}
                    {breaches.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <AlertTriangle className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Breach Data Available</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          Unable to fetch threat intelligence data. The APIs may be rate-limited or temporarily unavailable.
                        </p>
                        <button
                          onClick={fetchThreatData}
                          className="mt-6 px-6 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all"
                        >
                          <RefreshCw className="w-4 h-4 inline mr-2" />
                          Retry
                        </button>
                      </div>
                    ) : (
                    <div className="space-y-4">
                      {breaches.map((breach, index) => (
                        <motion.div
                          key={breach.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedBreach(breach)}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-white">{breach.name}</h3>
                                {breach.isVerified && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{breach.domain}</p>
                            </div>
                            <Badge className={getSeverityColor(breach.severity)}>
                              {breach.severity.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Breach Date</p>
                              <p className="text-sm text-white">{formatDate(breach.breachDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Discovered</p>
                              <p className="text-sm text-white">{getRelativeTime(breach.addedDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Accounts Affected</p>
                              <p className="text-sm text-white font-semibold">{formatNumber(breach.pwnCount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Data Types</p>
                              <p className="text-sm text-white">{breach.dataClasses.length} types</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {breach.dataClasses.slice(0, 4).map((dataClass) => (
                              <Badge
                                key={dataClass}
                                variant="outline"
                                className="text-xs bg-slate-700/50 border-slate-600/50"
                              >
                                {dataClass}
                              </Badge>
                            ))}
                            {breach.dataClasses.length > 4 && (
                              <Badge variant="outline" className="text-xs bg-slate-700/50 border-slate-600/50">
                                +{breach.dataClasses.length - 4} more
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 line-clamp-2"
                             dangerouslySetInnerHTML={{ __html: breach.description }}
                          />
                        </motion.div>
                      ))}
                    </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Breach Details Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-900/50 border-slate-700/50 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-cyan-400" />
                    Breach Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedBreach ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{selectedBreach.name}</h3>
                        <Badge className={getSeverityColor(selectedBreach.severity)}>
                          {selectedBreach.severity.toUpperCase()} SEVERITY
                        </Badge>
                      </div>

                      <Separator className="bg-slate-700/50" />

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-300"
                           dangerouslySetInnerHTML={{ __html: selectedBreach.description }}
                        />
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-2">Compromised Data</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedBreach.dataClasses.map((dataClass) => (
                            <Badge
                              key={dataClass}
                              className="bg-red-500/10 text-red-400 border-red-500/20"
                            >
                              {dataClass}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Verified Breach</span>
                          {selectedBreach.isVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Sensitive Data</span>
                          {selectedBreach.isSensitive ? (
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Fabricated</span>
                          {selectedBreach.isFabricated ? (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                      </div>

                      <Separator className="bg-slate-700/50" />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Breach Date</p>
                          <p className="text-white">{formatDate(selectedBreach.breachDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Added Date</p>
                          <p className="text-white">{formatDate(selectedBreach.addedDate)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Pwned Accounts</p>
                          <p className="text-2xl font-bold text-white">{formatNumber(selectedBreach.pwnCount)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Select a breach to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Breach Timeline (Last 12 Months)
              </CardTitle>
              <CardDescription>Historical view of breach discoveries over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((period, index) => (
                  <motion.div
                    key={period.month}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{period.month}</h3>
                        <p className="text-sm text-gray-400">{period.count} breaches discovered</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{formatNumber(period.totalAccounts)}</p>
                        <p className="text-xs text-gray-400">accounts affected</p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.min((period.count / 30) * 100, 100)}%` }}
                      />
                    </div>

                    {period.breaches && period.breaches.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {period.breaches.slice(0, 5).map((breach) => (
                          <Badge key={breach} variant="outline" className="text-xs bg-slate-700/50">
                            {breach}
                          </Badge>
                        ))}
                        {period.breaches.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{period.breaches.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                Trending Breach Databases
              </CardTitle>
              <CardDescription>Most impactful and recent breach databases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trending.map((db, index) => (
                  <motion.div
                    key={db.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{db.name}</h3>
                        <p className="text-xs text-gray-400">{db.domain}</p>
                      </div>
                      <Badge className={getSeverityColor(db.severity)}>
                        {db.severity}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Accounts</span>
                        <span className="text-sm font-bold text-white">{formatNumber(db.pwnCount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Data Types</span>
                        <span className="text-sm text-white">{db.dataTypes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Discovered</span>
                        <span className="text-sm text-white">{getRelativeTime(db.addedDate)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Geographic Distribution of Threats
              </CardTitle>
              <CardDescription>Breach origins by country and region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geoData.map((country, index) => (
                  <motion.div
                    key={country.country}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-green-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">{country.country}</h3>
                          <p className="text-sm text-gray-400">{country.count} breaches</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{country.percentage}%</p>
                        <p className="text-xs text-gray-400">of total</p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThreatIntelligencePage;
