#!/usr/bin/env node
import { exec } from 'child_process';
import { platform } from 'os';

const port = process.argv[2] || 5173;

function killPort() {
  const isWindows = platform() === 'win32';
  
  if (isWindows) {
    // Windows: usar netstat e taskkill
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== 'PID') {
            exec(`taskkill /PID ${pid} /F`, (err) => {
              if (!err) console.log(`✓ Processo na porta ${port} encerrado (PID: ${pid})`);
            });
          }
        }
      }
    });
  } else {
    // Linux/Mac: usar lsof
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, (error) => {
      if (!error) console.log(`✓ Processo na porta ${port} encerrado`);
    });
  }
}

killPort();
