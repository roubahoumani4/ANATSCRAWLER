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
    "/var/www/anatscrawler/app/modules",   # App modules directory
    "/var/www/anatscrawler/app/server/spiderfoot/modules",  # Server spiderfoot modules
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
    # Use 'fork' on Linux for better compatibility with logging
    if hasattr(mp, 'set_start_method'):
        try:
            mp.set_start_method("fork", force=True)
            print(f"[DEBUG] Set multiprocessing start method to 'fork'", file=sys.stderr)
        except RuntimeError:
            # If fork is not available, use spawn
            mp.set_start_method("spawn", force=True)
            print(f"[DEBUG] Set multiprocessing start method to 'spawn'", file=sys.stderr)
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

def scan_result_summary(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        summary = db.scanResultSummary(scan_id)
        if not summary:
            summary = []
        
        # Ensure we return a proper array structure
        if isinstance(summary, list):
            # Convert to the expected format for frontend
            formatted_summary = []
            for row in summary:
                if isinstance(row, (list, tuple)) and len(row) >= 4:
                    formatted_summary.append([
                        row[0],  # type/name
                        row[1] if len(row) > 1 else "",  # description
                        row[2] if len(row) > 2 else "",  # last seen
                        row[3] if len(row) > 3 else 0,   # total
                        row[4] if len(row) > 4 else 0    # unique total
                    ])
                else:
                    formatted_summary.append(row)
            print(json.dumps(formatted_summary))
        else:
            print(json.dumps([]))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        print(json.dumps([]))

def scan_correlation_summary(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        # Use "risk" as the default parameter to get the expected format for frontend
        summary = db.scanCorrelationSummary(scan_id, by="risk")
        if not summary:
            summary = []
        
        # Convert to the expected format for frontend
        if isinstance(summary, list):
            formatted_summary = []
            for row in summary:
                if isinstance(row, (list, tuple)) and len(row) >= 2:
                    formatted_summary.append([
                        row[0],  # risk level (HIGH, MEDIUM, LOW, INFO)
                        row[1] if len(row) > 1 else 0,   # count
                        row[0] if len(row) > 0 else "",  # risk level again for consistency
                        ""  # additional info
                    ])
                else:
                    formatted_summary.append(row)
            print(json.dumps(formatted_summary))
        else:
            print(json.dumps([]))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        print(json.dumps([]))

def scan_correlation_list(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        correlations = db.scanCorrelationList(scan_id)
        if not correlations:
            correlations = []
        
        # Convert to the expected format for frontend
        if isinstance(correlations, list):
            formatted_correlations = []
            for row in correlations:
                if isinstance(row, (list, tuple)) and len(row) >= 4:
                    formatted_correlations.append([
                        row[0],  # correlation id
                        row[1] if len(row) > 1 else "",  # title
                        row[2] if len(row) > 2 else "",  # risk
                        row[3] if len(row) > 3 else "",  # description
                        row[4] if len(row) > 4 else "",  # rule name
                        row[5] if len(row) > 5 else "",  # rule description
                        row[6] if len(row) > 6 else "",  # rule logic
                        row[7] if len(row) > 7 else 0    # count
                    ])
                else:
                    formatted_correlations.append(row)
            print(json.dumps(formatted_correlations))
        else:
            print(json.dumps([]))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        print(json.dumps([]))

def scan_result_event(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        events = db.scanResultEvent(scan_id)
        if not events:
            events = []
        
        # Convert to the expected format for frontend
        if isinstance(events, list):
            formatted_events = []
            for row in events:
                if isinstance(row, (list, tuple)) and len(row) >= 4:
                    formatted_events.append([
                        row[0],  # generated timestamp
                        row[1] if len(row) > 1 else "",  # data
                        row[2] if len(row) > 2 else "",  # source data
                        row[3] if len(row) > 3 else "",  # module
                        row[4] if len(row) > 4 else "",  # type
                        row[5] if len(row) > 5 else 100, # confidence
                        row[6] if len(row) > 6 else 100, # visibility
                        row[7] if len(row) > 7 else 0,   # risk
                        row[8] if len(row) > 8 else "",  # hash
                        row[9] if len(row) > 9 else "",  # source event hash
                        row[10] if len(row) > 10 else "", # event description
                        row[11] if len(row) > 11 else "", # event type
                        row[12] if len(row) > 12 else "", # scan instance id
                        row[13] if len(row) > 13 else 0,  # false positive
                        row[14] if len(row) > 14 else 0   # parent false positive
                    ])
                else:
                    formatted_events.append(row)
            print(json.dumps(formatted_events))
        else:
            print(json.dumps([]))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        print(json.dumps([]))

def scan_browse(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        browse = db.scanResultEvent(scan_id)
        if not browse:
            browse = []
        
        # Convert to the expected format for frontend (unique entities)
        if isinstance(browse, list):
            # Get unique entities for browse view
            unique_entities = {}
            for row in browse:
                if isinstance(row, (list, tuple)) and len(row) >= 2:
                    data = row[1] if len(row) > 1 else ""
                    event_type = row[4] if len(row) > 4 else ""
                    if data and event_type:
                        key = f"{event_type}:{data}"
                        if key not in unique_entities:
                            unique_entities[key] = {
                                "type": event_type,
                                "value": data,
                                "count": 1,
                                "last_seen": row[0] if len(row) > 0 else "",
                                "module": row[3] if len(row) > 3 else ""
                            }
                        else:
                            unique_entities[key]["count"] += 1
            
            # Convert to list format
            formatted_browse = []
            for entity in unique_entities.values():
                formatted_browse.append([
                    entity["value"],
                    entity["type"],
                    entity["last_seen"],
                    entity["module"],
                    entity["count"]
                ])
            
            print(json.dumps(formatted_browse))
        else:
            print(json.dumps([]))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        print(json.dumps([]))

def scan_logs(scan_id):
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        logs = db.scanLogs(scan_id)
        if not logs:
            logs = []
        print(json.dumps(logs))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        print(json.dumps([]))

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
        import multiprocessing as mp
        import logging
        
        # Configure logging for this process to avoid queue issues
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stderr),
                logging.FileHandler(f'/tmp/spiderfoot_scan_{scan_id}.log')
            ]
        )
        
        print(f"[PROCESS] Starting scan {scan_id} in separate process", file=sys.stderr)
        print(f"[PROCESS] Target: {target}, Type: {target_type}", file=sys.stderr)
        print(f"[PROCESS] Modules: {module_list}", file=sys.stderr)
        
        # Check if logging_queue is valid
        if logging_queue is None:
            print(f"[PROCESS] Warning: logging_queue is None, will use console logging", file=sys.stderr)
        elif not hasattr(logging_queue, 'put'):
            print(f"[PROCESS] Warning: logging_queue is not a valid queue object, will use console logging", file=sys.stderr)
            logging_queue = None
        else:
            print(f"[PROCESS] Logging queue is valid and ready to use", file=sys.stderr)
            # Test the queue in the child process
            try:
                logging_queue.put("child_process_test")
                print(f"[PROCESS] Queue test in child process successful", file=sys.stderr)
            except Exception as child_queue_error:
                print(f"[PROCESS] Queue test in child process failed: {child_queue_error}, will use console logging", file=sys.stderr)
                logging_queue = None
        
        # Ensure the modules directory is in the Python path for this process
        if MODULES_DIR not in sys.path:
            sys.path.insert(0, MODULES_DIR)
        if WRAPPER_DIR not in sys.path:
            sys.path.insert(0, WRAPPER_DIR)
        if SPIDERFOOT_CORE not in sys.path:
            sys.path.insert(0, SPIDERFOOT_CORE)
        
        print(f"[PROCESS] Python path: {sys.path[:3]}", file=sys.stderr)
        
        # Re-import modules in this process context
        try:
            from core.sfscan import SpiderFootScanner, startSpiderFootScanner
            from core.spiderfoot.db import SpiderFootDb
            from core.spiderfoot.helpers import SpiderFootHelpers
        except ImportError as import_error:
            print(f"[PROCESS] Failed to import SpiderFoot modules: {import_error}", file=sys.stderr)
            raise
        
        # Load modules in this process context
        print(f"[PROCESS] Loading modules from: {MODULES_DIR}", file=sys.stderr)
        modules_dict = SpiderFootHelpers.loadModulesAsDict(MODULES_DIR)
        print(f"[PROCESS] Loaded {len(modules_dict)} modules", file=sys.stderr)
        
        # Debug: Check if specific modules are loaded
        if modules_dict:
            print(f"[PROCESS] Sample modules loaded: {list(modules_dict.keys())[:5]}", file=sys.stderr)
            # Check if key modules are present
            key_modules = ["sfp_dnsresolve", "sfp_whois", "sfp__stor_db"]
            for key_mod in key_modules:
                if key_mod in modules_dict:
                    print(f"[PROCESS] ✓ {key_mod} module found", file=sys.stderr)
                else:
                    print(f"[PROCESS] ✗ {key_mod} module NOT found", file=sys.stderr)
        else:
            print(f"[PROCESS] ERROR: No modules loaded!", file=sys.stderr)
        
        # Update config with loaded modules
        config['__modules__'] = modules_dict
        
        # Ensure all modules have the required 'opts' key
        for mod_name in modules_dict:
            if 'opts' not in modules_dict[mod_name] or not isinstance(modules_dict[mod_name]['opts'], dict):
                modules_dict[mod_name]['opts'] = {}
        
        print(f"[PROCESS] Modules prepared with opts", file=sys.stderr)
        
        # Initialize database connection
        db = SpiderFootDb({'__database': DB_PATH})
        
        # ✅ CRITICAL: Ensure database schema is created
        try:
            db.create()
            print(f"[PROCESS] Database schema created successfully", file=sys.stderr)
        except Exception as e:
            print(f"[PROCESS] Database schema creation failed: {e}", file=sys.stderr)
            # Continue anyway as the schema might already exist
        
        # Update scan status to STARTING
        try:
            db.scanInstanceSet(scan_id, "", "", "STARTING")
        except Exception as e:
            print(f"[PROCESS] Failed to update scan status to STARTING: {e}", file=sys.stderr)
        
        # ✅ CRITICAL: Add more debugging for module execution
        print(f"[PROCESS] About to create scanner with target={target}, target_type={target_type}", file=sys.stderr)
        print(f"[PROCESS] Module list: {module_list}", file=sys.stderr)
        print(f"[PROCESS] Config keys: {list(config.keys())}", file=sys.stderr)
        
        # Use the startSpiderFootScanner function which is designed for multiprocessing
        try:
            print(f"[PROCESS] About to call startSpiderFootScanner with args:", file=sys.stderr)
            print(f"[PROCESS] - scan_name: {scan_name}", file=sys.stderr)
            print(f"[PROCESS] - scan_id: {scan_id}", file=sys.stderr)
            print(f"[PROCESS] - target: {target}", file=sys.stderr)
            print(f"[PROCESS] - target_type: {target_type}", file=sys.stderr)
            print(f"[PROCESS] - module_list: {module_list}", file=sys.stderr)
            print(f"[PROCESS] - config keys: {list(config.keys())}", file=sys.stderr)
            print(f"[PROCESS] - logging_queue type: {type(logging_queue)}", file=sys.stderr)
            
            try:
                scanner = startSpiderFootScanner(logging_queue, scan_name, scan_id, target, target_type, module_list, config)
                print(f"[PROCESS] Scanner created successfully", file=sys.stderr)
            except Exception as scanner_error:
                print(f"[PROCESS] Failed to create scanner with queue: {scanner_error}", file=sys.stderr)
                print(f"[PROCESS] Retrying without queue...", file=sys.stderr)
                # Retry without the queue
                scanner = startSpiderFootScanner(None, scan_name, scan_id, target, target_type, module_list, config)
                print(f"[PROCESS] Scanner created successfully (without queue)", file=sys.stderr)
            
            # Check if scanner was created properly
            if not scanner:
                print(f"[PROCESS] Scanner creation failed - scanner is None", file=sys.stderr)
                db.scanInstanceSet(scan_id, "", "", "ERROR-FAILED")
                return
            
            # ✅ CRITICAL: Check if modules were actually loaded in the scanner
            if hasattr(scanner, '_SpiderFootScanner__moduleInstances'):
                module_instances = scanner._SpiderFootScanner__moduleInstances
                print(f"[PROCESS] Scanner loaded {len(module_instances)} module instances: {list(module_instances.keys())}", file=sys.stderr)
                
                # Check each module's status
                for mod_name, mod_instance in module_instances.items():
                    print(f"[PROCESS] Module {mod_name}: errorState={getattr(mod_instance, 'errorState', 'N/A')}, _stopScanning={getattr(mod_instance, '_stopScanning', 'N/A')}", file=sys.stderr)
            else:
                print(f"[PROCESS] Scanner doesn't have module instances attribute", file=sys.stderr)
            
            # Check scanner status
            if hasattr(scanner, 'status'):
                print(f"[PROCESS] Scanner status: {scanner.status}", file=sys.stderr)
            
            # Check if scan is actually running
            if hasattr(scanner, '_SpiderFootScanner__status'):
                print(f"[PROCESS] Scanner internal status: {scanner._SpiderFootScanner__status}", file=sys.stderr)
            
            # Check if modules were loaded in the scanner
            if hasattr(scanner, '_SpiderFootScanner__moduleInstances'):
                module_instances = scanner._SpiderFootScanner__moduleInstances
                print(f"[PROCESS] Scanner loaded {len(module_instances)} module instances: {list(module_instances.keys())}", file=sys.stderr)
                
                # Check each module's status
                for mod_name, mod_instance in module_instances.items():
                    print(f"[PROCESS] Module {mod_name}: errorState={getattr(mod_instance, 'errorState', 'N/A')}, _stopScanning={getattr(mod_instance, '_stopScanning', 'N/A')}", file=sys.stderr)
            else:
                print(f"[PROCESS] Scanner doesn't have module instances attribute", file=sys.stderr)
            
            # Check if scan is actually running by checking the database status
            try:
                current_status = db.scanInstanceGet(scan_id)
                if current_status and len(current_status) > 5:
                    print(f"[PROCESS] Current scan status in DB: {current_status[5]}", file=sys.stderr)
                else:
                    print(f"[PROCESS] No scan status found in DB", file=sys.stderr)
            except Exception as db_error:
                print(f"[PROCESS] Error checking scan status in DB: {db_error}", file=sys.stderr)
            
            # Wait for the scan to complete by polling the status
            max_wait = 600  # 10 minutes timeout
            poll_interval = 5  # seconds
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
                        elif status_str in ["RUNNING", "STARTING", "STARTED"]:
                            # Check if any results have been generated
                            try:
                                results = db.scanResultEvent(scan_id)
                                if results and len(results) > 0:
                                    print(f"[PROCESS] Scan {scan_id} has generated {len(results)} results", file=sys.stderr)
                            except Exception as result_error:
                                print(f"[PROCESS] Error checking results: {result_error}", file=sys.stderr)
                    
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
            
            # Final status check and result verification
            try:
                final_status = db.scanInstanceGet(scan_id)
                if final_status and len(final_status) > 5:
                    final_status_str = final_status[5]
                    print(f"[PROCESS] Scan {scan_id} final status: {final_status_str}", file=sys.stderr)
                    
                    # Check if results were generated
                    if final_status_str == "FINISHED":
                        results = db.scanResultEvent(scan_id)
                        print(f"[PROCESS] Scan {scan_id} completed with {len(results) if results else 0} results", file=sys.stderr)
                    elif final_status_str == "RUNNING":
                        # Force the scan to finish if it's still running
                        print(f"[PROCESS] Scan {scan_id} is still running, forcing completion", file=sys.stderr)
                        db.scanInstanceSet(scan_id, "", "", "FINISHED")
            except Exception as final_check_error:
                print(f"[PROCESS] Error in final status check: {final_check_error}", file=sys.stderr)
            
        except Exception as scanner_error:
            print(f"[PROCESS] Failed to create scanner: {scanner_error}", file=sys.stderr)
            print(f"[PROCESS] Traceback: {traceback.format_exc()}", file=sys.stderr)
            db.scanInstanceSet(scan_id, "", "", "ERROR-FAILED")
            return
        
        print(f"[PROCESS] Scan {scan_id} process completed", file=sys.stderr)
        
    except Exception as e:
        print(f"[PROCESS] Error in scan {scan_id}: {e}", file=sys.stderr)
        print(f"[PROCESS] Traceback: {traceback.format_exc()}", file=sys.stderr)
        
        # Update scan status to ERROR-FAILED
        try:
            db = SpiderFootDb({'__database': DB_PATH})
            db.scanInstanceSet(scan_id, "", "", "ERROR-FAILED")
        except Exception as db_error:
            print(f"[PROCESS] Failed to update scan status: {db_error}", file=sys.stderr)

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
        
        # ✅ NEW: Select ALL available modules except those requiring API keys
        enabled_modules = []
        available_modules = list(modules_dict.keys())
        
        # Filter out modules that require API keys
        for module_name in available_modules:
            module_info = modules_dict.get(module_name, {})
            # Check both flags and meta.flags fields
            module_flags = module_info.get('flags', [])
            meta_flags = module_info.get('meta', {}).get('flags', [])
            all_flags = module_flags + meta_flags
            
            # Skip modules that require API keys
            if 'apikey' in all_flags:
                print(f"[DEBUG] Skipping module {module_name} - requires API key", file=sys.stderr)
                continue
            
            # Include all other modules
            enabled_modules.append(module_name)
            print(f"[DEBUG] Added module: {module_name}", file=sys.stderr)
        
        # ✅ CRITICAL: Always add the database storage module if not already included
        if "sfp__stor_db" in available_modules and "sfp__stor_db" not in enabled_modules:
            enabled_modules.append("sfp__stor_db")
            print(f"[DEBUG] Added database storage module: sfp__stor_db", file=sys.stderr)
        
        # If no modules were selected (all require API keys), use a few basic ones
        if not enabled_modules:
            basic_modules = ["sfp_dnsresolve", "sfp_whois", "sfp__stor_db"]
            enabled_modules = [mod for mod in basic_modules if mod in available_modules]
            print(f"[DEBUG] No non-API modules found, using basic modules: {enabled_modules}", file=sys.stderr)
        
        print(f"[DEBUG] Selected modules ({len(enabled_modules)} total): {enabled_modules}", file=sys.stderr)

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
            '__modules__': modules_dict,
            # ✅ CRITICAL: Ensure storage module is properly configured
            'sfp__stor_db': {
                '_store': True,
                'maxstorage': 0  # Unlimited storage
            }
        }
        
        # ✅ CRITICAL: Ensure storage module is properly configured
        if "sfp__stor_db" in enabled_modules:
            # Add storage module configuration to ensure it works properly
            if "sfp__stor_db" not in config:
                config["sfp__stor_db"] = {}
            config["sfp__stor_db"]["_store"] = True
            config["sfp__stor_db"]["maxstorage"] = 0  # Unlimited storage
            # Ensure the database connection is properly configured
            config["sfp__stor_db"]["__database"] = DB_PATH
            print(f"[DEBUG] Configured storage module settings", file=sys.stderr)

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
        print(f"Enabled Modules ({len(enabled_modules)}): {enabled_modules}", file=sys.stderr)

        print(f"[DEBUG] Starting SpiderFootScanner in separate process...", file=sys.stderr)

        try:
            # Create a proper multiprocessing queue for logging
            logging_queue = None
            try:
                # Try to create the queue with error handling
                logging_queue = mp.Queue()
                print(f"[DEBUG] Created multiprocessing queue successfully", file=sys.stderr)
                
                # Test if the queue is working
                try:
                    logging_queue.put("test_message")
                    print(f"[DEBUG] Queue test successful", file=sys.stderr)
                except Exception as test_error:
                    print(f"[DEBUG] Queue test failed: {test_error}, will use None", file=sys.stderr)
                    logging_queue = None
                    
            except Exception as queue_error:
                print(f"[DEBUG] Failed to create multiprocessing queue: {queue_error}, will use None", file=sys.stderr)
                logging_queue = None
            
            # Start the scan in a separate process using our custom function
            print(f"[DEBUG] About to start process with logging_queue: {type(logging_queue)}", file=sys.stderr)
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
