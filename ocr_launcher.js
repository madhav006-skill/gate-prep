/**
 * PM2-compatible wrapper to launch the Python uvicorn OCR server.
 * PM2 can manage Node.js scripts natively, so this spawns uvicorn as a child process
 * and forwards its stdout/stderr so PM2 can log everything.
 */
const { spawn } = require('child_process');
const path = require('path');

const VENV_PYTHON = path.join(__dirname, 'backend-pdf', 'venv', 'Scripts', 'python.exe');
const OCR_DIR    = path.join(__dirname, 'backend-pdf');

const child = spawn(
  VENV_PYTHON,
  ['-m', 'uvicorn', 'main:app', '--port', '8000', '--host', '127.0.0.1'],
  {
    cwd: OCR_DIR,
    stdio: 'inherit',   // pipe all output to PM2's stdout/stderr
    shell: false
  }
);

child.on('close', (code) => {
  console.log(`[OCR] uvicorn exited with code ${code}`);
  process.exit(code ?? 1);   // trigger PM2 autorestart
});

child.on('error', (err) => {
  console.error('[OCR] Failed to start uvicorn:', err.message);
  process.exit(1);
});

// Forward signals so PM2 stop/restart work cleanly
process.on('SIGINT',  () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
