import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Activity,
  BarChart3,
  TrendingUp,
  Server,
  Zap,
  XCircle,
  Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Machine {
  _id: string;
  machineId: string;
  machineName: string;
  ipAddress: string;
  ownerName: string;
  operatingSystem?: string;
  agentStatus: 'active' | 'inactive' | 'pending';
  lastAuditDate?: string;
  registrationDate: string;
  agentInstallationToken?: string;
}

interface AuditReport {
  _id: string;
  reportId: string;
  machineName: string;
  ipAddress: string;
  ownerName: string;
  auditDate: string;
  auditScore?: number;
  warnings: number;
  suggestions: number;
  findings: any[];
  status: 'completed' | 'failed' | 'pending';
}

interface Stats {
  totalMachines: number;
  activeMachines: number;
  inactiveMachines: number;
  totalReports: number;
  averageAuditScore: number;
  totalWarnings: number;
  totalSuggestions: number;
}

const OSAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMachines: 0,
    activeMachines: 0,
    inactiveMachines: 0,
    totalReports: 0,
    averageAuditScore: 0,
    totalWarnings: 0,
    totalSuggestions: 0
  });
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    machineName: '',
    ipAddress: '',
    ownerName: '',
    operatingSystem: '',
    machineHostname: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [machinesRes, reportsRes, statsRes] = await Promise.all([
        axios.get('/api/v1/os-audit/machines', { withCredentials: true }),
        axios.get('/api/v1/os-audit/reports', { withCredentials: true }),
        axios.get('/api/v1/os-audit/stats', { withCredentials: true })
      ]);

      setMachines(machinesRes.data.machines || []);
      setReports(reportsRes.data.reports || []);
      setStats(statsRes.data.stats || {});
    } catch (error: any) {
      console.error('Error fetching OS Audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/v1/os-audit/machines/register', registrationForm, {
        withCredentials: true
      });

      if (response.data.success) {
        setMachines([...machines, response.data.machine]);
        setRegistrationForm({
          machineName: '',
          ipAddress: '',
          ownerName: '',
          operatingSystem: '',
          machineHostname: ''
        });
        setShowRegisterDialog(false);
        setSelectedMachine(response.data.machine);
        setShowInstallDialog(true);
      }
    } catch (error: any) {
      console.error('Error registering machine:', error);
      alert(error.response?.data?.error || 'Failed to register machine');
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (window.confirm('Are you sure you want to delete this machine? This will also delete all associated reports.')) {
      try {
        await axios.delete(`/api/v1/os-audit/machines/${machineId}`, { withCredentials: true });
        setMachines(machines.filter(m => m._id !== machineId));
        await fetchData();
      } catch (error: any) {
        console.error('Error deleting machine:', error);
        alert(error.response?.data?.error || 'Failed to delete machine');
      }
    }
  };

  const downloadReport = (report: AuditReport) => {
    try {
      // Create report content
      const content = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                         OS AUDIT REPORT - ANATSCRAWLER                         ║
╚════════════════════════════════════════════════════════════════════════════════╝

REPORT ID: ${report.reportId}
Generated: ${new Date(report.auditDate).toLocaleString()}

MACHINE INFORMATION
════════════════════════════════════════════════════════════════════════════════
Machine Name:      ${report.machineName}
IP Address:        ${report.ipAddress}
Owner:             ${report.ownerName}
Operating System:  ${report.operatingSystem || 'Unknown'}
Lynis Version:     ${(report as any).lynisVersion || 'Unknown'}

SECURITY AUDIT RESULTS
════════════════════════════════════════════════════════════════════════════════
Overall Score:     ${report.auditScore || 'N/A'}/100
Warnings:          ${report.warnings}
Suggestions:       ${report.suggestions}
Status:            ${report.status}

${report.findings && report.findings.length > 0 ? `
AUDIT FINDINGS
════════════════════════════════════════════════════════════════════════════════
${report.findings.map((f: any, i: number) => {
  const type = f.type || f.result || 'INFO';
  const category = f.category || f.id || 'GENERAL';
  const description = f.description || f.test || 'No description';
  const details = f.details || f.recommendation || '';
  
  return `
${i + 1}. [${type.toUpperCase()}] ${category}
   Description: ${description}
${details ? `   Details: ${details}` : ''}`;
}).join('\n')}

` : 'No findings recorded.\n'}

RAW AUDIT DATA
════════════════════════════════════════════════════════════════════════════════
Lynis Log File:     ${(report as any).lynisLogFile || '/var/log/lynis.log'}
Lynis Report File:  ${(report as any).lynisReportFile || '/var/log/lynis-report.dat'}

Raw Report Output (first 1000 chars):
${(report as any).rawReport ? (report as any).rawReport.substring(0, 1000) : 'No raw report data'}

════════════════════════════════════════════════════════════════════════════════
Report Generated by ANATSCRAWLER OS Audit
${new Date().toLocaleString()}
════════════════════════════════════════════════════════════════════════════════
      `;

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${report.reportId}-${new Date(report.auditDate).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const downloadAgentScript = (machine: Machine) => {
    try {
      console.log('downloadAgentScript called with machine:', machine);
      
      // Build the agent installation script
      const machineId = machine.machineId;
      const token = machine.agentInstallationToken;
      const machineName = machine.machineName;
      const ownerName = machine.ownerName;
      
      console.log('Machine data extracted:', { machineId, token, machineName, ownerName });

      const script = `#!/bin/bash
# ANATSCRAWLER OS Audit Agent Installation Script
# Machine ID: ${machineId}
# Generated: $(date)

set -e

echo "=================================="
echo "ANATSCRAWLER OS Audit Agent Setup"
echo "=================================="
echo "Machine: ${machineName}"
echo "Owner: ${ownerName}"
echo "Token: ${token}"
echo "=================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

# Detect OS
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"

# Install dependencies based on OS
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    echo "Installing dependencies for Debian/Ubuntu..."
    apt-get update 2>&1 | grep -v "^Err:" || true
    apt-get install -y curl wget git build-essential 2>&1 || {
        echo "⚠️  Some packages failed to install, attempting with --no-install-recommends..."
        apt-get install -y --no-install-recommends curl wget git 2>&1 || true
    }

elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" ]]; then
    echo "Installing dependencies for RHEL/CentOS/Fedora..."
    yum install -y curl wget git gcc make 2>&1 || {
        echo "⚠️  Some packages failed to install, continuing anyway..."
    }

elif [[ "$OS" == "arch" ]]; then
    echo "Installing dependencies for Arch..."
    pacman -Syu --noconfirm curl wget git base-devel 2>&1 || {
        echo "⚠️  Some packages failed to install, continuing anyway..."
    }
fi

echo ""
echo "Installing Lynis..."
# Install Lynis via package manager
if ! command -v lynis &> /dev/null; then
    echo "Installing Lynis from package repository..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt-get install -y lynis 2>&1 || {
            echo "⚠️  Failed to install Lynis via apt, trying alternative..."
            apt-get install -y --no-install-recommends lynis 2>&1 || echo "Could not install Lynis"
        }
    elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" ]]; then
        yum install -y lynis 2>&1 || {
            echo "⚠️  Lynis not available in default repos, trying EPEL..."
            yum install -y epel-release 2>&1 || true
            yum install -y lynis 2>&1 || echo "Could not install Lynis"
        }
    elif [[ "$OS" == "arch" ]]; then
        pacman -S --noconfirm lynis 2>&1 || echo "Could not install Lynis"
    fi
    
    if command -v lynis &> /dev/null; then
        echo "✅ Lynis installed successfully"
    else
        echo "❌ Failed to install Lynis. Please install manually"
    fi
else
    echo "✅ Lynis already installed"
fi

echo ""
echo "Setting up OS Audit Agent..."

# Create agent directory
AGENT_DIR="/opt/anat-os-audit"
mkdir -p "$AGENT_DIR"

# Create the agent script
cat > "$AGENT_DIR/agent.sh" << 'AGENT_SCRIPT_END'
#!/bin/bash

# ANATSCRAWLER OS Audit Agent
AGENT_TOKEN="${token}"
SERVER_URL="https://horus.anatsecurity.fr"
MACHINE_ID="${machineId}"
MACHINE_NAME="${machineName}"
OWNER_NAME="${ownerName}"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Starting ANATSCRAWLER OS Audit                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Lynis is installed
if ! command -v lynis &> /dev/null; then
    echo "❌ Lynis not found. Please install Lynis first"
    exit 1
fi

# Run Lynis audit
echo "⏱️  Running Lynis security audit..."
lynis audit system 2>&1 || true

# Get system information
OS_INFO=$(lsb_release -d 2>/dev/null | sed 's/Description://' | xargs || uname -s || echo "Unknown")
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Define log file paths
LYNIS_LOG="/var/log/lynis.log"
LYNIS_REPORT="/var/log/lynis-report.dat"

# Check if log files exist
if [ ! -f "$LYNIS_LOG" ] || [ ! -f "$LYNIS_REPORT" ]; then
    echo "⚠️  Lynis log files not found"
    exit 1
fi

# Parse results
SCORE=$(grep "^hardening_index=" "$LYNIS_REPORT" 2>/dev/null | cut -d= -f2 || echo "0")
WARNINGS=$(grep -c "^warning\\[\\]=" "$LYNIS_REPORT" 2>/dev/null || echo "0")
SUGGESTIONS=$(grep -c "^suggestion\\[\\]=" "$LYNIS_REPORT" 2>/dev/null || echo "0")

[ -z "$SCORE" ] && SCORE="0"

echo "✅ Audit completed!"
echo "Score: $SCORE | Warnings: $WARNINGS | Suggestions: $SUGGESTIONS"

# Create JSON report
TEMP_JSON="/tmp/lynis_report_$$.json"

# Function to escape JSON
json_escape() {
  python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))" 2>/dev/null <<< "$1" || echo "\"$1\""
}

# Escape values
TOKEN_JSON=$(json_escape "$AGENT_TOKEN")
MACHINE_JSON=$(json_escape "$MACHINE_NAME")
OWNER_JSON=$(json_escape "$OWNER_NAME")
IP_JSON=$(json_escape "$IP_ADDRESS")
OS_JSON=$(json_escape "$OS_INFO")
LYNIS_JSON=$(json_escape "$(lynis --version 2>/dev/null || echo 'unknown')")
LOG_JSON=$(json_escape "$(cat "$LYNIS_LOG" 2>/dev/null | head -c 5000)")
REPORT_JSON=$(json_escape "$(cat "$LYNIS_REPORT" 2>/dev/null | head -c 2000)")

# Build findings array from report
FINDINGS='['
FIRST=1
while IFS='=' read -r key value; do
    if [[ $key == "suggestion"* ]]; then
        IFS='|' read -ra parts <<< "$value"
        cat_val="\${parts[0]}"
        desc="\${parts[1]}"
        if [ -n "$cat_val" ] && [ -n "$desc" ]; then
            [ $FIRST -eq 0 ] && FINDINGS="$FINDINGS,"
            FINDINGS="$FINDINGS{\\"category\\":\\"$cat_val\\",\\"type\\":\\"suggestion\\",\\"description\\":\\"$desc\\"}"
            FIRST=0
        fi
    fi
done < "$LYNIS_REPORT" 2>/dev/null
while IFS='=' read -r key value; do
    if [[ $key == "warning"* ]]; then
        IFS='|' read -ra parts <<< "$value"
        cat_val="\${parts[0]}"
        desc="\${parts[1]}"
        if [ -n "$cat_val" ] && [ -n "$desc" ]; then
            [ $FIRST -eq 0 ] && FINDINGS="$FINDINGS,"
            FINDINGS="$FINDINGS{\\"category\\":\\"$cat_val\\",\\"type\\":\\"warning\\",\\"description\\":\\"$desc\\"}"
            FIRST=0
        fi
    fi
done < "$LYNIS_REPORT" 2>/dev/null
FINDINGS="$FINDINGS]"

# Create JSON payload
cat > "$TEMP_JSON" << EOF_JSON
{
  "agentInstallationToken": $TOKEN_JSON,
  "machineName": $MACHINE_JSON,
  "ipAddress": $IP_JSON,
  "ownerName": $OWNER_JSON,
  "auditData": {
    "operatingSystem": $OS_JSON,
    "auditScore": $SCORE,
    "warnings": $WARNINGS,
    "suggestions": $SUGGESTIONS,
    "systemHardening": $SCORE,
    "lynisVersion": $LYNIS_JSON,
    "auditDuration": 60,
    "rawReport": $LOG_JSON,
    "lynisLogFile": "/var/log/lynis.log",
    "lynisReportFile": "/var/log/lynis-report.dat",
    "logFileContent": $LOG_JSON,
    "reportFileContent": $REPORT_JSON,
    "findings": $FINDINGS,
    "sections": {}
  }
}
EOF_JSON

# Submit report
echo "📤 Submitting report..."
echo "DEBUG: report JSON file content: $TEMP_JSON"
cat "$TEMP_JSON" 2>/dev/null || true
curl -s -X POST "$SERVER_URL/api/v1/os-audit/reports" \\
  -H "Content-Type: application/json" \\
  -d @"$TEMP_JSON" > /dev/null

# Heartbeat
HEARTBEAT_FILE="/tmp/heartbeat_$$.json"
printf '{"agentInstallationToken": %s}\n' "$TOKEN_JSON" > "$HEARTBEAT_FILE"
curl -s -X POST "$SERVER_URL/api/v1/os-audit/agent/heartbeat" \\
  -H "Content-Type: application/json" \\
  -d @"$HEARTBEAT_FILE" > /dev/null
rm -f "$HEARTBEAT_FILE"

rm -f "$TEMP_JSON"

echo "✅ Audit complete!"
AGENT_SCRIPT_END

# Make executable
chmod +x "$AGENT_DIR/agent.sh"

echo "✅ Agent installed at $AGENT_DIR/agent.sh"
echo ""
echo "Running initial audit..."
"$AGENT_DIR/agent.sh"

echo ""
echo "Setup complete! Agent will run daily at 2 AM."
echo "Or manually run: sudo $AGENT_DIR/agent.sh"
`;

      // Download the script
      console.log('Creating blob from script, length:', script.length);
      const blob = new Blob([script], { type: 'text/plain' });
      console.log('Blob created:', blob);
      
      const url = window.URL.createObjectURL(blob);
      console.log('Object URL created:', url);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `os-audit-agent-${machineId}.sh`;
      console.log('Download link prepared:', a.download);
      
      document.body.appendChild(a);
      console.log('Link appended to body, clicking...');
      
      a.click();
      console.log('Link clicked');
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('Cleanup complete');
    } catch (error) {
      console.error('Error downloading agent script:', error);
      console.error('Error stack:', (error as Error).stack);
      alert('Failed to download installation script. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400';
      case 'inactive':
        return 'bg-red-500/10 text-red-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-jetBlack text-coolWhite">
        <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeIn} className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="w-10 h-10 text-cyan-400" />
              OS Audit
            </h1>
            <p className="text-coolWhite/60 mt-2">Monitor and audit your systems with Lynis</p>
          </div>
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black gap-2">
                <Plus className="w-4 h-4" />
                Register Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-jetBlack border border-coolWhite/10">
              <DialogHeader>
                <DialogTitle className="text-coolWhite">Register New Machine</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegisterMachine} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">Your Name</label>
                  <Input
                    value={registrationForm.ownerName}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, ownerName: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                    className="bg-jetBlack border-coolWhite/10"
                  />
                  <p className="text-xs text-coolWhite/50 mt-1">This name will appear in all audit reports for this machine</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">Machine Name</label>
                  <Input
                    value={registrationForm.machineName}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, machineName: e.target.value })}
                    placeholder="e.g., Production Server 1"
                    required
                    className="bg-jetBlack border-coolWhite/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">IP Address</label>
                  <Input
                    value={registrationForm.ipAddress}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, ipAddress: e.target.value })}
                    placeholder="e.g., 192.168.1.100"
                    required
                    type="text"
                    className="bg-jetBlack border-coolWhite/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">Operating System (Optional)</label>
                  <Input
                    value={registrationForm.operatingSystem}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, operatingSystem: e.target.value })}
                    placeholder="e.g., Ubuntu 22.04 LTS"
                    className="bg-jetBlack border-coolWhite/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">Machine Hostname (Optional)</label>
                  <Input
                    value={registrationForm.machineHostname}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, machineHostname: e.target.value })}
                    placeholder="e.g., prod-server-01"
                    className="bg-jetBlack border-coolWhite/10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                    Register Machine
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterDialog(false)}
                    className="flex-1 border-coolWhite/10"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Statistics */}
        <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-jetBlack border-coolWhite/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-coolWhite/60 text-sm">Total Machines</p>
                <p className="text-3xl font-bold text-cyan-400">{stats.totalMachines}</p>
              </div>
              <Server className="w-10 h-10 text-cyan-400/30" />
            </div>
          </Card>
          <Card className="bg-jetBlack border-coolWhite/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-coolWhite/60 text-sm">Active Agents</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeMachines}</p>
              </div>
              <Activity className="w-10 h-10 text-green-400/30" />
            </div>
          </Card>
          <Card className="bg-jetBlack border-coolWhite/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-coolWhite/60 text-sm">Total Reports</p>
                <p className="text-3xl font-bold text-purple-400">{stats.totalReports}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-400/30" />
            </div>
          </Card>
          <Card className="bg-jetBlack border-coolWhite/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-coolWhite/60 text-sm">Avg Score</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.averageAuditScore.toFixed(1)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-yellow-400/30" />
            </div>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={fadeIn}>
          <Tabs defaultValue="machines" className="w-full">
            <TabsList className="bg-coolWhite/5 border border-coolWhite/10">
              <TabsTrigger value="machines">Machines ({machines.length})</TabsTrigger>
              <TabsTrigger value="reports">Audit Reports ({reports.length})</TabsTrigger>
            </TabsList>

            {/* Machines Tab */}
            <TabsContent value="machines" className="space-y-4">
              {machines.length === 0 ? (
                <Card className="bg-jetBlack border-coolWhite/10 p-12 text-center">
                  <Server className="w-12 h-12 text-coolWhite/30 mx-auto mb-4" />
                  <p className="text-coolWhite/60 mb-4">No machines registered yet</p>
                  <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-cyan-500 hover:bg-cyan-600">
                        Register Your First Machine
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {machines.map((machine) => (
                    <Card key={machine._id} className="bg-jetBlack border-coolWhite/10 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-coolWhite">{machine.machineName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(machine.agentStatus)}`}>
                              {getStatusIcon(machine.agentStatus)}
                              {machine.agentStatus.charAt(0).toUpperCase() + machine.agentStatus.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-coolWhite/60">IP Address</p>
                              <p className="text-coolWhite font-mono">{machine.ipAddress}</p>
                            </div>
                            <div>
                              <p className="text-coolWhite/60">Owner</p>
                              <p className="text-coolWhite">{machine.ownerName}</p>
                            </div>
                            {machine.operatingSystem && (
                              <div>
                                <p className="text-coolWhite/60">OS</p>
                                <p className="text-coolWhite">{machine.operatingSystem}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-coolWhite/60">Last Audit</p>
                              <p className="text-coolWhite">
                                {machine.lastAuditDate ? new Date(machine.lastAuditDate).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMachine(machine);
                              setShowInstallDialog(true);
                            }}
                            className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMachine(machine._id)}
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              {reports.length === 0 ? (
                <Card className="bg-jetBlack border-coolWhite/10 p-12 text-center">
                  <BarChart3 className="w-12 h-12 text-coolWhite/30 mx-auto mb-4" />
                  <p className="text-coolWhite/60">No audit reports yet</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <Card key={report._id} className="bg-jetBlack border-coolWhite/10 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-coolWhite">{report.machineName}</h3>
                            {report.auditScore && (
                              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full font-semibold">
                                Score: {report.auditScore}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-coolWhite/60">IP Address</p>
                              <p className="text-coolWhite font-mono">{report.ipAddress}</p>
                            </div>
                            <div>
                              <p className="text-coolWhite/60">Owner</p>
                              <p className="text-coolWhite">{report.ownerName}</p>
                            </div>
                            <div>
                              <p className="text-coolWhite/60">Warnings</p>
                              <p className="text-yellow-400 font-semibold">{report.warnings}</p>
                            </div>
                            <div>
                              <p className="text-coolWhite/60">Suggestions</p>
                              <p className="text-cyan-400 font-semibold">{report.suggestions}</p>
                            </div>
                            <div>
                              <p className="text-coolWhite/60">Date</p>
                              <p className="text-coolWhite">{new Date(report.auditDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReport(report)}
                            className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                            title="Download Report"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMachine(null);
                              setShowReportDialog(true);
                            }}
                            className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Install Agent Dialog */}
      {selectedMachine && (
        <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
          <DialogContent className="bg-jetBlack border border-coolWhite/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-coolWhite">Install Lynis Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-coolWhite/5 border border-coolWhite/10 p-4 rounded-lg">
                <p className="text-sm text-coolWhite/80 mb-4">
                  Follow these steps to install the OS Audit Agent on <span className="font-semibold">{selectedMachine.machineName}</span>:
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-coolWhite mb-2">Step 1: Download the Agent Script</p>
                    <Button
                      onClick={() => downloadAgentScript(selectedMachine)}
                      className="bg-cyan-500 hover:bg-cyan-600 gap-2 w-full"
                    >
                      <Download className="w-4 h-4" />
                      Download Installation Script
                    </Button>
                  </div>

                  <div>
                    <p className="font-semibold text-coolWhite mb-2">Step 2: Run the Script on Your Machine</p>
                    <div className="bg-jetBlack border border-cyan-500/20 p-3 rounded font-mono text-sm text-cyan-400 overflow-x-auto">
                      sudo bash os-audit-agent-{selectedMachine.machineId}.sh
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-coolWhite mb-2">Installation Token</p>
                    <div className="bg-jetBlack border border-coolWhite/10 p-3 rounded font-mono text-sm text-coolWhite/60 break-all">
                      {selectedMachine.agentInstallationToken}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-coolWhite mb-2">Machine Details</p>
                    <div className="bg-jetBlack border border-coolWhite/10 p-3 rounded text-sm space-y-1">
                      <p className="text-coolWhite/60">Machine ID: <span className="text-coolWhite font-mono">{selectedMachine.machineId}</span></p>
                      <p className="text-coolWhite/60">IP Address: <span className="text-coolWhite font-mono">{selectedMachine.ipAddress}</span></p>
                      <p className="text-coolWhite/60">Owner: <span className="text-coolWhite">{selectedMachine.ownerName}</span></p>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-sm text-blue-200">
                    <p className="font-semibold mb-1">ℹ️ Note</p>
                    <p>The script requires root access and will install Lynis along with the audit agent. The agent will run automatically every day at 2 AM.</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowInstallDialog(false)}
                className="w-full bg-cyan-500 hover:bg-cyan-600"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OSAuditPage;
