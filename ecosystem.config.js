module.exports = {
  apps: [
    {
      name: 'adinfinity-backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env_file: '.env',
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 5000,
    },
  ],
};
