#!/usr/bin/env python3.10
import sys
import json
import subprocess
import tempfile

def run_maigret(query, query_type):
    # Build maigret command
    cmd = [
        './maigret-venv/bin/python', '-m', 'maigret',
        '--json', '--timeout', '30', '--no-progress', '--top-sites', '20'
    ]
    if query_type == 'email':
        cmd += ['--email', query]
    else:
        cmd.append(query)
    # Use a temp file for output
    with tempfile.NamedTemporaryFile(suffix='.json') as tmp:
        cmd += ['--output', tmp.name]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            with open(tmp.name, 'r') as f:
                data = json.load(f)
            return {'success': True, 'results': data}
        except subprocess.CalledProcessError as e:
            return {'success': False, 'error': e.stderr.decode()}
        except Exception as e:
            return {'success': False, 'error': str(e)}

def main():
    try:
        payload = json.load(sys.stdin)
        name = payload.get('name', '').strip()
        username = payload.get('username', '').strip()
        email = payload.get('email', '').strip()
        # Prefer username, then email, then name
        if username:
            result = run_maigret(username, 'username')
        elif email:
            result = run_maigret(email, 'email')
        elif name:
            result = run_maigret(name, 'name')
        else:
            result = {'success': False, 'error': 'No query provided.'}
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == '__main__':
    main()
