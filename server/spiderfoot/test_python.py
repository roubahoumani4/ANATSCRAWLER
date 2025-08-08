#!/usr/bin/env python3
"""
Test script to verify SpiderFoot Python environment
"""
import sys
import os
import json

def test_environment():
    """Test the Python environment and SpiderFoot setup"""
    results = {
        "python_version": sys.version,
        "python_executable": sys.executable,
        "current_directory": os.getcwd(),
        "environment_variables": {
            "PYTHONPATH": os.environ.get("PYTHONPATH", "Not set"),
            "NODE_ENV": os.environ.get("NODE_ENV", "Not set")
        },
        "paths": {
            "script_dir": os.path.dirname(os.path.abspath(__file__)),
            "parent_dir": os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "core_dir": os.path.join(os.path.dirname(os.path.abspath(__file__)), "core"),
            "modules_dir": os.path.join(os.path.dirname(os.path.abspath(__file__)), "modules")
        },
        "path_exists": {},
        "imports": {}
    }
    
    # Check if paths exist
    for name, path in results["paths"].items():
        results["path_exists"][name] = os.path.exists(path)
    
    # Test imports
    try:
        import core.sfscan
        results["imports"]["core.sfscan"] = "SUCCESS"
    except ImportError as e:
        results["imports"]["core.sfscan"] = f"FAILED: {str(e)}"
    
    try:
        import core.spiderfoot.db
        results["imports"]["core.spiderfoot.db"] = "SUCCESS"
    except ImportError as e:
        results["imports"]["core.spiderfoot.db"] = f"FAILED: {str(e)}"
    
    try:
        import core.spiderfoot.helpers
        results["imports"]["core.spiderfoot.helpers"] = "SUCCESS"
    except ImportError as e:
        results["imports"]["core.spiderfoot.helpers"] = f"FAILED: {str(e)}"
    
    return results

if __name__ == "__main__":
    try:
        results = test_environment()
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": str(sys.exc_info())
        }))
