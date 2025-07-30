def list_modules():
    try:
        from spiderfoot import SpiderFootHelpers
        # Use loadModulesAsDict to get all modules from the modules directory
        modules_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "spiderfoot", "modules"))
        modules_dict = SpiderFootHelpers.loadModulesAsDict(modules_path)
        module_names = sorted(list(modules_dict.keys()))
        print(json.dumps({"modules": module_names}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
import sys
import json
import os

# Add SpiderFoot to the Python path (assumes code is in server/spiderfoot)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "spiderfoot")))

# Import SpiderFoot modules (adjust as needed for your version)
try:
    from spiderfoot import SpiderFootDb
except ImportError:
    print(json.dumps({"error": "Could not import SpiderFoot modules. Make sure the code is in server/spiderfoot."}))
    sys.exit(1)

def scan_info(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    try:
        scan = db.scanInstanceGet(scan_id)
        print(json.dumps(scan))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_graph(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    try:
        # For graph, return all event relationships (parent/child links)
        # Get all results for the scan
        results = db.scanResultEvent(scan_id)
        # Optionally, you could use scanElementSourcesDirect/scanElementChildrenDirect for more structure
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def scan_browse(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    try:
        # For browse, return all unique elements (entities)
        unique = db.scanResultEventUnique(scan_id)
        print(json.dumps(unique))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def list_scans():
    db = SpiderFootDb('spiderfoot.db')
    try:
        # Returns a list of all scan instances
        scans = db.scanInstanceList()
        print(json.dumps(scans))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
def scan_result_summary(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    summary = db.scanResultSummary(scan_id)
    print(json.dumps(summary))

def scan_correlation_summary(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    summary = db.scanCorrelationSummary(scan_id)
    print(json.dumps(summary))

def scan_correlation_list(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    clist = db.scanCorrelationList(scan_id)
    print(json.dumps(clist))

def scan_result_event(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    events = db.scanResultEvent(scan_id)
    print(json.dumps(events))

def scan_logs(scan_id):
    db = SpiderFootDb('spiderfoot.db')
    logs = db.scanLogs(scan_id)
    print(json.dumps(logs))

def start_scan(target, name):
    db = SpiderFootDb('spiderfoot.db')
    # This is a placeholder. Actual scan start logic may require more integration.
    # You may need to use sfscan.py or similar for real scan execution.
    db.scanInstanceCreate(name, name, target)
    print(json.dumps({"success": True}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "list_modules":
        list_modules()
        sys.exit(0)
    if cmd == "list_scans":
        list_scans()
    elif cmd == "scan_info":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_info(scan_id)
    elif cmd == "scan_graph":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_graph(scan_id)
    elif cmd == "scan_browse":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_browse(scan_id)
    elif cmd == "scan_result_summary":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_result_summary(scan_id)
    elif cmd == "scan_correlation_summary":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_correlation_summary(scan_id)
    elif cmd == "scan_correlation_list":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_correlation_list(scan_id)
    elif cmd == "scan_result_event":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_result_event(scan_id)
    elif cmd == "scan_logs":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No scan_id provided"}))
            sys.exit(1)
        scan_id = sys.argv[2]
        scan_logs(scan_id)
    elif cmd == "start_scan":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "No target or name provided"}))
            sys.exit(1)
        target = sys.argv[2]
        name = sys.argv[3]
        start_scan(target, name)
    else:
        print(json.dumps({"error": "Unknown command"}))
        sys.exit(1)
