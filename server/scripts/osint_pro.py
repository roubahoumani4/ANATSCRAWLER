#!/usr/bin/env python3
"""
Professional OSINT Reconnaissance Script - ENHANCED WITH LIVE VULNERABILITY DATABASES
Comprehensive digital intelligence and reconnaissance platform
"""

import argparse
import json
import socket
import subprocess
import sys
import re
import time
import concurrent.futures
import ssl
import hashlib
import base64
import threading
from datetime import datetime
from urllib.parse import urlparse, urljoin
from pathlib import Path
import os

# Auto-install required packages
REQUIRED_PACKAGES = {
    'requests': 'requests',
    'dns.resolver': 'dnspython', 
    'whois': 'python-whois',
    'bs4': 'beautifulsoup4',
    'urllib3': 'urllib3',
    'ipwhois': 'ipwhois',
    'cryptography': 'cryptography',
    'pytz': 'pytz',
}

for module, package in REQUIRED_PACKAGES.items():
    try:
        __import__(module)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])

import requests
import dns.resolver
import whois as python_whois
from bs4 import BeautifulSoup
import urllib3
import ipwhois
from cryptography import x509
from cryptography.hazmat.backends import default_backend
import pytz
from datetime import timedelta
import hashlib
import base64
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# =============================================================================
# DEFAULT CONFIGURATION
# =============================================================================

# API Keys (configure these with your own keys)
HIBP_API_KEY = "00000000000000000000000000000000"
SHODAN_API_KEY = "J45krb71x4qrP0X71SB5W7t81XjA17Wx"
VIRUSTOTAL_API_KEY = "8a22c81788990613a8dc97cd83a7767d0a959784664c4f4c1b9fe3b9ff680c8a"
SECURITYTRAILS_API_KEY = "s22YZ18zqRAUhhl_icDlTIVtZnHhVJdY"
CENSYS_API_ID = "Bou7s3DU"
CENSYS_API_SECRET = "EJ2HAdc7kjiFBFz6JPVTUcE3"

# Scan configuration defaults - RUN EVERYTHING by default
DEFAULT_DEEP_SCAN = True
DEFAULT_CHECK_BREACHES = True

# =============================================================================
# LIVE VULNERABILITY DATABASE CLASSES
# =============================================================================

class LiveVulnerabilityChecker:
    """Real-time vulnerability checking against official databases"""
    
    def __init__(self):
        self.nvd_base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        self.rate_limit_delay = 6  # seconds between requests (NVD rate limit)
        self.last_request_time = 0
        
    def _respect_rate_limit(self):
        """Respect NVD API rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()
    
    def check_nvd_vulnerabilities(self, software_name, version):
        """Check National Vulnerability Database (Official US Government)"""
        self._respect_rate_limit()
        
        try:
            # Format search query
            search_query = f"{software_name} {version}"
            params = {
                'keywordSearch': search_query,
                'resultsPerPage': 20
            }
            
            response = requests.get(self.nvd_base_url, params=params, timeout=15)
            
            if response.status_code == 200:
                return self._parse_nvd_response(response.json(), software_name, version)
            elif response.status_code == 403:
                print("NVD API rate limit hit. Consider using API key for higher limits.")
                return []
            else:
                print(f"NVD API returned status: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"NVD API error: {e}")
            return []
    
    def _parse_nvd_response(self, nvd_data, software_name, version):
        """Parse NVD API response"""
        vulnerabilities = []
        
        for vuln in nvd_data.get('vulnerabilities', []):
            cve_info = vuln['cve']
            cve_id = cve_info['id']
            
            # Get description
            description = "No description available"
            if 'descriptions' in cve_info and cve_info['descriptions']:
                for desc in cve_info['descriptions']:
                    if desc.get('lang') == 'en':
                        description = desc['value']
                        break
            
            # Calculate severity from CVSS
            severity = "UNKNOWN"
            cvss_score = 0.0
            
            if 'metrics' in cve_info:
                # Try CVSS v3 first
                if 'cvssMetricV31' in cve_info['metrics']:
                    cvss_data = cve_info['metrics']['cvssMetricV31'][0]['cvssData']
                    cvss_score = cvss_data['baseScore']
                    severity = self._cvss_to_severity(cvss_score)
                elif 'cvssMetricV2' in cve_info['metrics']:
                    cvss_data = cve_info['metrics']['cvssMetricV2'][0]['cvssData']
                    cvss_score = cvss_data['baseScore']
                    severity = self._cvss_to_severity(cvss_score)
            
            # Only include medium+ severity vulnerabilities
            if severity in ["MEDIUM", "HIGH", "CRITICAL"]:
                vulnerabilities.append({
                    'id': cve_id,
                    'description': description,
                    'severity': severity,
                    'cvss_score': cvss_score,
                    'software': f"{software_name} {version}",
                    'source': 'NVD (US Govt)',
                    'published': cve_info.get('published', 'Unknown'),
                    'last_modified': cve_info.get('lastModified', 'Unknown')
                })
        
        return vulnerabilities
    
    def _cvss_to_severity(self, cvss_score):
        """Convert CVSS score to severity level"""
        try:
            score = float(cvss_score)
            if score >= 9.0:
                return "CRITICAL"
            elif score >= 7.0:
                return "HIGH"
            elif score >= 4.0:
                return "MEDIUM"
            elif score >= 0.1:
                return "LOW"
            else:
                return "UNKNOWN"
        except (ValueError, TypeError):
            return "UNKNOWN"
    
    def check_cve_database(self, software_name, version):
        """Check CVE Database (MITRE Corporation) via NVD"""
        # NVD is the primary source for CVE data, so we use the same method
        return self.check_nvd_vulnerabilities(software_name, version)
    
    def comprehensive_vulnerability_check(self, software_name, version):
        """Comprehensive check against all available databases"""
        all_vulnerabilities = []
        
        print(f"Checking vulnerabilities for: {software_name} {version}")
        
        # Check NVD (US Government)
        nvd_vulns = self.check_nvd_vulnerabilities(software_name, version)
        all_vulnerabilities.extend(nvd_vulns)
        
        # Additional databases can be added here
        # For now, we use NVD as the primary source for CVE data
        
        return all_vulnerabilities

class VulnerabilityDB:
    """Comprehensive vulnerability database with real CVE data"""
    
    VULNERABLE_SOFTWARE = {
        # Web Servers
        'apache': {
            '2.4.18': {
                'severity': 'CRITICAL',
                'cves': ['CVE-2017-9798', 'CVE-2019-0211', 'CVE-2017-7679', 'CVE-2016-8743'],
                'description': 'Apache 2.4.18 is severely outdated with multiple memory disclosure and privilege escalation vulnerabilities',
                'release_date': '2015-12-15',
                'current_version': '2.4.62'
            },
            '2.4.17': {'severity': 'CRITICAL', 'cves': ['CVE-2016-5387', 'CVE-2016-2161']},
            '2.4.16': {'severity': 'CRITICAL', 'cves': ['CVE-2015-3185', 'CVE-2015-0228']},
            '2.4.12': {'severity': 'CRITICAL', 'cves': ['CVE-2015-0253']},
            '2.4.10': {'severity': 'CRITICAL', 'cves': ['CVE-2014-8109']},
            '2.2.': {'severity': 'CRITICAL', 'cves': ['Multiple CVEs - EOL']}
        },
        'nginx': {
            '1.10.': {'severity': 'HIGH', 'cves': ['CVE-2017-7529']},
            '1.8.': {'severity': 'HIGH', 'cves': ['CVE-2016-4450']},
            '1.6.': {'severity': 'CRITICAL', 'cves': ['CVE-2015-4000']}
        },
        'iis': {
            '7.0': {'severity': 'CRITICAL', 'cves': ['CVE-2015-1635', 'CVE-2014-4070']},
            '7.5': {'severity': 'HIGH', 'cves': ['CVE-2013-1345']},
            '8.0': {'severity': 'MEDIUM', 'cves': ['CVE-2015-0015']}
        },
        
        # Application Servers
        'glassfish': {
            '4.1': {
                'severity': 'CRITICAL', 
                'cves': ['CVE-2017-1000028', 'CVE-2016-7040'],
                'description': 'GlassFish 4.1 is end-of-life with directory traversal and RCE vulnerabilities',
                'release_date': '2014-06-12',
                'current_version': '7.0.0'
            },
            '3.1': {'severity': 'CRITICAL', 'cves': ['CVE-2013-5855']}
        },
        'tomcat': {
            '7.0.': {'severity': 'HIGH', 'cves': ['CVE-2016-8735']},
            '8.0.': {'severity': 'MEDIUM', 'cves': ['CVE-2017-12617']},
            '9.0.0': {'severity': 'MEDIUM', 'cves': ['CVE-2020-1938']}
        },
        
        # Mail Servers
        'mailenable': {
            '6.': {'severity': 'HIGH', 'cves': ['CVE-2012-3574']},
            '5.': {'severity': 'HIGH', 'cves': ['CVE-2009-2582']},
            '4.': {'severity': 'CRITICAL', 'cves': ['CVE-2008-3344']}
        },
        'exim': {
            '4.92': {'severity': 'CRITICAL', 'cves': ['CVE-2019-10149']},
            '4.91': {'severity': 'HIGH', 'cves': ['CVE-2019-13917']}
        },
        
        # Database Servers
        'mysql': {
            '5.5': {'severity': 'HIGH', 'cves': ['CVE-2016-6662']},
            '5.1': {'severity': 'CRITICAL', 'cves': ['CVE-2012-2122']}
        },
        
        # Frameworks
        'asp.net': {
            '4.0': {'severity': 'MEDIUM', 'cves': ['CVE-2012-0479']}
        },
        
        # JavaScript Libraries
        'jquery': {
            '1.6.1': {
                'severity': 'CRITICAL',
                'cves': ['CVE-2011-4969', 'CVE-2012-6708', 'CVE-2015-9251'],
                'description': 'jQuery 1.6.1 is critically outdated with multiple XSS vulnerabilities',
                'release_date': '2011-05-03',
                'current_version': '3.7.1'
            },
            '1.5': {'severity': 'CRITICAL', 'cves': ['CVE-2011-4969']},
            '1.4': {'severity': 'CRITICAL', 'cves': ['Multiple XSS vulnerabilities']},
            '1.3': {'severity': 'CRITICAL', 'cves': ['Multiple XSS vulnerabilities']}
        },
        
        # CMS Platforms
        'wordpress': {
            '4.7.0': {'severity': 'CRITICAL', 'cves': ['CVE-2017-5611']}
        },
        
        # Control Panels
        'plesk': {
            '12.0': {'severity': 'HIGH', 'cves': ['CVE-2014-4513']}
        }
    }
    
    @classmethod
    def check_software_version(cls, software_name, version, banner):
        """Check if software version is vulnerable"""
        software_name_lower = software_name.lower()
        
        for sw_pattern, versions in cls.VULNERABLE_SOFTWARE.items():
            if sw_pattern in software_name_lower:
                for vuln_version, vuln_info in versions.items():
                    if vuln_version in version or vuln_version in banner:
                        return vuln_info
        return None

# =============================================================================
# MAIN SCRIPT - ENHANCED WITH LIVE VULNERABILITY DATABASES
# =============================================================================

class Colors:
    """Terminal colors for output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

class ProfessionalOSINT:
    def __init__(self, target, output_dir=None, deep_scan=False, check_breaches=False):
        self.target = target
        self.deep_scan = deep_scan
        self.check_breaches = check_breaches
        self.hibp_api_key = HIBP_API_KEY
        self.shodan_key = SHODAN_API_KEY
        self.virustotal_key = VIRUSTOTAL_API_KEY
        self.securitytrails_key = SECURITYTRAILS_API_KEY
        self.censys_id = CENSYS_API_ID
        self.censys_secret = CENSYS_API_SECRET
        self.output_dir = output_dir or f"osint_{target.replace('://', '_').replace('/', '_')}"
        Path(self.output_dir).mkdir(exist_ok=True)
        
        # Comprehensive results structure
        self.results = {
            "metadata": {
                "target": target,
                "scan_time": datetime.now().isoformat(),
                "investigation_date": datetime.now().strftime("%B %d, %Y"),
                "report_classification": "Client Investigation",
                "revision": "2.0"
            },
            "executive_summary": {
                "risk_level": "MEDIUM",
                "key_findings": [],
                "critical_vulnerabilities": 0,
                "business_context": ""
            },
            "domain_information": {},
            "network_infrastructure": {},
            "subdomains": {},
            "port_scanning": {"open_ports": []},
            "web_technologies": {"analyzed_urls": []},
            "security_assessment": {},
            "vulnerabilities": [],
            "contact_info": {},
            "compliance": {},
            "ssl_certificates": {},
            "breach_data": {},
            "waf_detection": {},
            "business_intelligence": {},
            # NEW SECTIONS
            "social_media": {},
            "cloud_infrastructure": {},
            "threat_intelligence": {},
            "mobile_apps": {},
            "api_endpoints": {},
            "digital_footprint": {},
            "geolocation_data": {},
            "document_metadata": {},
            "javascript_libraries": {},
            "sql_injection": {},
            "amass": {},
            # LIVE VULNERABILITY DATA
            "live_vulnerability_checks": {
                "nvd_checked": False,
                "vulnerabilities_found": 0,
                "last_updated": None
            }
        }
        
        self.target_type = self._determine_target_type()
        self.domain = self._extract_domain()
        self.primary_ip = None
        self.discovered_ips = set()
        self.discovered_emails = set()
        self.discovered_subdomains = {}
        self.critical_findings = []
        self.breached_accounts = []
        self.ssl_cert_info = {}
        self.waf_detected = False
        self.vuln_db = VulnerabilityDB()
        self.live_checker = LiveVulnerabilityChecker()

    def _determine_target_type(self):
        """Determine if target is IP, domain, or URL"""
        ip_pattern = r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'
        if re.match(ip_pattern, self.target):
            return "ip"
        if self.target.startswith(('http://', 'https://')):
            return "url"
        return "domain"

    def _extract_domain(self):
        """Extract domain from target"""
        if self.target_type == "url":
            parsed = urlparse(self.target)
            return parsed.netloc or parsed.path
        elif self.target_type == "ip":
            return None
        return self.target

    def print_header(self, text):
        """Print formatted header"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.END}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}\n")

    def print_success(self, text):
        """Print success message"""
        print(f"{Colors.GREEN}[+] {text}{Colors.END}")

    def print_error(self, text):
        """Print error message"""
        print(f"{Colors.RED}[-] {text}{Colors.END}")

    def print_warning(self, text):
        """Print warning message"""
        print(f"{Colors.YELLOW}[!] {text}{Colors.END}")

    def print_critical(self, text):
        """Print critical vulnerability message"""
        print(f"{Colors.RED}{Colors.BOLD}[🔴 CRITICAL] {text}{Colors.END}")
        self.critical_findings.append(text)

    def print_debug(self, text):
        """Print debug information"""
        print(f"{Colors.BLUE}[DEBUG] {text}{Colors.END}")

    def save_artifact(self, filename, content):
        """Save investigation artifact to file"""
        filepath = Path(self.output_dir) / filename
        try:
            with open(filepath, 'w') as f:
                if isinstance(content, (dict, list)):
                    json.dump(content, f, indent=2, default=str)
                else:
                    f.write(str(content))
            return filepath
        except Exception as e:
            self.print_error(f"Failed to save {filename}: {e}")
            return None

    # =============================================================================
    # ENHANCED VULNERABILITY DISPLAY
    # =============================================================================

    def display_vulnerability_details(self):
        """Display detailed information about found vulnerabilities"""
        self.print_header("VULNERABILITY DETAILS - COMPREHENSIVE LIST")
        
        if not self.results["vulnerabilities"]:
            self.print_success("No vulnerabilities detected")
            return
        
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        
        print(f"{Colors.CYAN}Detailed Vulnerability Findings:{Colors.END}\n")
        
        for i, vuln in enumerate(self.results["vulnerabilities"], 1):
            # Count by severity
            if vuln["severity"] == "CRITICAL":
                critical_count += 1
                color = Colors.RED + Colors.BOLD
                symbol = "🔴"
            elif vuln["severity"] == "HIGH":
                high_count += 1
                color = Colors.RED
                symbol = "🟠"
            elif vuln["severity"] == "MEDIUM":
                medium_count += 1
                color = Colors.YELLOW
                symbol = "🟡"
            else:
                low_count += 1
                color = Colors.BLUE
                symbol = "🔵"
            
            print(f"{symbol} {color}{vuln['severity']}: {vuln['type']}{Colors.END}")
            print(f"   Description: {vuln['description']}")
            
            if vuln.get('service'):
                print(f"   Location: {vuln['service']}")
            if vuln.get('ip'):
                print(f"   IP: {vuln['ip']}")
            if vuln.get('software'):
                print(f"   Software: {vuln['software']}")
            
            if vuln.get('cves'):
                print(f"   CVEs: {', '.join(vuln['cves'])}")
            
            if vuln.get('cvss_score') and vuln['cvss_score'] != "N/A":
                print(f"   CVSS Score: {vuln['cvss_score']}")
            
            if vuln.get('source'):
                print(f"   Source: {vuln['source']}")
            
            print(f"   Recommendation: {vuln['recommendation']}")
            
            if vuln.get('banner'):
                banner_preview = vuln['banner'][:100] + '...' if len(vuln['banner']) > 100 else vuln['banner']
                print(f"   Evidence: {banner_preview}")
            
            print()  # Empty line between vulnerabilities
        
        # Print summary
        print(f"{Colors.CYAN}Vulnerability Summary:{Colors.END}")
        if critical_count > 0:
            print(f"  {Colors.RED}{Colors.BOLD}CRITICAL: {critical_count}{Colors.END}")
        if high_count > 0:
            print(f"  {Colors.RED}HIGH: {high_count}{Colors.END}")
        if medium_count > 0:
            print(f"  {Colors.YELLOW}MEDIUM: {medium_count}{Colors.END}")
        if low_count > 0:
            print(f"  {Colors.BLUE}LOW: {low_count}{Colors.END}")
        
        total_vulns = critical_count + high_count + medium_count + low_count
        print(f"  {Colors.CYAN}TOTAL: {total_vulns}{Colors.END}")
        
        if critical_count > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}🚨 {critical_count} CRITICAL vulnerabilities require immediate attention!{Colors.END}")
        
        # Update live vulnerability tracking
        self.results["live_vulnerability_checks"]["vulnerabilities_found"] = total_vulns
        self.results["live_vulnerability_checks"]["last_updated"] = datetime.now().isoformat()

    # =============================================================================
    # LIVE VULNERABILITY CHECKING
    # =============================================================================

    def live_vulnerability_scan(self):
        """Perform live vulnerability checks against official databases"""
        self.print_header("LIVE VULNERABILITY SCANNING - NVD & CVE DATABASES")
        
        print(f"{Colors.CYAN}Starting live vulnerability checks against official databases...{Colors.END}")
        print(f"{Colors.YELLOW}Note: This uses the National Vulnerability Database (NVD) - US Government{Colors.END}")
        print(f"{Colors.YELLOW}Rate limiting: 1 request every 6 seconds to respect API limits{Colors.END}\n")
        
        live_vulns_found = 0
        
        # Check technologies found during port scanning
        for port_info in self.results.get("port_scanning", {}).get("open_ports", []):
            if port_info.get('banner'):
                software, version = self.extract_software_from_banner(port_info['banner'])
                if software and version:
                    live_vulns = self.check_software_against_nvd(software, version, port_info)
                    live_vulns_found += len(live_vulns)
        
        # Check web technologies
        for url_data in self.results.get("web_technologies", {}).get("analyzed_urls", []):
            for tech in url_data.get("technologies", []):
                if ':' in tech:  # Format like "Server: Apache/2.4.18"
                    tech_type, tech_info = tech.split(':', 1)
                    software, version = self.extract_software_from_string(tech_info.strip())
                    if software and version:
                        live_vulns = self.check_software_against_nvd(software, version, {"service": f"Web: {tech_type}"})
                        live_vulns_found += len(live_vulns)
        
        # end live_vulnerability_scan processing
        # (Reporting content for markdown moved to _build_markdown_report)
        
        self.results["live_vulnerability_checks"]["nvd_checked"] = True
        self.results["live_vulnerability_checks"]["vulnerabilities_found"] = live_vulns_found
        
        if live_vulns_found > 0:
            self.print_success(f"Live vulnerability check completed: {live_vulns_found} vulnerabilities found in official databases")
        else:
            self.print_success("Live vulnerability check completed: No additional vulnerabilities found in official databases")

    def extract_software_from_banner(self, banner):
        """Extract software name and version from service banner"""
        # Common patterns for software detection
        patterns = {
            'Apache': (r'Apache[/\s](\d+\.\d+\.\d+)', 'apache'),
            'nginx': (r'nginx/(\d+\.\d+\.\d+)', 'nginx'),
            'IIS': (r'IIS[/\s](\d+\.\d+)', 'iis'),
            'OpenSSH': (r'OpenSSH[_-]?(\d+\.\d+[p\d]*)', 'openssh'),
            'MySQL': (r'MySQL[_-]?(\d+\.\d+\.\d+)', 'mysql'),
            'PostgreSQL': (r'PostgreSQL[_\s](\d+\.\d+)', 'postgresql'),
            'GlassFish': (r'GlassFish[^\d]*(\d+\.\d+)', 'glassfish'),
            'Tomcat': (r'Tomcat[/\s](\d+\.\d+\.\d+)', 'tomcat'),
            'MailEnable': (r'MailEnable[^\d]*(\d+\.\d+)', 'mailenable'),
        }
        
        for software_name, (pattern, key) in patterns.items():
            match = re.search(pattern, banner, re.IGNORECASE)
            if match:
                return key, match.group(1)
        
        return None, None

    def extract_software_from_string(self, tech_string):
        """Extract software and version from technology string"""
        # Handle common patterns in technology detection
        patterns = [
            (r'(\w+)[/\s](\d+\.\d+\.\d+)', 1, 2),  # Apache/2.4.18
            (r'(\w+)\s+(\d+\.\d+)', 1, 2),         # IIS 7.5
            (r'jquery[.-](\d+\.\d+\.\d+)', 'jquery', 1),  # jquery-1.6.1
        ]
        
        for pattern, software_idx, version_idx in patterns:
            match = re.search(pattern, tech_string, re.IGNORECASE)
            if match:
                if isinstance(software_idx, int):
                    software = match.group(software_idx).lower()
                else:
                    software = software_idx
                
                version = match.group(version_idx)
                return software, version
        
        return None, None

    def check_software_against_nvd(self, software, version, context_info):
        """Check software against National Vulnerability Database"""
        self.print_debug(f"Checking NVD for: {software} {version}")
        
        vulnerabilities = self.live_checker.comprehensive_vulnerability_check(software, version)
        
        for vuln in vulnerabilities:
            vulnerability_record = {
                "type": "Live Vulnerability Scan",
                "severity": vuln['severity'],
                "description": f"{vuln['id']}: {vuln['description']}",
                "software": f"{software} {version}",
                "cves": [vuln['id']],
                "cvss_score": vuln['cvss_score'],
                "source": vuln['source'],
                "published": vuln['published'],
                "recommendation": f"Apply security patches for {software} or upgrade to latest version"
            }
            
            # Add context if available
            if 'service' in context_info:
                vulnerability_record['service'] = context_info['service']
            if 'ip' in context_info:
                vulnerability_record['ip'] = context_info['ip']
            if 'port' in context_info:
                vulnerability_record['port'] = context_info['port']
            
            self.results["vulnerabilities"].append(vulnerability_record)
            
            # Print critical findings immediately
            if vuln['severity'] in ['CRITICAL', 'HIGH']:
                self.print_critical(f"LIVE SCAN: {vuln['id']} - {software} {version} - CVSS: {vuln['cvss_score']}")
        
        return vulnerabilities

    # =============================================================================
    # EXISTING CORE FUNCTIONS (enhanced with live vulnerability checking)
    # =============================================================================

    def comprehensive_whois_lookup(self):
        """Enhanced WHOIS lookup with detailed parsing"""
        self.print_header("1. COMPREHENSIVE WHOIS REGISTRATION DETAILS")
        
        query_target = self.domain if self.domain else self.target
        
        try:
            self.print_debug(f"Performing WHOIS lookup for: {query_target}")
            w = python_whois.whois(query_target)
            whois_data = {
                "domain": query_target,
                "registrar": {},
                "registrant": {},
                "dates": {},
                "name_servers": [],
                "status": []
            }
            
            # Parse registrar information
            if hasattr(w, 'registrar'):
                whois_data["registrar"]["name"] = w.registrar
            if hasattr(w, 'whois_server'):
                whois_data["registrar"]["whois_server"] = w.whois_server
            
            # Parse dates
            date_fields = ['creation_date', 'expiration_date', 'updated_date']
            for field in date_fields:
                if hasattr(w, field) and getattr(w, field):
                    dates = getattr(w, field)
                    if isinstance(dates, list):
                        whois_data["dates"][field] = dates[0].isoformat() if dates else None
                    else:
                        whois_data["dates"][field] = dates.isoformat()
            
            # Parse name servers
            if hasattr(w, 'name_servers') and w.name_servers:
                whois_data["name_servers"] = [str(ns).lower() for ns in w.name_servers]
            
            # Parse status
            if hasattr(w, 'status') and w.status:
                whois_data["status"] = [str(s) for s in w.status]
            
            # Extract contact information
            contact_fields = ['emails', 'org', 'name', 'address', 'city', 'state', 
                            'country', 'zipcode', 'phone']
            for field in contact_fields:
                if hasattr(w, field) and getattr(w, field):
                    value = getattr(w, field)
                    if isinstance(value, list):
                        whois_data["registrant"][field] = value[0] if value else None
                    else:
                        whois_data["registrant"][field] = value
                    
                    # Collect emails
                    if field == 'emails' and value:
                        if isinstance(value, list):
                            for email in value:
                                if email and isinstance(email, str) and '@' in email:
                                    self.discovered_emails.add(email.lower())
                        elif isinstance(value, str) and '@' in value:
                            self.discovered_emails.add(value.lower())
            
            # Display results
            print(f"{Colors.CYAN}Domain:{Colors.END} {whois_data['domain']}")
            if whois_data["dates"].get("creation_date"):
                print(f"{Colors.CYAN}Creation Date:{Colors.END} {whois_data['dates']['creation_date']}")
            if whois_data["dates"].get("expiration_date"):
                print(f"{Colors.CYAN}Expiration Date:{Colors.END} {whois_data['dates']['expiration_date']}")
            if whois_data["registrar"].get("name"):
                print(f"{Colors.CYAN}Registrar:{Colors.END} {whois_data['registrar']['name']}")
            
            if whois_data["name_servers"]:
                print(f"{Colors.CYAN}Name Servers:{Colors.END}")
                for ns in whois_data["name_servers"][:5]:
                    print(f"  - {ns}")
            
            if self.discovered_emails:
                print(f"{Colors.CYAN}Contact Emails:{Colors.END}")
                for email in list(self.discovered_emails)[:5]:
                    print(f"  - {email}")
            
            self.results["domain_information"]["whois"] = whois_data
            self.save_artifact("whois_detailed.json", whois_data)
            
        except Exception as e:
            self.print_error(f"WHOIS lookup failed: {str(e)}")

    def enhanced_dns_enumeration(self):
        """Comprehensive DNS enumeration with analysis"""
        self.print_header("2. ENHANCED DNS CONFIGURATION ANALYSIS")
        
        if not self.domain:
            self.print_warning("No domain to query")
            return

        dns_data = {
            "records": {},
            "analysis": {},
            "security": {}
        }
        
        record_types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME']
        
        print(f"{Colors.CYAN}Querying {len(record_types)} DNS record types for: {self.domain}{Colors.END}")
        
        for record_type in record_types:
            try:
                answers = dns.resolver.resolve(self.domain, record_type)
                records = [str(rdata) for rdata in answers]
                dns_data["records"][record_type] = records
                
                print(f"\n{Colors.BLUE}{record_type} Records:{Colors.END}")
                for record in records[:10]:
                    print(f"  - {record}")
                
                # Store A records
                if record_type == 'A' and records:
                    self.primary_ip = records[0]
                    self.discovered_ips.update(records)
                    
                # Analyze MX records
                if record_type == 'MX':
                    dns_data["analysis"]["mail_servers"] = records
                    
                # Extract SPF from TXT
                if record_type == 'TXT':
                    spf_records = [r for r in records if 'v=spf1' in r]
                    if spf_records:
                        dns_data["analysis"]["spf_record"] = spf_records[0]
                        # Analyze SPF policy
                        spf_analysis = self.analyze_spf_policy(spf_records[0])
                        dns_data["analysis"]["spf_analysis"] = spf_analysis
                    
            except Exception as e:
                self.print_debug(f"No {record_type} records found: {e}")
        
        # DNSSEC check
        print(f"\n{Colors.BLUE}DNSSEC Status:{Colors.END}")
        try:
            dns.resolver.resolve(self.domain, 'DNSKEY')
            self.print_success("DNSSEC is enabled")
            dns_data["security"]["dnssec"] = True
        except:
            self.print_warning("DNSSEC is NOT enabled (vulnerable to DNS spoofing)")
            dns_data["security"]["dnssec"] = False
            self.results["vulnerabilities"].append({
                "type": "DNS Security",
                "severity": "MEDIUM",
                "description": "DNSSEC not implemented - vulnerable to DNS spoofing attacks",
                "recommendation": "Enable DNSSEC with registrar",
                "source": "Local Database"
            })

        # ── checkdmarc integration ──────────────────────────────────────
        print(f"\n{Colors.BLUE}Running checkdmarc analysis...{Colors.END}")
        try:
            import subprocess, json as _json
            proc = subprocess.run(
                ["checkdmarc", self.domain, "-f", "json"],
                capture_output=True, text=True, timeout=60
            )
            if proc.returncode == 0 and proc.stdout.strip():
                cdm = _json.loads(proc.stdout)
                dns_data["checkdmarc"] = cdm

                # ── DMARC ──
                dmarc_info = cdm.get("dmarc", {})
                dns_data["analysis"]["dmarc_record"] = dmarc_info.get("record", "")
                dns_data["analysis"]["dmarc_valid"] = dmarc_info.get("valid", False)
                dmarc_tags = dmarc_info.get("tags", {})
                dns_data["analysis"]["dmarc_policy"] = dmarc_tags.get("p", {}).get("value", "none") if isinstance(dmarc_tags, dict) else "none"
                dns_data["analysis"]["dmarc_subdomain_policy"] = dmarc_tags.get("sp", {}).get("value", "") if isinstance(dmarc_tags, dict) else ""
                dns_data["analysis"]["dmarc_pct"] = dmarc_tags.get("pct", {}).get("value", 100) if isinstance(dmarc_tags, dict) else 100
                dns_data["analysis"]["dmarc_rua"] = dmarc_tags.get("rua", {}).get("value", []) if isinstance(dmarc_tags, dict) else []
                dns_data["analysis"]["dmarc_ruf"] = dmarc_tags.get("ruf", {}).get("value", []) if isinstance(dmarc_tags, dict) else []
                dns_data["analysis"]["dmarc_warnings"] = dmarc_info.get("warnings", [])

                if dmarc_info.get("record"):
                    self.print_success(f"DMARC Record: {dmarc_info['record']}")
                    print(f"  Policy: {dns_data['analysis']['dmarc_policy']}")
                    print(f"  Valid: {dmarc_info.get('valid', False)}")
                else:
                    self.print_warning("No DMARC record found")
                    self.results["vulnerabilities"].append({
                        "type": "Email Security",
                        "severity": "HIGH",
                        "description": "No DMARC record found - domain is vulnerable to email spoofing",
                        "recommendation": "Publish a DMARC record with at least p=quarantine",
                        "source": "checkdmarc"
                    })

                # ── Enhanced SPF from checkdmarc ──
                spf_info = cdm.get("spf", {})
                if spf_info.get("record"):
                    dns_data["analysis"]["spf_record"] = spf_info["record"]
                    dns_data["analysis"]["spf_valid"] = spf_info.get("valid", False)
                    dns_data["analysis"]["spf_dns_lookups"] = spf_info.get("dns_lookups", 0)
                    dns_data["analysis"]["spf_warnings"] = spf_info.get("warnings", [])
                    self.print_success(f"SPF Record: {spf_info['record']}")
                    print(f"  Valid: {spf_info.get('valid', False)}")
                    print(f"  DNS Lookups: {spf_info.get('dns_lookups', 0)}/10")

                # ── MTA-STS ──
                mta_sts = cdm.get("mta_sts", {})
                if mta_sts:
                    dns_data["analysis"]["mta_sts"] = mta_sts
                    if mta_sts.get("valid"):
                        policy = mta_sts.get("policy", {})
                        self.print_success(f"MTA-STS: mode={policy.get('mode', 'N/A')}")
                    else:
                        self.print_warning("MTA-STS not configured or invalid")

                # ── MX with TLS info ──
                mx_info = cdm.get("mx", {})
                if mx_info.get("hosts"):
                    dns_data["analysis"]["mx_hosts"] = mx_info["hosts"]
                    dns_data["analysis"]["mx_warnings"] = mx_info.get("warnings", [])
                    for host in mx_info["hosts"]:
                        tls_status = "TLS" if host.get("tls") else "NO TLS"
                        starttls = "STARTTLS" if host.get("starttls") else "no STARTTLS"
                        print(f"  MX: {host.get('hostname', '')} [{tls_status}, {starttls}]")

                # ── NS info ──
                ns_info = cdm.get("ns", {})
                if ns_info.get("hostnames"):
                    dns_data["analysis"]["ns_hostnames"] = ns_info["hostnames"]
                    dns_data["analysis"]["ns_warnings"] = ns_info.get("warnings", [])

                # ── SOA ──
                soa_info = cdm.get("soa", {})
                if soa_info:
                    dns_data["analysis"]["soa"] = soa_info

                # ── DNSSEC from checkdmarc ──
                if "dnssec" in cdm:
                    dns_data["security"]["dnssec"] = cdm["dnssec"]

                self.print_success("checkdmarc analysis complete")
            else:
                err_msg = proc.stderr.strip() if proc.stderr else "unknown error"
                self.print_warning(f"checkdmarc returned no output: {err_msg}")
        except FileNotFoundError:
            self.print_warning("checkdmarc not installed (pip install checkdmarc)")
        except subprocess.TimeoutExpired:
            self.print_warning("checkdmarc timed out after 60s")
        except Exception as e:
            self.print_warning(f"checkdmarc failed: {str(e)}")

        self.results["domain_information"]["dns"] = dns_data
        self.save_artifact("dns_analysis.json", dns_data)

    def analyze_spf_policy(self, spf_record):
        """Analyze SPF policy for security"""
        analysis = {}
        
        if '+all' in spf_record:
            analysis['policy_strength'] = 'WEAK'
            analysis['risk'] = 'HIGH'
            analysis['description'] = 'SPF uses +all (allows any server to send mail)'
        elif '~all' in spf_record:
            analysis['policy_strength'] = 'MODERATE'
            analysis['risk'] = 'MEDIUM'
            analysis['description'] = 'SPF uses ~all (softfail)'
        elif '-all' in spf_record:
            analysis['policy_strength'] = 'STRONG'
            analysis['risk'] = 'LOW'
            analysis['description'] = 'SPF uses -all (strict policy)'
        else:
            analysis['policy_strength'] = 'UNKNOWN'
            analysis['risk'] = 'MEDIUM'
            analysis['description'] = 'SPF policy strength unknown'
        
        return analysis

    def comprehensive_subdomain_enumeration(self):
        """Enhanced subdomain discovery with multiple techniques"""
        self.print_header("3. COMPREHENSIVE SUBDOMAIN ENUMERATION")
        
        if not self.domain:
            self.print_warning("No domain to enumerate")
            return
        
        subdomains_data = {
            "common_subdomains": [],
            "certificate_transparency": [],
            "dns_bruteforce": [],
            "total_discovered": 0
        }
        
        print(f"{Colors.CYAN}Starting subdomain enumeration for: {self.domain}{Colors.END}")
        
        # Technique 1: Common subdomains
        found_common = self.enumerate_common_subdomains()
        subdomains_data["common_subdomains"] = found_common
        
        # Technique 2: Certificate Transparency
        found_ct = self.certificate_transparency_lookup()
        subdomains_data["certificate_transparency"] = found_ct
        
        # Technique 3: DNS Brute Force (if deep scan)
        if self.deep_scan:
            found_brute = self.dns_brute_force()
            subdomains_data["dns_bruteforce"] = found_brute
        
        # Combine and deduplicate
        all_subdomains = set()
        for sub in found_common + found_ct + (found_brute if self.deep_scan else []):
            subdomain_name = sub["subdomain"]
            all_subdomains.add(subdomain_name)
            if "ip" in sub and sub["ip"]:
                self.discovered_ips.add(sub["ip"])
        
        subdomains_data["total_discovered"] = len(all_subdomains)
        self.discovered_subdomains = {sub: "discovered" for sub in all_subdomains}
        
        print(f"\n{Colors.GREEN}Total unique subdomains found: {len(all_subdomains)}{Colors.END}")
        if all_subdomains:
            for subdomain in sorted(list(all_subdomains))[:15]:
                print(f"  - {subdomain}")
            
            if len(all_subdomains) > 15:
                print(f"  ... and {len(all_subdomains) - 15} more")
        else:
            self.print_warning("No subdomains discovered")
        
        self.results["subdomains"] = subdomains_data
        self.save_artifact("subdomains_comprehensive.json", subdomains_data)

    def enumerate_common_subdomains(self):
        """Enumerate common subdomains"""
        subdomains = [
            'www', 'mail', 'webmail', 'ftp', 'smtp', 'pop', 'imap', 'ns', 'ns1', 'ns2',
            'admin', 'portal', 'api', 'dev', 'staging', 'test', 'uat', 'demo',
            'vpn', 'ssh', 'remote', 'gateway', 'firewall', 'router',
            'blog', 'shop', 'store', 'cdn', 'static', 'assets',
            'mobile', 'm', 'app', 'beta', 'alpha', 'support', 'help',
            'cpanel', 'plesk', 'whm', 'panel', 'mysql', 'db', 'backup'
        ]
        
        found = []
        print(f"{Colors.CYAN}Testing {len(subdomains)} common subdomains...{Colors.END}")
        
        for sub in subdomains:
            subdomain = f"{sub}.{self.domain}"
            try:
                answers = dns.resolver.resolve(subdomain, 'A')
                ips = [str(rdata) for rdata in answers]
                found.append({
                    "subdomain": subdomain,
                    "ip": ips[0] if ips else None,
                    "source": "common_wordlist"
                })
                self.print_success(f"{subdomain} -> {', '.join(ips)}")
            except:
                pass
        
        self.print_debug(f"Found {len(found)} subdomains from common wordlist")
        return found

    def certificate_transparency_lookup(self):
        """Check Certificate Transparency logs"""
        found = []
        try:
            url = f"https://crt.sh/?q=%.{self.domain}&output=json"
            self.print_debug(f"Querying Certificate Transparency: {url}")
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                certs = response.json()
                domains = set()
                
                for cert in certs[:100]:
                    name_value = cert.get('name_value', '')
                    for domain in name_value.split('\n'):
                        clean_domain = domain.strip().lower()
                        if clean_domain and self.domain in clean_domain:
                            domains.add(clean_domain)
                
                for domain in domains:
                    found.append({
                        "subdomain": domain,
                        "source": "certificate_transparency"
                    })
                
                print(f"{Colors.GREEN}Found {len(domains)} domains in CT logs{Colors.END}")
                
        except Exception as e:
            self.print_error(f"Certificate Transparency check failed: {str(e)}")
        
        return found

    def dns_brute_force(self):
        """DNS brute force with larger wordlist"""
        if not self.deep_scan:
            return []
            
        print(f"{Colors.YELLOW}Starting DNS brute force (this may take a while)...{Colors.END}")
        
        # Enhanced wordlist for financial institutions
        financial_subdomains = [
            'gateway', 'payment', 'pay', 'card', 'credit', 'debit', 'merchant',
            'pos', 'terminal', 'processing', 'transaction', 'settlement',
            'authorization', 'clearing', 'reconciliation', 'chargeback',
            'fraud', 'risk', 'compliance', 'kyc', 'aml', 'pci', 'dss',
            'issuing', 'acquiring', 'portfolio', 'loyalty', 'rewards'
        ]
        
        found = []
        tested = 0
        max_tests = 200
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_sub = {
                executor.submit(self.check_subdomain, f"{sub}.{self.domain}"): f"{sub}.{self.domain}"
                for sub in financial_subdomains[:max_tests]
            }
            
            for future in concurrent.futures.as_completed(future_to_sub):
                tested += 1
                subdomain = future_to_sub[future]
                try:
                    result = future.result()
                    if result:
                        found.append(result)
                        self.print_success(f"{subdomain} -> {result['ip']}")
                except Exception:
                    pass
        
        print(f"{Colors.GREEN}DNS brute force completed: {len(found)} subdomains found from {tested} tested{Colors.END}")
        return found

    def check_subdomain(self, subdomain):
        """Check if subdomain exists"""
        try:
            answers = dns.resolver.resolve(subdomain, 'A')
            ips = [str(rdata) for rdata in answers]
            return {
                "subdomain": subdomain,
                "ip": ips[0] if ips else None,
                "source": "dns_bruteforce"
            }
        except:
            return None

    def advanced_port_scanning(self):
        """Comprehensive port scanning with service detection"""
        self.print_header("4. ADVANCED PORT SCANNING & SERVICE DETECTION")
        
        target_ip = self.primary_ip or self.target
        if not target_ip:
            self.print_warning("No IP address available for scanning")
            return
        
        port_data = {
            "target": target_ip,
            "scan_time": datetime.now().isoformat(),
            "open_ports": [],
            "services": {},
            "vulnerabilities": []
        }
        
        # Extended port list including financial services ports
        common_ports = {
            21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
            80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 465: 'SMTPS',
            587: 'SMTP-Submission', 993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL',
            3389: 'RDP', 5432: 'PostgreSQL', 8000: 'HTTP-Alt', 8080: 'HTTP-Proxy',
            8100: 'HTTP-Alt2', 8101: 'HTTP-Alt3', 8443: 'HTTPS-Alt', 9090: 'HTTP-Admin',
            10443: 'HTTPS-Alt2', 11443: 'HTTPS-Alt3',
            # Financial services ports
            8443: 'HTTPS-Alt', 9443: 'HTTPS-Service', 10443: 'HTTPS-Alt2', 
            11443: 'HTTPS-Alt3', 12443: 'HTTPS-Alt4'
        }
        
        # Add discovered IPs from subdomains to scan
        ips_to_scan = [target_ip]
        for subdomain_info in self.results.get("subdomains", {}).get("common_subdomains", []):
            if "ip" in subdomain_info and subdomain_info["ip"]:
                ips_to_scan.append(subdomain_info["ip"])
        
        # Deduplicate IPs
        ips_to_scan = list(set(ips_to_scan))
        
        print(f"{Colors.CYAN}Scanning {len(ips_to_scan)} IP addresses on {len(common_ports)} ports...{Colors.END}")
        
        all_open_ports = []
        for ip in ips_to_scan[:3]:  # Limit to 3 IPs for time reasons
            print(f"{Colors.CYAN}Scanning IP: {ip}{Colors.END}")
            open_ports = self.scan_ip_ports(ip, common_ports)
            all_open_ports.extend(open_ports)
        
        # Sort by port number
        all_open_ports.sort(key=lambda x: x["port"])
        
        # Display results in table format
        if all_open_ports:
            print(f"\n{Colors.GREEN}OPEN PORTS:{Colors.END}")
            print(f"{'IP':<15} {'Port':<8} {'Service':<15} {'Version/Banner':<30} {'Status':<10}")
            print("-" * 85)
            for port_info in all_open_ports:
                banner = port_info.get('banner', '') or ''
                banner_display = banner[:28] + '..' if banner and len(banner) > 30 else banner
                print(f"{port_info['ip']:<15} {port_info['port']:<8} {port_info['service']:<15} {banner_display or '':<30} {'OPEN':<10}")
        else:
            self.print_warning("No common ports found open")
        
        port_data["open_ports"] = all_open_ports
        self.results["port_scanning"] = port_data
        self.save_artifact("port_scanning.json", port_data)

    def scan_ip_ports(self, ip, port_dict):
        """Scan ports for a specific IP"""
        open_ports = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            future_to_port = {
                executor.submit(self.scan_port, ip, port, service): (port, service) 
                for port, service in port_dict.items()
            }
            
            for future in concurrent.futures.as_completed(future_to_port):
                port, service = future_to_port[future]
                try:
                    result = future.result()
                    if result:
                        open_ports.append(result)
                        self.analyze_service_vulnerabilities(result)
                except Exception as e:
                    pass
        
        return open_ports

    def scan_port(self, ip, port, service):
        """Scan individual port with banner grabbing"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((ip, port))
            
            if result == 0:
                banner = self.grab_banner(ip, port)
                port_info = {
                    "ip": ip,
                    "port": port,
                    "service": service,
                    "banner": banner,
                    "protocol": "tcp"
                }
                
                # Enhanced service detection
                if banner:
                    port_info["detected_service"] = self.detect_service_from_banner(banner)
                
                sock.close()
                return port_info
            sock.close()
        except:
            pass
        return None

    def detect_service_from_banner(self, banner):
        """Detect specific services from banner"""
        banner_lower = banner.lower()
        
        # Mail services
        if 'mailenable' in banner_lower:
            version_match = re.search(r'MailEnable[^\d]*(\d+\.\d+)', banner, re.IGNORECASE)
            return f"MailEnable {version_match.group(1) if version_match else 'Unknown'}"
        
        # Web servers
        elif 'apache' in banner_lower:
            version_match = re.search(r'Apache/(\d+\.\d+\.\d+)', banner)
            return f"Apache {version_match.group(1) if version_match else 'Unknown'}"
        
        elif 'iis' in banner_lower or 'microsoft-iis' in banner_lower:
            version_match = re.search(r'IIS/(\d+\.\d+)', banner, re.IGNORECASE)
            return f"IIS {version_match.group(1) if version_match else 'Unknown'}"
        
        elif 'glassfish' in banner_lower:
            version_match = re.search(r'GlassFish[^\d]*(\d+\.\d+)', banner, re.IGNORECASE)
            return f"GlassFish {version_match.group(1) if version_match else 'Unknown'}"
        
        elif 'nginx' in banner_lower:
            version_match = re.search(r'nginx/(\d+\.\d+\.\d+)', banner)
            return f"nginx {version_match.group(1) if version_match else 'Unknown'}"
        
        return None

    def grab_banner(self, ip, port):
        """Enhanced banner grabbing"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, port))
            
            # Send appropriate probes based on port
            if port in [80, 8080, 8000, 8100, 8101, 9090]:
                sock.send(b"GET / HTTP/1.0\r\nHost: example.com\r\n\r\n")
            elif port in [21]:  # FTP
                sock.send(b"\r\n")
            elif port in [22]:  # SSH
                sock.send(b"SSH-2.0-OpenSSH_8.2\r\n")
            elif port in [25, 587]:  # SMTP
                sock.send(b"EHLO example.com\r\n")
            elif port in [110]:  # POP3
                sock.send(b"USER test\r\n")
            elif port in [143]:  # IMAP
                sock.send(b"a001 LOGIN test test\r\n")
            
            banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
            sock.close()
            
            return banner[:500] if banner else ''
            
        except:
            return ''

    def analyze_service_vulnerabilities(self, service_info):
        """Analyze services for known vulnerabilities using real vulnerability database"""
        banner = (service_info.get('banner') or '').lower()
        port = service_info['port']
        service = service_info['service']
        ip = service_info['ip']
        
        if not banner:
            return
        
        # Extract version information from banner
        version_patterns = [
            r'Apache/(\d+\.\d+\.\d+)',
            r'nginx/(\d+\.\d+\.\d+)',
            r'IIS/(\d+\.\d+)',
            r'GlassFish[^\d]*(\d+\.\d+)',
            r'MailEnable[^\d]*(\d+\.\d+)',
            r'Microsoft-HTTPAPI/(\d+\.\d+)',
            r'OpenSSH_(\d+\.\d+)',
            r'PostgreSQL (\d+\.\d+)',
            r'MySQL[^\d]*(\d+\.\d+\.\d+)'
        ]
        
        detected_software = None
        detected_version = None
        
        for pattern in version_patterns:
            match = re.search(pattern, banner, re.IGNORECASE)
            if match:
                detected_version = match.group(1)
                # Determine software type from pattern
                if 'apache' in pattern.lower():
                    detected_software = 'apache'
                elif 'nginx' in pattern.lower():
                    detected_software = 'nginx'
                elif 'iis' in pattern.lower():
                    detected_software = 'iis'
                elif 'glassfish' in pattern.lower():
                    detected_software = 'glassfish'
                elif 'mailenable' in pattern.lower():
                    detected_software = 'mailenable'
                elif 'openssh' in pattern.lower():
                    detected_software = 'openssh'
                elif 'postgresql' in pattern.lower():
                    detected_software = 'postgresql'
                elif 'mysql' in pattern.lower():
                    detected_software = 'mysql'
                break
        
        # Check against vulnerability database
        if detected_software and detected_version:
            vuln_info = self.vuln_db.check_software_version(detected_software, detected_version, banner)
            if vuln_info:
                vulnerability = {
                    "type": "Outdated Software",
                    "severity": vuln_info['severity'],
                    "service": f"{service} on port {port}",
                    "ip": ip,
                    "software": f"{detected_software} {detected_version}",
                    "description": vuln_info['description'],
                    "cves": vuln_info['cves'],
                    "banner": service_info.get('banner'),
                    "recommendation": f"Upgrade {detected_software} to version {vuln_info.get('current_version', 'latest')}",
                    "source": "Local Database"
                }
                
                self.results["vulnerabilities"].append(vulnerability)
                
                if vuln_info['severity'] == 'CRITICAL':
                    self.print_critical(f"Outdated {detected_software} {detected_version} detected on {ip}:{port}")
                    self.print_critical(f"CVEs: {', '.join(vuln_info['cves'])}")
                else:
                    self.print_warning(f"Vulnerable {detected_software} {detected_version} detected on {ip}:{port}")

    def ssl_certificate_analysis(self):
        """SSL/TLS analysis powered by rbsec sslscan (https://github.com/rbsec/sslscan).

        We invoke sslscan with XML output (`--xml=-`) and parse the results to
        extract certificate details, supported protocol versions, enabled cipher
        suites, and known-weak flags. Output is rendered in the same human
        readable format the frontend expects (Subject/Issuer/Valid From/etc.)
        so the existing parsers continue to work, and the raw sslscan XML is
        preserved under `ssl_certificates` for advanced consumers.
        """
        self.print_header("5. SSL/TLS CERTIFICATE ANALYSIS")

        if not self.domain:
            self.print_warning("No domain for SSL analysis")
            return

        import shutil
        import xml.etree.ElementTree as ET

        # Look for the sslscan binary in a few common locations so both dev
        # machines (apt-installed) and the production VM (cloned rbsec/sslscan
        # repo under /var/www/anatscrawler/sslscan) are supported.
        candidate_paths = [
            os.environ.get("SSLSCAN_BIN"),
            shutil.which("sslscan"),
            "/usr/bin/sslscan",
            "/usr/local/bin/sslscan",
            "/var/www/anatscrawler/sslscan/sslscan",
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "sslscan", "sslscan"),
        ]
        sslscan_bin = next(
            (p for p in candidate_paths if p and os.path.isfile(p) and os.access(p, os.X_OK)),
            None,
        )
        if not sslscan_bin:
            self.print_warning(
                "sslscan binary not found. Build it from the cloned repo "
                "(cd sslscan && make static) or install via apt. Checked: "
                + ", ".join(p for p in candidate_paths if p)
            )
            return

        ports_to_check = [443]
        # If earlier modules detected additional open HTTPS-ish ports, include them.
        try:
            open_ports = self.results.get("open_ports", []) or []
            alt_https_ports = {8443, 9443, 10443, 11443, 12443}
            for entry in open_ports:
                if isinstance(entry, dict):
                    p = entry.get("port")
                    svc = str(entry.get("service", "")).lower()
                    if p in alt_https_ports and ("https" in svc or "ssl" in svc or "tls" in svc or svc == ""):
                        if p not in ports_to_check:
                            ports_to_check.append(p)
        except Exception:
            pass

        print(
            f"{Colors.CYAN}Running sslscan on {self.domain} "
            f"across {len(ports_to_check)} port(s): {ports_to_check}{Colors.END}"
        )

        ssl_data = {}
        certificates_found = 0
        primary_cert_printed = False

        for port in ports_to_check:
            target = f"{self.domain}:{port}"
            try:
                self.print_debug(f"sslscan {target}")
                proc = subprocess.run(
                    [
                        sslscan_bin,
                        "--no-colour",
                        "--connect-timeout=5",
                        "--sleep=0",
                        "--show-certificate",
                        "--xml=-",
                        target,
                    ],
                    capture_output=True,
                    text=True,
                    timeout=180,
                )
            except subprocess.TimeoutExpired:
                self.print_warning(f"sslscan timeout on port {port}")
                continue
            except Exception as e:
                self.print_debug(f"sslscan error on port {port}: {e}")
                continue

            xml_text = (proc.stdout or "").strip()
            if not xml_text:
                self.print_debug(f"Empty sslscan output on port {port}")
                continue

            try:
                root = ET.fromstring(xml_text)
            except ET.ParseError as e:
                self.print_debug(f"Failed to parse sslscan XML for port {port}: {e}")
                continue

            ssl_test = root.find("ssltest") if root.tag != "ssltest" else root
            if ssl_test is None:
                continue

            # --- Certificate details ---
            cert_el = ssl_test.find("certificate") or ssl_test.find("certificates/certificate")
            cert_info = {}
            if cert_el is not None:
                cert_node = cert_el  # local binding for type narrowing
                def _val(tag):
                    node = cert_node.find(tag)
                    if node is None or not node.text:
                        return None
                    text = node.text.strip()
                    # sslscan sometimes prefixes element text with its own label
                    # (e.g. "Signature Algorithm: ecdsa-with-SHA256"). Strip it.
                    import re as _re
                    text = _re.sub(
                        r"^(Signature Algorithm|Serial Number|Not Valid Before|Not Valid After)\s*:\s*",
                        "",
                        text,
                        flags=_re.IGNORECASE,
                    )
                    return text.strip() or None

                subject_full = _val("subject")
                issuer_full = _val("issuer")
                not_before = _val("not-valid-before")
                not_after = _val("not-valid-after")
                signature_algorithm = _val("signature-algorithm")
                self_signed = _val("self-signed")
                expired = _val("expired")
                pk_node = cert_el.find("pk")
                public_key = {
                    "type": pk_node.get("type") if pk_node is not None else None,
                    "bits": pk_node.get("bits") if pk_node is not None else None,
                }

                # Parse Subject CN out of the full DN for the UI.
                cn_match = None
                if subject_full:
                    import re as _re
                    cn_match = _re.search(r"CN\s*=\s*([^,/]+)", subject_full)
                subject_cn = cn_match.group(1).strip() if cn_match else subject_full

                issuer_cn_match = None
                if issuer_full:
                    import re as _re
                    issuer_cn_match = _re.search(r"CN\s*=\s*([^,/]+)", issuer_full)
                issuer_cn = issuer_cn_match.group(1).strip() if issuer_cn_match else issuer_full

                # Days until expiry.
                days_until_expiry = None
                if not_after:
                    import re as _re
                    normalized = _re.sub(r"\s+", " ", not_after.strip())
                    for fmt in (
                        "%b %d %H:%M:%S %Y GMT",
                        "%b %d %H:%M:%S %Y %Z",
                        "%b %d %H:%M:%S %Y",
                    ):
                        try:
                            expiry_dt = datetime.strptime(normalized, fmt)
                            days_until_expiry = (expiry_dt - datetime.utcnow()).days
                            break
                        except ValueError:
                            continue

                cert_info = {
                    "subject": subject_cn,
                    "subject_full": subject_full,
                    "issuer": issuer_cn,
                    "issuer_full": issuer_full,
                    "not_before": not_before,
                    "not_after": not_after,
                    "signature_algorithm": signature_algorithm,
                    "self_signed": self_signed,
                    "expired": expired,
                    "public_key": public_key,
                    "days_until_expiry": days_until_expiry,
                }

            # --- Protocols ---
            protocols = []
            for p in ssl_test.findall("protocol"):
                protocols.append({
                    "type": p.get("type"),
                    "version": p.get("version"),
                    "enabled": p.get("enabled") == "1",
                })
            enabled_protocols = [
                f"{pr['type'].upper()}{pr['version']}"
                for pr in protocols
                if pr["enabled"]
            ]

            # --- Ciphers ---
            ciphers = []
            for c in ssl_test.findall("cipher"):
                ciphers.append({
                    "status": c.get("status"),
                    "sslversion": c.get("sslversion"),
                    "bits": c.get("bits"),
                    "cipher": c.get("cipher"),
                    "strength": c.get("strength"),
                })
            accepted_ciphers = [c for c in ciphers if c.get("status") in ("accepted", "preferred")]
            weak_ciphers = [c for c in accepted_ciphers if c.get("strength") in ("weak", "medium")]

            # --- Known weak-protocol flags ---
            weak_flags = []
            if any(
                pr["enabled"] and pr["type"].lower() == "ssl" and pr["version"] in ("2", "3")
                for pr in protocols
            ):
                weak_flags.append("SSLv2/SSLv3 enabled")
            if any(
                pr["enabled"] and pr["type"].lower() == "tls" and pr["version"] in ("1.0", "1.1")
                for pr in protocols
            ):
                weak_flags.append("TLS 1.0/1.1 enabled")

            heartbleed_vulns = []
            for hb in ssl_test.findall("heartbleed"):
                if hb.get("vulnerable") == "1":
                    heartbleed_vulns.append(hb.get("sslversion"))

            port_record = {
                "port": port,
                "certificate": cert_info,
                "protocols": protocols,
                "enabled_protocols": enabled_protocols,
                "ciphers": ciphers,
                "accepted_ciphers_count": len(accepted_ciphers),
                "weak_ciphers_count": len(weak_ciphers),
                "weak_flags": weak_flags,
                "heartbleed": heartbleed_vulns,
                "raw_xml": xml_text,
            }

            if not cert_info and not accepted_ciphers:
                # nothing interesting on this port
                continue

            certificates_found += 1
            ssl_data[f"port_{port}"] = port_record

            # --- Console output ---
            print(f"\n{Colors.CYAN}SSL Scan (Port {port}):{Colors.END}")
            if cert_info:
                print(f"  Subject: {cert_info.get('subject') or 'N/A'}")
                print(f"  Issuer: {cert_info.get('issuer') or 'N/A'}")
                print(f"  Valid From: {cert_info.get('not_before') or 'N/A'}")
                print(f"  Valid Until: {cert_info.get('not_after') or 'N/A'}")
                print(f"  Signature Algorithm: {cert_info.get('signature_algorithm') or 'N/A'}")
                pk = cert_info.get("public_key") or {}
                if pk.get("type") or pk.get("bits"):
                    print(f"  Public Key: {pk.get('type')} {pk.get('bits')} bits")

                dte = cert_info.get("days_until_expiry")
                if dte is not None:
                    if dte < 0:
                        self.print_critical(f"SSL certificate expired {abs(dte)} days ago!")
                    elif dte < 30:
                        self.print_critical(f"SSL certificate expires in {dte} days!")
                        self.results["vulnerabilities"].append({
                            "type": "SSL Certificate Expiry",
                            "severity": "HIGH",
                            "description": f"SSL certificate on port {port} expires in {dte} days",
                            "service": f"HTTPS on port {port}",
                            "recommendation": "Renew SSL certificate immediately",
                            "source": "sslscan",
                        })
                    else:
                        self.print_success(f"Certificate valid for {dte} days")

            if enabled_protocols:
                print(f"  Enabled Protocols: {', '.join(enabled_protocols)}")
            if accepted_ciphers:
                print(f"  Accepted Ciphers: {len(accepted_ciphers)} (weak/medium: {len(weak_ciphers)})")
            for flag in weak_flags:
                self.print_critical(f"{flag} on port {port}")
                self.results["vulnerabilities"].append({
                    "type": "Weak SSL/TLS Protocol",
                    "severity": "HIGH",
                    "description": f"{flag} on port {port}",
                    "service": f"HTTPS on port {port}",
                    "recommendation": "Disable legacy SSL/TLS protocol versions",
                    "source": "sslscan",
                })
            if heartbleed_vulns:
                self.print_critical(
                    f"Heartbleed vulnerability detected on port {port} ({', '.join(heartbleed_vulns)})"
                )
                self.results["vulnerabilities"].append({
                    "type": "Heartbleed (CVE-2014-0160)",
                    "severity": "CRITICAL",
                    "description": f"Heartbleed detected on port {port}",
                    "service": f"HTTPS on port {port}",
                    "recommendation": "Upgrade OpenSSL and re-issue certificates",
                    "source": "sslscan",
                })

            # Populate the flat fields the frontend currently reads (first cert wins).
            if cert_info and not primary_cert_printed:
                self.ssl_cert_info = {
                    "Subject": cert_info.get("subject"),
                    "Issuer": cert_info.get("issuer"),
                    "Valid From": cert_info.get("not_before"),
                    "Valid Until": cert_info.get("not_after"),
                    "Signature Algorithm": cert_info.get("signature_algorithm"),
                }
                primary_cert_printed = True

        if certificates_found == 0:
            self.print_warning("No SSL/TLS services responded on common ports")

        self.results["ssl_certificates"] = ssl_data
        self.save_artifact("ssl_analysis.json", ssl_data)

    def get_ssl_certificate(self, domain, port=443):
        """Retrieve SSL certificate details"""
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection((domain, port), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert_der = ssock.getpeercert(binary_form=True)
                    if cert_der is None:
                        return None
                    cert = x509.load_der_x509_certificate(cert_der, default_backend())
                    
                    # Helper to convert a cryptography.x509.Name into a simple dict {OID_NAME: value}
                    def name_to_dict(name_obj):
                        result = {}
                        for attr in name_obj:
                            try:
                                key = attr.oid._name
                            except Exception:
                                key = attr.oid.dotted_string
                            result[key] = attr.value
                        return result

                    cert_info = {
                        'subject': name_to_dict(cert.subject),
                        'issuer': name_to_dict(cert.issuer),
                        'version': cert.version,
                        'serial_number': str(cert.serial_number),
                        'not_before': cert.not_valid_before.isoformat(),
                        'not_after': cert.not_valid_after.isoformat(),
                        'signature_algorithm': cert.signature_algorithm_oid._name,
                        'extensions': {}
                    }
                    
                    # Calculate days until expiry
                    expiry = cert.not_valid_after
                    now = datetime.now()
                    days_until_expiry = (expiry - now).days
                    cert_info['days_until_expiry'] = days_until_expiry
                    
                    # Parse extensions
                    try:
                        for ext in cert.extensions:
                            cert_info['extensions'][ext.oid._name] = str(ext.value)
                    except:
                        pass
                    
                    return cert_info
                    
        except Exception as e:
            return None

    def comprehensive_web_analysis(self):
        """Comprehensive web technology and security analysis"""
        self.print_header("6. COMPREHENSIVE WEB TECHNOLOGY ANALYSIS")
        
        urls_to_check = []
        
        # Build URL list
        if self.target_type == "url":
            urls_to_check.append(self.target)
        elif self.domain:
            urls_to_check.append(f"https://{self.domain}")
            urls_to_check.append(f"http://{self.domain}")
        
        # Add discovered subdomains
        for subdomain in list(self.discovered_subdomains.keys())[:3]:
            urls_to_check.append(f"https://{subdomain}")
        
        print(f"{Colors.CYAN}Analyzing {len(urls_to_check)} URLs for web technologies...{Colors.END}")
        
        web_data = {
            "analyzed_urls": [],
            "technologies": {},
            "security_headers": {},
            "vulnerabilities": []
        }
        
        urls_analyzed = 0
        
        for url in urls_to_check[:5]:
            print(f"\n{Colors.CYAN}Analyzing: {url}{Colors.END}")
            
            try:
                response = requests.get(url, timeout=10, verify=False, allow_redirects=True)
                url_data = self.analyze_web_response(url, response)
                web_data["analyzed_urls"].append(url_data)
                urls_analyzed += 1
                
            except Exception as e:
                self.print_error(f"Failed to analyze {url}: {str(e)}")
        
        self.print_debug(f"Successfully analyzed {urls_analyzed} URLs")
        
        self.results["web_technologies"] = web_data
        self.save_artifact("web_analysis.json", web_data)

    def analyze_web_response(self, url, response):
        """Analyze web response for technologies and security"""
        url_data = {
            "url": url,
            "final_url": response.url,
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "technologies": [],
            "security_issues": []
        }
        
        headers = response.headers
        html = response.text.lower()
        
        # Server detection
        if 'Server' in headers:
            server = headers['Server']
            url_data["technologies"].append(f"Server: {server}")
            print(f"{Colors.GREEN}Server:{Colors.END} {server}")
        
        # Framework detection
        if 'X-Powered-By' in headers:
            powered_by = headers['X-Powered-By']
            url_data["technologies"].append(f"Powered-By: {powered_by}")
            print(f"{Colors.GREEN}Powered-By:{Colors.END} {powered_by}")
        
        # Security headers analysis
        security_headers = self.analyze_security_headers(headers)
        url_data["security_issues"] = security_headers["missing"]
        
        print(f"{Colors.GREEN}Security Headers:{Colors.END}")
        headers_found = 0
        for header, status in security_headers["status"].items():
            if status == "PRESENT":
                headers_found += 1
                self.print_success(f"  {header}")
            else:
                self.print_warning(f"  {header}: MISSING")
                # Add vulnerability for missing security headers
                if header in ['Strict-Transport-Security', 'Content-Security-Policy']:
                    self.results["vulnerabilities"].append({
                        "type": "Missing Security Header",
                        "severity": "HIGH",
                        "description": f"Missing {header} security header",
                        "service": f"Web server: {url}",
                        "recommendation": f"Configure {header} header for enhanced security",
                        "source": "Local Database"
                    })
        
        self.print_debug(f"Found {headers_found} security headers")
        
        # Technology detection from HTML
        technologies = self.detect_technologies_from_html(html)
        url_data["technologies"].extend(technologies)
        
        return url_data

    def analyze_security_headers(self, headers):
        """Analyze security headers"""
        security_headers = {
            'Strict-Transport-Security': 'HSTS (Force HTTPS)',
            'Content-Security-Policy': 'CSP (XSS Protection)',
            'X-Frame-Options': 'Clickjacking Protection',
            'X-Content-Type-Options': 'MIME-sniffing Protection',
            'X-XSS-Protection': 'XSS Protection',
            'Referrer-Policy': 'Referrer Control',
            'Permissions-Policy': 'Feature Policy'
        }
        
        analysis = {
            "status": {},
            "missing": []
        }
        
        for header, description in security_headers.items():
            if header in headers:
                analysis["status"][header] = "PRESENT"
                # Check for weak configurations
                if header == 'X-XSS-Protection' and headers[header] == '0':
                    analysis["missing"].append(f"{header} is disabled")
            else:
                analysis["status"][header] = "MISSING"
                analysis["missing"].append(header)
        
        return analysis

    def detect_technologies_from_html(self, html):
        """Detect technologies from HTML content"""
        technologies = []
        
        tech_patterns = {
            'jQuery': [r'jquery[.-](\d+\.\d+\.\d+)', r'jquery.min.js'],
            'React': ['react', 'react-dom'],
            'Angular': ['ng-app', 'angular'],
            'Vue.js': ['vue.js', 'vue-'],
            'Bootstrap': ['bootstrap.min.css', 'bootstrap.js'],
            'WordPress': ['wp-content', 'wp-includes', 'wordpress'],
            'ASP.NET': ['aspnet', 'asp.net', '__viewstate'],
            'Google Analytics': ['google-analytics', 'gtag', 'ga.js'],
            'Telerik': ['telerik', 'radeditor'],
            'GlassFish': ['glassfish'],
            'MailEnable': ['mailenable']
        }
        
        tech_found = 0
        
        for tech, patterns in tech_patterns.items():
            for pattern in patterns:
                if re.search(pattern, html, re.IGNORECASE):
                    technologies.append(tech)
                    tech_found += 1
                    
                    # Special handling for jQuery version detection
                    if tech == 'jQuery' and 'jquery[.-]' in pattern:
                        version_match = re.search(r'jquery[.-](\d+\.\d+\.\d+)', html, re.IGNORECASE)
                        if version_match:
                            version = version_match.group(1)
                            vuln_info = self.vuln_db.check_software_version('jquery', version, '')
                            if vuln_info:
                                self.print_critical(f"Outdated jQuery {version} detected - {vuln_info['description']}")
                                self.results["vulnerabilities"].append({
                                    "type": "Outdated JavaScript Library",
                                    "severity": vuln_info['severity'],
                                    "description": vuln_info['description'],
                                    "cves": vuln_info['cves'],
                                    "software": f"jQuery {version}",
                                    "service": "Web application",
                                    "recommendation": f"Upgrade to jQuery {vuln_info.get('current_version', '3.7.1')} immediately",
                                    "source": "Local Database"
                                })
                    
                    print(f"{Colors.GREEN}Technology:{Colors.END} {tech}")
                    break
        
        self.print_debug(f"Found {tech_found} technologies in HTML")
        
        return technologies

    def breach_data_check(self):
        """REAL breach checking using HIBP API"""
        if not self.check_breaches or not self.hibp_api_key:
            if self.check_breaches and not self.hibp_api_key:
                self.print_warning("HIBP API key required for breach checking. Skipping.")
            return
            
        self.print_header("7. REAL DATA BREACH ANALYSIS")
        
        breach_data = {}
        
        emails_to_check = list(self.discovered_emails)[:5]  # Limit to 5 due to API rate limits
        
        if not emails_to_check:
            self.print_warning("No email addresses discovered for breach checking")
            return
        
        print(f"{Colors.CYAN}Checking {len(emails_to_check)} emails for data breaches...{Colors.END}")
        
        for email in emails_to_check:
            try:
                self.print_debug(f"Checking breaches for: {email}")
                breaches = self.real_hibp_check(email)
                if breaches:
                    breach_data[email] = breaches
                    self.breached_accounts.append(email)
                    self.print_warning(f"BREACHES FOUND for {email}: {len(breaches)} breaches")
                    
                    for breach in breaches[:3]:
                        print(f"  - {breach.get('Name', 'Unknown')} ({breach.get('BreachDate', 'Unknown date')})")
                        if 'DataClasses' in breach:
                            print(f"    Compromised: {', '.join(breach['DataClasses'][:3])}")
                        
                    # Add to vulnerabilities if passwords were exposed
                    if any('Password' in str(b.get('DataClasses', [])) for b in breaches):
                        self.results["vulnerabilities"].append({
                            "type": "Compromised Credentials",
                            "severity": "CRITICAL",
                            "description": f"Password for {email} exposed in data breaches",
                            "service": "Email account security",
                            "recommendation": "Immediate password reset and enable MFA",
                            "source": "Have I Been Pwned"
                        })
                        self.print_critical(f"PASSWORD EXPOSED for {email} in data breaches!")
                        
                else:
                    self.print_success(f"No breaches found for {email}")
                    
                # Respect rate limits
                time.sleep(1.6)
                        
            except Exception as e:
                self.print_error(f"Breach check failed for {email}: {str(e)}")
                # Still respect rate limits on error
                time.sleep(1.6)
        
        if self.breached_accounts:
            self.print_warning(f"Found {len(self.breached_accounts)} breached accounts")
        else:
            self.print_success("No breached accounts found")
        
        self.results["breach_data"] = breach_data
        self.save_artifact("breach_analysis.json", breach_data)

    def real_hibp_check(self, email):
        """Real HIBP API check - NO SIMULATIONS"""
        try:
            headers = {
                'User-Agent': 'ProfessionalOSINTTool',
                'hibp-api-key': self.hibp_api_key
            }
            
            url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}"
            params = {
                'truncateResponse': 'false'
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return []  # No breaches found
            elif response.status_code == 429:  # Rate limit
                self.print_warning("Rate limit hit, waiting 2 seconds...")
                time.sleep(2)
                response = requests.get(url, headers=headers, params=params, timeout=10)
                if response.status_code == 200:
                    return response.json()
            else:
                self.print_error(f"HIBP API error: {response.status_code}")
                return []
                
        except requests.exceptions.RequestException as e:
            self.print_error(f"HIBP API request failed: {str(e)}")
            return []
        except Exception as e:
            self.print_error(f"HIBP check unexpected error: {str(e)}")
            return []

    def waf_detection(self):
        """Web Application Firewall detection powered by EnableSecurity/wafw00f.

        Runs the wafw00f CLI (https://github.com/EnableSecurity/wafw00f) against
        the target URL(s) with JSON output and records the detected firewall
        product + manufacturer per URL. Results are stored under
        self.results['waf_detection']['detections'] with a shape the frontend
        parser already understands.
        """
        self.print_header("8. WEB APPLICATION FIREWALL DETECTION")

        import shutil
        import tempfile

        # --- Build the list of URLs to probe ---
        urls_to_check = []
        if self.target_type == "url":
            urls_to_check.append(self.target)
        elif self.domain:
            urls_to_check.append(f"https://{self.domain}")
            urls_to_check.append(f"http://{self.domain}")
        urls_to_check = urls_to_check[:3]

        if not urls_to_check:
            self.print_warning("No URLs available for WAF detection")
            return

        # --- Locate wafw00f runner ---
        candidate_paths = [
            os.environ.get("WAFW00F_BIN"),
            shutil.which("wafw00f"),
            "/usr/local/bin/wafw00f",
            "/usr/bin/wafw00f",
            "/var/www/anatscrawler/wafw00f/wafw00f/main.py",
            os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "..", "wafw00f", "wafw00f", "main.py",
            ),
        ]
        wafw00f_cmd = None
        repo_root = None
        for p in candidate_paths:
            if not p or not os.path.isfile(p):
                continue
            if p.endswith(".py"):
                py = shutil.which("python3") or shutil.which("python") or "python3"
                wafw00f_cmd = [py, p]
                repo_root = os.path.dirname(os.path.dirname(os.path.abspath(p)))
                break
            if os.access(p, os.X_OK):
                wafw00f_cmd = [p]
                break

        # Last fallback: `python3 -m wafw00f` (works when pip-installed)
        if wafw00f_cmd is None:
            py = shutil.which("python3") or shutil.which("python")
            if py:
                wafw00f_cmd = [py, "-m", "wafw00f"]

        if wafw00f_cmd is None:
            self.print_warning(
                "wafw00f not found. Install via `pip install wafw00f` or clone "
                "EnableSecurity/wafw00f to /var/www/anatscrawler/wafw00f. "
                "Checked: " + ", ".join(p for p in candidate_paths if p)
            )
            return

        env = os.environ.copy()
        if repo_root:
            existing = env.get("PYTHONPATH", "")
            env["PYTHONPATH"] = repo_root + (os.pathsep + existing if existing else "")

        print(f"{Colors.CYAN}Running wafw00f against {len(urls_to_check)} URL(s)...{Colors.END}")

        detections = []
        waf_detected_count = 0

        for url in urls_to_check:
            self.print_debug(f"wafw00f probing {url}")
            tmp = tempfile.NamedTemporaryFile(prefix="wafw00f_", suffix=".json", delete=False)
            tmp.close()
            try:
                cmd = wafw00f_cmd + [url, "-f", "json", "-o", tmp.name, "-a"]
                try:
                    proc = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=180,
                        env=env,
                    )
                except subprocess.TimeoutExpired:
                    self.print_warning(f"wafw00f timed out on {url}")
                    detections.append({
                        "target": url,
                        "detected": False,
                        "waf": None,
                        "manufacturer": None,
                        "message": "wafw00f timed out",
                    })
                    continue
                except Exception as e:
                    self.print_error(f"wafw00f execution failed on {url}: {e}")
                    detections.append({
                        "target": url,
                        "detected": False,
                        "waf": None,
                        "manufacturer": None,
                        "message": f"wafw00f error: {e}",
                    })
                    continue

                parsed = None
                try:
                    if os.path.getsize(tmp.name) > 0:
                        with open(tmp.name, "r") as f:
                            parsed = json.load(f)
                except Exception as e:
                    self.print_debug(f"Failed to parse wafw00f JSON for {url}: {e}")

                if parsed is None:
                    combined = (proc.stdout or "") + (proc.stderr or "")
                    start = combined.find("[")
                    end = combined.rfind("]")
                    if start != -1 and end != -1 and end > start:
                        try:
                            parsed = json.loads(combined[start:end + 1])
                        except Exception:
                            parsed = None

                if not parsed:
                    detections.append({
                        "target": url,
                        "detected": False,
                        "waf": None,
                        "manufacturer": None,
                        "message": "No WAF detected",
                    })
                    print(f"{Colors.YELLOW}No WAF detected on {url}{Colors.END}")
                    continue

                # wafw00f returns a list of result dicts (one per URL)
                if isinstance(parsed, dict):
                    parsed = [parsed]

                for item in parsed:
                    if not isinstance(item, dict):
                        continue
                    detected = bool(item.get("detected"))
                    firewall = item.get("firewall") or item.get("waf")
                    manufacturer = item.get("manufacturer")
                    item_url = item.get("url") or url
                    if detected and firewall and firewall.lower() not in ("none", "no"):
                        waf_detected_count += 1
                        self.waf_detected = True
                        message = (
                            f"WAF detected: {firewall}"
                            + (f" ({manufacturer})" if manufacturer else "")
                        )
                        self.print_success(f"{message} on {item_url}")
                    else:
                        message = "No WAF detected"
                        print(f"{Colors.YELLOW}No WAF detected on {item_url}{Colors.END}")
                    detections.append({
                        "target": item_url,
                        "detected": detected,
                        "waf": firewall,
                        "manufacturer": manufacturer,
                        "message": message,
                    })
            finally:
                try:
                    os.unlink(tmp.name)
                except Exception:
                    pass

        if waf_detected_count == 0:
            self.print_warning("No WAF detected on any tested URLs")

        waf_data = {
            "engine": "wafw00f",
            "detections": detections,
            "total": len(detections),
            "waf_detected_count": waf_detected_count,
        }
        self.results["waf_detection"] = waf_data
        self.save_artifact("waf_detection.json", waf_data)

    def ip_geolocation_analysis(self):
        """Perform IP geolocation and ASN analysis"""
        self.print_header("9. IP GEOLOCATION & NETWORK ANALYSIS")
        
        ip_data = {}
        unique_ips = list(self.discovered_ips)
        
        if not unique_ips:
            self.print_warning("No IP addresses discovered for geolocation analysis")
            return
        
        print(f"{Colors.CYAN}Performing geolocation analysis for {len(unique_ips)} IPs...{Colors.END}")
        
        ips_analyzed = 0
        
        for ip in unique_ips[:10]:  # Limit to 10 IPs
            try:
                self.print_debug(f"Geolocating IP: {ip}")
                geo_info = self.get_ip_geolocation(ip)
                if geo_info:
                    ips_analyzed += 1
                    ip_data[ip] = geo_info
                    print(f"\n{Colors.CYAN}IP: {ip}{Colors.END}")
                    print(f"  Organization: {geo_info.get('org', 'N/A')}")
                    print(f"  Country: {geo_info.get('country', 'N/A')}")
                    print(f"  City: {geo_info.get('city', 'N/A')}")
                    print(f"  ASN: {geo_info.get('asn', 'N/A')}")
            except Exception as e:
                self.print_error(f"Geolocation failed for {ip}: {str(e)}")
        
        self.print_debug(f"Successfully analyzed {ips_analyzed} IP addresses")
        
        self.results["network_infrastructure"]["ip_geolocation"] = ip_data
        self.save_artifact("ip_geolocation.json", ip_data)

    def get_ip_geolocation(self, ip):
        """Get IP geolocation information"""
        try:
            # Using ipinfo.io (free tier - 50k requests/month)
            response = requests.get(f"https://ipinfo.io/{ip}/json", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'ip': data.get('ip'),
                    'hostname': data.get('hostname'),
                    'city': data.get('city'),
                    'region': data.get('region'),
                    'country': data.get('country'),
                    'loc': data.get('loc'),  # Latitude, longitude
                    'org': data.get('org'),
                    'postal': data.get('postal'),
                    'timezone': data.get('timezone'),
                    'asn': data.get('org')  # Extract ASN from org field
                }
        except:
            pass
        
        # Fallback: Simple whois lookup
        try:
            obj = ipwhois.IPWhois(ip)
            results = obj.lookup_rdap()
            return {
                'ip': ip,
                'asn': results.get('asn'),
                'asn_description': results.get('asn_description'),
                'network': results.get('network', {}).get('name'), # type: ignore
                'country': results.get('asn_country_code')
            }
        except:
            return None

    def business_intelligence_gathering(self):
        """Gather business intelligence and context"""
        self.print_header("10. BUSINESS INTELLIGENCE & CONTEXT ANALYSIS")
        
        business_data = {
            "company_profile": {},
            "services_identified": [],
            "infrastructure_providers": [],
            "related_entities": []
        }
        
        print(f"{Colors.CYAN}Gathering business intelligence for: {self.domain or self.target}{Colors.END}")
        
        # Analyze domain for business context
        if self.domain:
            # Extract potential company name from domain
            domain_parts = self.domain.split('.')
            if len(domain_parts) >= 2:
                company_candidate = domain_parts[-2].upper()
                business_data["company_profile"]["name_candidate"] = company_candidate
                self.print_debug(f"Company name candidate: {company_candidate}")
            
            # Financial services indicators
            financial_indicators = ['bank', 'credit', 'card', 'pay', 'money', 'finance', 'capital', 'invest']
            if any(indicator in self.domain.lower() for indicator in financial_indicators):
                business_data["services_identified"].append("Financial Services")
                self.print_success("Domain suggests financial services business")
            
            # E-commerce indicators
            ecommerce_indicators = ['shop', 'store', 'market', 'buy', 'cart']
            if any(indicator in self.domain.lower() for indicator in ecommerce_indicators):
                business_data["services_identified"].append("E-commerce")
                self.print_success("Domain suggests e-commerce business")
        
        # Infrastructure provider analysis
        if self.results.get("domain_information", {}).get("whois", {}).get("registrar", {}).get("name"):
            registrar = self.results["domain_information"]["whois"]["registrar"]["name"]
            business_data["infrastructure_providers"].append(f"Registrar: {registrar}")
            self.print_debug(f"Registrar: {registrar}")
        
        # Related entities from email domains
        for email in self.discovered_emails:
            domain = email.split('@')[-1]
            if domain != self.domain:
                business_data["related_entities"].append(domain)
                self.print_debug(f"Related entity domain: {domain}")
        
        self.results["business_intelligence"] = business_data
        self.save_artifact("business_intelligence.json", business_data)
        
        # Display findings
        print(f"{Colors.CYAN}Business Context:{Colors.END}")
        for key, value in business_data.items():
            if value:
                print(f"  {key}: {value}")
        
        if not any(business_data.values()):
            self.print_warning("No business intelligence data gathered")

    # =============================================================================
    # ENHANCED SOCIAL MEDIA & DIGITAL FOOTPRINT
    # =============================================================================

    def social_media_enumeration(self):
        """Enhanced social media presence detection"""
        self.print_header("11. SOCIAL MEDIA & DIGITAL FOOTPRINT ANALYSIS")
        
        if not self.domain:
            self.print_warning("No domain available for social media enumeration")
            return
        
        social_data = {}
        domain_name = self.domain.split(".")[0]
        platforms = {
            'linkedin': f'https://linkedin.com/company/{domain_name}',
            'twitter': f'https://twitter.com/{domain_name}',
            'facebook': f'https://facebook.com/{domain_name}',
            'instagram': f'https://instagram.com/{domain_name}',
            'github': f'https://github.com/{domain_name}',
            'youtube': f'https://youtube.com/@{domain_name}'
        }
        
        print(f"{Colors.CYAN}Checking {len(platforms)} social media platforms...{Colors.END}")
        
        for platform, url in platforms.items():
            try:
                response = requests.get(url, timeout=10, allow_redirects=False)
                if response.status_code in [200, 301, 302]:
                    social_data[platform] = {
                        'url': url,
                        'status': 'FOUND',
                        'status_code': response.status_code
                    }
                    self.print_success(f"{platform.capitalize()}: {url}")
                else:
                    social_data[platform] = {
                        'url': url,
                        'status': 'NOT_FOUND',
                        'status_code': response.status_code
                    }
                    self.print_debug(f"{platform.capitalize()}: Not found (Status: {response.status_code})")
            except Exception as e:
                social_data[platform] = {
                    'url': url,
                    'status': 'ERROR',
                    'error': str(e)
                }
                self.print_error(f"{platform.capitalize()} check failed: {str(e)}")
        
        self.results["social_media"] = social_data
        self.save_artifact("social_media.json", social_data)

    def email_pattern_discovery(self):
        """Discover email patterns and generate potential addresses"""
        self.print_header("12. EMAIL PATTERN DISCOVERY")
        
        email_data = {
            "discovered_patterns": [],
            "generated_emails": [],
            "verification_results": {}
        }
        
        # Common email patterns
        patterns = [
            'first.last@{domain}',
            'firstlast@{domain}',
            'f.last@{domain}',
            'first.l@{domain}',
            'first@{domain}',
            'last@{domain}',
            'initial.last@{domain}'
        ]
        
        # Generate emails based on domain
        domain_name = self.domain.split('.')[0] if self.domain else "company"
        
        # Sample names for pattern testing
        sample_names = ['john', 'jane', 'admin', 'support', 'info', 'sales']
        
        generated_count = 0
        for pattern in patterns:
            for name in sample_names:
                email = pattern.format(domain=self.domain, first=name, last='doe', initial=name[0])
                if email not in email_data["generated_emails"]:
                    email_data["generated_emails"].append(email)
                    generated_count += 1
        
        print(f"{Colors.CYAN}Generated {generated_count} unique email patterns{Colors.END}")
        print(f"{Colors.CYAN}Sample generated email patterns:{Colors.END}")
        for email in email_data["generated_emails"][:10]:
            print(f"  - {email}")
        
        self.results["contact_info"]["email_patterns"] = email_data
        self.save_artifact("email_patterns.json", email_data)

    # =============================================================================
    # ADVANCED TECHNOLOGY STACK DETECTION
    # =============================================================================

    def wappalyzer_integration(self):
        """Wappalyzer-like technology detection"""
        self.print_header("13. ADVANCED TECHNOLOGY STACK ANALYSIS")
        
        tech_data = {
            "categories": {},
            "confidence_scores": {},
            "versions": {}
        }
        
        # Comprehensive technology patterns
        technology_patterns = {
            "CMS": {
                "wordpress": ["wp-content", "wp-includes", "wordpress"],
                "joomla": ["joomla", "Joomla"],
                "drupal": ["drupal", "Drupal"],
                "magento": ["magento", "Mage"],
                "shopify": ["shopify"]
            },
            "Frameworks": {
                "react": ["react", "react-dom"],
                "angular": ["ng-", "angular"],
                "vue": ["vue", "vue.js"],
                "django": ["django", "csrfmiddleware"],
                "laravel": ["laravel", "illuminate"]
            },
            "Web Servers": {
                "apache": ["apache", "Apache"],
                "nginx": ["nginx", "Nginx"],
                "iis": ["microsoft-iis", "IIS"],
                "litespeed": ["litespeed"]
            },
            "Analytics": {
                "google_analytics": ["google-analytics", "ga.js", "gtag"],
                "google_tag_manager": ["googletagmanager", "gtm.js"],
                "hotjar": ["hotjar"],
                "marketo": ["marketo"]
            },
            "CDN": {
                "cloudflare": ["cloudflare", "cf-ray"],
                "akamai": ["akamai"],
                "aws_cloudfront": ["cloudfront"],
                "fastly": ["fastly"]
            }
        }
        
        # Analyze primary domain
        urls_to_check = []
        if self.domain:
            urls_to_check.extend([f"https://{self.domain}", f"http://{self.domain}"])
        else:
            urls_to_check.append(self.target)
        
        print(f"{Colors.CYAN}Analyzing {len(urls_to_check)} URLs for technologies...{Colors.END}")
        
        for url in urls_to_check:
            try:
                self.print_debug(f"Analyzing technologies for: {url}")
                response = requests.get(url, timeout=10, verify=False)
                content = response.text.lower()
                headers = response.headers
                
                detected_tech = []
                
                for category, technologies in technology_patterns.items():
                    for tech, patterns in technologies.items():
                        for pattern in patterns:
                            if pattern.lower() in content or any(pattern.lower() in str(h).lower() for h in headers.values()):
                                detected_tech.append(tech)
                                if category not in tech_data["categories"]:
                                    tech_data["categories"][category] = []
                                if tech not in tech_data["categories"][category]:
                                    tech_data["categories"][category].append(tech)
                                break
                
                # Extract versions
                version_patterns = {
                    "wordpress": r'wordpress.*?(\d+\.\d+\.\d+)',
                    "jquery": r'jquery[.-](\d+\.\d+\.\d+)',
                    "react": r'react[.-](\d+\.\d+\.\d+)'
                }
                
                for tech, pattern in version_patterns.items():
                    match = re.search(pattern, content, re.IGNORECASE)
                    if match:
                        tech_data["versions"][tech] = match.group(1)
                
                if detected_tech:
                    print(f"{Colors.GREEN}Technologies detected on {url}:{Colors.END}")
                    for tech in detected_tech[:10]:
                        print(f"  - {tech}")
                else:
                    self.print_warning(f"No technologies detected on {url}")
                        
            except Exception as e:
                self.print_error(f"Technology detection failed for {url}: {e}")
        
        self.results["web_technologies"]["advanced_detection"] = tech_data
        self.save_artifact("technology_stack.json", tech_data)

    def cloud_infrastructure_detection(self):
        """Detect cloud providers and infrastructure"""
        self.print_header("14. CLOUD INFRASTRUCTURE ANALYSIS")
        
        cloud_data = {
            "providers": {},
            "services": {},
            "regions": {}
        }
        
        # Cloud provider indicators
        cloud_indicators = {
            "aws": [
                "amazonaws.com", "aws.amazon", "s3.amazonaws.com",
                "cloudfront.net", "amazonaws", "ec2", "us-east-1"
            ],
            "azure": [
                "azure.com", "windows.net", "azure.microsoft",
                "blob.core.windows.net", "azurewebsites.net"
            ],
            "google_cloud": [
                "googleapis.com", "googlecloud", "gcp", 
                "appspot.com", "googleusercontent.com"
            ],
            "cloudflare": [
                "cloudflare.com", "cf-", "cloudflare"
            ],
            "digitalocean": [
                "digitalocean.com", "digitaloceanspaces.com"
            ]
        }
        
        print(f"{Colors.CYAN}Checking DNS records for cloud infrastructure...{Colors.END}")
        
        # Check DNS records for cloud indicators
        if self.domain:
            try:
                record_types = ['MX', 'TXT', 'CNAME', 'NS', 'A']
                records_found = 0
                
                for record_type in record_types:
                    try:
                        answers = dns.resolver.resolve(self.domain, record_type)
                        for rdata in answers:
                            record_str = str(rdata).lower()
                            records_found += 1
                            for provider, indicators in cloud_indicators.items():
                                for indicator in indicators:
                                    if indicator.lower() in record_str:
                                        if provider not in cloud_data["providers"]:
                                            cloud_data["providers"][provider] = []
                                        cloud_data["providers"][provider].append({
                                            "record_type": record_type,
                                            "value": str(rdata)
                                        })
                                        self.print_success(f"Cloud indicator found: {provider} in {record_type} record")
                    except Exception as e:
                        self.print_debug(f"No {record_type} records found: {e}")
                
                self.print_debug(f"Checked {records_found} DNS records for cloud indicators")
                
            except Exception as e:
                self.print_error(f"Cloud detection DNS query failed: {e}")
        else:
            self.print_warning("No domain available for cloud infrastructure analysis")
        
        # Display results
        if cloud_data["providers"]:
            print(f"{Colors.GREEN}Cloud infrastructure detected:{Colors.END}")
            for provider, records in cloud_data["providers"].items():
                print(f"  - {provider.upper()} ({len(records)} indicators)")
        else:
            self.print_warning("No clear cloud infrastructure indicators detected")
        
        self.results["cloud_infrastructure"] = cloud_data
        self.save_artifact("cloud_infrastructure.json", cloud_data)

    def javascript_library_scan(self):
        """JS library vulnerability analysis powered by Retire.js.

        Fetches the target's homepage, collects every <script src="..."> URL,
        downloads each external JS file to a temp directory, and runs the
        retire.js CLI (https://github.com/RetireJS/retire.js) with JSON output.
        Findings are printed in a format the frontend parser understands and
        also appended to self.results["vulnerabilities"].
        """
        self.print_header("15. JAVASCRIPT LIBRARY VULNERABILITY ANALYSIS")

        if not self.domain:
            self.print_warning("No domain for JS library scan")
            return

        import shutil
        import tempfile

        # --- Locate retire binary / runner ---
        candidate_paths = [
            os.environ.get("RETIRE_BIN"),
            shutil.which("retire"),
            "/usr/local/bin/retire",
            "/usr/bin/retire",
            "/var/www/anatscrawler/retire.js/node/bin/retire",
            os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "..", "retire.js", "node", "bin", "retire",
            ),
        ]
        retire_cmd = None
        for p in candidate_paths:
            if p and os.path.isfile(p) and os.access(p, os.X_OK):
                retire_cmd = [p]
                break
        if retire_cmd is None:
            npx_path = shutil.which("npx")
            if npx_path:
                retire_cmd = [npx_path, "--yes", "retire"]
            else:
                self.print_warning(
                    "retire.js not found. Install via `npm i -g retire` or build "
                    "the cloned repo. Checked: "
                    + ", ".join(p for p in candidate_paths if p)
                )
                return

        # --- Collect candidate pages to scrape for <script src=...> URLs ---
        pages = []
        for scheme in ("https", "http"):
            pages.append(f"{scheme}://{self.domain}")
        for sub in list(self.discovered_subdomains.keys())[:2]:
            pages.append(f"https://{sub}")

        script_urls = set()
        headers = {"User-Agent": "Mozilla/5.0 (ANATSCRAWLER/OSINT)"}

        for page in pages:
            try:
                self.print_debug(f"Fetching {page} to extract <script> tags")
                resp = requests.get(page, headers=headers, timeout=10, verify=False, allow_redirects=True)
            except Exception as e:
                self.print_debug(f"Unable to fetch {page}: {e}")
                continue
            if not resp.ok or not resp.text:
                continue
            try:
                soup = BeautifulSoup(resp.text, "html.parser")
            except Exception as e:
                self.print_debug(f"HTML parse failed for {page}: {e}")
                continue
            for tag in soup.find_all("script"):
                src = tag.get("src")
                if not src:
                    continue
                abs_url = urljoin(resp.url, src)
                if abs_url.lower().endswith(".js") or ".js?" in abs_url.lower():
                    script_urls.add(abs_url)
                elif "javascript" in (tag.get("type") or "").lower():
                    script_urls.add(abs_url)
                else:
                    # Many CDNs omit .js extension; still include http(s) script srcs
                    if abs_url.startswith(("http://", "https://")):
                        script_urls.add(abs_url)

        if not script_urls:
            self.print_warning("No external JavaScript sources discovered on the target")
            self.results["javascript_libraries"] = {
                "scanned_files": 0,
                "script_urls": [],
                "findings": [],
                "summary": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            }
            self.save_artifact("javascript_libraries.json", self.results["javascript_libraries"])
            return

        script_urls = list(script_urls)[:30]  # Safety cap on number of scripts
        print(f"{Colors.CYAN}Discovered {len(script_urls)} JavaScript source(s){Colors.END}")

        # --- Download scripts to a temp dir ---
        tmpdir = tempfile.mkdtemp(prefix="retirejs_")
        downloaded = {}
        for idx, url in enumerate(script_urls):
            try:
                r = requests.get(url, headers=headers, timeout=10, verify=False, stream=True)
                if not r.ok:
                    self.print_debug(f"Skip {url}: HTTP {r.status_code}")
                    continue
                # Safe filename
                parsed = urlparse(url)
                base = os.path.basename(parsed.path) or f"script_{idx}.js"
                base = re.sub(r"[^A-Za-z0-9._-]", "_", base)
                if not base.lower().endswith(".js"):
                    base += ".js"
                fname = f"{idx:03d}_{base}"
                fpath = os.path.join(tmpdir, fname)
                max_bytes = 3 * 1024 * 1024  # 3 MB per file
                total = 0
                with open(fpath, "wb") as f:
                    for chunk in r.iter_content(64 * 1024):
                        if not chunk:
                            break
                        total += len(chunk)
                        if total > max_bytes:
                            break
                        f.write(chunk)
                downloaded[fpath] = url
            except Exception as e:
                self.print_debug(f"Skip {url}: {e}")
                continue

        if not downloaded:
            self.print_warning("Could not download any JS files for scanning")
            try:
                shutil.rmtree(tmpdir, ignore_errors=True)
            except Exception:
                pass
            return

        print(f"{Colors.CYAN}Downloaded {len(downloaded)} JS file(s); running retire.js...{Colors.END}")

        # --- Run retire.js ---
        out_json = os.path.join(tmpdir, "_retire_output.json")
        cmd = retire_cmd + [
            "--path", tmpdir,
            "--outputformat", "json",
            "--outputpath", out_json,
            "--exitwith", "0",
        ]
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        except subprocess.TimeoutExpired:
            self.print_warning("retire.js timed out after 180s")
            try:
                shutil.rmtree(tmpdir, ignore_errors=True)
            except Exception:
                pass
            return
        except Exception as e:
            self.print_error(f"retire.js execution failed: {e}")
            try:
                shutil.rmtree(tmpdir, ignore_errors=True)
            except Exception:
                pass
            return

        retire_output = {}
        try:
            if os.path.exists(out_json):
                with open(out_json, "r") as f:
                    retire_output = json.load(f)
            elif proc.stdout and proc.stdout.strip().startswith("{"):
                retire_output = json.loads(proc.stdout)
        except Exception as e:
            self.print_debug(f"Failed to parse retire.js JSON: {e}")

        # --- Parse findings ---
        findings = []
        summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        data_items = retire_output.get("data", []) if isinstance(retire_output, dict) else []

        for item in data_items:
            fpath = item.get("file", "")
            url = downloaded.get(fpath, fpath)
            for comp in item.get("results", []):
                component = comp.get("component", "unknown")
                version = comp.get("version", "unknown")
                vulns = comp.get("vulnerabilities", []) or []
                severities = {"critical": 0, "high": 0, "medium": 0, "low": 0}
                vuln_list = []
                for v in vulns:
                    sev = str(v.get("severity", "low")).lower()
                    if sev not in severities:
                        sev = "low"
                    severities[sev] += 1
                    summary[sev] += 1
                    ids = v.get("identifiers", {}) or {}
                    cves = ids.get("CVE") or []
                    if isinstance(cves, str):
                        cves = [cves]
                    vuln_list.append({
                        "severity": sev,
                        "summary": ids.get("summary") or ids.get("githubID") or ids.get("retid") or "Vulnerability",
                        "cves": cves,
                        "github_id": ids.get("githubID"),
                        "cwe": v.get("cwe", []) or [],
                        "info": v.get("info", []) or [],
                        "below": v.get("below"),
                        "at_or_above": v.get("atOrAbove"),
                    })
                findings.append({
                    "component": component,
                    "version": version,
                    "file": fpath,
                    "url": url,
                    "npmname": comp.get("npmname"),
                    "licenses": comp.get("licenses", []) or [],
                    "vulnerabilities": vuln_list,
                    "counts": severities,
                })

        # --- Console output (parsed by the frontend) ---
        if not findings:
            self.print_success("No vulnerable JavaScript libraries detected by retire.js")
        else:
            self.print_critical(
                f"Retire.js flagged {len(findings)} vulnerable library instance(s)"
            )
            for f in findings:
                print()
                print(f"{Colors.CYAN}Component: {f['component']}{Colors.END}")
                print(f"  Version: {f['version']}")
                print(f"  File: {f['url']}")
                counts = f["counts"]
                print(
                    f"  Vulnerabilities: {sum(counts.values())} "
                    f"(critical: {counts['critical']}, high: {counts['high']}, "
                    f"medium: {counts['medium']}, low: {counts['low']})"
                )
                for v in f["vulnerabilities"][:10]:
                    cve_str = ", ".join(v["cves"]) if v["cves"] else (v["github_id"] or "-")
                    info_url = v["info"][0] if v["info"] else ""
                    print(
                        f"  - [{v['severity'].upper()}] {cve_str}: {v['summary']}"
                        + (f" ({info_url})" if info_url else "")
                    )

                # Feed into the main vulnerability list
                for v in f["vulnerabilities"]:
                    severity_map = {
                        "critical": "CRITICAL",
                        "high": "HIGH",
                        "medium": "MEDIUM",
                        "low": "LOW",
                    }
                    self.results["vulnerabilities"].append({
                        "type": "Vulnerable JavaScript Library",
                        "severity": severity_map.get(v["severity"], "LOW"),
                        "description": (
                            f"{f['component']} {f['version']}: {v['summary']}"
                            + (f" (CVE: {', '.join(v['cves'])})" if v["cves"] else "")
                        ),
                        "service": f["url"],
                        "recommendation": (
                            f"Upgrade {f['component']} to a version above {v['below']}"
                            if v["below"] else f"Upgrade {f['component']} to the latest version"
                        ),
                        "source": "retire.js",
                    })

        print()
        total_vulns = sum(summary.values())
        print(f"{Colors.CYAN}Summary:{Colors.END}")
        print(f"  Libraries Scanned: {len(downloaded)}")
        print(f"  Vulnerable Libraries: {len(findings)}")
        print(
            f"  Total Vulnerabilities: {total_vulns} "
            f"(critical: {summary['critical']}, high: {summary['high']}, "
            f"medium: {summary['medium']}, low: {summary['low']})"
        )

        js_result = {
            "scanned_files": len(downloaded),
            "script_urls": list(downloaded.values()),
            "findings": findings,
            "summary": summary,
            "retire_version": retire_output.get("version") if isinstance(retire_output, dict) else None,
        }
        self.results["javascript_libraries"] = js_result
        self.save_artifact("javascript_libraries.json", js_result)

        # Clean up temp download directory
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
        except Exception:
            pass

    def sql_injection_scan(self):
        """SQL injection analysis powered by sqlmap.

        Discovers candidate URLs with query parameters from the target homepage
        and top subdomains, then runs sqlmap (https://github.com/sqlmapproject/sqlmap)
        against each with the safest, batch-mode profile. Findings are printed
        and added to self.results["vulnerabilities"].
        """
        self.print_header("16. SQL INJECTION ANALYSIS (sqlmap)")

        if not self.domain:
            self.print_warning("No domain for SQL injection scan")
            return

        import shutil
        import tempfile

        # --- Locate sqlmap runner ---
        candidate_paths = [
            os.environ.get("SQLMAP_BIN"),
            shutil.which("sqlmap"),
            "/usr/local/bin/sqlmap",
            "/usr/bin/sqlmap",
            "/var/www/anatscrawler/sqlmap/sqlmap.py",
            os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "..", "sqlmap", "sqlmap.py",
            ),
        ]
        sqlmap_cmd = None
        for p in candidate_paths:
            if not p:
                continue
            if not os.path.isfile(p):
                continue
            if p.endswith(".py"):
                py = shutil.which("python3") or shutil.which("python") or "python3"
                sqlmap_cmd = [py, p]
                break
            if os.access(p, os.X_OK):
                sqlmap_cmd = [p]
                break
        if sqlmap_cmd is None:
            self.print_warning(
                "sqlmap not found. Install via `apt install sqlmap` or clone to "
                "/var/www/anatscrawler/sqlmap. Checked: "
                + ", ".join(p for p in candidate_paths if p)
            )
            return

        # --- Discover candidate URLs with query parameters ---
        # Aggression profile (set SQLMAP_PROFILE=aggressive or SQLMAP_PROFILE=deep
        # to unlock higher levels/risks and wider crawling).
        profile = (os.environ.get("SQLMAP_PROFILE") or "standard").lower().strip()
        if profile in ("deep", "aggressive", "max"):
            prof = {
                "level": 5,
                "risk": 3,
                "technique": "BEUSTQ",     # Boolean, Error, Union, Stacked, Time, inline
                "timeout": 30,
                "retries": 2,
                "threads": 5,
                "per_url_timeout": 900,     # 15 min / URL
                "max_urls": 25,
                "per_host_quota": 8,
                "test_forms": True,
            }
        elif profile in ("hard", "thorough"):
            prof = {
                "level": 3,
                "risk": 2,
                "technique": "BEUSTQ",
                "timeout": 20,
                "retries": 1,
                "threads": 4,
                "per_url_timeout": 600,
                "max_urls": 20,
                "per_host_quota": 6,
                "test_forms": True,
            }
        else:  # "standard" (default — still stronger than v1)
            prof = {
                "level": 2,
                "risk": 2,
                "technique": "BEUST",       # skip slow inline Q
                "timeout": 15,
                "retries": 1,
                "threads": 4,
                "per_url_timeout": 360,     # 6 min / URL
                "max_urls": 15,
                "per_host_quota": 5,
                "test_forms": True,
            }

        seed_pages = []
        for scheme in ("https", "http"):
            seed_pages.append(f"{scheme}://{self.domain}")
        # Include more subdomains to broaden attack surface
        for sub in list(self.discovered_subdomains.keys())[:5]:
            seed_pages.append(f"https://{sub}")
            seed_pages.append(f"http://{sub}")

        headers = {"User-Agent": "Mozilla/5.0 (ANATSCRAWLER/OSINT)"}
        candidate_urls = []        # URLs with query strings (GET)
        form_targets = []          # POST forms -> {"url","data"}
        seen_urls = set()
        seen_forms = set()
        host_counts = {}

        def add_url(u: str):
            if not u or u in seen_urls:
                return
            try:
                parsed = urlparse(u)
            except Exception:
                return
            if parsed.scheme not in ("http", "https"):
                return
            host = (parsed.hostname or "").lower()
            if not host:
                return
            domain = self.domain or ""
            if not (host == domain or (domain and host.endswith("." + domain))):
                return
            if not parsed.query:
                return
            if host_counts.get(host, 0) >= prof["per_host_quota"]:
                return
            host_counts[host] = host_counts.get(host, 0) + 1
            seen_urls.add(u)
            candidate_urls.append(u)

        def add_form(action: str, data: str, method: str):
            key = f"{method.upper()}::{action}::{data}"
            if key in seen_forms:
                return
            try:
                parsed = urlparse(action)
            except Exception:
                return
            if parsed.scheme not in ("http", "https"):
                return
            host = (parsed.hostname or "").lower()
            domain = self.domain or ""
            if not (host == domain or (domain and host.endswith("." + domain))):
                return
            seen_forms.add(key)
            form_targets.append({"url": action, "data": data, "method": method.upper()})

        # BFS-style crawl: seed pages + 1-hop link discovery (same origin)
        crawl_queue = list(seed_pages)
        crawled = set()
        crawl_limit = 25  # pages fetched total (protect against runaways)

        while crawl_queue and len(crawled) < crawl_limit:
            page = crawl_queue.pop(0)
            if page in crawled:
                continue
            crawled.add(page)
            try:
                self.print_debug(f"Crawling {page} for SQLi candidates")
                resp = requests.get(page, headers=headers, timeout=10, verify=False, allow_redirects=True)
            except Exception as e:
                self.print_debug(f"Unable to fetch {page}: {e}")
                continue
            if not resp.ok or not resp.text:
                continue

            add_url(resp.url)  # If the landing URL itself is parameterized

            try:
                soup = BeautifulSoup(resp.text, "html.parser")
            except Exception as e:
                self.print_debug(f"HTML parse failed for {page}: {e}")
                continue

            # Links
            for tag in soup.find_all("a", href=True):
                abs_url = urljoin(resp.url, tag["href"])
                add_url(abs_url)
                # Queue same-origin pages for shallow crawl (no query → internal page)
                try:
                    p = urlparse(abs_url)
                    host = (p.hostname or "").lower()
                    if (
                        p.scheme in ("http", "https")
                        and (host == self.domain or host.endswith("." + self.domain))
                        and abs_url not in crawled
                        and len(crawl_queue) < crawl_limit
                    ):
                        crawl_queue.append(abs_url)
                except Exception:
                    pass

            # Forms
            for tag in soup.find_all("form"):
                action = urljoin(resp.url, tag.get("action") or resp.url)
                method = (tag.get("method") or "get").lower()
                inputs = tag.find_all(["input", "select", "textarea"])
                params = []
                for inp in inputs:
                    name = inp.get("name")
                    if not name:
                        continue
                    val = inp.get("value") or "1"
                    params.append(f"{name}={val}")
                if not params:
                    continue
                qs = "&".join(params)
                if method == "post" and prof["test_forms"]:
                    add_form(action, qs, "POST")
                else:
                    sep = "&" if "?" in action else "?"
                    add_url(f"{action}{sep}{qs}")

            if len(candidate_urls) + len(form_targets) >= prof["max_urls"]:
                break

        total_targets = len(candidate_urls) + len(form_targets)
        if not total_targets:
            self.print_warning("No parameterized URLs or forms found to test for SQL injection")
            self.results["sql_injection"] = {
                "tested_urls": [],
                "findings": [],
                "summary": {"injectable": 0, "tested": 0},
                "profile": profile,
            }
            self.save_artifact("sql_injection.json", self.results["sql_injection"])
            return

        candidate_urls = candidate_urls[:prof["max_urls"]]
        form_targets = form_targets[: max(0, prof["max_urls"] - len(candidate_urls))]
        targets = [{"url": u, "data": None, "method": "GET"} for u in candidate_urls] + form_targets
        print(
            f"{Colors.CYAN}sqlmap profile: {profile}  "
            f"level={prof['level']} risk={prof['risk']} technique={prof['technique']} "
            f"threads={prof['threads']} timeout/url={prof['per_url_timeout']}s{Colors.END}"
        )
        print(
            f"{Colors.CYAN}Testing {len(candidate_urls)} GET URL(s) + "
            f"{len(form_targets)} POST form(s) — {total_targets} target(s){Colors.END}"
        )

        # --- Run sqlmap against each target ---
        tmpdir = tempfile.mkdtemp(prefix="sqlmap_")
        findings = []
        tested = []

        # Regex patterns used to parse sqlmap output
        param_re = re.compile(r"Parameter:\s*([^\s(]+)\s*\((GET|POST|COOKIE|HEADER)\)", re.IGNORECASE)
        type_re = re.compile(r"^\s*Type:\s*(.+)$", re.MULTILINE)
        title_re = re.compile(r"^\s*Title:\s*(.+)$", re.MULTILINE)
        payload_re = re.compile(r"^\s*Payload:\s*(.+)$", re.MULTILINE)
        dbms_re = re.compile(r"back-end DBMS:\s*(.+)", re.IGNORECASE)
        not_injectable_re = re.compile(r"all tested parameters do not appear to be injectable", re.IGNORECASE)

        for idx, tgt in enumerate(targets, 1):
            url = tgt["url"]
            method = tgt["method"]
            label = f"{method} {url}" + (f"  data={tgt['data']}" if tgt["data"] else "")
            print(f"{Colors.CYAN}[{idx}/{len(targets)}] sqlmap -> {label}{Colors.END}")
            output_dir = os.path.join(tmpdir, f"scan_{idx}")
            cmd = sqlmap_cmd + [
                "-u", url,
                "--batch",
                "--disable-coloring",
                "--random-agent",
                f"--level={prof['level']}",
                f"--risk={prof['risk']}",
                f"--technique={prof['technique']}",
                f"--timeout={prof['timeout']}",
                f"--retries={prof['retries']}",
                f"--threads={prof['threads']}",
                "--smart",
                "--keep-alive",
                "--flush-session",
                "--fresh-queries",
                "--output-dir", output_dir,
                "-v", "1",
            ]
            if tgt["data"]:
                cmd += ["--data", tgt["data"]]
            # Probe DBMS banner/fingerprint on deeper profiles
            if profile in ("deep", "aggressive", "max", "hard", "thorough"):
                cmd += ["--banner", "--current-user", "--current-db", "--is-dba"]

            try:
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=prof["per_url_timeout"])
            except subprocess.TimeoutExpired:
                self.print_warning(f"sqlmap timed out after {prof['per_url_timeout']}s on {url}")
                tested.append({"url": url, "method": method, "status": "timeout"})
                continue
            except Exception as e:
                self.print_error(f"sqlmap execution failed on {url}: {e}")
                tested.append({"url": url, "method": method, "status": "error", "error": str(e)})
                continue

            out = (proc.stdout or "") + "\n" + (proc.stderr or "")
            if not_injectable_re.search(out):
                print(f"{Colors.GREEN}  No injectable parameters detected{Colors.END}")
                tested.append({"url": url, "method": method, "status": "clean"})
                continue

            # Extract "Parameter: X (METHOD)" blocks
            param_blocks = []
            matches = list(param_re.finditer(out))
            for i, m in enumerate(matches):
                start = m.start()
                end = matches[i + 1].start() if i + 1 < len(matches) else len(out)
                block = out[start:end]
                param_name, pmethod = m.group(1), m.group(2).upper()
                techniques = []
                # Within each parameter block, iterate "Type:" sub-blocks
                type_matches = list(type_re.finditer(block))
                for j, tm in enumerate(type_matches):
                    tstart = tm.start()
                    tend = type_matches[j + 1].start() if j + 1 < len(type_matches) else len(block)
                    sub = block[tstart:tend]
                    title_m = title_re.search(sub)
                    payload_m = payload_re.search(sub)
                    tech = {
                        "type": tm.group(1).strip(),
                        "title": title_m.group(1).strip() if title_m else None,
                        "payload": payload_m.group(1).strip() if payload_m else None,
                    }
                    techniques.append(tech)
                param_blocks.append({
                    "parameter": param_name,
                    "method": pmethod,
                    "techniques": techniques,
                })

            dbms_match = dbms_re.search(out)
            dbms = dbms_match.group(1).strip() if dbms_match else None

            if param_blocks:
                tested.append({"url": url, "method": method, "status": "vulnerable"})
                finding = {
                    "url": url,
                    "method": method,
                    "data": tgt["data"],
                    "dbms": dbms,
                    "parameters": param_blocks,
                }
                findings.append(finding)
                self.print_critical(
                    f"SQL INJECTION on {url}: {len(param_blocks)} parameter(s) injectable"
                    + (f" (DBMS: {dbms})" if dbms else "")
                )
                for pb in param_blocks:
                    techs = ", ".join(t["type"] for t in pb["techniques"]) or "unknown"
                    print(f"  - Parameter: {pb['parameter']} ({pb['method']})  Techniques: {techs}")

                # Feed into main vulnerability list
                self.results["vulnerabilities"].append({
                    "type": "SQL Injection",
                    "severity": "CRITICAL",
                    "description": (
                        f"sqlmap confirmed SQL injection on {url} via "
                        f"{', '.join(pb['parameter'] for pb in param_blocks)}"
                        + (f" (DBMS: {dbms})" if dbms else "")
                    ),
                    "service": url,
                    "recommendation": (
                        "Use parameterized queries / prepared statements, validate and "
                        "encode all user input, apply least-privilege DB accounts, and "
                        "deploy a WAF with SQLi rules."
                    ),
                    "source": "sqlmap",
                })
            else:
                tested.append({"url": url, "method": method, "status": "unknown"})

        # --- Summary ---
        summary = {
            "tested": len(tested),
            "injectable": len(findings),
            "clean": len([t for t in tested if t.get("status") == "clean"]),
            "timeout": len([t for t in tested if t.get("status") == "timeout"]),
            "error": len([t for t in tested if t.get("status") == "error"]),
        }
        print()
        print(f"{Colors.CYAN}Summary:{Colors.END}")
        print(f"  URLs Tested: {summary['tested']}")
        print(f"  Injectable: {summary['injectable']}")
        print(f"  Clean: {summary['clean']}")
        if summary["timeout"]:
            print(f"  Timed out: {summary['timeout']}")
        if summary["error"]:
            print(f"  Errors: {summary['error']}")

        if not findings:
            self.print_success("No SQL injection vulnerabilities detected by sqlmap")

        sql_result = {
            "tested_urls": tested,
            "findings": findings,
            "summary": summary,
            "profile": profile,
        }
        self.results["sql_injection"] = sql_result
        self.save_artifact("sql_injection.json", sql_result)

        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
        except Exception:
            pass

    # =============================================================================
    # OWASP AMASS — ATTACK-SURFACE / SUBDOMAIN ENUMERATION
    # =============================================================================

    def _team_cymru_asn_lookup(self, ips):
        """Bulk-lookup ASN/prefix/AS-name for a list of IPs via Team Cymru whois.

        Uses the netcat-style interface on whois.cymru.com:43. One TCP
        connection, one request batch, typically < 2 seconds for < 500 IPs.
        Returns: {ip: {"asn": str, "prefix": str, "as_name": str}}.
        """
        import socket as _socket
        result = {}
        if not ips:
            return result
        try:
            payload_lines = ["begin", "verbose"] + list(ips) + ["end", ""]
            payload = ("\n".join(payload_lines)).encode("utf-8")
            with _socket.create_connection(("whois.cymru.com", 43), timeout=8) as s:
                s.sendall(payload)
                chunks = []
                s.settimeout(8)
                while True:
                    try:
                        buf = s.recv(8192)
                    except _socket.timeout:
                        break
                    if not buf:
                        break
                    chunks.append(buf)
            raw = b"".join(chunks).decode("utf-8", errors="ignore")
            for line in raw.splitlines():
                line = line.strip()
                if not line or line.lower().startswith("bulk mode") or line.startswith("AS "):
                    continue
                parts = [p.strip() for p in line.split("|")]
                # verbose format: AS | IP | BGP Prefix | CC | Registry | Allocated | AS Name
                if len(parts) < 7:
                    continue
                asn, ip, prefix, _cc, _reg, _alloc, as_name = parts[:7]
                if not ip or asn.upper() == "NA":
                    continue
                result[ip] = {
                    "asn": asn if asn and asn.upper() != "NA" else None,
                    "prefix": prefix if prefix and prefix.upper() != "NA" else None,
                    "as_name": as_name or None,
                }
        except Exception as e:
            self.print_debug(f"Team Cymru ASN lookup failed: {e}")
        return result

    def amass_enumeration(self):
        """Run OWASP Amass to expand the attack surface (subdomains, IPs, ASNs)."""
        import shutil, tempfile, json, re, subprocess, os
        self.print_header("OWASP AMASS ATTACK SURFACE MAPPING")

        if not self.domain:
            self.print_warning("No domain to enumerate with Amass")
            self.results["amass"] = {
                "enabled": False,
                "reason": "no-domain",
                "hosts": [],
                "summary": {"hosts": 0, "new_subdomains": 0, "ips": 0, "asns": 0},
            }
            return

        # Locate amass binary
        candidate_paths = [
            os.environ.get("AMASS_BIN"),
            shutil.which("amass"),
            "/snap/bin/amass",
            "/usr/local/bin/amass",
            "/usr/bin/amass",
            "/var/www/anatscrawler/amass/amass",
        ]
        amass_bin = next((p for p in candidate_paths if p and os.path.exists(p)), None)
        if not amass_bin and candidate_paths[1]:  # shutil.which returned something but path check failed
            amass_bin = candidate_paths[1]
        if not amass_bin:
            self.print_warning("Amass binary not found (install: snap install amass)")
            self.results["amass"] = {
                "enabled": False,
                "reason": "not-installed",
                "hosts": [],
                "summary": {"hosts": 0, "new_subdomains": 0, "ips": 0, "asns": 0},
            }
            return

        # Mode / profile
        mode = (os.environ.get("AMASS_MODE") or "passive").lower().strip()
        amass_timeout = int(os.environ.get("AMASS_TIMEOUT") or ("2" if mode == "passive" else "5"))  # minutes
        proc_timeout = amass_timeout * 60 + 60  # subprocess timeout = amass-budget + 60s grace

        # Snap-confined amass (/snap/bin/amass) cannot read/write the host's real
        # /tmp (it gets a private /tmp/snap-private-tmp/...). Place the work dir
        # under $HOME so the snap "home" interface allows R/W access.
        is_snap_amass = "/snap/" in amass_bin
        tmp_parent = None
        if is_snap_amass:
            home_dir = os.path.expanduser("~")
            if home_dir and os.path.isdir(home_dir):
                tmp_parent = os.path.join(home_dir, ".cache", "anatscrawler", "amass")
                try:
                    os.makedirs(tmp_parent, exist_ok=True)
                except Exception:
                    tmp_parent = None
        tmpdir = tempfile.mkdtemp(prefix="amass_", dir=tmp_parent)
        json_file = os.path.join(tmpdir, "amass.json")
        text_file = os.path.join(tmpdir, "amass.txt")

        cmd = [
            amass_bin, "enum",
            "-d", self.domain,
            "-timeout", str(amass_timeout),
            "-json", json_file,
            "-o", text_file,
            "-nocolor",
            "-silent",
        ]
        if mode == "passive":
            cmd.append("-passive")

        print(f"{Colors.CYAN}Amass mode: {mode}  timeout: {amass_timeout}m  target: {self.domain}{Colors.END}")
        print(f"{Colors.CYAN}Running: {' '.join(cmd)}{Colors.END}")

        proc_stdout = ""
        proc_stderr = ""
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=proc_timeout)
            proc_stdout = proc.stdout or ""
            proc_stderr = proc.stderr or ""
        except subprocess.TimeoutExpired:
            self.print_warning(f"Amass exceeded subprocess timeout of {proc_timeout}s; using partial output")
        except Exception as e:
            self.print_error(f"Amass execution failed: {e}")
            self.results["amass"] = {
                "enabled": True,
                "mode": mode,
                "reason": f"error:{e}",
                "hosts": [],
                "summary": {"hosts": 0, "new_subdomains": 0, "ips": 0, "asns": 0},
            }
            shutil.rmtree(tmpdir, ignore_errors=True)
            return

        # --- Parse JSON output (one object per line) ---
        hosts = {}        # name -> {addresses, sources, tags}
        all_ips = set()
        all_asns = set()
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            rec = json.loads(line)
                        except Exception:
                            continue
                        name = (rec.get("name") or "").lower().strip().rstrip(".")
                        if not name:
                            continue
                        entry = hosts.setdefault(name, {
                            "name": name,
                            "addresses": [],
                            "sources": set(),
                            "tag": rec.get("tag"),
                        })
                        for addr in rec.get("addresses") or []:
                            ip = addr.get("ip")
                            if ip:
                                all_ips.add(ip)
                                asn = addr.get("asn")
                                if asn:
                                    all_asns.add(str(asn))
                                entry["addresses"].append({
                                    "ip": ip,
                                    "cidr": addr.get("cidr"),
                                    "asn": asn,
                                    "desc": addr.get("desc"),
                                })
                        src = rec.get("source") or rec.get("sources")
                        if isinstance(src, str):
                            entry["sources"].add(src)
                        elif isinstance(src, list):
                            entry["sources"].update(str(s) for s in src)
            except Exception as e:
                self.print_warning(f"Failed to parse Amass JSON: {e}")

        # --- Fallback: plain-text file or stdout if JSON empty ---
        if not hosts:
            text_blob = ""
            if os.path.exists(text_file):
                try:
                    with open(text_file, "r", encoding="utf-8", errors="ignore") as f:
                        text_blob = f.read()
                except Exception:
                    pass
            text_blob = text_blob or proc_stdout
            for raw in text_blob.splitlines():
                line = raw.strip()
                if not line:
                    continue
                # Amass may print lines like "www.example.com" or
                # "www.example.com (FQDN) --> a_record --> 1.2.3.4 (IPAddress)"
                name_match = re.match(r"([A-Za-z0-9_.-]+\.[A-Za-z]{2,})", line)
                if not name_match:
                    continue
                name = name_match.group(1).lower().rstrip(".")
                if not (name == self.domain or name.endswith("." + self.domain)):
                    continue
                entry = hosts.setdefault(name, {
                    "name": name, "addresses": [], "sources": set(), "tag": None,
                })
                for ip in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", line):
                    all_ips.add(ip)
                    entry["addresses"].append({"ip": ip, "cidr": None, "asn": None, "desc": None})

        # Promote discovered hosts / IPs into global state
        new_subs = 0
        for name in hosts.keys():
            if name == self.domain:
                continue
            if name.endswith("." + self.domain) and name not in self.discovered_subdomains:
                self.discovered_subdomains[name] = "amass"
                new_subs += 1

        # --- Post-enumeration DNS resolution (passive mode leaves addresses empty) ---
        hosts_needing_resolve = [n for n, d in hosts.items() if not d["addresses"]]
        if hosts_needing_resolve:
            print(f"{Colors.CYAN}Resolving {len(hosts_needing_resolve)} host(s) to IPs...{Colors.END}")

            def _resolve_host(hname):
                ips = set()
                for rtype in ("A", "AAAA"):
                    try:
                        answers = dns.resolver.resolve(hname, rtype, lifetime=4)
                        for rr in answers:
                            ips.add(str(rr).strip())
                    except Exception:
                        pass
                return hname, ips

            with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
                for hname, ips in ex.map(_resolve_host, hosts_needing_resolve):
                    entry = hosts[hname]
                    for ip in ips:
                        all_ips.add(ip)
                        entry["addresses"].append({
                            "ip": ip, "cidr": None, "asn": None, "desc": None,
                        })

        # --- ASN / CIDR enrichment via Team Cymru whois (bulk) ---
        if all_ips:
            cymru_map = self._team_cymru_asn_lookup(sorted(all_ips))
            if cymru_map:
                for hdata in hosts.values():
                    for addr in hdata["addresses"]:
                        ip = addr.get("ip")
                        info = cymru_map.get(ip)
                        if info:
                            addr["asn"] = info.get("asn")
                            addr["cidr"] = info.get("prefix")
                            addr["desc"] = info.get("as_name")
                            if info.get("asn"):
                                all_asns.add(str(info["asn"]))

        for ip in all_ips:
            self.discovered_ips.add(ip)

        # Serialize sources set -> sorted list
        host_list = []
        for name, data in sorted(hosts.items()):
            host_list.append({
                "name": name,
                "addresses": data["addresses"],
                "sources": sorted(list(data["sources"])),
                "tag": data["tag"],
            })

        summary = {
            "hosts": len(host_list),
            "new_subdomains": new_subs,
            "ips": len(all_ips),
            "asns": len(all_asns),
        }

        print()
        print(f"{Colors.CYAN}Summary:{Colors.END}")
        print(f"  Hosts discovered: {summary['hosts']}")
        print(f"  New subdomains added: {summary['new_subdomains']}")
        print(f"  Unique IPs: {summary['ips']}")
        print(f"  Unique ASNs: {summary['asns']}")
        if host_list:
            self.print_success(f"Amass enumerated {summary['hosts']} host(s) ({summary['new_subdomains']} new)")
            for h in host_list[:15]:
                ips = ", ".join(a["ip"] for a in h["addresses"] if a.get("ip")) or "no-ip"
                srcs = ", ".join(h["sources"]) if h["sources"] else "—"
                print(f"  - {h['name']}  [{ips}]  sources: {srcs}")
            if len(host_list) > 15:
                print(f"  ... and {len(host_list) - 15} more")
        else:
            if proc_stderr.strip():
                self.print_debug(f"Amass stderr: {proc_stderr.strip()[:400]}")
            if proc_stdout.strip():
                self.print_debug(f"Amass stdout: {proc_stdout.strip()[:400]}")
            self.print_warning("Amass returned no hosts")
            if is_snap_amass:
                self.print_warning(
                    "Snap amass is sandboxed; if results stay empty, install the native binary "
                    "(e.g. /usr/local/bin/amass) and set AMASS_BIN to its path."
                )

        amass_result = {
            "enabled": True,
            "mode": mode,
            "timeout_minutes": amass_timeout,
            "hosts": host_list,
            "asns": sorted(list(all_asns)),
            "summary": summary,
        }
        self.results["amass"] = amass_result
        self.save_artifact("amass.json", amass_result)

        shutil.rmtree(tmpdir, ignore_errors=True)

    # =============================================================================
    # COMPREHENSIVE REPORT GENERATION
    # =============================================================================

    def generate_professional_report(self):
        """Generate professional markdown report"""
        self.print_header("GENERATING COMPREHENSIVE OSINT REPORT")
        
        report_file = Path(self.output_dir) / f"OSINT_REPORT_{self.domain or self.target.replace('.', '_').upper()}.md"
        
        # Build executive summary
        critical_vulns = [v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"]
        high_vulns = [v for v in self.results["vulnerabilities"] if v["severity"] == "HIGH"]
        
        if critical_vulns:
            self.results["executive_summary"]["risk_level"] = "HIGH"
        elif high_vulns:
            self.results["executive_summary"]["risk_level"] = "MEDIUM-HIGH"
        
        self.results["executive_summary"]["critical_vulnerabilities"] = len(critical_vulns)
        self.results["executive_summary"]["total_vulnerabilities"] = len(self.results["vulnerabilities"])
        
        report = self._build_markdown_report()
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report)
            self.print_success(f"Professional report generated: {report_file}")
        except Exception as e:
            self.print_error(f"Failed to generate report: {e}")
        
        return report_file

    def _build_markdown_report(self):
        """Build comprehensive markdown report with all enhanced data"""
        critical_vulns = [v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"]
        all_ips = list(self.discovered_ips)
        
        report = f"""# COMPREHENSIVE OSINT INVESTIGATION REPORT

## Executive Summary
**Target:** {self.domain or self.target}
**Risk Level:** {self.results["executive_summary"]["risk_level"]}
**Critical Vulnerabilities:** {len(critical_vulns)}
**Live Database Checks:** {self.results["live_vulnerability_checks"]["nvd_checked"]}

## Scan Summary
- **IPs Discovered:** {len(all_ips)}
- **Subdomains Found:** {len(self.discovered_subdomains)}
- **Open Ports:** {len(self.results['port_scanning'].get('open_ports', []))}
- **Technologies Detected:** {len(self.results.get('web_technologies', {}).get('analyzed_urls', []))}
- **Security Issues:** {len(self.results.get('vulnerabilities', []))}
- **Breached Accounts:** {len(self.breached_accounts)}
- **Live NVD Checks:** {self.results["live_vulnerability_checks"]["vulnerabilities_found"]} vulnerabilities found

## Vulnerability Summary
"""
        
        # Add vulnerability breakdown
        severity_count = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        for vuln in self.results["vulnerabilities"]:
            severity = vuln.get("severity", "MEDIUM")
            if severity in severity_count:
                severity_count[severity] += 1
        
        for severity, count in severity_count.items():
            if count > 0:
                report += f"- **{severity}:** {count}\n"
        
        # Add critical findings
        if critical_vulns:
            report += "\n## Critical Vulnerabilities Requiring Immediate Attention\n"
            for vuln in critical_vulns[:5]:
                report += f"### {vuln['type']}\n"
                report += f"- **Description:** {vuln['description']}\n"
                report += f"- **Location:** {vuln.get('service', 'N/A')}\n"
                report += f"- **CVEs:** {', '.join(vuln.get('cves', [])) if vuln.get('cves') else 'N/A'}\n"
                report += f"- **Recommendation:** {vuln['recommendation']}\n\n"
        
        report += """
## Complete Assessment
All investigation modules completed with detailed output and live vulnerability database integration.

## Live Database Integration
- **National Vulnerability Database (NVD):** US Government official database
- **CVE Database:** MITRE Corporation vulnerability tracking
- **Real-time Checks:** Live vulnerability scanning against latest threats

## Investigation Details
Full technical details available in the JSON output files in the investigation directory.
"""
        # -----------------------------------------------------------------
        # Include enhanced sections (Business Intelligence, Social Media)
        # -----------------------------------------------------------------
        # 10. Business Intelligence & Context Analysis
        biz = self.results.get("business_intelligence", {})
        report += "\n## 10. BUSINESS INTELLIGENCE & CONTEXT ANALYSIS\n"
        if biz and any(v for v in biz.values() if v):
            company = biz.get("company_profile", {})
            if company:
                name = company.get("name_candidate") or company.get("name")
                report += f"- **Company Candidate:** {name}\n" if name else ""
            services = biz.get("services_identified", [])
            if services:
                report += "- **Identified Services:**\n"
                for s in services:
                    report += f"  - {s}\n"
            infra = biz.get("infrastructure_providers", [])
            if infra:
                report += "- **Infrastructure Providers / Registrars:**\n"
                for r in infra:
                    report += f"  - {r}\n"
            related = biz.get("related_entities", [])
            if related:
                report += "- **Related Entities / Domains:**\n"
                for d in related:
                    report += f"  - {d}\n"
        else:
            report += "- No business intelligence extracted.\n"

        # 11. Social Media & Digital Footprint Analysis
        social = self.results.get("social_media", {})
        report += "\n## 11. SOCIAL MEDIA & DIGITAL FOOTPRINT ANALYSIS\n"
        if social:
            for platform, info in social.items():
                status = info.get("status", "UNKNOWN")
                url = info.get("url", "N/A")
                if status == 'FOUND':
                    report += f"- **{platform.capitalize()}:** {url} (FOUND, HTTP {info.get('status_code', 'N/A')})\n"
                elif status == 'NOT_FOUND':
                    report += f"- **{platform.capitalize()}:** Not found (HTTP {info.get('status_code', 'N/A')})\n"
                else:
                    err = info.get('error')
                    report += f"- **{platform.capitalize()}:** Error ({err}) - attempted URL: {url}\n"
        else:
            report += "- No social media accounts discovered or enumeration not performed.\n"
        # 12. Email Pattern Discovery
        report += "\n## 12. EMAIL PATTERN DISCOVERY\n"
        email_patterns = self.results.get("contact_info", {}).get("email_patterns", {})
        if email_patterns:
            generated = email_patterns.get("generated_emails", [])
            report += f"- **Generated Patterns:** {len(generated)} examples\n"
            for e in generated[:10]:
                report += f"  - {e}\n"
        else:
            report += "- No email patterns generated.\n"

        # 13. Advanced Technology Stack Analysis
        report += "\n## 13. ADVANCED TECHNOLOGY STACK ANALYSIS\n"
        tech = self.results.get('web_technologies', {}).get('advanced_detection') or self.results.get('web_technologies', {})
        if tech:
            categories = tech.get('categories', {}) if isinstance(tech, dict) else {}
            if categories:
                for cat, items in categories.items():
                    report += f"- **{cat}:** {', '.join(items)}\n"
            versions = tech.get('versions', {}) if isinstance(tech, dict) else {}
            if versions:
                report += "- **Detected Versions:**\n"
                for k, v in versions.items():
                    report += f"  - {k}: {v}\n"
        else:
            report += "- No technologies detected.\n"

        # 14. Cloud Infrastructure Analysis
        report += "\n## 14. CLOUD INFRASTRUCTURE ANALYSIS\n"
        cloud = self.results.get('cloud_infrastructure', {})
        if cloud and cloud.get('providers'):
            for provider, records in cloud.get('providers', {}).items():
                report += f"- **{provider.upper()}:** {len(records)} indicators\n"
                for r in records[:5]:
                    report += f"  - {r.get('record_type')}: {r.get('value')}\n"
        else:
            report += "- No clear cloud infrastructure indicators detected.\n"

        # LIVE VULNERABILITY SCANNING - NVD & CVE DATABASES
        report += "\n## LIVE VULNERABILITY SCANNING - NVD & CVE DATABASES\n"
        live = self.results.get('live_vulnerability_checks', {})
        if live:
            nvd_checked = live.get('nvd_checked', False)
            vulns_found = live.get('vulnerabilities_found', 0)
            report += f"- **NVD Checked:** {nvd_checked}\n"
            report += f"- **Vulnerabilities Found (live checks):** {vulns_found}\n"
        else:
            report += "- Live vulnerability scanning was not performed.\n"

        # VULNERABILITY DETAILS - COMPREHENSIVE LIST
        report += "\n## VULNERABILITY DETAILS - COMPREHENSIVE LIST\n"
        vulns = self.results.get('vulnerabilities', [])
        if vulns:
            for v in vulns:
                report += f"- **{v.get('severity','UNKNOWN')}:** {v.get('type','Vulnerability')}\n"
                if v.get('description'):
                    report += f"  - Description: {v.get('description')}\n"
                if v.get('service'):
                    report += f"  - Location: {v.get('service')}\n"
                if v.get('ip'):
                    report += f"  - IP: {v.get('ip')}\n"
                if v.get('software'):
                    report += f"  - Software: {v.get('software')}\n"
                if v.get('cves'):
                    report += f"  - CVEs: {', '.join(v.get('cves'))}\n"
                if v.get('recommendation'):
                    report += f"  - Recommendation: {v.get('recommendation')}\n"
                report += "\n"
        else:
            report += "- No vulnerabilities recorded in the results.\n"

        # ENHANCED SCAN COMPLETE! summary
        report += "\n## ENHANCED SCAN COMPLETE!\n"
        report += f"- Modules completed: {len([m for m in self.results.get('modules_completed', [])]) if self.results.get('modules_completed') else 'N/A'}\n"
        report += f"- IPs Discovered: {len(self.discovered_ips)}\n"
        report += f"- Subdomains Found: {len(self.discovered_subdomains)}\n"
        report += f"- Open Ports: {len(self.results.get('port_scanning', {}).get('open_ports', []))}\n"
        report += f"- Critical Vulnerabilities: {len([v for v in vulns if v.get('severity')=='CRITICAL'])}\n"
        report += f"- Total Vulnerabilities: {len(vulns)}\n"
        report += f"- Breached Accounts: {len(self.breached_accounts)}\n"
        report += f"- Live NVD Checks: {live.get('vulnerabilities_found', 0) if isinstance(live, dict) else 0}\n"
        report += f"- Risk Level: {self.results.get('executive_summary', {}).get('risk_level', 'N/A')}\n"

        return report

    def run_comprehensive_assessment(self):
        """Run complete enhanced OSINT assessment"""
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}ENHANCED OSINT RECONNAISSANCE PLATFORM{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}WITH LIVE VULNERABILITY DATABASE INTEGRATION{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}\n")
        
        print(f"{Colors.CYAN}Target: {self.target}{Colors.END}")
        print(f"{Colors.CYAN}Type: {self.target_type.upper()}{Colors.END}")
        print(f"{Colors.CYAN}Output Directory: {self.output_dir}{Colors.END}")
        print(f"{Colors.CYAN}Deep Scan: {self.deep_scan}{Colors.END}")
        print(f"{Colors.CYAN}Breach Check: {self.check_breaches}{Colors.END}")
        print(f"{Colors.CYAN}Live Vulnerability Checks: ENABLED{Colors.END}\n")
        
        # Run all assessment modules (original + enhanced)
        modules = [
            # Original modules
            self.comprehensive_whois_lookup,
            self.enhanced_dns_enumeration,
            self.comprehensive_subdomain_enumeration,
            self.amass_enumeration,
            self.advanced_port_scanning,
            self.ssl_certificate_analysis,
            self.comprehensive_web_analysis,
            self.waf_detection,
            self.ip_geolocation_analysis,
            self.business_intelligence_gathering,
            
            # Enhanced modules
            self.social_media_enumeration,
            self.email_pattern_discovery,
            self.wappalyzer_integration,
            self.cloud_infrastructure_detection,
            self.javascript_library_scan,
            self.sql_injection_scan,
        ]
        
        # HIBP breach check removed — the REAL DATA BREACH ANALYSIS section is
        # now powered by the Dark Web / Domain Monitoring index on the client.
        # (Intentionally not scheduling self.breach_data_check.)

        # Add live vulnerability scanning
        modules.append(self.live_vulnerability_scan)
        
        total_modules = len(modules)
        completed_modules = 0
        
        print(f"{Colors.CYAN}Executing {total_modules} investigation modules...{Colors.END}\n")
        
        for i, module in enumerate(modules, 1):
            module_name = module.__name__.replace('_', ' ').title()
            print(f"{Colors.BLUE}[{i}/{total_modules}] {module_name}{Colors.END}")
            
            try:
                module()
                completed_modules += 1
                time.sleep(1)  # Brief pause between modules
            except Exception as e:
                self.print_error(f"Module {module_name} failed: {str(e)}")
                continue
        
        # Display vulnerability details
        self.display_vulnerability_details()
        
        # Generate final report (markdown)
        report_file = self.generate_professional_report()
        
        # Save complete results
        self.save_artifact("complete_results.json", self.results)

        # Generate professional PDF report (reads every artifact above)
        pdf_file = None
        try:
            import subprocess, sys as _sys
            pdf_script = Path(__file__).resolve().parent / "generate_osint_pdf_report.py"
            if pdf_script.exists():
                cp = subprocess.run(
                    [_sys.executable, str(pdf_script), str(self.output_dir)],
                    capture_output=True, text=True, timeout=180,
                )
                if cp.returncode == 0 and cp.stdout.strip():
                    pdf_file = cp.stdout.strip().splitlines()[-1]
                    self.print_success(f"PDF report generated: {pdf_file}")
                else:
                    self.print_warning(
                        f"PDF generation failed (rc={cp.returncode}): "
                        f"{(cp.stderr or cp.stdout).strip()[:300]}"
                    )
        except Exception as e:
            self.print_warning(f"PDF generation error: {e}")
        
        # Enhanced summary
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}ENHANCED SCAN COMPLETE!{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}\n")
        
        critical_count = len([v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"])
        
        print(f"{Colors.CYAN}Enhanced Scan Summary:{Colors.END}")
        print(f"  Modules completed: {completed_modules}/{total_modules}")
        print(f"  IPs Discovered: {len(self.discovered_ips)}")
        print(f"  Subdomains Found: {len(self.discovered_subdomains)}")
        print(f"  Open Ports: {len(self.results['port_scanning'].get('open_ports', []))}")
        print(f"  Critical Vulnerabilities: {critical_count}")
        print(f"  Total Vulnerabilities: {len(self.results['vulnerabilities'])}")
        print(f"  Breached Accounts: {len(self.breached_accounts)}")
        print(f"  Live NVD Checks: {self.results['live_vulnerability_checks']['vulnerabilities_found']} vulnerabilities found")
        print(f"  Risk Level: {self.results['executive_summary']['risk_level']}")
        print(f"\n{Colors.CYAN}Report Location: {pdf_file or report_file}{Colors.END}\n")
        
        if critical_count > 0:
            print(f"{Colors.RED}{Colors.BOLD}🚨 {critical_count} CRITICAL vulnerabilities require immediate attention!{Colors.END}")
        
        if self.breached_accounts:
            print(f"{Colors.RED}{Colors.BOLD}BREACH: {len(self.breached_accounts)} accounts found in data breaches!{Colors.END}")

# =============================================================================
# COMMAND-LINE INTERFACE & EXECUTION
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Enhanced Professional OSINT Reconnaissance Platform with Live Vulnerability Databases",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python osint_pro_enhanced.py example.com                    # Full comprehensive scan
  python osint_pro_enhanced.py example.com --quick            # Fast scan 
  python osint_pro_enhanced.py example.com --no-deep-scan     # Skip deep DNS brute-force
  python osint_pro_enhanced.py example.com --no-breaches      # Skip breach checking
  python osint_pro_enhanced.py example.com -o /path/to/output # Custom output directory
        """
    )
    
    # Target is required
    parser.add_argument('target',
                        help='Target domain, IP, or URL to scan (REQUIRED)')
    
    # Quick mode - disable expensive operations
    parser.add_argument('--quick', action='store_true', default=False,
                        help='Quick scan mode (skips deep DNS brute-force and breach checks)')
    
    # Individual toggles to disable specific features (default is ON)
    parser.add_argument('--no-deep-scan', action='store_true', default=False,
                        help='Disable deep DNS brute-force scanning')
    parser.add_argument('--no-breaches', action='store_true', default=False,
                        help='Disable data breach checking via HIBP API')
    
    # Output directory
    parser.add_argument('-o', '--output', dest='output_dir', default=None,
                        help='Custom output directory for results')
    
    args = parser.parse_args()
    
    # Quick mode overrides - disable expensive operations
    if args.quick:
        args.no_deep_scan = True
        args.no_breaches = True
    
    # Determine actual flags (default is ON, unless --no-flag is used)
    deep_scan = not args.no_deep_scan
    # HIBP breach checking has been removed — always disabled.
    check_breaches = False
    
    # Prepare output directory
    output_dir = args.output_dir or f"osint_{args.target.replace('://', '_').replace('/', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print(f"{Colors.BOLD}{Colors.CYAN}Starting Enhanced OSINT Scan with Live Vulnerability Databases...{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Target: {args.target}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Configuration: Deep Scan={deep_scan}, Breach Check={check_breaches}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Live Vulnerability Checks: ENABLED{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Output: {output_dir}{Colors.END}\n")
    
    # Initialize and run the enhanced scan
    osint = ProfessionalOSINT(
        target=args.target,
        output_dir=output_dir,
        deep_scan=deep_scan,
        check_breaches=check_breaches
    )
    
    # Run the comprehensive enhanced assessment
    osint.run_comprehensive_assessment()
    
    print(f"\n{Colors.BOLD}{Colors.GREEN}Enhanced scan completed successfully!{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}Check the '{output_dir}' directory for complete results.{Colors.END}")