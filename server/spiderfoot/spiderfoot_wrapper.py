import sys
import json
import os
import traceback
import time

# --- Path Setup ---
WRAPPER_DIR = os.path.abspath(os.path.dirname(__file__))
SPIDERFOOT_CORE = os.path.join(WRAPPER_DIR, "core")

# Try multiple possible module paths (including symbolic links)
possible_module_paths = [
    os.path.join(WRAPPER_DIR, "modules"),  # Direct modules directory
    "/var/www/anatscrawler/modules",       # Symbolic link location (as shown in image)
    os.path.join(os.getcwd(), "modules"),  # Current working directory modules
    "modules"                              # Relative path
]

MODULES_DIR = None
for path in possible_module_paths:
    if os.path.exists(path):
        MODULES_DIR = path
        print(f"[DEBUG] Found modules directory: {path}", file=sys.stderr)
        break

if not MODULES_DIR:
    MODULES_DIR = os.path.join(WRAPPER_DIR, "modules")  # Default fallback

# Try multiple possible database paths
possible_db_paths = [
    "/var/www/anatscrawler/spiderfoot.db",  # Root level (as shown in the image)
    "/var/www/anatscrawler/app/spiderfoot.db",  # App subdirectory
    os.path.join(WRAPPER_DIR, "spiderfoot.db"),  # Wrapper directory
    os.path.join(os.getcwd(), "spiderfoot.db"),  # Current working directory
    "spiderfoot.db"  # Relative path
]

DB_PATH = None
for path in possible_db_paths:
    if os.path.exists(path) or os.path.exists(os.path.dirname(path)):
        DB_PATH = path
        print(f"[DEBUG] Found database path: {path}", file=sys.stderr)
        break

if not DB_PATH:
    DB_PATH = "/var/www/anatscrawler/spiderfoot.db"  # Default fallback based on actual structure

# Show paths (debugging)
print("PYTHONPATH:", sys.path, file=sys.stderr)
print("MODULES_DIR:", MODULES_DIR, file=sys.stderr)
print("DB_PATH:", DB_PATH, file=sys.stderr)
print("CWD:", os.getcwd(), file=sys.stderr)

# Ensure importable paths
for path in [WRAPPER_DIR, SPIDERFOOT_CORE, MODULES_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

# --- Multiprocessing Setup ---
try:
    import multiprocessing as mp
    mp.set_start_method("spawn", force=True)
except Exception as e:
    print(f"[DEBUG] Multiprocessing setup warning: {e}", file=sys.stderr)

# --- Imports ---
try:
    from core.sfscan import SpiderFootScanner, startSpiderFootScanner
    from core.spiderfoot.db import SpiderFootDb
    from core.spiderfoot.helpers import SpiderFootHelpers
except ImportError as e:
    print(json.dumps({
        "error": "Failed to import SpiderFoot modules",
        "details": str(e),
        "paths": {
            "wrapper_dir": WRAPPER_DIR,
            "core_dir": SPIDERFOOT_CORE,
            "modules_dir": MODULES_DIR,
            "sys_path": sys.path
        }
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
        print(f"[DEBUG] Using database path: {DB_PATH}", file=sys.stderr)
        
        # Check if database directory exists
        db_dir = os.path.dirname(DB_PATH)
        if not os.path.exists(db_dir):
            print(f"[DEBUG] Creating database directory: {db_dir}", file=sys.stderr)
            try:
                os.makedirs(db_dir, exist_ok=True)
            except Exception as dir_error:
                print(f"[DEBUG] Failed to create database directory: {dir_error}", file=sys.stderr)
        
        db = SpiderFootDb({'__database': DB_PATH})
        
        # Try to create the database if it doesn't exist
        try:
            db.create()
        except Exception as create_error:
            print(f"[DEBUG] Database creation warning: {create_error}", file=sys.stderr)
        
        scans = db.scanInstanceList()
        processed_scans = []
        
        if scans:
            for scan in scans:
                # scan structure: [guid, name, seed_target, created, started, ended, status, count]
                scan_id = scan[0]
                name = scan[1]
                target = scan[2]
                created = scan[3]
                started = scan[4] if scan[4] and scan[4] != 0 else None
                ended = scan[5] if scan[5] and scan[5] != 0 else None
                status = scan[6]
                elements = scan[7] if isinstance(scan[7], int) else 0
                
                # Get correlation summary for this scan
                correlations = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
                try:
                    correlation_summary = db.scanCorrelationSummary(scan_id, by="risk")
                    if correlation_summary:
                        for corr in correlation_summary:
                            if len(corr) >= 2:
                                risk_level = corr[0].upper()
                                count = corr[1] if isinstance(corr[1], int) else 0
                                if risk_level in correlations:
                                    correlations[risk_level] = count
                except Exception as corr_error:
                    print(f"[DEBUG] Error getting correlations for scan {scan_id}: {corr_error}", file=sys.stderr)
                
                # Convert timestamps to proper format
                started_str = None
                if started:
                    try:
                        started_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(started))
                    except:
                        started_str = str(started)
                
                ended_str = None
                if ended:
                    try:
                        ended_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ended))
                    except:
                        ended_str = str(ended)
                
                processed_scan = [
                    scan_id,           # scan_id
                    name,              # name
                    target,            # target
                    started_str,       # started
                    ended_str,         # finished
                    status,            # status
                    elements,          # elements
                    correlations       # correlations
                ]
                processed_scans.append(processed_scan)
        
        print(json.dumps({"scans": processed_scans}))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_info(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        info = db.scanInstanceGet(scan_id)
        print(json.dumps(info))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_graph(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        graph = db.scanGraph(scan_id)
        print(json.dumps(graph))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def scan_browse(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        browse = db.scanResultEvent(scan_id)
        print(json.dumps(browse))
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
        correlations = db.scanCorrelationList(scan_id)
        print(json.dumps(correlations))
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

def delete_scan(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        
        # Check if scan exists
        scan_info = db.scanInstanceGet(scan_id)
        if not scan_info:
            print(json.dumps({"success": False, "error": f"Scan {scan_id} does not exist"}))
            return
        
        # Check if scan is running
        if scan_info[5] in ["RUNNING", "STARTING", "STARTED"]:
            print(json.dumps({"success": False, "error": f"Scan {scan_id} is {scan_info[5]}. You cannot delete running scans."}))
            return
        
        # Delete the scan
        db.scanInstanceDelete(scan_id)
        print(json.dumps({"success": True, "message": f"Scan {scan_id} deleted successfully"}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)

def run_scan_in_process(logging_queue, scan_name, scan_id, target, target_type, module_list, config):
    """Run a scan in a separate process - this is the target function for multiprocessing"""
    try:
        import time
        print(f"[PROCESS] Starting scan {scan_id} in separate process", file=sys.stderr)
        print(f"[PROCESS] Target: {target}, Type: {target_type}", file=sys.stderr)
        print(f"[PROCESS] Modules: {module_list}", file=sys.stderr)
        
        # Ensure the modules directory is in the Python path for this process
        if MODULES_DIR not in sys.path:
            sys.path.insert(0, MODULES_DIR)
        if WRAPPER_DIR not in sys.path:
            sys.path.insert(0, WRAPPER_DIR)
        if SPIDERFOOT_CORE not in sys.path:
            sys.path.insert(0, SPIDERFOOT_CORE)
        
        print(f"[PROCESS] Python path: {sys.path[:3]}", file=sys.stderr)
        
        # Use the startSpiderFootScanner function which is designed for multiprocessing
        scanner = startSpiderFootScanner(logging_queue, scan_name, scan_id, target, target_type, module_list, config)
        
        print(f"[PROCESS] Scanner created successfully", file=sys.stderr)
        
        # Wait for the scan to complete by polling the status
        db = SpiderFootDb({'__database': DB_PATH})
        max_wait = 300  # 5 minutes timeout
        poll_interval = 2  # seconds
        waited = 0
        
        print(f"[PROCESS] Waiting for scan {scan_id} to complete...", file=sys.stderr)
        
        while waited < max_wait:
            try:
                scan_status = db.scanInstanceGet(scan_id)
                if scan_status and len(scan_status) > 5:
                    status_str = scan_status[5]
                    print(f"[PROCESS] Scan {scan_id} status: {status_str}", file=sys.stderr)
                    
                    if status_str in ["FINISHED", "ERROR-FAILED", "ABORTED"]:
                        print(f"[PROCESS] Scan {scan_id} completed with status: {status_str}", file=sys.stderr)
                        break
                
                time.sleep(poll_interval)
                waited += poll_interval
                
            except Exception as poll_error:
                print(f"[PROCESS] Error polling scan status: {poll_error}", file=sys.stderr)
                time.sleep(poll_interval)
                waited += poll_interval
        
        if waited >= max_wait:
            print(f"[PROCESS] Scan {scan_id} timed out after {max_wait} seconds", file=sys.stderr)
            # Update scan status to ERROR-FAILED
            try:
                db.scanInstanceSet(scan_id, "", "", "ERROR-FAILED")
            except:
                pass
        
        print(f"[PROCESS] Scan {scan_id} process completed", file=sys.stderr)
        
    except Exception as e:
        print(f"[PROCESS] Error in scan {scan_id}: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        # Update scan status to ERROR-FAILED
        try:
            db = SpiderFootDb({'__database': DB_PATH})
            db.scanInstanceSet(scan_id, "", "", "ERROR-FAILED")
        except:
            pass

def start_scan(target, name):
    try:
        import time
        
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
        
        # Select default modules if none specified
        enabled_modules = []
        
        # Add some basic modules for different target types
        if target_type == "IP_ADDRESS":
            enabled_modules = ["sfp_dnsresolve", "sfp_whois", "sfp_ipinfo", "sfp_abuseipdb", "sfp_shodan"]
        elif target_type == "DOMAIN_NAME":
            enabled_modules = ["sfp_dnsresolve", "sfp_whois", "sfp_subdomain_takeover", "sfp_webserver", "sfp_ssl"]
        elif target_type == "EMAILADDR":
            enabled_modules = ["sfp_haveibeenpwned", "sfp_hunter", "sfp_emailrep", "sfp_breachdirectory"]
        else:
            # Default modules for any target type
            enabled_modules = ["sfp_dnsresolve", "sfp_whois", "sfp_ipinfo", "sfp_shodan"]
        
        # Filter to only include modules that actually exist
        available_modules = list(modules_dict.keys())
        enabled_modules = [mod for mod in enabled_modules if mod in available_modules]
        
        # If no modules were selected, use a few basic ones
        if not enabled_modules:
            basic_modules = ["sfp_dnsresolve", "sfp_whois", "sfp_ipinfo"]
            enabled_modules = [mod for mod in basic_modules if mod in available_modules]
        
        # If still no modules, use the first few available
        if not enabled_modules and available_modules:
            enabled_modules = available_modules[:5]  # Use first 5 modules
        
        print(f"[DEBUG] Selected modules: {enabled_modules}", file=sys.stderr)

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
            '_socks1type': '',  # Added to prevent KeyError in modules
            '__modules__': modules_dict
        }

        print(f"[DEBUG] Scan config prepared", file=sys.stderr)
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

        print(f"[DEBUG] Starting SpiderFootScanner in separate process...", file=sys.stderr)

        try:
            # Create a dummy logging queue (not used in our case)
            logging_queue = None
            
            # Start the scan in a separate process using our custom function
            p = mp.Process(target=run_scan_in_process, args=(logging_queue, name, scan_id, target, target_type, enabled_modules, config))
            p.daemon = True
            p.start()
            
            print(f"[DEBUG] SpiderFootScanner process started with PID: {p.pid}", file=sys.stderr)
            
        except Exception as inner:
            print("🚨 Failed to start SpiderFootScanner process", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            print(json.dumps({"success": False, "error": f"Failed to start scan process: {str(inner)}"}), file=sys.stderr, flush=True)
            return

        print(f"[Scan] Scan {scan_id} started in background process.", file=sys.stderr, flush=True)
        
        # Wait a moment for the scan to initialize
        time.sleep(2)
        
        # Check if the scan was created successfully
        db = SpiderFootDb({'__database': DB_PATH})
        scan_status = db.scanInstanceGet(scan_id)
        
        if scan_status:
            status_str = scan_status[5] if scan_status and len(scan_status) > 5 else "UNKNOWN"
            print(f"[Scan] Scan {scan_id} initialized with status: {status_str}", file=sys.stderr, flush=True)
            print(json.dumps({"success": True, "scanId": scan_id, "status": status_str, "message": "Scan started successfully"}))
        else:
            print(f"[ERROR] Scan {scan_id} failed to initialize", file=sys.stderr, flush=True)
            print(json.dumps({"success": False, "scanId": scan_id, "error": "Scan failed to initialize"}))
            
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
            case "delete_scan": delete_scan(*args)
            case "start_scan": start_scan(*args)
            case _: print(json.dumps({"error": "Unknown command"})); sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)
