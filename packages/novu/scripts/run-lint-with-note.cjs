const { spawn } = require('node:child_process');

const startedAt = Date.now();

console.log(
  '[novu lint] Note: this command can respond slowly while we investigate and improve lint performance.'
);

const lintProcess = spawn('npx', ['biome', 'lint', 'packages/novu'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

lintProcess.on('error', (error) => {
  console.error('[novu lint] Failed to start Biome lint command.', error);
  process.exit(1);
});

lintProcess.on('exit', (code, signal) => {
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`[novu lint] Completed in ${elapsedSeconds}s.`);

  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 1);
});
