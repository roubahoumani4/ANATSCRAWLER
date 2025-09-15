#!/usr/bin/env python3
"""
SpiderFoot Installation Verification Script
Verifies that all required dependencies are properly installed and functional.
"""

import sys
import os
import importlib

# Required core modules for SpiderFoot functionality
REQUIRED_MODULES = [
    'cherrypy',
    'requests',
    'bs4',  # beautifulsoup4
    'lxml',
    'dns',  # dnspython
    'netaddr',
    'cryptography',
    'yaml',
    'openpyxl',
    'networkx',
]

# Optional modules that enhance functionality but aren't critical
OPTIONAL_MODULES = [
    'socks',  # pysocks
    'whois',  # python-whois
    'phonenumbers',
    'PyPDF2',
    'docx',  # python-docx
    'pptx',  # python-pptx
    'ExifRead',
    'secure',
    'pygexf',
    'adblockparser',
    'ipwhois',
    'publicsuffixlist',
    'OpenSSL',  # pyOpenSSL
]

def check_module(module_name, required=True):
    """Check if a module can be imported successfully."""
    try:
        importlib.import_module(module_name)
        print(f"✅ {module_name}: OK")
        return True
    except ImportError as e:
        status = "❌" if required else "⚠️"
        print(f"{status} {module_name}: {e}")
        return False

def check_spiderfoot_modules():
    """Check SpiderFoot-specific modules."""
    print("\n🕷️ Checking SpiderFoot modules...")
    
    # Add current directory to Python path for SpiderFoot modules
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    sf_modules = ['sflib', 'spiderfoot']
    all_ok = True
    
    for module in sf_modules:
        if not check_module(module, required=True):
            all_ok = False
    
    return all_ok

def check_python_version():
    """Check Python version compatibility."""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major != 3:
        print("❌ Python 3 is required")
        return False
    
    if version.minor < 8:
        print("⚠️ Python 3.8+ is recommended")
        return False
    
    print("✅ Python version is compatible")
    return True

def check_spiderfoot_files():
    """Check if essential SpiderFoot files exist."""
    print("\n📁 Checking SpiderFoot files...")
    
    required_files = [
        'sf.py',
        'sflib.py',
        'sfwebui.py',
        'spiderfoot/__init__.py'
    ]
    
    all_ok = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}: Found")
        else:
            print(f"❌ {file_path}: Missing")
            all_ok = False
    
    return all_ok

def main():
    """Main verification function."""
    print("🔍 SpiderFoot Installation Verification")
    print("=" * 50)
    
    # Check Python version
    python_ok = check_python_version()
    
    # Check required modules
    print("\n📦 Checking required modules...")
    required_ok = True
    for module in REQUIRED_MODULES:
        if not check_module(module, required=True):
            required_ok = False
    
    # Check optional modules
    print("\n📦 Checking optional modules...")
    optional_count = 0
    for module in OPTIONAL_MODULES:
        if check_module(module, required=False):
            optional_count += 1
    
    print(f"\n📊 Optional modules available: {optional_count}/{len(OPTIONAL_MODULES)}")
    
    # Check SpiderFoot files
    files_ok = check_spiderfoot_files()
    
    # Check SpiderFoot modules
    sf_modules_ok = check_spiderfoot_modules()
    
    # Final status
    print("\n" + "=" * 50)
    if python_ok and required_ok and files_ok and sf_modules_ok:
        print("🎉 SpiderFoot installation verification PASSED")
        print("✅ All critical components are working correctly")
        sys.exit(0)
    else:
        print("❌ SpiderFoot installation verification FAILED")
        print("🔧 Please resolve the issues above before running SpiderFoot")
        sys.exit(1)

if __name__ == "__main__":
    main()
