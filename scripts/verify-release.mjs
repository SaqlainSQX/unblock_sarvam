import { existsSync,readFileSync,readdirSync } from 'node:fs';
import { resolve,extname } from 'node:path';
import assert from 'node:assert/strict';
const walk=directory=>existsSync(directory)?readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(resolve(directory,entry.name)):entry.isFile()?[resolve(directory,entry.name)]:[]):[];
const source=walk('src').filter(path=>/\.[cm]?[jt]sx?$/.test(path));
for(const path of source){const text=readFileSync(path,'utf8');assert(!/(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*(?:fixtures|tests\/)/.test(text),`Test dependency in ${path}`);assert(!/SYNTHETIC EXERCISE|DEMO_FOCUS_01|offline-transport-only|classificationKnown/.test(text),`Sample response in ${path}`);assert(!/sk_[A-Za-z0-9_-]{20,}/.test(text),`Possible credential in ${path}`);if(text.startsWith("'use client'")){assert(!/from\s*['"][^'"]*server\//.test(text),`Client imports server in ${path}`);assert(!/process\.env\.(?:SARVAM|MENTOR)/.test(text),`Private environment access in client ${path}`);}}
const config=readFileSync('.env.example','utf8');assert(/^SARVAM_API_KEY=\s*$/m.test(config));assert(/^ALLOW_LIVE_API=false$/m.test(config));
assert(existsSync('.next/BUILD_ID'),'Run the production build first');
const compiled=[...walk('.next/server'),...walk('.next/static')].filter(path=>extname(path)==='.js');
for(const path of compiled){const text=readFileSync(path,'utf8');assert(!/SYNTHETIC EXERCISE|DEMO_FOCUS_01|offline-transport-only/.test(text),`Fixture content in production ${path}`);assert(!/sk_[A-Za-z0-9_-]{20,}/.test(text),`Possible key in production ${path}`);}
const traces=walk('.next').filter(path=>path.endsWith('.nft.json'));
for(const path of traces){const trace=JSON.parse(readFileSync(path,'utf8'));for(const file of trace.files||[]){assert(!/(?:^|[/\\])(?:fixtures|tests|\.data|\.evidence|\.git)(?:[/\\])|(?:^|[/\\])\.env|\.exe$/.test(file),`Private/test file in deployment trace ${file}`);}}
console.log(`PASS release: ${source.length} source files, ${compiled.length} production bundles, ${traces.length} dependency traces. No runtime fixture imports, sample responses or embedded keys found.`);
console.log('This static check supplements the production-route browser smoke; it does not prove live API entitlement.');
