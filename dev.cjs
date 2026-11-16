const path = require('node:path');
const { spawn } = require('node:child_process');

const root = __dirname;
const children = [];
let stopping = false;

function stopAll() {
  if (stopping) {
    return;
  }

  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
    }
  }
}

function launch(name, workingDirectory, entryPoint, args = []) {
  const child = spawn(process.execPath, [entryPoint, ...args], {
    cwd: workingDirectory,
    env: process.env,
    stdio: 'inherit',
  });
  children.push(child);

  child.on('error', (error) => {
    console.error(`${name} could not start: ${error.message}`);
    process.exitCode = 1;
    stopAll();
  });

  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`${name} exited${signal ? ` after ${signal}` : ` with code ${code}`}. Stopping Reel Rush.`);
      process.exitCode = code || 1;
      stopAll();
    }
  });

  return child;
}

async function waitForApi(apiProcess) {
  const deadline = Date.now() + 30000;
  let lastError;

  while (Date.now() < deadline) {
    if (stopping || apiProcess.exitCode !== null || apiProcess.signalCode !== null) {
      throw new Error('The backend stopped before it became ready.');
    }

    try {
      const response = await fetch('http://localhost:3000/api/health', {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        return;
      }
      lastError = new Error(`Health check returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Backend did not become ready at http://localhost:3000/api/health within 30 seconds. ${lastError?.message ?? ''}`);
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

async function start() {
  const backend = launch('Backend', path.join(root, 'backend'), path.join(root, 'backend', 'server.cjs'));
  await waitForApi(backend);
  if (stopping) {
    return;
  }

  console.log('Backend is ready. Starting the Angular frontend.');
  launch(
    'Frontend',
    path.join(root, 'frontend'),
    path.join(root, 'frontend', 'node_modules', '@angular', 'cli', 'bin', 'ng.js'),
    ['serve'],
  );
}

start().catch((error) => {
  console.error(`Reel Rush could not start: ${error.message}`);
  process.exitCode = 1;
  stopAll();
});
