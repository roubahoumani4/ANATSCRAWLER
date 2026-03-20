import React, { useState, useEffect, useMemo } from "react";
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
  Server,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";

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
  osType: "linux" | "windows";
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
    osType: "linux" as "linux" | "windows",
    description: "",
    supportedVersions: [] as string[],
  });

  // Table state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nameFilter, setNameFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All recursively");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgRes, compRes] = await Promise.all([
        axios.get("/api/v1/os-audit/packages", {
          params: { search: searchQuery },
          withCredentials: true,
        }),
        axios.get("/api/v1/os-audit/companies", { withCredentials: true }),
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
      const res = await axios.post("/api/v1/os-audit/packages", form, {
        withCredentials: true,
      });
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} installation package(s)?`)) return;
    for (const id of selectedIds) {
      try {
        await axios.delete(`/api/v1/os-audit/packages/${id}`, { withCredentials: true });
      } catch (e) {}
    }
    setSelectedIds(new Set());
    fetchData();
  };

  const handleDownloadScript = async (pkg: InstallPackage, overrideOsType?: "linux" | "windows") => {
    try {
      const res = await axios.get(`/api/v1/os-audit/packages/${pkg._id}/download-script`, {
        withCredentials: true,
      });
      if (res.data.success) {
        const { agentToken, companyName, packageId } = res.data;
        const osType = overrideOsType || res.data.osType;
        const script = generateScript(agentToken, osType, companyName, packageId);
        const ext = osType === "windows" ? "ps1" : "sh";
        const blob = new Blob([script], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
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

  const handleDownloadForOS = async (osType: "linux" | "windows") => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : packages.map((p) => p._id);
    for (const id of ids) {
      const pkg = packages.find((p) => p._id === id);
      if (pkg) await handleDownloadScript(pkg, osType);
    }
  };

  const handleShowScript = async (pkg: InstallPackage) => {
    setSelectedPackage(pkg);
    setShowScriptDialog(true);
  };

  const generateScript = (token: string, osType: string, companyName: string, packageId: string): string => {
    if (osType === "windows") {
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

# Heartbeat script
$heartbeatScript = @"
while (\$true) {
  try {
    \$body = @{ agentInstallationToken = '$AGENT_TOKEN'; machineName = \$env:COMPUTERNAME } | ConvertTo-Json
    Invoke-RestMethod -Uri '$SERVER_URL/api/v1/os-audit/agent/heartbeat' -Method POST -ContentType 'application/json' -Body \$body -TimeoutSec 30 | Out-Null
  } catch { }
  Start-Sleep -Seconds 300
}
"@
$heartbeatPath = "$AGENT_DIR\\heartbeat.ps1"
Set-Content -Path $heartbeatPath -Value $heartbeatScript -Force

$hbAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File $heartbeatPath"
$hbTrigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "ANATSCRAWLER-Heartbeat" -Action $hbAction -Trigger $hbTrigger -RunLevel Highest -Force | Out-Null
Start-Process -FilePath "PowerShell.exe" -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File $heartbeatPath" -WindowStyle Hidden
Write-Log "Heartbeat service started."
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

# Setup heartbeat cron job (every 5 minutes)
HEARTBEAT_SCRIPT="$AGENT_DIR/heartbeat.sh"
cat > "$HEARTBEAT_SCRIPT" << 'HEARTBEAT_EOF'
#!/bin/bash
curl -s -X POST "$SERVER_URL/api/v1/os-audit/agent/heartbeat" \\
  -H "Content-Type: application/json" \\
  -d "{\\"agentInstallationToken\\":\\"$AGENT_TOKEN\\",\\"machineName\\":\\"$(hostname)\\"}" > /dev/null 2>&1
HEARTBEAT_EOF
sed -i "s|\\$SERVER_URL|$SERVER_URL|g" "$HEARTBEAT_SCRIPT"
sed -i "s|\\$AGENT_TOKEN|$AGENT_TOKEN|g" "$HEARTBEAT_SCRIPT"
chmod +x "$HEARTBEAT_SCRIPT"

# Add cron job for heartbeat every 5 minutes and daily audit at 2 AM
(crontab -l 2>/dev/null | grep -v "anat-os-audit"; echo "*/5 * * * * $HEARTBEAT_SCRIPT"; echo "0 2 * * * $0") | crontab -
echo "Heartbeat and scheduled audit configured."
`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCompanyName = (pkg: InstallPackage): string => {
    if (typeof pkg.company === "object" && pkg.company !== null) {
      return (pkg.company as any).name || "Unknown";
    }
    return "Unknown";
  };

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      if (nameFilter && !p.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (descFilter) {
        const desc = p.description || "N/A";
        if (!desc.toLowerCase().includes(descFilter.toLowerCase())) return false;
      }
      if (companyFilter !== "All recursively") {
        if (getCompanyName(p) !== companyFilter) return false;
      }
      return true;
    });
  }, [packages, nameFilter, descFilter, companyFilter]);

  // Pagination
  const totalItems = filteredPackages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const allSelected =
    paginatedPackages.length > 0 && paginatedPackages.every((p) => selectedIds.has(p._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPackages.map((p) => p._id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setNameFilter("");
    setDescFilter("");
    setCompanyFilter("All recursively");
  };

  const hasFilters = nameFilter || descFilter || companyFilter !== "All recursively";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] text-gray-200 flex flex-col">
      {/* Page Header */}
      <div className="px-6 pt-5 pb-2">
        <h1 className="text-2xl font-bold text-white">Installation packages</h1>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-gray-700/50">
        <Button
          onClick={() => {
            setForm({ name: "", companyId: "", osType: "linux", description: "", supportedVersions: [] });
            setShowCreateDialog(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium h-9 px-5"
        >
          CREATE
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm font-medium h-9 px-4">
              DOWNLOAD <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#2a2d35] border-gray-600 text-gray-200">
            <DropdownMenuItem
              onClick={() => handleDownloadForOS("linux")}
              className="hover:bg-gray-700 cursor-pointer text-xs"
            >
              <Server size={13} className="mr-2" /> Linux
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDownloadForOS("windows")}
              className="hover:bg-gray-700 cursor-pointer text-xs"
            >
              <Monitor size={13} className="mr-2" /> Windows
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0}
          className="bg-transparent border border-red-500 text-red-400 hover:bg-red-600 hover:text-white text-sm font-medium h-9 px-5 disabled:opacity-40"
        >
          DELETE
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap border-b border-gray-700/50">
        <div className="flex items-center gap-1">
          <label className="text-[11px] text-gray-500 mr-1">Company</label>
          <select
            value={companyFilter}
            onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
            className="h-8 bg-[#2a2d35] border border-gray-600 rounded px-2 text-gray-300 text-xs min-w-[140px]"
          >
            <option value="All recursively">All recursively</option>
            {companies.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Input
            placeholder="Name"
            value={nameFilter}
            onChange={(e) => { setNameFilter(e.target.value); setCurrentPage(1); }}
            className="h-8 w-40 bg-[#2a2d35] border-gray-600 text-gray-300 text-xs placeholder:text-gray-500 pr-7"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
        </div>

        <div className="relative">
          <Input
            placeholder="Description"
            value={descFilter}
            onChange={(e) => { setDescFilter(e.target.value); setCurrentPage(1); }}
            className="h-8 w-40 bg-[#2a2d35] border-gray-600 text-gray-300 text-xs placeholder:text-gray-500 pr-7"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
        </div>

        {hasFilters && (
          <button onClick={resetFilters} className="text-cyan-400 hover:text-cyan-300 text-xs ml-1">
            Reset filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#1e2128] border-b border-gray-700/60 text-gray-400 text-xs">
              <th className="w-10 px-3 py-2.5 text-center">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-gray-500 data-[state=checked]:bg-cyan-600"
                />
              </th>
              <th className="px-3 py-2.5 text-left font-medium">Name</th>
              <th className="px-3 py-2.5 text-left font-medium">Language</th>
              <th className="px-3 py-2.5 text-left font-medium">Description</th>
              <th className="px-3 py-2.5 text-left font-medium">Company</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPackages.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-gray-500">
                  No installation packages found
                </td>
              </tr>
            ) : (
              paginatedPackages.map((pkg) => (
                <tr
                  key={pkg._id}
                  className={`border-b border-gray-800/50 hover:bg-[#252830] transition-colors ${
                    selectedIds.has(pkg._id) ? "bg-cyan-900/10" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <Checkbox
                      checked={selectedIds.has(pkg._id)}
                      onCheckedChange={() => toggleSelect(pkg._id)}
                      className="border-gray-500 data-[state=checked]:bg-cyan-600"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleShowScript(pkg)}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline text-left font-medium"
                    >
                      {pkg.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">English</td>
                  <td className="px-3 py-2.5 text-gray-300">
                    {pkg.description || "N/A"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">{getCompanyName(pkg)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
        <span>
          {startItem}-{endItem} of {totalItems} items
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-[#2a2d35] border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30">«</button>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30">‹</button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= totalPages) setCurrentPage(v);
              }}
              className="w-10 text-center bg-[#2a2d35] border border-gray-600 rounded py-1 text-gray-300 text-xs"
            />
            <span>of {totalPages} pages</span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30">›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30">»</button>
          </div>
        </div>
      </div>

      {/* Create Package Dialog - Full screen side panel style */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-gray-200 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Create Installation Package
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-6">
            <p className="text-gray-400 text-sm font-medium border-b border-gray-700/50 pb-2">General</p>

            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-400 w-28 shrink-0">Name*:</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Type here"
                className="bg-[#2a2d35] border-gray-600 text-gray-200 placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-400 w-28 shrink-0">Description:</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Type here"
                className="bg-[#2a2d35] border-gray-600 text-gray-200 placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-400 w-28 shrink-0">Language:</label>
              <select className="w-full rounded-md bg-[#2a2d35] border border-gray-600 text-gray-200 px-3 py-2 text-sm">
                <option value="English">English</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-400 w-28 shrink-0">Company*:</label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                required
                className="w-full rounded-md bg-[#2a2d35] border border-gray-600 text-gray-200 px-3 py-2 text-sm"
              >
                <option value="" disabled className="text-gray-500">Choose company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Create Package
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Script Preview Dialog */}
      <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-gray-200 max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  {selectedPackage.osType === "linux" ? "Bash Script (.sh)" : "PowerShell Script (.ps1)"}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadScript(selectedPackage)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Download size={14} className="mr-1" /> Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        generateScript(
                          selectedPackage.agentToken,
                          selectedPackage.osType,
                          getCompanyName(selectedPackage),
                          selectedPackage.packageId
                        )
                      )
                    }
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={14} className="mr-1 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <pre className="bg-[#0d0f12] border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-[50vh]">
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
    </div>
  );
};

export default InstallationPackagesPage;
