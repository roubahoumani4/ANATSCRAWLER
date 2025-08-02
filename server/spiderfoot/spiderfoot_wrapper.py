import sys
import json
import os
import traceback

# --- Path Setup ---
WRAPPER_DIR = os.path.abspath(os.path.dirname(__file__))
SPIDERFOOT_CORE = os.path.join(WRAPPER_DIR, "core")
MODULES_DIR = os.path.join(WRAPPER_DIR, "modules")
DB_PATH = os.path.expanduser("~/.spiderfoot/spiderfoot.db")

# Show paths (debugging)
print("PYTHONPATH:", sys.path, file=sys.stderr)
print("MODULES_DIR:", MODULES_DIR, file=sys.stderr)

# Ensure importable paths
for path in [WRAPPER_DIR, SPIDERFOOT_CORE, MODULES_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

# --- Imports ---
try:
    from core.sfscan import SpiderFootScanner
    from core.spiderfoot.db import SpiderFootDb
    from core.spiderfoot.helpers import SpiderFootHelpers
except ImportError as e:
    print(json.dumps({
        "error": "Failed to import SpiderFoot modules",
        "details": str(e)
    }), file=sys.stderr, flush=True)
    sys.exit(1)

# --- Wrapper Commands ---
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
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        scan = db.scanInstanceGet(scan_id)
        print(json.dumps(scan))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_graph(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        results = db.scanResultEvent(scan_id)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_browse(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        unique = db.scanResultEventUnique(scan_id)
        print(json.dumps(unique))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_result_summary(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        summary = db.scanResultSummary(scan_id)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_correlation_summary(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        summary = db.scanCorrelationSummary(scan_id)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_correlation_list(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        clist = db.scanCorrelationList(scan_id)
        print(json.dumps(clist))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_result_event(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        events = db.scanResultEvent(scan_id)
        print(json.dumps(events))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_logs(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        logs = db.scanLogs(scan_id)
        print(json.dumps(logs))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def start_scan(target, name):
    try:
        target_type = SpiderFootHelpers.targetTypeFromString(target)
        if not target_type:
            print(json.dumps({"success": False, "error": f"Could not determine target type for: {target}"}))
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

        sfdb = SpiderFootDb({'__database': DB_PATH})
        sfdb.create()

        scan_id = SpiderFootHelpers.genScanInstanceId()

        # ✅ Register scan instance in DB
        sfdb.scanInstanceCreate(scan_id, name, target)

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
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))

# --- Command Handler ---
if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No command provided"}))
            sys.exit(1)

        cmd = sys.argv[1]
        args = sys.argv[2:]

        match cmd:
            case "list_modules": list_modules()
            case "list_scans": list_scans()
            case "scan_info": scan_info(*args)
            case "scan_graph": scan_graph(*args)
            case "scan_browse": scan_browse(*args)
            case "scan_result_summary": scan_result_summary(*args)
            case "scan_correlation_summary": scan_correlation_summary(*args)
            case "scan_correlation_list": scan_correlation_list(*args)
            case "scan_result_event": scan_result_event(*args)
            case "scan_logs": scan_logs(*args)
            case "start_scan": start_scan(*args)
            case _: print(json.dumps({"error": "Unknown command"})); sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)
