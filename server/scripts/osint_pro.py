#!/usr/bin/env python3
"""
Professional OSINT Reconnaissance Script - AUTOMATED VERSION
Hardcoded configuration for immediate execution
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
import shutil
import xml.etree.ElementTree as ET
from datetime import datetime
from urllib.parse import urlparse
from pathlib import Path

# Auto-install required packages
REQUIRED_PACKAGES = {
    'requests': 'requests',
    'dns.resolver': 'dnspython', 
    'whois': 'python-whois',
    'bs4': 'beautifulsoup4',
    'urllib3': 'urllib3',
    'ipwhois': 'ipwhois',
    'cryptography': 'cryptography',
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
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# =============================================================================
# DEFAULT CONFIGURATION
# =============================================================================

# API Keys (already configured)
HIBP_API_KEY = "00000000000000000000000000000000"
SHODAN_API_KEY = "J45krb71x4qrP0X71SB5W7t81XjA17Wx"

# Scan configuration defaults - RUN EVERYTHING by default
DEFAULT_DEEP_SCAN = True
DEFAULT_CHECK_BREACHES = True

# =============================================================================
# MAIN SCRIPT - NO NEED TO MODIFY BELOW THIS LINE
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

class ProfessionalOSINT:
    def __init__(self, target, output_dir=None, deep_scan=False, check_breaches=False):
        self.target = target
        self.deep_scan = deep_scan
        self.check_breaches = check_breaches
        self.hibp_api_key = HIBP_API_KEY
        self.shodan_key = SHODAN_API_KEY
        self.output_dir = output_dir or f"osint_{target.replace('://', '_').replace('/', '_')}"
        Path(self.output_dir).mkdir(exist_ok=True)
        
        # Comprehensive results structure
        self.results = {
            "metadata": {
                "target": target,
                "scan_time": datetime.now().isoformat(),
                "investigation_date": datetime.now().strftime("%B %d, %Y"),
                "report_classification": "Client Investigation",
                "revision": "1.0"
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
            "business_intelligence": {}
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

    def comprehensive_whois_lookup(self):
        """Enhanced WHOIS lookup with detailed parsing"""
        self.print_header("1. COMPREHENSIVE WHOIS REGISTRATION DETAILS")
        
        query_target = self.domain if self.domain else self.target
        
        try:
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
                        self.analyze_spf_record(spf_records[0])
                    
            except Exception:
                pass
        
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
                "description": "DNSSEC not implemented",
                "recommendation": "Enable DNSSEC with registrar"
            })

        self.results["domain_information"]["dns"] = dns_data
        self.save_artifact("dns_analysis.json", dns_data)

    def analyze_spf_record(self, spf_record):
        """Analyze SPF record for security implications"""
        print(f"\n{Colors.BLUE}SPF Record Analysis:{Colors.END}")
        print(f"  Record: {spf_record}")
        
        # Check for common issues
        if '+all' in spf_record:
            self.print_critical("SPF record uses +all (INSECURE - allows any server to send mail)")
        elif '~all' in spf_record:
            self.print_warning("SPF record uses ~all (SoftFail - suspicious emails not rejected)")
        elif '-all' in spf_record:
            self.print_success("SPF record uses -all (Strict - unauthorized emails rejected)")
        
        # Extract IP ranges
        ip4_matches = re.findall(r'ip4:([0-9./]+)', spf_record)
        if ip4_matches:
            print(f"  Authorized IPv4 ranges: {', '.join(ip4_matches)}")
            self.discovered_ips.update(ip4_matches)

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
        for subdomain in sorted(list(all_subdomains))[:15]:
            print(f"  - {subdomain}")
        
        if len(all_subdomains) > 15:
            print(f"  ... and {len(all_subdomains) - 15} more")
        
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
        print(f"Testing {len(subdomains)} common subdomains...")
        
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
        
        return found

    def certificate_transparency_lookup(self):
        """Check Certificate Transparency logs"""
        found = []
        try:
            url = f"https://crt.sh/?q=%.{self.domain}&output=json"
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
        
        print(f"Scanning {len(ips_to_scan)} IP addresses...\n")
        
        all_open_ports = []
        for ip in ips_to_scan[:3]:  # Limit to 3 IPs for time reasons
            print(f"{Colors.CYAN}Scanning IP: {ip}{Colors.END}")
            # First pass: fast TCP connect + banner grab
            candidate_ports = self.scan_ip_ports(ip, common_ports)
            if not candidate_ports:
                continue

            # Verify candidates with nmap where available to avoid false-positives
            ports_list = [p['port'] for p in candidate_ports]
            verified = self.verify_open_ports_with_nmap(ip, ports_list, candidate_ports)

            # Analyze vulnerabilities for verified ports and add to final list
            for p in verified:
                try:
                    self.analyze_service_vulnerabilities(p)
                except Exception:
                    pass

            all_open_ports.extend(verified)
        
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

    def verify_open_ports_with_nmap(self, ip, ports_list, original_port_infos):
        """Verify candidate open ports using nmap - returns only ports confirmed open by nmap.

        ip: target ip
        ports_list: list of port numbers to verify
        original_port_infos: list of port_info dicts from the fast scan
        """
        # If nmap is not available, fallback to the fast-scan results
        if not shutil.which('nmap'):
            self.print_warning('nmap not found on PATH — skipping nmap verification (using fast-scan results)')
            return original_port_infos

        if not ports_list:
            return []

        port_str = ','.join(str(p) for p in sorted(set(ports_list)))
        cmd = ['nmap', '-Pn', '-sV', '-p', port_str, '--host-timeout', '30s', '-oX', '-', ip]
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            xml_out = proc.stdout
            if not xml_out:
                return original_port_infos

            root = ET.fromstring(xml_out)
            open_ports = []
            # Map original infos by port for merging banners
            orig_map = {int(p['port']): p for p in original_port_infos if 'port' in p}

            for port_elem in root.findall('.//port'):
                # portid is an attribute on the <port> element
                portid = port_elem.attrib.get('portid')
                if not portid:
                    continue
                try:
                    pid = int(portid)
                except Exception:
                    continue

                state_elem = port_elem.find('state')
                state = state_elem.attrib.get('state') if state_elem is not None and 'state' in state_elem.attrib else (state_elem.get('state') if state_elem is not None else None)
                if state != 'open':
                    continue

                service_elem = port_elem.find('service')
                srv_name = ''
                product = ''
                version = ''
                if service_elem is not None:
                    srv_name = service_elem.attrib.get('name', '')
                    product = service_elem.attrib.get('product', '')
                    version = service_elem.attrib.get('version', '')

                merged = orig_map.get(pid, {}).copy() if pid in orig_map else { 'ip': ip, 'port': pid, 'service': srv_name or 'unknown', 'banner': '' }
                # Prefer nmap-discovered service name/product/version
                if srv_name:
                    merged['service'] = srv_name
                if product or version:
                    merged['banner'] = ((product or '') + ((' ' + version) if version else '')).strip() or merged.get('banner', '')

                # Add a flag indicating source of confirmation
                merged['confirmed_by'] = 'nmap'
                open_ports.append(merged)

            return open_ports
        except Exception as e:
            self.print_warning(f"nmap verification failed: {e}")
            return original_port_infos

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
                    "recommendation": f"Upgrade {detected_software} to version {vuln_info.get('current_version', 'latest')}"
                }
                
                self.results["vulnerabilities"].append(vulnerability)
                
                if vuln_info['severity'] == 'CRITICAL':
                    self.print_critical(f"Outdated {detected_software} {detected_version} detected on {ip}:{port}")
                    self.print_critical(f"CVEs: {', '.join(vuln_info['cves'])}")
                else:
                    self.print_warning(f"Vulnerable {detected_software} {detected_version} detected on {ip}:{port}")

    def ssl_certificate_analysis(self):
        """Comprehensive SSL/TLS certificate analysis"""
        self.print_header("5. SSL/TLS CERTIFICATE ANALYSIS")
        
        if not self.domain:
            self.print_warning("No domain for SSL analysis")
            return
        
        ssl_data = {}
        ports_to_check = [443, 8443, 9443, 10443, 11443, 12443]
        
        for port in ports_to_check:
            try:
                cert_info = self.get_ssl_certificate(self.domain, port)
                if cert_info:
                    ssl_data[f"port_{port}"] = cert_info
                    print(f"\n{Colors.CYAN}SSL Certificate (Port {port}):{Colors.END}")
                    print(f"  Subject: {cert_info.get('subject', {}).get('CN', 'N/A')}")
                    print(f"  Issuer: {cert_info.get('issuer', {}).get('O', 'N/A')}")
                    print(f"  Valid From: {cert_info.get('not_before', 'N/A')}")
                    print(f"  Valid Until: {cert_info.get('not_after', 'N/A')}")
                    print(f"  Signature Algorithm: {cert_info.get('signature_algorithm', 'N/A')}")
                    
                    # Check certificate expiration
                    if cert_info.get('days_until_expiry', 0) < 30:
                        self.print_critical(f"SSL certificate expires in {cert_info['days_until_expiry']} days!")
            except Exception as e:
                continue
        
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

    def breach_data_check(self):
        """REAL breach checking using HIBP API"""
        if not self.check_breaches or not self.hibp_api_key:
            if self.check_breaches and not self.hibp_api_key:
                self.print_warning("HIBP API key required for breach checking. Skipping.")
            return
            
        self.print_header("6. REAL DATA BREACH ANALYSIS")
        
        breach_data = {}
        
        for email in list(self.discovered_emails)[:5]:  # Limit to 5 due to API rate limits
            try:
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
                            "recommendation": "Immediate password reset and enable MFA"
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
        """Detect Web Application Firewalls"""
        self.print_header("7. WEB APPLICATION FIREWALL DETECTION")
        
        waf_data = {}
        urls_to_check = []
        
        if self.target_type == "url":
            urls_to_check.append(self.target)
        elif self.domain:
            urls_to_check.append(f"https://{self.domain}")
            urls_to_check.append(f"http://{self.domain}")
        
        for url in urls_to_check[:3]:
            try:
                waf_info = self.detect_waf(url)
                if waf_info:
                    waf_data[url] = waf_info
                    if waf_info['detected']:
                        self.print_success(f"WAF detected: {waf_info['waf']} on {url}")
                        self.waf_detected = True
                    else:
                        print(f"{Colors.YELLOW}No WAF detected on {url}{Colors.END}")
            except Exception as e:
                self.print_error(f"WAF detection failed for {url}: {str(e)}")
        
        self.results["waf_detection"] = waf_data
        self.save_artifact("waf_detection.json", waf_data)

    def detect_waf(self, url):
        """Detect WAF by analyzing HTTP responses"""
        try:
            response = requests.get(url, timeout=10, verify=False, allow_redirects=True)
            headers = response.headers
            
            waf_indicators = {
                'Cloudflare': ['cf-ray', 'cf-cache-status', 'server: cloudflare'],
                'Akamai': ['akamai-origin-ops', 'x-akamai-transformed'],
                'Imperva': ['x-cdn', 'incap_ses_', 'visid_incap_'],
                'AWS WAF': ['x-aws-request-id', 'server: awswaf'],
                'ModSecurity': ['server: mod_security'],
                'F5 BIG-IP': ['x-wa-info', 'x-protected-by'],
                'Barracuda': ['barracuda'],
                'FortiWeb': ['fortiweb'],
                'Sucuri': ['x-sucuri-id', 'x-sucuri-cache'],
                'Wordfence': ['x-wf-', 'wordfence'],
                'Comodo': ['protected-by-comodo-waf'],
                'Juniper': ['server: vpngate'],
                'Citrix Netscaler': ['ns_af', 'citrix_ns_id'],
                'Radware': ['x-secured-by'],
                'Reblaze': ['rbzid=']
            }
            
            detected_waf = None
            for waf, indicators in waf_indicators.items():
                for indicator in indicators:
                    if ':' in indicator:
                        header, value = indicator.split(':', 1)
                        if header.strip().lower() in headers and value.strip().lower() in headers[header.strip().lower()].lower():
                            detected_waf = waf
                            break
                    else:
                        if any(indicator.lower() in key.lower() or indicator.lower() in str(value).lower() 
                              for key, value in headers.items()):
                            detected_waf = waf
                            break
                if detected_waf:
                    break
            
            return {
                'detected': detected_waf is not None,
                'waf': detected_waf,
                'headers': dict(headers),
                'status_code': response.status_code
            }
            
        except Exception as e:
            return {'detected': False, 'error': str(e)}

    def ip_geolocation_analysis(self):
        """Perform IP geolocation and ASN analysis"""
        self.print_header("8. IP GEOLOCATION & NETWORK ANALYSIS")
        
        ip_data = {}
        unique_ips = list(self.discovered_ips)
        
        for ip in unique_ips[:10]:  # Limit to 10 IPs
            try:
                geo_info = self.get_ip_geolocation(ip)
                if geo_info:
                    ip_data[ip] = geo_info
                    print(f"\n{Colors.CYAN}IP: {ip}{Colors.END}")
                    print(f"  Organization: {geo_info.get('org', 'N/A')}")
                    print(f"  Country: {geo_info.get('country', 'N/A')}")
                    print(f"  City: {geo_info.get('city', 'N/A')}")
                    print(f"  ASN: {geo_info.get('asn', 'N/A')}")
            except Exception as e:
                self.print_error(f"Geolocation failed for {ip}: {str(e)}")
        
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

    def comprehensive_web_analysis(self):
        """Comprehensive web technology and security analysis"""
        self.print_header("9. COMPREHENSIVE WEB TECHNOLOGY ANALYSIS")
        
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
        
        web_data = {
            "analyzed_urls": [],
            "technologies": {},
            "security_headers": {},
            "vulnerabilities": []
        }
        
        for url in urls_to_check[:5]:
            print(f"\n{Colors.CYAN}Analyzing: {url}{Colors.END}")
            
            try:
                response = requests.get(url, timeout=10, verify=False, allow_redirects=True)
                url_data = self.analyze_web_response(url, response)
                web_data["analyzed_urls"].append(url_data)
                
            except Exception as e:
                self.print_error(f"Failed to analyze {url}: {str(e)}")
        
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
        for header, status in security_headers["status"].items():
            if status == "PRESENT":
                self.print_success(f"  {header}")
            else:
                self.print_warning(f"  {header}: MISSING")
        
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
        
        for tech, patterns in tech_patterns.items():
            for pattern in patterns:
                if re.search(pattern, html, re.IGNORECASE):
                    technologies.append(tech)
                    
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
                                    "recommendation": f"Upgrade to jQuery {vuln_info.get('current_version', '3.7.1')} immediately"
                                })
                    
                    print(f"{Colors.GREEN}Technology:{Colors.END} {tech}")
                    break
        
        return technologies

    def business_intelligence_gathering(self):
        """Gather business intelligence and context"""
        self.print_header("10. BUSINESS INTELLIGENCE & CONTEXT ANALYSIS")
        
        business_data = {
            "company_profile": {},
            "services_identified": [],
            "infrastructure_providers": [],
            "related_entities": []
        }
        
        # Analyze domain for business context
        if self.domain:
            # Extract potential company name from domain
            domain_parts = self.domain.split('.')
            if len(domain_parts) >= 2:
                company_candidate = domain_parts[-2].upper()
                business_data["company_profile"]["name_candidate"] = company_candidate
            
            # Financial services indicators
            financial_indicators = ['bank', 'credit', 'card', 'pay', 'money', 'finance', 'capital', 'invest']
            if any(indicator in self.domain.lower() for indicator in financial_indicators):
                business_data["services_identified"].append("Financial Services")
                self.print_success("Domain suggests financial services business")
        
        # Infrastructure provider analysis
        if self.results.get("domain_information", {}).get("whois", {}).get("registrar", {}).get("name"):
            registrar = self.results["domain_information"]["whois"]["registrar"]["name"]
            business_data["infrastructure_providers"].append(f"Registrar: {registrar}")
        
        # Related entities from email domains
        for email in self.discovered_emails:
            domain = email.split('@')[-1]
            if domain != self.domain:
                business_data["related_entities"].append(domain)
        
        self.results["business_intelligence"] = business_data
        self.save_artifact("business_intelligence.json", business_data)
        
        # Display findings
        print(f"{Colors.CYAN}Business Context:{Colors.END}")
        for key, value in business_data.items():
            if value:
                print(f"  {key}: {value}")

    def generate_professional_report(self):
        """Generate professional markdown report"""
        self.print_header("GENERATING PROFESSIONAL OSINT REPORT")
        
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
        """Build comprehensive markdown report with real data"""
        critical_vulns = [v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"]
        all_ips = list(self.discovered_ips)
        
        # Build port table
        port_table_lines = []
        open_ports = self.results.get("port_scanning", {}).get("open_ports", [])
        
        for port_info in open_ports:
            port = port_info.get('port', 'N/A')
            service = port_info.get('service', 'N/A')
            ip = port_info.get('ip', 'N/A')
            banner = port_info.get('banner', '') or ''
            banner_display = banner[:50] if banner else 'N/A'
            port_table_lines.append(f"| {ip} | {port} | {service} | {banner_display} |")
        
        port_table = '\n'.join(port_table_lines) if port_table_lines else "| No open ports found | | | |"
        
        # Build technologies list
        technologies_list = []
        analyzed_urls = self.results.get("web_technologies", {}).get("analyzed_urls", [])
        for url_data in analyzed_urls:
            for tech in url_data.get("technologies", []):
                if tech and tech not in technologies_list:
                    technologies_list.append(tech)
        
        technologies_display = '\n'.join([f"- {tech}" for tech in technologies_list[:10]]) if technologies_list else "- No technologies detected"
        
        # Build security issues list
        security_issues = []
        for url_data in analyzed_urls:
            for issue in url_data.get("security_issues", []):
                if issue and issue not in security_issues:
                    security_issues.append(issue)
        
        security_issues_display = '\n'.join([f"- {issue}" for issue in security_issues[:5]]) if security_issues else "- All major security headers present"

        # Build breach data
        breach_display = ""
        if self.results.get("breach_data"):
            breach_display = "### 6.1 Compromised Email Accounts - Data Breaches Detected\n\n"
            for email, breaches in self.results["breach_data"].items():
                breach_display += f"#### {email}\n\n"
                breach_display += f"**Breaches Detected:** {len(breaches)} data breach{'es' if len(breaches) > 1 else ''}\n\n"
                for breach in breaches[:3]:
                    breach_display += f"**Breach:** {breach.get('Name', 'Unknown')} ({breach.get('BreachDate', 'Unknown date')})\n"
                    if 'DataClasses' in breach:
                        breach_display += f"- **Compromised Data:** {', '.join(breach.get('DataClasses', [])[:5])}\n"
                breach_display += "\n"

        # Build SSL certificate info
        ssl_display = ""
        if self.results.get("ssl_certificates"):
            for port, cert in self.results["ssl_certificates"].items():
                ssl_display += f"**Port {port.replace('port_', '')}:**\n"
                ssl_display += f"- Subject: {cert.get('subject', {}).get('CN', 'N/A')}\n"
                ssl_display += f"- Issuer: {cert.get('issuer', {}).get('O', 'N/A')}\n"
                ssl_display += f"- Valid Until: {cert.get('not_after', 'N/A')}\n"
                ssl_display += f"- Days Until Expiry: {cert.get('days_until_expiry', 'N/A')}\n\n"

        # Build WAF info
        waf_display = ""
        if self.results.get("waf_detection"):
            for url, waf_info in self.results["waf_detection"].items():
                if waf_info.get('detected'):
                    waf_display += f"- **{url}:** {waf_info.get('waf', 'Unknown WAF')} detected\n"
                else:
                    waf_display += f"- **{url}:** No WAF detected\n"

        report = f"""# OSINT Investigation Report: {self.domain or self.target}
**Investigation Date:** {self.results["metadata"]["investigation_date"]}
**Target Domain:** {self.domain or self.target}
**Report Classification:** {self.results["metadata"]["report_classification"]}
**Revision:** {self.results["metadata"]["revision"]}

---

## Executive Summary

This report contains comprehensive OSINT findings from a professional security assessment of {self.domain or self.target}.

**Risk Level:** **{self.results["executive_summary"]["risk_level"]}**

**Key Findings:**
- IP Addresses Discovered: {len(all_ips)}
- Subdomains Found: {len(self.discovered_subdomains)}
- Email Addresses: {len(self.discovered_emails)}
- Open Ports: {len(open_ports)}
- Critical Vulnerabilities: {len(critical_vulns)}
- Total Vulnerabilities: {len(self.results["vulnerabilities"])}
- Breached Accounts: {len(self.breached_accounts)}
- WAF Detected: {'Yes' if self.waf_detected else 'No'}

**Critical Issues Requiring Immediate Attention:**
{chr(10).join([f"- {finding}" for finding in self.critical_findings[:5]]) if self.critical_findings else "No critical issues detected"}

---

## 1. Domain Information

### 1.1 WHOIS Registration Details

**Domain:** {self.results["domain_information"].get("whois", {}).get("domain", "N/A")}
**Registrar:** {self.results["domain_information"].get("whois", {}).get("registrar", {}).get("name", "N/A")}
**Creation Date:** {self.results["domain_information"].get("whois", {}).get("dates", {}).get("creation_date", "N/A")}
**Expiration Date:** {self.results["domain_information"].get("whois", {}).get("dates", {}).get("expiration_date", "N/A")}

**Name Servers:**
{chr(10).join([f"- {ns}" for ns in self.results["domain_information"].get("whois", {}).get("name_servers", [])[:5]]) if self.results["domain_information"].get("whois", {}).get("name_servers") else "- No name servers found"}

### 1.2 DNS Configuration

**A Records:**
{chr(10).join([f"- {record}" for record in self.results["domain_information"].get("dns", {}).get("records", {}).get("A", [])]) if self.results["domain_information"].get("dns", {}).get("records", {}).get("A") else "- No A records found"}

**MX Records (Mail Servers):**
{chr(10).join([f"- {record}" for record in self.results["domain_information"].get("dns", {}).get("records", {}).get("MX", [])]) if self.results["domain_information"].get("dns", {}).get("records", {}).get("MX") else "- No MX records found"}

**DNSSEC Status:** {"Enabled" if self.results["domain_information"].get("dns", {}).get("security", {}).get("dnssec") else "Not Enabled"}

---

## 2. Network Infrastructure

### 2.1 Discovered IP Addresses

{chr(10).join([f"- {ip}" for ip in all_ips[:10]]) if all_ips else "No IP addresses discovered"}

### 2.2 Subdomain Enumeration

**Total Subdomains Discovered:** {len(self.discovered_subdomains)}

**Key Subdomains:**
{chr(10).join([f"- {subdomain}" for subdomain in list(self.discovered_subdomains.keys())[:10]]) if self.discovered_subdomains else "- No subdomains found"}

---

## 3. Port Scanning Results

### 3.1 Open Ports

| IP | Port | Service | Banner |
|----|------|---------|--------|
{port_table}

---

## 4. SSL/TLS Certificate Analysis

{ssl_display if ssl_display else "No SSL certificate information available"}

---

## 5. Web Technology Stack

### 5.1 Server Technologies

{technologies_display}

### 5.2 Security Headers Assessment

**Missing Security Headers:**
{security_issues_display}

---

## 6. Data Breach Analysis

{breach_display if breach_display else "No breach data available or breach checking disabled"}

---

## 7. Web Application Firewall Detection

{waf_display if waf_display else "No WAF detection performed"}

---

## 8. Security Assessment

### 8.1 Vulnerability Summary

**Critical Vulnerabilities:** {len(critical_vulns)}
**Total Vulnerabilities:** {len(self.results["vulnerabilities"])}

### 8.2 Detailed Vulnerabilities

{chr(10).join([f"#### {vuln['type']} - {vuln['severity']}\n**Software:** {vuln.get('software', 'N/A')}\n**Description:** {vuln['description']}\n**Affected:** {vuln.get('service', 'N/A')}\n**IP:** {vuln.get('ip', 'N/A')}\n**CVEs:** {', '.join(vuln.get('cves', []))}\n**Recommendation:** {vuln['recommendation']}\n" for vuln in self.results["vulnerabilities"][:10]]) if self.results["vulnerabilities"] else "No vulnerabilities detected"}

---

## 9. Business Intelligence

**Identified Services:**
{chr(10).join([f"- {service}" for service in self.results.get("business_intelligence", {}).get("services_identified", [])]) if self.results.get("business_intelligence", {}).get("services_identified") else "- No specific services identified"}

**Infrastructure Providers:**
{chr(10).join([f"- {provider}" for provider in self.results.get("business_intelligence", {}).get("infrastructure_providers", [])]) if self.results.get("business_intelligence", {}).get("infrastructure_providers") else "- No infrastructure providers identified"}

---

## 10. Contact Information

**Discovered Email Addresses:**
{chr(10).join([f"- {email}" for email in list(self.discovered_emails)[:5]]) if self.discovered_emails else "- No email addresses discovered"}

**Breached Accounts:**
{chr(10).join([f"- {email}" for email in self.breached_accounts]) if self.breached_accounts else "- No breached accounts detected"}

---

## 11. Recommendations

### Immediate Actions (24-48 hours):
{chr(10).join([f"- {vuln['recommendation']}" for vuln in self.results["vulnerabilities"] if vuln['severity'] == 'CRITICAL'][:3]) if any(vuln['severity'] == 'CRITICAL' for vuln in self.results["vulnerabilities"]) else "- No critical actions required"}

### Short-term Actions (1-2 weeks):
- Implement missing security headers (HSTS, CSP, X-Content-Type-Options)
- Review and close unnecessary open ports
- Ensure DNSSEC is implemented
- Update outdated software components

### Long-term Actions (1 month):
- Conduct comprehensive penetration test
- Implement regular vulnerability scanning
- Establish security monitoring
- Develop incident response plan

---

## Investigation Artifacts

All investigation data saved to: `{self.output_dir}/`

**Generated Files:**
- whois_detailed.json - Complete WHOIS information
- dns_analysis.json - DNS records and analysis  
- subdomains_comprehensive.json - Subdomain enumeration results
- port_scanning.json - Port scanning results
- web_analysis.json - Web technology analysis
- ssl_analysis.json - SSL certificate analysis
- breach_analysis.json - Data breach information
- waf_detection.json - WAF detection results
- ip_geolocation.json - IP geolocation data
- business_intelligence.json - Business context
- complete_results.json - Complete dataset

---

## Methodology

This OSINT investigation was conducted using legal and ethical reconnaissance techniques:

**Passive Reconnaissance:**
- WHOIS database queries
- DNS enumeration and analysis  
- Certificate transparency logs
- Public IP geolocation
- Web technology fingerprinting
- SSL certificate analysis
- Data breach database queries

**Active Reconnaissance:**
- Port scanning (non-intrusive)
- Service version detection
- HTTP header analysis
- Technology stack identification
- WAF detection

No systems were accessed without authorization and no illegal activities were performed.

---

## Disclaimer

This report is provided for legitimate security assessment purposes only. All information was gathered from publicly available sources using legal OSINT methodologies.

The findings represent a point-in-time assessment and security posture may change. Recommendations should be evaluated by qualified security professionals.

---

*Report generated by Professional OSINT Reconnaissance Tool*  
*{datetime.now().isoformat()}*
"""
        return report

    def run_comprehensive_assessment(self):
        """Run complete OSINT assessment"""
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}AUTOMATED OSINT RECONNAISSANCE TOOL{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}\n")
        
        print(f"{Colors.CYAN}Target: {self.target}{Colors.END}")
        print(f"{Colors.CYAN}Type: {self.target_type.upper()}{Colors.END}")
        print(f"{Colors.CYAN}Output Directory: {self.output_dir}{Colors.END}")
        print(f"{Colors.CYAN}Deep Scan: {self.deep_scan}{Colors.END}")
        print(f"{Colors.CYAN}Breach Check: {self.check_breaches}{Colors.END}")
        print(f"{Colors.CYAN}HIBP API: {'Configured' if self.hibp_api_key else 'Not configured'}{Colors.END}\n")
        
        # Run all assessment modules
        modules = [
            self.comprehensive_whois_lookup,
            self.enhanced_dns_enumeration,
            self.comprehensive_subdomain_enumeration,
            self.advanced_port_scanning,
            self.ssl_certificate_analysis,
            self.comprehensive_web_analysis,
            self.waf_detection,
            self.ip_geolocation_analysis,
            self.business_intelligence_gathering,
        ]
        
        # Add breach check if enabled and API key available
        if self.check_breaches and self.hibp_api_key:
            modules.insert(6, self.breach_data_check)
        
        for module in modules:
            try:
                module()
            except Exception as e:
                self.print_error(f"Module {module.__name__} failed: {str(e)}")
                continue
        
        # Generate final report
        report_file = self.generate_professional_report()
        
        # Save complete results
        self.save_artifact("complete_results.json", self.results)
        
        # Summary
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}AUTOMATED SCAN COMPLETE!{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}\n")
        
        critical_count = len([v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"])
        
        print(f"{Colors.CYAN}Scan Summary:{Colors.END}")
        print(f"  IPs Discovered: {len(self.discovered_ips)}")
        print(f"  Subdomains Found: {len(self.discovered_subdomains)}")
        print(f"  Open Ports: {len(self.results['port_scanning'].get('open_ports', []))}")
        print(f"  Critical Vulnerabilities: {critical_count}")
        print(f"  Total Vulnerabilities: {len(self.results['vulnerabilities'])}")
        print(f"  Breached Accounts: {len(self.breached_accounts)}")
        print(f"  Risk Level: {self.results['executive_summary']['risk_level']}")
        print(f"  WAF Detected: {'Yes' if self.waf_detected else 'No'}")
        print(f"\n{Colors.CYAN}Report Location: {report_file}{Colors.END}\n")
        
        if critical_count > 0:
            print(f"{Colors.RED}{Colors.BOLD}CRITICAL: {critical_count} vulnerabilities require immediate attention!{Colors.END}")
        
        if self.breached_accounts:
            print(f"{Colors.RED}{Colors.BOLD}BREACH: {len(self.breached_accounts)} accounts found in data breaches!{Colors.END}")

# =============================================================================
# COMMAND-LINE INTERFACE & EXECUTION
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Professional OSINT Reconnaissance Tool - Runs comprehensive scan by default",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python osint_pro.py example.com                          # Full comprehensive scan
  python osint_pro.py example.com --quick                  # Fast scan (skips deep DNS and breach checks)
  python osint_pro.py example.com --no-deep-scan           # Skip deep DNS brute-force
  python osint_pro.py example.com --no-breaches            # Skip breach checking
  python osint_pro.py example.com -o /path/to/output       # Save to custom directory
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
    check_breaches = not args.no_breaches
    
    # Prepare output directory
    output_dir = args.output_dir or f"osint_{args.target.replace('://', '_').replace('/', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print(f"{Colors.BOLD}{Colors.CYAN}Starting Automated OSINT Scan...{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Target: {args.target}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Configuration: Deep Scan={deep_scan}, Breach Check={check_breaches}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Output: {output_dir}{Colors.END}\n")
    
    # Initialize and run the scan
    osint = ProfessionalOSINT(
        target=args.target,
        output_dir=output_dir,
        deep_scan=deep_scan,
        check_breaches=check_breaches
    )
    
    # Run the comprehensive assessment
    osint.run_comprehensive_assessment()
    
    print(f"\n{Colors.BOLD}{Colors.GREEN}Scan completed successfully!{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}Check the '{output_dir}' directory for complete results.{Colors.END}")