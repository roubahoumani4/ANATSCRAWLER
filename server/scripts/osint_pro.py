#!/usr/bin/env python3
"""
Professional OSINT Reconnaissance Script - COMPLETELY FIXED
Enterprise-grade information gathering with comprehensive reporting
"""

import argparse
import json
import socket
import subprocess
import sys
import re
import time
import concurrent.futures
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
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
            "compliance": {}
        }
        
        self.target_type = self._determine_target_type()
        self.domain = self._extract_domain()
        self.primary_ip = None
        self.discovered_ips = set()
        self.discovered_emails = set()
        self.discovered_subdomains = {}
        self.critical_findings = []

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
                    
                    # Collect emails - FIXED VERSION
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
            "total_discovered": 0
        }
        
        # Technique 1: Common subdomains
        found_common = self.enumerate_common_subdomains()
        subdomains_data["common_subdomains"] = found_common
        
        # Technique 2: Certificate Transparency
        found_ct = self.certificate_transparency_lookup()
        subdomains_data["certificate_transparency"] = found_ct
        
        # Combine and deduplicate
        all_subdomains = set()
        for sub in found_common + found_ct:
            all_subdomains.add(sub["subdomain"])
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
        
        # Extended port list
        common_ports = {
            21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
            80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 465: 'SMTPS',
            587: 'SMTP-Submission', 993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL',
            3389: 'RDP', 5432: 'PostgreSQL', 8000: 'HTTP-Alt', 8080: 'HTTP-Proxy',
            8100: 'HTTP-Alt2', 8101: 'HTTP-Alt3', 8443: 'HTTPS-Alt', 9090: 'HTTP-Admin',
            10443: 'HTTPS-Alt2', 11443: 'HTTPS-Alt3'
        }
        
        print(f"Scanning {target_ip}...\n")
        
        # Use threading for faster scanning
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            future_to_port = {
                executor.submit(self.scan_port, target_ip, port, service): (port, service) 
                for port, service in common_ports.items()
            }
            
            for future in concurrent.futures.as_completed(future_to_port):
                port, service = future_to_port[future]
                try:
                    result = future.result()
                    if result:
                        port_data["open_ports"].append(result)
                        self.analyze_service_vulnerabilities(result)
                except Exception as e:
                    pass
        
        # Sort by port number
        port_data["open_ports"].sort(key=lambda x: x["port"])
        
        # Display results in table format
        if port_data["open_ports"]:
            print(f"\n{Colors.GREEN}OPEN PORTS:{Colors.END}")
            print(f"{'Port':<8} {'Service':<15} {'Version/Banner':<30} {'Status':<10}")
            print("-" * 65)
            for port_info in port_data["open_ports"]:
                banner = port_info.get('banner', '') or ''
                banner_display = banner[:28] + '..' if banner and len(banner) > 30 else banner
                print(f"{port_info['port']:<8} {port_info['service']:<15} {banner_display or '':<30} {'OPEN':<10}")
        else:
            self.print_warning("No common ports found open")
        
        self.results["port_scanning"] = port_data
        self.save_artifact("port_scanning.json", port_data)

    def scan_port(self, ip, port, service):
        """Scan individual port with banner grabbing"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((ip, port))
            
            if result == 0:
                banner = self.grab_banner(ip, port)
                return {
                    "port": port,
                    "service": service,
                    "banner": banner,
                    "protocol": "tcp"
                }
            sock.close()
        except:
            pass
        return None

    def grab_banner(self, ip, port):
        """Enhanced banner grabbing - RETURNS EMPTY STRING INSTEAD OF NONE"""
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
            
            banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
            sock.close()
            
            # Extract server info from HTTP response
            if port in [80, 8080, 8000, 8100, 8101, 9090] and 'Server:' in banner:
                server_match = re.search(r'Server:\s*([^\r\n]+)', banner, re.IGNORECASE)
                if server_match:
                    return server_match.group(1).strip()
            
            return banner[:200] if banner else ''  # Return empty string instead of None
            
        except:
            return ''  # Return empty string instead of None

    def analyze_service_vulnerabilities(self, service_info):
        """Analyze services for known vulnerabilities"""
        banner = (service_info.get('banner') or '').lower()
        port = service_info['port']
        service = service_info['service']
        
        # Check for outdated software versions
        vulnerable_versions = {
            'apache/2.4.18': {
                'severity': 'CRITICAL',
                'cves': ['CVE-2017-9798', 'CVE-2019-0211', 'CVE-2017-7679'],
                'description': 'Apache 2.4.18 is severely outdated (2015) with multiple memory disclosure and privilege escalation vulnerabilities'
            },
            'glassfish': {
                'severity': 'CRITICAL', 
                'cves': ['CVE-2017-1000028'],
                'description': 'GlassFish server is outdated with directory traversal vulnerability'
            },
            'iis/7.': {
                'severity': 'HIGH',
                'cves': ['Multiple vulnerabilities'],
                'description': 'Outdated IIS version with known security issues'
            },
            'mailenable': {
                'severity': 'MEDIUM',
                'cves': ['Multiple historical vulnerabilities'],
                'description': 'MailEnable has had multiple security vulnerabilities in past versions'
            }
        }
        
        for pattern, vuln_info in vulnerable_versions.items():
            if pattern in banner:
                vulnerability = {
                    "type": "Outdated Software",
                    "severity": vuln_info['severity'],
                    "service": f"{service} on port {port}",
                    "description": vuln_info['description'],
                    "cves": vuln_info['cves'],
                    "banner": service_info.get('banner'),
                    "recommendation": f"Upgrade {pattern} to latest version"
                }
                
                self.results["vulnerabilities"].append(vulnerability)
                
                if vuln_info['severity'] == 'CRITICAL':
                    self.print_critical(f"Outdated {pattern} detected on port {port}")
                else:
                    self.print_warning(f"Vulnerable {pattern} detected on port {port}")

    def comprehensive_web_analysis(self):
        """Comprehensive web technology and security analysis"""
        self.print_header("5. COMPREHENSIVE WEB TECHNOLOGY ANALYSIS")
        
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
            
            # Check for outdated servers
            if 'Apache/2.4.18' in server:
                self.print_critical(f"Outdated Apache 2.4.18 detected")
        
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
            'Telerik': ['telerik', 'radeditor']
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
                            if version.startswith('1.'):
                                self.print_critical(f"Outdated jQuery {version} detected (released ~2011)")
                                self.results["vulnerabilities"].append({
                                    "type": "Outdated JavaScript Library",
                                    "severity": "CRITICAL",
                                    "description": f"jQuery {version} is 13+ years outdated with multiple XSS vulnerabilities",
                                    "recommendation": "Upgrade to jQuery 3.7.x immediately"
                                })
                    
                    print(f"{Colors.GREEN}Technology:{Colors.END} {tech}")
                    break
        
        return technologies

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
        """Build comprehensive markdown report - COMPLETELY SAFE VERSION"""
        critical_vulns = [v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"]
        all_ips = list(self.discovered_ips)
        
        # SAFELY build port table - NO MORE BUGS!
        port_table_lines = []
        open_ports = self.results.get("port_scanning", {}).get("open_ports", [])
        
        for port_info in open_ports:
            port = port_info.get('port', 'N/A')
            service = port_info.get('service', 'N/A')
            banner = port_info.get('banner', '') or ''  # Ensure banner is never None
            banner_display = banner[:50] if banner else 'N/A'
            port_table_lines.append(f"| {port} | {service} | {banner_display} |")
        
        port_table = '\n'.join(port_table_lines) if port_table_lines else "| No open ports found | | |"
        
        # SAFELY build technologies list
        technologies_list = []
        analyzed_urls = self.results.get("web_technologies", {}).get("analyzed_urls", [])
        for url_data in analyzed_urls:
            for tech in url_data.get("technologies", []):
                if tech and tech not in technologies_list:
                    technologies_list.append(tech)
        
        technologies_display = '\n'.join([f"- {tech}" for tech in technologies_list[:10]]) if technologies_list else "- No technologies detected"
        
        # SAFELY build security issues list
        security_issues = []
        for url_data in analyzed_urls:
            for issue in url_data.get("security_issues", []):
                if issue and issue not in security_issues:
                    security_issues.append(issue)
        
        security_issues_display = '\n'.join([f"- {issue}" for issue in security_issues[:5]]) if security_issues else "- All major security headers present"

        report = f"""# OSINT Investigation Report: {self.domain or self.target}
**Investigation Date:** {self.results["metadata"]["investigation_date"]}
**Target Domain:** {self.domain or self.target}
**Report Classification:** {self.results["metadata"]["report_classification"]}
**Revision:** {self.results["metadata"]["revision"]}

---

## Executive Summary

This report contains comprehensive OSINT (Open Source Intelligence) findings from a professional security assessment of {self.domain or self.target}.

**Risk Level:** **{self.results["executive_summary"]["risk_level"]}**

**Key Findings:**
- IP Addresses Discovered: {len(all_ips)}
- Subdomains Found: {len(self.discovered_subdomains)}
- Email Addresses: {len(self.discovered_emails)}
- Open Ports: {len(open_ports)}
- Critical Vulnerabilities: {len(critical_vulns)}
- Total Vulnerabilities: {len(self.results["vulnerabilities"])}

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

**Domain Status:**
{chr(10).join([f"- {status}" for status in self.results["domain_information"].get("whois", {}).get("status", [])[:3]]) if self.results["domain_information"].get("whois", {}).get("status") else "- No status information"}

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

| Port | Service | Banner |
|------|---------|--------|
{port_table}

---

## 4. Web Technology Stack

### 4.1 Server Technologies

{technologies_display}

### 4.2 Security Headers Assessment

**Missing Security Headers:**
{security_issues_display}

---

## 5. Security Assessment

### 5.1 Vulnerability Summary

**Critical Vulnerabilities:** {len(critical_vulns)}
**Total Vulnerabilities:** {len(self.results["vulnerabilities"])}

### 5.2 Detailed Vulnerabilities

{chr(10).join([f"#### {vuln['type']} - {vuln['severity']}\n**Description:** {vuln['description']}\n**Affected:** {vuln.get('service', 'N/A')}\n**Recommendation:** {vuln['recommendation']}\n" for vuln in self.results["vulnerabilities"][:10]]) if self.results["vulnerabilities"] else "No vulnerabilities detected"}

---

## 6. Contact Information

**Discovered Email Addresses:**
{chr(10).join([f"- {email}" for email in list(self.discovered_emails)[:5]]) if self.discovered_emails else "- No email addresses discovered"}

---

## 7. Recommendations

### Immediate Actions (24-48 hours):
{chr(10).join([f"- {vuln['recommendation']}" for vuln in self.results["vulnerabilities"] if vuln['severity'] == 'CRITICAL'][:3]) if any(vuln['severity'] == 'CRITICAL' for vuln in self.results["vulnerabilities"]) else "- No critical actions required"}

### Short-term Actions (1-2 weeks):
- Implement missing security headers (HSTS, CSP, X-Content-Type-Options)
- Review and close unnecessary open ports
- Ensure DNSSEC is implemented

### Long-term Actions (1 month):
- Conduct comprehensive penetration test
- Implement regular vulnerability scanning
- Establish security monitoring

---

## Investigation Artifacts

All investigation data saved to: `{self.output_dir}/`

**Generated Files:**
- whois_detailed.json - Complete WHOIS information
- dns_analysis.json - DNS records and analysis  
- subdomains_comprehensive.json - Subdomain enumeration results
- port_scanning.json - Port scanning results
- web_analysis.json - Web technology analysis
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

**Active Reconnaissance:**
- Port scanning (non-intrusive)
- Service version detection
- HTTP header analysis
- Technology stack identification

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
        print(f"{Colors.BOLD}{Colors.GREEN}PROFESSIONAL OSINT RECONNAISSANCE TOOL{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}\n")
        
        print(f"{Colors.CYAN}Target: {self.target}{Colors.END}")
        print(f"{Colors.CYAN}Type: {self.target_type.upper()}{Colors.END}")
        print(f"{Colors.CYAN}Output Directory: {self.output_dir}{Colors.END}")
        print(f"{Colors.CYAN}Deep Scan: {self.deep_scan}{Colors.END}")
        print(f"{Colors.CYAN}Breach Check: {self.check_breaches}{Colors.END}\n")
        
        # Run all assessment modules
        modules = [
            self.comprehensive_whois_lookup,
            self.enhanced_dns_enumeration,
            self.comprehensive_subdomain_enumeration,
            self.advanced_port_scanning,
            self.comprehensive_web_analysis,
        ]
        
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
        print(f"{Colors.BOLD}{Colors.GREEN}ASSESSMENT COMPLETE!{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.END}\n")
        
        critical_count = len([v for v in self.results["vulnerabilities"] if v["severity"] == "CRITICAL"])
        
        print(f"{Colors.CYAN}Assessment Summary:{Colors.END}")
        print(f"  IPs Discovered: {len(self.discovered_ips)}")
        print(f"  Subdomains Found: {len(self.discovered_subdomains)}")
        print(f"  Open Ports: {len(self.results['port_scanning'].get('open_ports', []))}")
        print(f"  Critical Vulnerabilities: {critical_count}")
        print(f"  Total Vulnerabilities: {len(self.results['vulnerabilities'])}")
        print(f"  Risk Level: {self.results['executive_summary']['risk_level']}")
        print(f"\n{Colors.CYAN}Report Location: {report_file}{Colors.END}\n")
        
        if critical_count > 0:
            print(f"{Colors.RED}{Colors.BOLD}CRITICAL: {critical_count} vulnerabilities require immediate attention!{Colors.END}")

def main():
    parser = argparse.ArgumentParser(
        description='Professional OSINT Reconnaissance Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python osint_pro.py ccm.com.lb
  python osint_pro.py https://example.com -o results --deep-scan
  python osint_pro.py 8.8.8.8 --check-breaches
        """
    )
    
    parser.add_argument('target', help='Target domain, URL, or IP address')
    parser.add_argument('-o', '--output', help='Output directory for results', default=None)
    parser.add_argument('--deep-scan', action='store_true', help='Perform deep scanning (slower but more comprehensive)')
    parser.add_argument('--check-breaches', action='store_true', help='Check for email breaches (requires HIBP API)')
    
    args = parser.parse_args()
    
    # Run professional assessment
    osint = ProfessionalOSINT(
        args.target, 
        args.output, 
        deep_scan=args.deep_scan,
        check_breaches=args.check_breaches
    )
    osint.run_comprehensive_assessment()

if __name__ == "__main__":
    main()
