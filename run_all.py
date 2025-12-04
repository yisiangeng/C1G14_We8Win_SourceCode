import subprocess
import os
import shutil

# Start backend Flask server
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
backend_script = os.path.join(backend_dir, 'run.py')

print('Starting Flask backend...')
backend_proc = subprocess.Popen(['python', backend_script], cwd=backend_dir)

# Start ML FastAPI server
ml_dir = os.path.join(os.path.dirname(__file__), 'ML')
print('Starting FastAPI ML server...')
ml_proc = subprocess.Popen(['python', '-m', 'uvicorn', 'app:app', '--reload', '--port', '8000'], cwd=ml_dir)

# Start frontend Vite dev server

# Start frontend Vite dev server in src directory
project_root = os.path.dirname(__file__)
print('Starting Vite frontend in project root...')

def find_npm():
    """Return path to npm executable (prefer npm.cmd on Windows) or None."""
    # Try common names first
    for name in ('npm', 'npm.cmd', 'npm.exe'):
        path = shutil.which(name)
        if path:
            return path

    # Fallback to common installation locations on Windows
    possible = [
        r"C:\Program Files\nodejs\npm.cmd",
        r"C:\Program Files (x86)\nodejs\npm.cmd",
    ]
    for p in possible:
        if os.path.exists(p):
            return p

    return None

npm_path = find_npm()
frontend_proc = None
if npm_path:
    print(f'Found npm at: {npm_path}')
    try:
        frontend_proc = subprocess.Popen([npm_path, 'run', 'dev'], cwd=project_root)
    except Exception as e:
        print(f'Failed to start frontend using {npm_path}: {e}')
        frontend_proc = None
else:
    print('npm not found in PATH or common locations. Skipping frontend startup.')

try:
    backend_proc.wait()
    ml_proc.wait()
    frontend_proc.wait()
except KeyboardInterrupt:
    print('Shutting down servers...')
    backend_proc.terminate()
    ml_proc.terminate()
    frontend_proc.terminate()
