import sys
import json
import os
import traceback

# --- Cleaned Imports and Path Setup ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPIDERFOOT_DIR = os.path.join(BASE_DIR, "spiderfoot")
SPIDERFOOT_CORE = os.path.join(SPIDERFOOT_DIR, "spiderfoot")
MODULES_DIR = os.path.join(SPIDERFOOT_DIR, "modules")
DB_PATH = os.path.expanduser("~/.spiderfoot/spiderfoot.db")

# Show current paths for debugging
print("PYTHONPATH:", sys.path, file=sys.stderr)
print("MODULES_DIR:", MODULES_DIR, file=sys.stderr)

# Update PYTHONPATH dynamically
for path in [BASE_DIR, SPIDERFOOT_DIR, SPIDERFOOT_CORE]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Ensure packages are importable
try:
    from spiderfoot.db import SpiderFootDb
    from spiderfoot.helpers import SpiderFootHelpers
    from spiderfoot.sfscan import SpiderFootScanner
except ImportError as e:
    print(json.dumps({
        "error": "Failed to import SpiderFoot modules",
        "details": str(e)
    }), file=sys.stderr, flush=True)
    sys.exit(1)

def list_modules():
    try:
        modules_dict = SpiderFootHelpers.loadModulesAsDict(MODULES_DIR)
        module_names = sorted(list(modules_dict.keys()))
        print(json.dumps({"modules": module_names}))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def list_scans():
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        scans = db.scanInstanceList()
        print(json.dumps({"scans": scans}))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_info(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        scan = db.scanInstanceGet(scan_id)
        print(json.dumps(scan))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_graph(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        results = db.scanResultEvent(scan_id)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_browse(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        unique = db.scanResultEventUnique(scan_id)
        print(json.dumps(unique))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_result_summary(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        summary = db.scanResultSummary(scan_id)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_correlation_summary(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        summary = db.scanCorrelationSummary(scan_id)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_correlation_list(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        clist = db.scanCorrelationList(scan_id)
        print(json.dumps(clist))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_result_event(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        events = db.scanResultEvent(scan_id)
        print(json.dumps(events))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_logs(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        logs = db.scanLogs(scan_id)
        print(json.dumps(logs))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def start_scan(target, name):
    try:
        target_type = SpiderFootHelpers.targetTypeFromString(target)
        if not target_type:
            print(json.dumps({
                "success": False,
                "error": f"Could not determine target type for: {target}"
            }))
            return
        modules_dict = SpiderFootHelpers.loadModulesAsDict(MODULES_DIR)
        enabled_modules = list(modules_dict.keys())
        config = {
            '__database': DB_PATH,
            '_debug': True,
            '_loglevel': 'DEBUG',
            '__logging': True,
            '_scanlogtodisk': True,
            '_dnsserver': '8.8.8.8',
            '_useragent': 'Mozilla/5.0',
            '_maxthreads': 10,
            '_uiShowOnlyNew': False,
            '_moduleTimeout': 30,
            '_internettlds_cache': True,
            '_internettlds': 'generic, country, sponsored, infrastructure'
        }
        scan_id = SpiderFootHelpers.genScanInstanceId()
        scanner = SpiderFootScanner(
            scanName=name,
            scanId=scan_id,
            targetValue=target,
            targetType=target_type,
            moduleList=enabled_modules,
            globalOpts=config,
            start=True
        )
        print(json.dumps({"success": True, "scanId": scanner.scanId}))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }))

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No command provided"}))
            sys.exit(1)

        cmd = sys.argv[1]

        if cmd == "list_modules":
            list_modules()
        elif cmd == "list_scans":
            list_scans()
        elif cmd == "scan_info":
            scan_info(sys.argv[2])
        elif cmd == "scan_graph":
            scan_graph(sys.argv[2])
        elif cmd == "scan_browse":
            scan_browse(sys.argv[2])
        elif cmd == "scan_result_summary":
            scan_result_summary(sys.argv[2])
        elif cmd == "scan_correlation_summary":
            scan_correlation_summary(sys.argv[2])
        elif cmd == "scan_correlation_list":
            scan_correlation_list(sys.argv[2])
        elif cmd == "scan_result_event":
            scan_result_event(sys.argv[2])
        elif cmd == "scan_logs":
            scan_logs(sys.argv[2])
        elif cmd == "start_scan":
            start_scan(sys.argv[2], sys.argv[3])
        else:
            print(json.dumps({"error": "Unknown command"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), file=sys.stderr)
        sys.exit(1)
