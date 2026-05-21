module.exports = {
  apps: [
    // ─── Node.js Backend ───────────────────────────────────────────────────
    {
      name: 'gate-backend',
      cwd: 'F:/gate-prep/backend',
      script: 'src/server.js',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: 'F:/gate-prep/logs/backend-err.log',
      out_file:   'F:/gate-prep/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },

    // ─── Python OCR Microservice (launched via Node.js wrapper) ──────────────
    {
      name: 'gate-python-ocr',
      script: 'F:/gate-prep/ocr_launcher.js',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      error_file: 'F:/gate-prep/logs/ocr-err.log',
      out_file:   'F:/gate-prep/logs/ocr-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
