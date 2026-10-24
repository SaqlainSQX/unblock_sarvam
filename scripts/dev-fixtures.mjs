import { spawn } from 'node:child_process';
console.log('OFFLINE FIXTURE DEVELOPMENT: opening the Playwright test UI. Provider HTTP is intercepted by test tooling; this is not the release app.');
const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--ui'],{stdio:'inherit'});child.on('exit',code=>process.exit(code??1));
