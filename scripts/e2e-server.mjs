import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], {
  stdio: 'inherit', env: { ...process.env, NODE_OPTIONS:`--import=${pathToFileURL(resolve('tests/helpers/provider-transport.mjs')).href}`, NEXT_BUILD_DIR: '.next', ALLOW_LIVE_API: 'true', SARVAM_API_KEY: 'offline-transport-only', MENTOR_PASSCODE: 'offline-test-mentor', DATA_DIR: `.data/e2e-${randomUUID()}`, DISPATCH_LEDGER_PATH: `.data/e2e-ledger-${randomUUID()}.json`,PROVIDER_CACHE_DIR:`.data/e2e-cache-${randomUUID()}` },
});
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
