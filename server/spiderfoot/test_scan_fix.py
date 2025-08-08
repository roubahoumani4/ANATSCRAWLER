#!/usr/bin/env python3
"""
Test script to verify SpiderFoot scan fixes are working correctly.
This script tests the scan creation, execution, and result retrieval.
"""

import sys
import os
import json
import time
import traceback

# Add the spiderfoot directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_scan_creation():
    """Test scan creation and basic functionality."""
    print("🔍 Testing scan creation...")
    
    try:
        from spiderfoot_wrapper import start_scan, list_scans, scan_info
        
        # Test scan creation
        target = "8.8.8.8"
        name = "test_scan_fix"
        
        print(f"Creating scan for target: {target}")
        result = start_scan(target, name)
        
        if result and isinstance(result, dict) and result.get('success'):
            scan_id = result.get('scanId')
            print(f"✅ Scan created successfully with ID: {scan_id}")
            return scan_id
        else:
            print(f"❌ Failed to create scan: {result}")
            return None
            
    except Exception as e:
        print(f"❌ Error in test_scan_creation: {e}")
        traceback.print_exc()
        return None

def test_scan_status(scan_id):
    """Test scan status checking."""
    print(f"🔍 Testing scan status for {scan_id}...")
    
    try:
        from spiderfoot_wrapper import scan_info
        
        # Wait a moment for scan to initialize
        time.sleep(2)
        
        info = scan_info(scan_id)
        if info:
            print(f"✅ Scan info retrieved: {info}")
            return True
        else:
            print(f"❌ Failed to get scan info")
            return False
            
    except Exception as e:
        print(f"❌ Error in test_scan_status: {e}")
        traceback.print_exc()
        return False

def test_scan_results(scan_id):
    """Test scan result retrieval."""
    print(f"🔍 Testing scan results for {scan_id}...")
    
    try:
        from spiderfoot_wrapper import scan_result_summary, scan_correlation_summary, scan_browse
        
        # Wait for scan to potentially complete
        time.sleep(5)
        
        # Test summary
        summary = scan_result_summary(scan_id)
        print(f"✅ Summary retrieved: {len(summary) if isinstance(summary, list) else 'N/A'} items")
        
        # Test correlations
        correlations = scan_correlation_summary(scan_id)
        print(f"✅ Correlations retrieved: {len(correlations) if isinstance(correlations, list) else 'N/A'} items")
        
        # Test browse
        browse = scan_browse(scan_id)
        print(f"✅ Browse data retrieved: {len(browse) if isinstance(browse, list) else 'N/A'} items")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in test_scan_results: {e}")
        traceback.print_exc()
        return False

def test_scan_list():
    """Test scan list functionality."""
    print("🔍 Testing scan list...")
    
    try:
        from spiderfoot_wrapper import list_scans
        
        scans = list_scans()
        if scans and isinstance(scans, dict) and 'scans' in scans:
            scan_count = len(scans['scans'])
            print(f"✅ Scan list retrieved: {scan_count} scans")
            return True
        else:
            print(f"❌ Failed to get scan list: {scans}")
            return False
            
    except Exception as e:
        print(f"❌ Error in test_scan_list: {e}")
        traceback.print_exc()
        return False

def main():
    """Main test function."""
    print("🚀 Starting SpiderFoot scan fix verification...")
    print("=" * 50)
    
    # Test 1: Scan list
    if not test_scan_list():
        print("❌ Scan list test failed")
        return False
    
    # Test 2: Scan creation
    scan_id = test_scan_creation()
    if not scan_id:
        print("❌ Scan creation test failed")
        return False
    
    # Test 3: Scan status
    if not test_scan_status(scan_id):
        print("❌ Scan status test failed")
        return False
    
    # Test 4: Scan results
    if not test_scan_results(scan_id):
        print("❌ Scan results test failed")
        return False
    
    print("=" * 50)
    print("✅ All tests completed successfully!")
    print("🎯 SpiderFoot scan fixes are working correctly.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
