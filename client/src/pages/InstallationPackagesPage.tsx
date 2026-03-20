import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Download,
  Copy,
  Building2,
  Monitor,
  CheckCircle,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

interface Company {
  _id: string;
  name: string;
  sector: string;
}

interface InstallPackage {
  _id: string;
  packageId: string;
  name: string;
  company: { _id: string; name: string; sector: string } | string;
  osType: 'linux' | 'windows';
  supportedVersions: string[];
  agentToken: string;
  description?: string;
  downloadCount: number;
  createdAt: string;
}

const InstallationPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<InstallPackage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<InstallPackage | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    companyId: "",
    osType: "linux" as 'linux' | 'windows',
    description: "",
    supportedVersions: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgRes, compRes] = await Promise.all([
        axios.get("/api/v1/os-audit/packages", { params: { search: searchQuery }, withCredentials: true }),
        axios.get("/api/v1/os-audit/companies", { withCredentials: true })
      ]);
      setPackages(pkgRes.data.packages || []);
      setCompanies(compRes.data.companies || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/os-audit/packages", form, { withCredentials: true });
      if (res.data.success) {
        setShowCreateDialog(false);
        setForm({ name: "", companyId: "", osType: "linux", description: "", supportedVersions: [] });
        fetchData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create package");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this installation package?")) return;
    try {
      await axios.delete(`/api/v1/os-audit/packages/${id}`, { withCredentials: true });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete package");
    }
  };

  const handleDownloadScript = async (pkg: InstallPackage) => {
    try {
      const res = await axios.get(`/api/v1/os-audit/packages/${pkg._id}/download-script`, { withCredentials: true });
      if (res.data.success) {
        const { agentToken, osType, companyName, packageId } = res.data;
        const script = generateScript(agentToken, osType, companyName, packageId);
        const ext = osType === 'windows' ? 'ps1' : 'sh';
        const blob = new Blob([script], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-${packageId}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to download script");
    }
  };

  const handleShowScript = async (pkg: InstallPackage) => {
    setSelectedPackage(pkg);
    setShowScriptDialog(true);
  };

  const generateScript = (token: string, osType: string, companyName: string, packageId: string): string => {
    if (osType === 'windows') {
      return `#Requires -RunAsAdministrator
# ANATSCRAWLER Windows OS Audit Agent
# Company: ${companyName}
# Package: ${packageId}

$ErrorActionPreference = "Continue"

$AGENT_TOKEN = "${token}"
$SERVER_URL = "https://horus.anatsecurity.fr"
$COMPANY_NAME = "${companyName}"
$MACHINE_NAME = $env:COMPUTERNAME
$HOSTNAME = $env:COMPUTERNAME
$OS_INFO = (Get-CimInstance Win32_OperatingSystem).Caption
$KERNEL_VERSION = (Get-CimInstance Win32_OperatingSystem).Version
$IP_ADDRESS = @((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet, Wi* -ErrorAction SilentlyContinue).IPAddress, (Get-NetIPAddress -AddressFamily IPv4).IPAddress)[0]
$OWNER_NAME = $env:USERNAME
$AGENT_DIR = "C:\\anat-os-audit"
$KITTY_DIR = "$AGENT_DIR\\HardeningKitty"
$REPORT_DIR = "$AGENT_DIR\\reports"

function Write-Log {
  param([string]$Message)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$ts] $Message"
}

function Install-AuditTool {
  New-Item -ItemType Directory -Path $AGENT_DIR -Force | Out-Null
  New-Item -ItemType Directory -Path $REPORT_DIR -Force | Out-Null

  if (Test-Path $KITTY_DIR) {
    Write-Log "Audit tool already installed"
    return
  }

  $gitPath = Get-Command git -ErrorAction SilentlyContinue
  if ($gitPath) {
    Write-Log "Cloning audit tool repository..."
    git clone https://github.com/scipag/HardeningKitty $KITTY_DIR | Out-Null
  } else {
    Write-Log "Git not found, downloading zip package..."
    $zipPath = "$AGENT_DIR\\audit-tool.zip"
    Invoke-WebRequest -Uri "https://github.com/scipag/HardeningKitty/archive/refs/heads/master.zip" -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $AGENT_DIR -Force
    Move-Item "$AGENT_DIR\\HardeningKitty-master" $KITTY_DIR -Force
    Remove-Item $zipPath -Force
  }
}

function Invoke-WindowsAudit {
  Set-Location $KITTY_DIR
  Import-Module .\\HardeningKitty.psm1 -Force
  Write-Log "Starting HardeningKitty audit..."
  try {
    Invoke-HardeningKitty -Mode Audit -Log -LogFile "$REPORT_DIR\\audit.log" -Report -ReportFile "$REPORT_DIR\\audit.csv" -SkipMachineInformation
  } catch {
    Write-Log "HardeningKitty error: $_"
  }
  Write-Log "HardeningKitty execution finished."
  $raw = ""
  if (Test-Path "$REPORT_DIR\\audit.log") {
    $raw = Get-Content "$REPORT_DIR\\audit.log" -Raw
    Write-Log "Read audit log: $($raw.Length) chars"
  } else {
    Write-Log "WARNING: audit.log not found"
  }
  if (Test-Path "$REPORT_DIR\\audit.csv") {
    Write-Log "CSV report found at $REPORT_DIR\\audit.csv"
  } else {
    Write-Log "WARNING: audit.csv not found"
  }
  return $raw
}

function Parse-Findings {
  param([string]$RawOutput)

  $findings = @()
  $critical = 0
  $high = 0
  $medium = 0
  $low = 0
  $passed = 0

  $csvPath = "$REPORT_DIR\\audit.csv"
  if (Test-Path $csvPath) {
    $csvData = Import-Csv -Path $csvPath -Delimiter ','
    foreach ($row in $csvData) {
      $testResult = $row.TestResult
      $severity = if ($row.Severity) { $row.Severity.ToLower() } else { 'low' }
      if ($severity -notin @('critical','high','medium','low')) { $severity = 'medium' }

      if ($testResult -eq 'Passed') {
        $passed += 1
      } else {
        switch ($severity) {
          'critical' { $critical += 1 }
          'high'     { $high += 1 }
          'medium'   { $medium += 1 }
          default    { $low += 1 }
        }
        $findings += @{
          id = if ($row.ID) { $row.ID } else { [Guid]::NewGuid().ToString() }
          test = if ($row.Category) { $row.Category } else { 'Windows Hardening' }
          description = if ($row.Name) { $row.Name } else { $testResult }
          result = 'WARNING'
          severity = $severity
          recommendation = if ($row.RecommendedValue) { "Set to: $($row.RecommendedValue)" } else { 'Apply recommended configuration.' }
          currentValue = if ($row.DefaultValue) { $row.DefaultValue } else { '' }
          recommendedValue = if ($row.RecommendedValue) { $row.RecommendedValue } else { '' }
          category = if ($row.Category) { $row.Category } else { '' }
          method = if ($row.Method) { $row.Method } else { '' }
        }
      }
    }
  } else {
    foreach ($line in ($RawOutput -split [Environment]::NewLine)) {
      if ($line -match '\\[PASS\\]') { $passed += 1; continue }
      if ($line -notmatch '\\[FAIL\\]') { continue }
      $sev = 'low'
      if ($line -match 'Firewall|Defender|Credential|Admin|Password') { $sev = 'critical'; $critical += 1 }
      elseif ($line -match 'UAC|SMB|RDP|WinRM|TLS|SSL|Encryption') { $sev = 'high'; $high += 1 }
      elseif ($line -match 'Audit|Logging|Registry|Update|Patch') { $sev = 'medium'; $medium += 1 }
      else { $low += 1 }
      $findings += @{
        id = [Guid]::NewGuid().ToString()
        test = 'Windows Hardening Check'
        description = $line.Trim()
        result = 'WARNING'
        severity = $sev
        recommendation = 'Apply the recommended hardening configuration.'
      }
    }
  }

  $total = $passed + $critical + $high + $medium + $low
  $score = if ($total -gt 0) { [math]::Round(($passed / $total) * 100) } else { 0 }

  return @{
    findings = $findings
    critical = $critical
    high = $high
    medium = $medium
    low = $low
    passed = $passed
    score = $score
  }
}

function Submit-Report {
  param(
    [hashtable]$Parsed,
    [string]$RawOutput
  )

  $hostname = $env:COMPUTERNAME
  $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1 -ExpandProperty IPAddress)
  if (-not $ipAddress) { $ipAddress = "Unknown" }
  $osInfo = Get-CimInstance Win32_OperatingSystem
  $os = $osInfo.Caption
  $osBuild = $osInfo.BuildNumber
  $osVersion = $osInfo.Version
  $osArch = $osInfo.OSArchitecture
  $domain = (Get-CimInstance Win32_ComputerSystem).Domain
  $lastBoot = $osInfo.LastBootUpTime.ToString('yyyy-MM-dd HH:mm:ss')

  $csvContent = ""
  $csvPath = "$REPORT_DIR\\audit.csv"
  if (Test-Path $csvPath) { $csvContent = [System.IO.File]::ReadAllText($csvPath) }

  Write-Log "Building payload..."
  $findingsArray = @()
  foreach ($f in $Parsed.findings) {
    $findingsArray += [PSCustomObject]@{
      id = $f.id
      test = $f.test
      description = $f.description
      result = $f.result
      severity = $f.severity
      recommendation = $f.recommendation
      currentValue = $f.currentValue
      recommendedValue = $f.recommendedValue
      category = $f.category
    }
  }

  $payloadObj = [PSCustomObject]@{
    agentInstallationToken = $AGENT_TOKEN
    machineName = $hostname
    ipAddress = $ipAddress
    ownerName = $OWNER_NAME
    companyName = $COMPANY_NAME
    auditData = [PSCustomObject]@{
      operatingSystem = "$os (Build $osBuild)"
      kernelVersion = $osVersion
      hostname = $hostname
      auditScore = $Parsed.score
      warnings = $Parsed.high + $Parsed.critical
      suggestions = $Parsed.medium + $Parsed.low
      systemHardening = $Parsed.score
      findings = $findingsArray
      sections = [PSCustomObject]@{
        critical = $Parsed.critical
        high = $Parsed.high
        medium = $Parsed.medium
        low = $Parsed.low
        passed = $Parsed.passed
        osVersion = $osVersion
        osBuild = $osBuild
        osArch = $osArch
        domain = $domain
        lastBoot = $lastBoot
      }
      rawReport = ""
      logFileContent = ""
      reportFileContent = $csvContent
      lynisVersion = "windows-audit"
      auditDuration = 60
    }
  }

  Write-Log "Converting to JSON..."
  $payload = $payloadObj | ConvertTo-Json -Depth 5 -Compress
  Write-Log "Payload ready: $($payload.Length) bytes"

  try {
    Write-Log "Sending report..."
    $response = Invoke-RestMethod -Uri "$SERVER_URL/api/v1/os-audit/reports" -Method POST -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($payload)) -TimeoutSec 120
    Write-Log "Report submitted successfully."
  } catch {
    Write-Log "ERROR submitting report: $($_.Exception.Message)"
    if ($_.Exception.Response) {
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Log "Server response: $body"
      } catch { }
    }
    throw
  }
  try {
    Invoke-RestMethod -Uri "$SERVER_URL/api/v1/os-audit/agent/heartbeat" -Method POST -ContentType "application/json" -Body (@{agentInstallationToken=$AGENT_TOKEN} | ConvertTo-Json) | Out-Null
    Write-Log "Heartbeat sent."
  } catch {
    Write-Log "WARNING: Heartbeat failed: $($_.Exception.Message)"
  }
}

Write-Log "Starting Windows audit setup..."
try {
  Install-AuditTool
  Write-Log "Audit tool installed. Running audit..."
  $raw = Invoke-WindowsAudit
  Write-Log "Audit finished. Parsing findings..."
  $parsed = Parse-Findings -RawOutput $raw
  Write-Log "Parsed: Score=$($parsed.score) Passed=$($parsed.passed) Critical=$($parsed.critical) High=$($parsed.high) Medium=$($parsed.medium) Low=$($parsed.low)"
  Write-Log "Submitting report to $SERVER_URL ..."
  Submit-Report -Parsed $parsed -RawOutput $raw
  Write-Log "Audit complete. Score: $($parsed.score)/100"
} catch {
  Write-Log "FATAL ERROR: $($_.Exception.Message)"
  Write-Log "Stack: $($_.ScriptStackTrace)"
  throw
}

$scriptPath = "$AGENT_DIR\\agent.ps1"
Set-Content -Path $scriptPath -Value $MyInvocation.MyCommand.Definition -Force

$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File $scriptPath"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "ANATSCRAWLER-OSAudit" -Action $action -Trigger $trigger -RunLevel Highest -Force | Out-Null
Write-Log "Scheduled task created (daily at 02:00)."
`;
    }

    return `#!/bin/bash
# ANATSCRAWLER Linux OS Audit Agent
# Company: ${companyName}
# Package: ${packageId}

set -e

AGENT_TOKEN="${token}"
SERVER_URL="https://horus.anatsecurity.fr"
COMPANY_NAME="${companyName}"

echo "=================================="
echo "ANATSCRAWLER OS Audit Agent Setup"
echo "Company: $COMPANY_NAME"
echo "=================================="

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

# Install Lynis
if ! command -v lynis &> /dev/null; then
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt-get update && apt-get install -y lynis
    elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" ]]; then
        yum install -y epel-release && yum install -y lynis
    fi
fi

# Create agent directory
AGENT_DIR="/opt/anat-os-audit"
mkdir -p "$AGENT_DIR"

# Run Lynis audit
echo "Running security audit..."
lynis audit system 2>&1 || true

# Collect system info
MACHINE_NAME="$(hostname)"
IP_ADDRESS="$(hostname -I | awk '{print \$1}')"
OS_INFO="$(grep '^PRETTY_NAME=' /etc/os-release | cut -d= -f2 | tr -d '\"')"
KERNEL="$(uname -r)"

# Parse results
LYNIS_REPORT="/var/log/lynis-report.dat"
SCORE=$(grep "^hardening_index=" "$LYNIS_REPORT" 2>/dev/null | cut -d= -f2 || echo "0")
WARNINGS=$(grep -c "^warning\\[\\]=" "$LYNIS_REPORT" 2>/dev/null || echo "0")
SUGGESTIONS=$(grep -c "^suggestion\\[\\]=" "$LYNIS_REPORT" 2>/dev/null || echo "0")

# Submit report
TEMP_JSON="/tmp/lynis_report_$$.json"
python3 -c "
import json, sys
data = {
    'agentInstallationToken': '$AGENT_TOKEN',
    'machineName': '$MACHINE_NAME',
    'ipAddress': '$IP_ADDRESS',
    'ownerName': '$(whoami)',
    'companyName': '$COMPANY_NAME',
    'auditData': {
        'operatingSystem': '$OS_INFO',
        'kernelVersion': '$KERNEL',
        'hostname': '$MACHINE_NAME',
        'auditScore': int('$SCORE' or '0'),
        'warnings': int('$WARNINGS' or '0'),
        'suggestions': int('$SUGGESTIONS' or '0'),
        'systemHardening': int('$SCORE' or '0'),
        'findings': [],
        'sections': {},
        'logFileContent': open('/var/log/lynis.log','r').read() if __import__('os').path.exists('/var/log/lynis.log') else '',
        'reportFileContent': open('$LYNIS_REPORT','r').read() if __import__('os').path.exists('$LYNIS_REPORT') else ''
    }
}
json.dump(data, open('$TEMP_JSON','w'))
"

curl -s -X POST "$SERVER_URL/api/v1/os-audit/reports" \\
  -H "Content-Type: application/json" \\
  -d @"$TEMP_JSON"

rm -f "$TEMP_JSON"
echo "Audit complete for $COMPANY_NAME!"
`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCompanyName = (pkg: InstallPackage): string => {
    if (typeof pkg.company === 'object' && pkg.company !== null) {
      return (pkg.company as any).name || 'Unknown';
    }
    return 'Unknown';
  };

  const linuxVersions = ['Ubuntu 20.04+', 'Ubuntu 22.04+', 'Debian 11+', 'Debian 12+', 'CentOS 8+', 'RHEL 8+', 'Fedora 36+', 'Arch Linux'];
  const windowsVersions = ['Windows 10', 'Windows 11', 'Windows Server 2019', 'Windows Server 2022'];

  if (loading) {
    return (
      <div className="min-h-screen bg-jetBlack flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coolWhite/10 border-t-crimsonRed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-coolWhite/60">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" className="min-h-screen bg-jetBlack text-coolWhite p-6">
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="text-cyan-400" size={36} />
              Installation Packages
            </h1>
            <p className="text-gray-400 mt-2">Create and manage agent installation packages for companies</p>
          </div>
          <Button
            onClick={() => {
              setForm({ name: "", companyId: "", osType: "linux", description: "", supportedVersions: [] });
              setShowCreateDialog(true);
            }}
            className="bg-crimsonRed hover:bg-crimsonRed/80 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Package
          </Button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={fadeIn} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/60 border-gray-700 text-coolWhite placeholder:text-gray-500"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div variants={fadeIn} className="bg-gradient-to-br from-cyan-900/40 via-cyan-800/30 to-cyan-900/40 border border-cyan-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wide mb-1">Total Packages</p>
              <h3 className="text-3xl font-bold text-white">{packages.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
              <Package className="text-cyan-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-orange-900/40 via-orange-800/30 to-orange-900/40 border border-orange-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-400 text-sm font-semibold uppercase tracking-wide mb-1">Linux Packages</p>
              <h3 className="text-3xl font-bold text-white">{packages.filter(p => p.osType === 'linux').length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
              <Server className="text-orange-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-900/40 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-1">Windows Packages</p>
              <h3 className="text-3xl font-bold text-white">{packages.filter(p => p.osType === 'windows').length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Monitor className="text-blue-400" size={24} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Packages by OS Type */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="bg-gray-900/60 border border-gray-800 mb-6">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400">
            All ({packages.length})
          </TabsTrigger>
          <TabsTrigger value="linux" className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400">
            Linux ({packages.filter(p => p.osType === 'linux').length})
          </TabsTrigger>
          <TabsTrigger value="windows" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
            Windows ({packages.filter(p => p.osType === 'windows').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'linux', 'windows'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {(() => {
              const filtered = tab === 'all' ? packages : packages.filter(p => p.osType === tab);
              if (filtered.length === 0) {
                return (
                  <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Packages</h3>
                    <p className="text-gray-500">Create an installation package to get started</p>
                  </div>
                );
              }
              return (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map(pkg => (
                    <motion.div key={pkg._id} variants={fadeIn}
                      className="bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-400/30 transition-all duration-300">
                      <div className={`h-2 bg-gradient-to-r ${pkg.osType === 'linux' ? 'from-orange-500 to-yellow-600' : 'from-blue-500 to-cyan-600'}`}></div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{pkg.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${
                                pkg.osType === 'linux' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                              }`}>
                                {pkg.osType === 'linux' ? 'Linux' : 'Windows'}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => handleDelete(pkg._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Building2 size={14} />
                            <span>{getCompanyName(pkg)}</span>
                          </div>
                          {pkg.description && (
                            <p className="text-gray-500 text-xs">{pkg.description}</p>
                          )}
                        </div>

                        <div className="mb-4">
                          <span className="text-xs text-gray-500 block mb-2">Supported Versions:</span>
                          <div className="flex flex-wrap gap-1">
                            {pkg.supportedVersions.map((v, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400 border border-gray-700">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-800">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadScript(pkg)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1">
                            <Download size={14} className="mr-1" /> Download
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleShowScript(pkg)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1">
                            <Copy size={14} className="mr-1" /> Copy Script
                          </Button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 text-center">
                          {pkg.downloadCount} downloads
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              );
            })()}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Package Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-coolWhite max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="text-cyan-400" size={24} />
              Create Installation Package
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Package Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="e.g., Production Server Agent" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Company *</label>
              <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} required
                className="w-full rounded-md bg-gray-800 border border-gray-600 text-coolWhite px-3 py-2 text-sm">
                <option value="">Select company</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">OS Type *</label>
              <div className="flex gap-4">
                <label className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all ${
                  form.osType === 'linux' ? 'border-orange-400 bg-orange-500/10' : 'border-gray-700 hover:border-gray-600'
                }`}>
                  <input type="radio" value="linux" checked={form.osType === 'linux'}
                    onChange={() => setForm({ ...form, osType: 'linux', supportedVersions: [] })} className="sr-only" />
                  <div className="text-center">
                    <Server className={`mx-auto mb-2 ${form.osType === 'linux' ? 'text-orange-400' : 'text-gray-500'}`} size={24} />
                    <span className={`text-sm font-medium ${form.osType === 'linux' ? 'text-orange-400' : 'text-gray-400'}`}>Linux</span>
                  </div>
                </label>
                <label className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all ${
                  form.osType === 'windows' ? 'border-blue-400 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
                }`}>
                  <input type="radio" value="windows" checked={form.osType === 'windows'}
                    onChange={() => setForm({ ...form, osType: 'windows', supportedVersions: [] })} className="sr-only" />
                  <div className="text-center">
                    <Monitor className={`mx-auto mb-2 ${form.osType === 'windows' ? 'text-blue-400' : 'text-gray-500'}`} size={24} />
                    <span className={`text-sm font-medium ${form.osType === 'windows' ? 'text-blue-400' : 'text-gray-400'}`}>Windows</span>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Supported Versions</label>
              <div className="flex flex-wrap gap-2">
                {(form.osType === 'linux' ? linuxVersions : windowsVersions).map(v => (
                  <label key={v} className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    form.supportedVersions.includes(v) ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}>
                    <input type="checkbox" checked={form.supportedVersions.includes(v)} className="sr-only"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, supportedVersions: [...form.supportedVersions, v] });
                        } else {
                          setForm({ ...form, supportedVersions: form.supportedVersions.filter(sv => sv !== v) });
                        }
                      }} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md bg-gray-800 border border-gray-600 text-coolWhite px-3 py-2 text-sm min-h-[80px]"
                placeholder="Package description..." />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</Button>
              <Button type="submit" className="bg-crimsonRed hover:bg-crimsonRed/80 text-white">
                Create Package
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Script Preview Dialog */}
      <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-coolWhite max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Copy className="text-cyan-400" size={24} />
              Agent Script - {selectedPackage?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  {selectedPackage.osType === 'linux' ? 'Bash Script (.sh)' : 'PowerShell Script (.ps1)'}
                </span>
                <Button size="sm" variant="outline"
                  onClick={() => copyToClipboard(generateScript(
                    selectedPackage.agentToken,
                    selectedPackage.osType,
                    getCompanyName(selectedPackage),
                    selectedPackage.packageId
                  ))}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {copied ? <><CheckCircle size={14} className="mr-1 text-emerald-400" /> Copied!</> : <><Copy size={14} className="mr-1" /> Copy</>}
                </Button>
              </div>
              <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-[50vh]">
                {generateScript(
                  selectedPackage.agentToken,
                  selectedPackage.osType,
                  getCompanyName(selectedPackage),
                  selectedPackage.packageId
                )}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default InstallationPackagesPage;
