import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import axios from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Search,
  RefreshCw,
  Filter,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Chrome,
  Zap,
  User,
  Calendar,
} from 'lucide-react';
import MatrixBackground from '@/components/ui/MatrixBackground';

interface Session {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  username?: string;
  email?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  deviceFingerprint: string;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReason?: string;
  isBlocked: boolean;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  blockedSessions: number;
  deviceBreakdown: Array<{ _id: string; count: number }>;
  topBrowsers: Array<{ _id: string; count: number }>;
}

interface User {
  _id: string;
  username: string;
  email: string;
  roles: string[];
}

const SessionManagementPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuspicious, setShowSuspicious] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog states
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [page, selectedUser, selectedDevice, selectedStatus, searchTerm, showSuspicious]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/v1/admin/activity-logs/users`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
      };

      if (selectedUser && selectedUser !== 'all') params.userId = selectedUser;
      if (selectedDevice && selectedDevice !== 'all') params.deviceType = selectedDevice;
      if (selectedStatus && selectedStatus !== 'all') params.isActive = selectedStatus === 'active';
      if (searchTerm) params.search = searchTerm;
      if (showSuspicious) params.isSuspicious = true;

      const response = await axios.get(`/api/v1/admin/sessions`, { params });
      
      setSessions(response.data.data.sessions);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (selectedUser && selectedUser !== 'all') params.userId = selectedUser;

      const response = await axios.get(`/api/v1/admin/sessions/stats`, { params });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTerminateSession = async () => {
    if (!selectedSession) return;
    
    try {
      setActionLoading(true);
      await axios.post(`/api/v1/admin/sessions/${selectedSession._id}/terminate`);
      
      setTerminateDialogOpen(false);
      setSelectedSession(null);
      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error('Error terminating session:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateAllUserSessions = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate all sessions for this user?')) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/v1/admin/sessions/user/${userId}/terminate-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      
      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error('Error terminating user sessions:', error);
    }
  };

  const resetFilters = () => {
    setSelectedUser('all');
    setSelectedDevice('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setShowSuspicious(false);
    setPage(1);
  };

  const getDeviceIcon = (deviceType: string) => {
    const icons: Record<string, any> = {
      desktop: <Monitor size={16} />,
      mobile: <Smartphone size={16} />,
      tablet: <Tablet size={16} />,
      unknown: <Globe size={16} />,
    };
    return icons[deviceType] || <Globe size={16} />;
  };

  const getBrowserIcon = (browser: string) => {
    const browserLower = browser.toLowerCase();
    if (browserLower.includes('chrome')) return <Chrome size={16} />;
    if (browserLower.includes('firefox')) return <Globe size={16} className="text-orange-400" />;
    return <Globe size={16} />;
  };

  const getStatusBadge = (session: Session) => {
    if (session.isBlocked) {
      return (
        <Badge className="text-red-400 bg-red-400/10 border-0">
          <XCircle size={12} className="mr-1" />
          Blocked
        </Badge>
      );
    }
    if (session.isSuspicious) {
      return (
        <Badge className="text-yellow-400 bg-yellow-400/10 border-0">
          <AlertTriangle size={12} className="mr-1" />
          Suspicious
        </Badge>
      );
    }
    if (session.isActive) {
      return (
        <Badge className="text-green-400 bg-green-400/10 border-0">
          <CheckCircle size={12} className="mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="text-gray-400 bg-gray-400/10 border-0">
        <XCircle size={12} className="mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite relative">
      <MatrixBackground />
      <motion.div
        className="p-8 pt-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded bg-blue-700/10 text-white">
                <Shield size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Session Management</h1>
                <p className="text-sm text-gray-400">
                  Monitor and control active user sessions across the platform
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  fetchSessions();
                  fetchStats();
                }}
                className="bg-[hsl(var(--crimsonRed))] hover:bg-[hsl(var(--crimsonRed),.85)] text-white"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {stats.totalSessions}
                  </div>
                  <div className="text-sm text-gray-400">Total Sessions</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {stats.activeSessions}
                  </div>
                  <div className="text-sm text-gray-400">Active Sessions</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    {stats.suspiciousSessions}
                  </div>
                  <div className="text-sm text-gray-400">Suspicious</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-red-400 mb-2">
                    {stats.blockedSessions}
                  </div>
                  <div className="text-sm text-gray-400">Blocked</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Filters Section */}
        <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-coolWhite text-lg">
              <Filter className="mr-2 text-blue-400" size={20} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Device Type</label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm">
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search by IP, location, browser..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="border-gray-700"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setShowSuspicious(!showSuspicious)}
                variant="outline"
                size="sm"
                className={`border-gray-700 ${showSuspicious ? 'bg-yellow-400/10 text-yellow-400' : ''}`}
              >
                <AlertTriangle size={14} className="mr-1" />
                {showSuspicious ? 'Showing Suspicious' : 'Show Suspicious Only'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-coolWhite">Active Sessions</CardTitle>
            <CardDescription className="text-gray-400">
              Total of {sessions.length} sessions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-coolWhite/10 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Shield size={48} className="mx-auto mb-4 opacity-20" />
                <p>No sessions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-darkGray/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-blue-400" />
                            <span className="font-medium">
                              {session.username || session.userId?.username}
                            </span>
                          </div>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-400">
                            {session.email || session.userId?.email}
                          </span>
                          {getStatusBadge(session)}
                          {session.isSuspicious && session.suspiciousReason && (
                            <Badge className="text-orange-400 bg-orange-400/10 border-0 text-xs">
                              {session.suspiciousReason}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceType)}
                            <div>
                              <div className="text-gray-400 text-xs">Device</div>
                              <div className="text-coolWhite capitalize">{session.deviceType}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getBrowserIcon(session.browser)}
                            <div>
                              <div className="text-gray-400 text-xs">Browser</div>
                              <div className="text-coolWhite">
                                {session.browser}
                                {session.browserVersion && ` ${session.browserVersion}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Globe size={16} className="text-purple-400" />
                            <div>
                              <div className="text-gray-400 text-xs">IP Address</div>
                              <div className="text-coolWhite font-mono text-xs">{session.ipAddress}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-green-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Location</div>
                              <div className="text-coolWhite">
                                {session.location?.city && session.location?.country
                                  ? `${session.location.city}, ${session.location.country}`
                                  : session.location?.country || 'Unknown'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Monitor size={16} className="text-cyan-400" />
                            <div>
                              <div className="text-gray-400 text-xs">OS</div>
                              <div className="text-coolWhite">
                                {session.os}
                                {session.osVersion && ` ${session.osVersion}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-yellow-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Last Activity</div>
                              <div className="text-coolWhite">{getTimeAgo(session.lastActivity)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Created</div>
                              <div className="text-coolWhite text-xs">{formatDate(session.createdAt)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-orange-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Fingerprint</div>
                              <div className="text-coolWhite font-mono text-xs truncate max-w-[120px]">
                                {session.deviceFingerprint.substring(0, 12)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {session.isActive && !session.isBlocked && (
                          <Button
                            onClick={() => {
                              setSelectedSession(session);
                              setTerminateDialogOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="border-red-400/50 text-red-400 hover:bg-red-400/10"
                          >
                            <LogOut size={14} className="mr-1" />
                            Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="border-gray-700"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={
                          page === pageNum
                            ? 'bg-[hsl(var(--crimsonRed))] text-white'
                            : 'border-gray-700'
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-gray-700"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Terminate Session Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent className="bg-jetBlack border-gray-700 text-coolWhite">
          <DialogHeader>
            <DialogTitle>Terminate Session</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to terminate this session? The user will be logged out immediately.
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">User:</span>
                <span>{selectedSession.username || selectedSession.userId?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Device:</span>
                <span className="capitalize">{selectedSession.deviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">IP Address:</span>
                <span className="font-mono">{selectedSession.ipAddress}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTerminateDialogOpen(false)}
              disabled={actionLoading}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTerminateSession}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? 'Terminating...' : 'Terminate Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManagementPage;
