import re

with open("client/src/pages/OSAuditPage.tsx", "r") as f:
    text = f.read()

# Windows Agent Replace
win_old = """$AGENT_TOKEN = "${token}"
$SERVER_URL = "https://horus.anatsecurity.fr"
$MACHINE_ID = "${machineId}"
$MACHINE_NAME = "${machineName}"
$OWNER_NAME = "${ownerName}"
$AGENT_DIR = "C:\\\\anat-os-audit\""""

win_new = """$AGENT_TOKEN = "${token}"
$SERVER_URL = "https://horus.anatsecurity.fr"
$MACHINE_ID = "${machineId}"
$MACHINE_NAME = $env:COMPUTERNAME
$HOSTNAME = $env:COMPUTERNAME
$OS_INFO = (Get-CimInstance Win32_OperatingSystem).Caption
$KERNEL_VERSION = (Get-CimInstance Win32_OperatingSystem).Version
$IP_ADDRESS = @((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet, Wi* -ErrorAction SilentlyContinue).IPAddress, (Get-NetIPAddress -AddressFamily IPv4).IPAddress)[0]
$OWNER_NAME = "${ownerName}"
$AGENT_DIR = "C:\\\\anat-os-audit\""""

text = text.replace(win_old, win_new)

# Linux Agent Replace
lin_old = """AGENT_TOKEN="${token}"
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
if ! command -v lynis &> /dev/null; then"""

lin_new = """AGENT_TOKEN="${token}"
SERVER_URL="https://horus.anatsecurity.fr"
MACHINE_ID="${machineId}"
MACHINE_NAME="\$(hostname)"
HOSTNAME="\$(hostname)"
KERNEL_VERSION="\$(uname -r)"
OS_INFO="\$(cat /etc/os-release | grep '^PRETTY_NAME=' | cut -d'=' -f2 | tr -d '\"' || uname -s)"
IP_ADDRESS="\$(hostname -I | awk '{print \$1}')"
OWNER_NAME="${ownerName}"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Starting ANATSCRAWLER OS Audit                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Lynis is installed
if ! command -v lynis &> /dev/null; then"""

text = text.replace(lin_old, lin_new)

with open("client/src/pages/OSAuditPage.tsx", "w") as f:
    f.write(text)
