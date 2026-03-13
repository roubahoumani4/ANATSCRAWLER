#!/bin/bash
# Setup and Test Script for PDF Audit Report Generator
# This script validates the installation and generates a test report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   PDF Audit Report Generator - Setup & Verification Script${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        return $1
    fi
}

print_section() {
    echo -e "\n${BLUE}>>> $1${NC}"
}

# Step 1: Check Python Installation
print_section "Step 1: Checking Python Installation"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    print_status 0 "Python 3 found (v$PYTHON_VERSION)"
else
    print_status 1 "Python 3 not found"
    exit 1
fi

# Step 2: Check pip
print_section "Step 2: Checking pip"
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version 2>&1 | awk '{print $2}')
    print_status 0 "pip found (v$PIP_VERSION)"
else
    print_status 1 "pip not found"
    exit 1
fi

# Step 3: Install Dependencies
print_section "Step 3: Installing Python Dependencies"
echo "Installing: reportlab, Pillow, python-dateutil"
pip3 install -q reportlab Pillow python-dateutil 2>/dev/null
print_status $? "Dependencies installed successfully"

# Step 4: Verify Dependencies
print_section "Step 4: Verifying Installed Packages"

python3 -c "import reportlab; print(f'  reportlab v{reportlab.__version__}')" 2>/dev/null
print_status $? "reportlab module"

python3 -c "import PIL; print(f'  Pillow v{PIL.__version__}')" 2>/dev/null
print_status $? "Pillow module"

python3 -c "import dateutil; print(f'  python-dateutil available')" 2>/dev/null
print_status $? "python-dateutil module"

# Step 5: Check script exists
print_section "Step 5: Verifying Report Generator Script"
SCRIPT_PATH="server/scripts/generate_audit_pdf_report.py"
if [ -f "$SCRIPT_PATH" ]; then
    print_status 0 "Script found at $SCRIPT_PATH"
    chmod +x "$SCRIPT_PATH"
else
    print_status 1 "Script not found at $SCRIPT_PATH"
    exit 1
fi

# Step 6: Check for sample report file
print_section "Step 6: Looking for Sample Lynis Reports"
SAMPLE_REPORT=$(find . -name "*lynis*.dat" 2>/dev/null | head -1)
if [ -n "$SAMPLE_REPORT" ]; then
    echo -e "${GREEN}✓ Found sample report: $SAMPLE_REPORT${NC}"
    TEST_REPORT="$SAMPLE_REPORT"
else
    echo -e "${YELLOW}! No sample Lynis report found${NC}"
    echo "  You can provide one when running: python3 generate_audit_pdf_report.py"
fi

# Step 7: Test Report Generation (if sample available)
print_section "Step 7: Testing Report Generation"
if [ -n "$TEST_REPORT" ]; then
    TEST_OUTPUT="/tmp/audit_test_$(date +%s).pdf"
    echo "Generating test report from: $TEST_REPORT"
    echo "Output: $TEST_OUTPUT"
    
    python3 "$SCRIPT_PATH" "$TEST_REPORT" \
        -o "$TEST_OUTPUT" \
        -H "test-system" \
        -I "192.168.1.100" \
        -O "Test User" 2>&1
    
    if [ -f "$TEST_OUTPUT" ]; then
        FILE_SIZE=$(ls -lh "$TEST_OUTPUT" | awk '{print $5}')
        print_status 0 "Report generated successfully ($FILE_SIZE)"
        echo -e "  Output: ${GREEN}$TEST_OUTPUT${NC}"
    else
        print_status 1 "Report generation failed"
    fi
else
    echo -e "${YELLOW}ⓘ Skipping test generation (no sample report available)${NC}"
fi

# Step 8: Verify Directory Structure
print_section "Step 8: Verifying Directory Structure"
DIRS=(
    "server/routes"
    "server/services"
    "server/scripts"
    "server/models"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_status 0 "$dir exists"
    else
        print_status 1 "$dir missing"
    fi
done

# Step 9: Check Required Files
print_section "Step 9: Checking Required Files"
FILES=(
    "server/scripts/generate_audit_pdf_report.py"
    "server/services/auditReportGenerator.ts"
    "server/routes/os-audit-reports.routes.ts"
    "COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md"
    "PDF_AUDIT_REPORT_QUICK_START.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file"
    else
        print_status 1 "$file (MISSING)"
    fi
done

# Final Summary
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup Verification Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Read the Quick Start Guide:"
echo "   ${BLUE}cat PDF_AUDIT_REPORT_QUICK_START.md${NC}"
echo ""
echo "2. Generate your first report:"
echo "   ${BLUE}python3 server/scripts/generate_audit_pdf_report.py \\${NC}"
echo "   ${BLUE}  /path/to/lynis-report.dat \\${NC}"
echo "   ${BLUE}  -o audit_report.pdf \\${NC}"
echo "   ${BLUE}  -H hostname -I ip-address -O owner${NC}"
echo ""
echo "3. For API integration, update your backend routes and restart the server"
echo ""
echo "4. For complete documentation:"
echo "   ${BLUE}cat COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md${NC}"
echo ""

echo -e "${GREEN}✓ System is ready to generate audit reports!${NC}\n"
