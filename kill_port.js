const { execSync } = require('child_process');
try {
  const result = execSync('netstat -ano | findstr :5000').toString();
  console.log('netstat result:', result.trim());
  const lines = result.trim().split('\n');
  const pids = new Set();
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) pids.add(parts[4]);
  });
  pids.forEach(pid => {
    if (pid && !isNaN(pid) && pid !== '0') {
      try {
        execSync('taskkill /F /PID ' + pid);
        console.log('Killed PID:', pid);
      } catch(e) {
        console.log('Kill error for PID', pid, ':', e.message.substring(0, 100));
      }
    }
  });
} catch(e) {
  console.log('No process on port 5000 or error:', e.message.substring(0, 100));
}
