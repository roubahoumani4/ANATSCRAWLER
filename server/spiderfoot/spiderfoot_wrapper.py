import sys
import json
import os
import traceback

# --- Path Setup ---
WRAPPER_DIR = os.path.abspath(os.path.dirname(__file__))
SPIDERFOOT_CORE = os.path.join(WRAPPER_DIR, "core")
MODULES_DIR = os.path.join(WRAPPER_DIR, "modules")
DB_PATH = "/var/www/anatscrawler/app/spiderfoot.db"

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
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def list_scans():
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        scans = db.scanInstanceList()
        print(json.dumps({"scans": scans}))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_info(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        scan = db.scanInstanceGet(scan_id)
        print(json.dumps(scan))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_graph(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        results = db.scanResultEvent(scan_id)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_browse(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        unique = db.scanResultEventUnique(scan_id)
        print(json.dumps(unique))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_result_summary(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        summary = db.scanResultSummary(scan_id)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_correlation_summary(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        summary = db.scanCorrelationSummary(scan_id)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_correlation_list(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        clist = db.scanCorrelationList(scan_id)
        print(json.dumps(clist))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_result_event(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        events = db.scanResultEvent(scan_id)
        print(json.dumps(events))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_logs(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        logs = db.scanLogs(scan_id)
        print(json.dumps(logs))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def start_scan(target, name):
    try:
        target_type = SpiderFootHelpers.targetTypeFromString(target)
        if not target_type:
            print(json.dumps({"success": False, "error": f"Could not determine target type for: {target}"}))
            return

        print(f"[DEBUG] Attempting to load modules from: {MODULES_DIR}", file=sys.stderr)
        modules_dict = SpiderFootHelpers.loadModulesAsDict(MODULES_DIR)
        print(f"[DEBUG] Modules loaded: {list(modules_dict.keys()) if modules_dict else 'None'}", file=sys.stderr)
        if not modules_dict:
            print(f"[ERROR] Failed to load any modules.", file=sys.stderr)
            print(json.dumps({"success": False, "error": "Failed to load any modules."}), file=sys.stderr, flush=True)
            return
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
            '_internettlds': 'generic, country, sponsored, infrastructure',
            '__modules__': {mod: {'opts': {}} for mod in enabled_modules}
        }

        print(f"[DEBUG] Scan config: {json.dumps(config)}", file=sys.stderr)
        print(f"[DEBUG] Enabled modules: {enabled_modules}", file=sys.stderr)

        sfdb = SpiderFootDb({'__database': DB_PATH})
        sfdb.create()

        print(f"[DEBUG] Database initialized at: {DB_PATH}", file=sys.stderr)

        scan_id = SpiderFootHelpers.genScanInstanceId()

        print(f"[DEBUG] Generated scan ID: {scan_id}", file=sys.stderr)

        # ✅ Register the scan in the DB manually
        sfdb.scanInstanceCreate(scan_id, name, target)

        print(f"[DEBUG] Scan registered in DB: name={name}, target={target}", file=sys.stderr)

        print(f"▶️ Starting scan...", file=sys.stderr)
        print(f"Target: {target}", file=sys.stderr)
        print(f"Target Type: {target_type}", file=sys.stderr)
        print(f"Scan ID: {scan_id}", file=sys.stderr)
        print(f"Enabled Modules: {enabled_modules}", file=sys.stderr)

        print(f"[DEBUG] Initializing SpiderFootScanner...", file=sys.stderr)

        try:
            scanner = SpiderFootScanner(
                scanName=name,
                scanId=scan_id,
                targetValue=target,
                targetType=target_type,
                moduleList=enabled_modules,
                globalOpts=config,
                start=True
            )
            print(f"[DEBUG] SpiderFootScanner initialized successfully.", file=sys.stderr)
        except Exception as inner:
            print("🚨 Failed to initialize SpiderFootScanner", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return

        print(f"[Scan] Scan {scan_id} started.", file=sys.stderr, flush=True)
        # Poll for scan status and event count
        import time
        db = SpiderFootDb({'__database': DB_PATH})
        max_wait = 120  # seconds
        poll_interval = 2  # seconds
        waited = 0
        last_event_count = -1
        while waited < max_wait:
            try:
                scan_status = db.scanInstanceGet(scan_id)
                status_str = scan_status[5] if scan_status and len(scan_status) > 5 else "UNKNOWN"
                events = db.scanResultEvent(scan_id)
                event_count = len(events) if events else 0
                if event_count != last_event_count:
                    print(f"[Scan] Progress: status={status_str}, events={event_count}", file=sys.stderr, flush=True)
                    last_event_count = event_count
                if status_str in ["FINISHED", "ERROR-FAILED", "ABORTED"]:
                    print(f"[Scan] Scan {scan_id} completed with status: {status_str}. Total events: {event_count}", file=sys.stderr, flush=True)
                    print(json.dumps({"success": status_str=="FINISHED", "scanId": scanner.scanId, "eventCount": event_count, "status": status_str}))
                    break
                time.sleep(poll_interval)
                waited += poll_interval
            except Exception as scanerr:
                print(f"[Scan] Polling error: {scanerr}", file=sys.stderr, flush=True)
                print(traceback.format_exc(), file=sys.stderr, flush=True)
                break
        else:
            print(f"[Scan] Scan {scan_id} timed out after {max_wait} seconds.", file=sys.stderr, flush=True)
            print(json.dumps({"success": False, "scanId": scanner.scanId, "eventCount": last_event_count, "status": "TIMEOUT"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

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
