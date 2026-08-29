import { spawn, exec } from 'child_process';

const commands = [
  { name: 'Convex', command: 'npx', args: ['convex', 'dev'], color: '\x1b[36m' },  // Cyan
  { name: 'Backend', command: 'npx', args: ['tsx', 'server/index.ts'], color: '\x1b[32m' }, // Green
  { name: 'Vite', command: 'npm', args: ['run', 'dev'], color: '\x1b[35m' }      // Magenta
];

console.log('\x1b[1m\x1b[34m[System] Starting Convex, Express Backend, and Vite Frontend concurrently...\x1b[0m\n');

const children = [];

function killAll() {
  console.log('\n\x1b[1m\x1b[31m[System] Stopping all processes...\x1b[0m');
  
  const promises = children.map(child => {
    return new Promise((resolve) => {
      if (!child || child.killed) {
        resolve();
        return;
      }
      
      if (process.platform === 'win32') {
        // On Windows, child.kill() only kills the shell process (cmd.exe)
        // taskkill /t /f kills the process tree (shell + actual server)
        exec(`taskkill /pid ${child.pid} /t /f`, () => {
          resolve();
        });
      } else {
        child.kill('SIGINT');
        resolve();
      }
    });
  });

  Promise.all(promises).then(() => {
    process.exit();
  });
}

// Handle cleanup events
process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);
process.on('exit', killAll);

commands.forEach(cfg => {
  const isWindows = process.platform === 'win32';
  
  const child = spawn(cfg.command, cfg.args, {
    shell: isWindows,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: 'true' } // Keep color support in child processes
  });

  children.push(child);

  const prefix = `${cfg.color}[${cfg.name}]\x1b[0m`;

  // Helper to handle and format streaming outputs
  const handleData = (stream, isError = false) => {
    let buffer = '';
    stream.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      // Keep the last partial line in buffer
      buffer = lines.pop() || '';
      
      lines.forEach(line => {
        const cleaned = line.replace(/\r/g, ''); // Clean Windows line endings
        if (isError) {
          console.error(`${prefix} \x1b[31m${cleaned}\x1b[0m`);
        } else {
          console.log(`${prefix} ${cleaned}`);
        }
      });
    });
    
    stream.on('end', () => {
      if (buffer) {
        const cleaned = buffer.replace(/\r/g, '');
        if (isError) {
          console.error(`${prefix} \x1b[31m${cleaned}\x1b[0m`);
        } else {
          console.log(`${prefix} ${cleaned}`);
        }
      }
    });
  };

  handleData(child.stdout, false);
  handleData(child.stderr, true);

  child.on('error', (err) => {
    console.error(`${prefix} \x1b[1m\x1b[31mFailed to start process: ${err.message}\x1b[0m`);
  });

  child.on('close', (code) => {
    console.log(`${prefix} exited with code ${code}`);
  });
});
