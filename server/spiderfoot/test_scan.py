#!/usr/bin/env python3
"""
Test script to verify SpiderFoot scan functionality
"""

import sys
import os
import json

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from spiderfoot_wrapper import start_scan, list_modules, list_scans
    
    print("Testing SpiderFoot functionality...")
    
    # Test module loading
    print("\n1. Testing module loading...")
    try:
        modules = list_modules()
        print(f"✓ Modules loaded: {len(modules.get('modules', []))} modules")
    except Exception as e:
        print(f"✗ Module loading failed: {e}")
    
    # Test scan listing
    print("\n2. Testing scan listing...")
    try:
        scans = list_scans()
        print(f"✓ Scan listing works: {len(scans.get('scans', []))} scans found")
    except Exception as e:
        print(f"✗ Scan listing failed: {e}")
    
    # Test scan creation (with a simple target)
    print("\n3. Testing scan creation...")
    try:
        result = start_scan("example.com", "Test Scan")
        if result and isinstance(result, str):
            # Parse the JSON response
            try:
                result_data = json.loads(result)
                if result_data.get('success'):
                    print(f"✓ Scan creation successful: {result_data.get('scanId')}")
                else:
                    print(f"✗ Scan creation failed: {result_data.get('error')}")
            except json.JSONDecodeError:
                print(f"✓ Scan creation response: {result}")
        else:
            print(f"✗ Scan creation failed: {result}")
    except Exception as e:
        print(f"✗ Scan creation failed: {e}")
    
    print("\nTest completed!")
    
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Test failed: {e}")
    sys.exit(1)
