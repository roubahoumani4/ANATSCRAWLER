def list_modules():
    import traceback
    try:
        # Use absolute path for spiderfoot directory
        spiderfoot_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "spiderfoot"))
        sys.path.insert(0, spiderfoot_dir)
        from spiderfoot.spiderfoot.helpers import SpiderFootHelpers
        modules_path = os.path.join(spiderfoot_dir, "modules")
        modules_dict = SpiderFootHelpers.loadModulesAsDict(modules_path)
        module_names = sorted(list(modules_dict.keys()))
        print(json.dumps({"modules": module_names}))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))


import sys
import json
import os
import traceback

# Print to stderr at the very top to confirm script starts
print("[spiderfoot_wrapper.py] STARTED", file=sys.stderr, flush=True)

# Use absolute path for SpiderFoot DB
DB_PATH = os.path.expanduser('~/.spiderfoot/spiderfoot.db')

# Add SpiderFoot to the Python path (assumes code is in server/spiderfoot)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "spiderfoot")))

# Import SpiderFoot modules (adjust as needed for your version)
try:
    from spiderfoot.spiderfoot.db import SpiderFootDb
except ImportError:
    print(json.dumps({"error": "Could not import SpiderFoot modules. Make sure the code is in server/spiderfoot."}), flush=True)
    print(traceback.format_exc(), file=sys.stderr, flush=True)
    sys.stderr.flush()
    sys.exit(1)

def scan_info(scan_id):
    import traceback
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        scan = db.scanInstanceGet(scan_id)
        print(json.dumps(scan))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_graph(scan_id):
    import traceback
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        # For graph, return all event relationships (parent/child links)
        # Get all results for the scan
        results = db.scanResultEvent(scan_id)
        # Optionally, you could use scanElementSourcesDirect/scanElementChildrenDirect for more structure
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

def scan_browse(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    try:
        # For browse, return all unique elements (entities)
        unique = db.scanResultEventUnique(scan_id)
        print(json.dumps(unique))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def list_scans():
    try:
        db = SpiderFootDb({'__database': DB_PATH})
        # Returns a list of all scan instances
        scans = db.scanInstanceList()
        print(json.dumps(scans), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        sys.stderr.flush()
        sys.exit(1)
def scan_result_summary(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    summary = db.scanResultSummary(scan_id)
    print(json.dumps(summary))

def scan_correlation_summary(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    summary = db.scanCorrelationSummary(scan_id)
    print(json.dumps(summary))

def scan_correlation_list(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    clist = db.scanCorrelationList(scan_id)
    print(json.dumps(clist))

def scan_result_event(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    events = db.scanResultEvent(scan_id)
    print(json.dumps(events))

def scan_logs(scan_id):
    db = SpiderFootDb({'__database': DB_PATH})
    logs = db.scanLogs(scan_id)
    print(json.dumps(logs))

def start_scan(target, name):
    import traceback
    try:
        # This only creates a scan instance, does NOT start a scan engine!
        db = SpiderFootDb({'__database': DB_PATH})
        db.scanInstanceCreate(name, name, target)
        # TODO: Actually start a scan using sfscan.py or SpiderFootScanner
        print(json.dumps({"success": False, "error": "Scan engine not started. Only DB entry created. Implement scan execution via sfscan.py or SpiderFootScanner."}))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No command provided"}), flush=True)
            sys.exit(1)
        cmd = sys.argv[1]
        if cmd == "list_modules":
            list_modules()
            sys.exit(0)
        if cmd == "list_scans":
            list_scans()
        elif cmd == "scan_info":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_info(scan_id)
        elif cmd == "scan_graph":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_graph(scan_id)
        elif cmd == "scan_browse":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_browse(scan_id)
        elif cmd == "scan_result_summary":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_result_summary(scan_id)
        elif cmd == "scan_correlation_summary":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_correlation_summary(scan_id)
        elif cmd == "scan_correlation_list":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_correlation_list(scan_id)
        elif cmd == "scan_result_event":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_result_event(scan_id)
        elif cmd == "scan_logs":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No scan_id provided"}), flush=True)
                sys.exit(1)
            scan_id = sys.argv[2]
            scan_logs(scan_id)
        elif cmd == "start_scan":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "No target or name provided"}), flush=True)
                sys.exit(1)
            target = sys.argv[2]
            name = sys.argv[3]
            start_scan(target, name)
        else:
            print(json.dumps({"error": "Unknown command"}), flush=True)
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr, flush=True)
        sys.stderr.flush()
        sys.exit(1)
