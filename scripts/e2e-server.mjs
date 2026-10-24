import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3100'], {
  stdio: 'inherit', env: { ...process.env, NEXT_BUILD_DIR: '.next-e2e', ALLOW_LIVE_API: 'false', SARVAM_API_KEY: '', MENTOR_PASSCODE: 'offline-test-mentor', DATA_DIR: `.data/e2e-${randomUUID()}`, DISPATCH_LEDGER_PATH: `.data/e2e-ledger-${randomUUID()}.json` },
});
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
