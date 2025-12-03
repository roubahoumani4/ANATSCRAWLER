import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { History, RefreshCw, Eye, Clock, CheckCircle2, XCircle, Loader, Trash2 } from 'lucide-react';

interface Scan {
  jobId: string;
  target: string;
  status: 'pending' | 'running' | 'finished' | 'failed' | 'aborted';
  startTime: string;
  endTime?: string;
  elapsedSeconds?: number;
}

const HistoryPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/assessment/scans?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch scans');
      const data = await res.json();
      setScans(data.scans || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (jobId: string, target: string, status: string) => {
    const action = status === 'running' ? 'abort' : 'delete';
    if (!confirm(`Are you sure you want to ${action} the scan for "${target}"?\n\nJob ID: ${jobId.slice(0, 16)}...\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(jobId);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/assessment/scans/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} scan`);
      }
      
      const result = await res.json();
      
      // If aborted, update the scan status instead of removing it
      if (result.status === 'aborted') {
        setScans(prevScans => prevScans.map(scan => 
          scan.jobId === jobId ? { ...scan, status: 'aborted' } : scan
        ));
      } else {
        // Remove the scan from the list if deleted
        setScans(prevScans => prevScans.filter(scan => scan.jobId !== jobId));
      }
    } catch (e: any) {
      setError(e.message || `Failed to ${action} scan`);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'finished':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'aborted':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-700 text-yellow-100';
      case 'finished':
        return 'bg-emerald-700 text-emerald-100';
      case 'failed':
        return 'bg-red-700 text-red-100';
      case 'aborted':
        return 'bg-orange-700 text-orange-100';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const calculateDuration = (scan: Scan) => {
    if (scan.elapsedSeconds) {
      return `${scan.elapsedSeconds}s`;
    }
    if (scan.startTime && scan.endTime) {
      const start = new Date(scan.startTime).getTime();
      const end = new Date(scan.endTime).getTime();
      const seconds = Math.floor((end - start) / 1000);
      return `${seconds}s`;
    }
    return '—';
  };

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <History className="text-sky-400" size={28} />
            Scan History
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            All assessment scans with their start/end times and statuses
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-2 transition-colors"
            onClick={fetchScans}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            onClick={() => navigate('/osint/assessment')}
          >
            Back to Assessment
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
        {loading && scans.length === 0 ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">
            Loading scan history...
          </div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <History size={48} className="mx-auto mb-4 opacity-50" />
            <p>No scans found. Start a new assessment to see results here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 text-left">Job ID</th>
                  <th className="py-3 px-4 text-left">Target</th>
                  <th className="py-3 px-4 text-left">Start Time</th>
                  <th className="py-3 px-4 text-left">End Time</th>
                  <th className="py-3 px-4 text-left">Duration</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {scans.map((scan) => (
                  <tr 
                    key={scan.jobId} 
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                      {scan.jobId.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {scan.target}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {scan.startTime ? new Date(scan.startTime).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {scan.endTime ? new Date(scan.endTime).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {calculateDuration(scan)}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(scan.status)}`}
                      >
                        {getStatusIcon(scan.status)}
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          onClick={() => navigate(`/osint/assessment/output?jobId=${encodeURIComponent(scan.jobId)}`)}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button 
                          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => deleteScan(scan.jobId, scan.target, scan.status)}
                          disabled={deleting === scan.jobId}
                        >
                          {deleting === scan.jobId ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          {scan.status === 'running' ? 'Abort' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
