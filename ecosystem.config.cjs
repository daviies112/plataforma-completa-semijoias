module.exports = {
  apps: [
    {
      name: 'plataformacompleta',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/plataformacompleta',
      interpreter: 'none',
      env_file: '/var/www/plataformacompleta/.env',
      env: {
        NODE_ENV: 'production',
        PORT: '5001',
        HOST: '0.0.0.0'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      out_file: '/root/.pm2/logs/plataforma-out.log',
      error_file: '/root/.pm2/logs/plataforma-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
