// Local handoff integrity checker. No dependencies, network, or application tests.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const json = (name) => JSON.parse(read(name));
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'out', 'coverage', 'test-results', 'playwright-report'].includes(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (['.md', '.json', '.mjs'].includes(extname(path))) files.push(path);
  }
}
walk(root);
let links = 0;
for (const path of files) {
  const content = readFileSync(path, 'utf8');
  assert(!/sk_[A-Za-z0-9_-]{20,}/.test(content), `Possible credential in ${relative(root, path)}`);
  if (extname(path) === '.json') JSON.parse(content);
  if (extname(path) !== '.md') continue;
  for (const match of content.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const dest = resolve(dirname(path), decodeURIComponent(target));
    const rel = relative(root, dest);
    assert(rel !== '..' && !rel.startsWith(`..${sep}`), `Link escapes handoff: ${target}`);
    assert(existsSync(dest), `Broken link in ${relative(root, path)}: ${target}`);
    links++;
  }
}
const env = read('.env.example');
assert(/^SARVAM_API_KEY=\s*$/m.test(env), 'Example key must be empty');
assert(/^MENTOR_PASSCODE=\s*$/m.test(env), 'Example passcode must be empty');
assert(/^ALLOW_LIVE_API=false$/m.test(env), 'Default must disable live calls');
assert(/^LIVE_MAX_DISPATCHES=6$/m.test(env), 'Budget must match plan');
const ignore = read('.gitignore');
for (const entry of ['.env*', '!.env.example', '.data/', '.evidence/', '*.exe']) assert(ignore.includes(entry), `Missing ignore rule ${entry}`);

const seed = json('data/faq.seed.json');
assert.equal(seed.schemaVersion, 1);
assert.equal(seed.entries.length, 7);
const ids = new Set(seed.entries.map((entry) => entry.id));
assert.equal(ids.size, 7, 'Unique FAQ IDs');
assert.equal(seed.entries.filter((entry) => entry.approval === 'source_reviewed').length, 5);
assert.equal(seed.entries.filter((entry) => entry.approval === 'draft').length, 2);
for (const entry of seed.entries) {
  assert.equal(entry.revision, 1);
  assert(['documented_public', 'exact'].includes(entry.scope.versionPolicy));
  if (entry.approval === 'draft') {
    assert.equal(entry.bodyEn, '');
    assert.equal(entry.bodyHi, '');
    assert.equal(entry.approvedBy, null);
  } else {
    assert(entry.bodyEn && entry.bodyHi && entry.source.url);
    assert.equal(new URL(entry.source.url).hostname, 'heykivi.ai');
    assert.deepEqual(entry.scope.os, ['macos']);
    assert.deepEqual(entry.scope.distribution, ['public']);
  }
}
const scenarios = json('fixtures/scenarios.json');
assert.equal(scenarios.provenance, 'synthetic');
assert.equal(scenarios.scenarios.length, 24);
assert.equal(new Set(scenarios.scenarios.map((s) => s.id)).size, 24);
scenarios.scenarios.forEach((scenario, index) => {
  assert.equal(scenario.id, `S${String(index + 1).padStart(2, '0')}`);
  assert(scenario.name && scenario.expected && (scenario.input || scenario.setup));
  if (scenario.context) assert(scenarios.contexts[scenario.context]);
  if (scenario.expected.faqId) assert(ids.has(scenario.expected.faqId));
});
const provider = json('fixtures/provider-responses.json');
const schema = json('fixtures/classification.schema.json');
assert.equal(provider.provenance, 'synthetic');
for (const proposal of [provider.classificationKnown, provider.classificationUnknown, provider.classificationClarify]) {
  assert.deepEqual(Object.keys(proposal).sort(), [...schema.required].sort());
  assert(schema.properties.intent.enum.includes(proposal.intent));
  assert(schema.properties.reasonCode.enum.includes(proposal.reasonCode));
  if (proposal.faqId) assert(ids.has(proposal.faqId));
  if (proposal.intent === 'clarify') assert(proposal.needsClarification && proposal.clarification);
  else assert(!proposal.needsClarification && proposal.clarification === null);
}
assert(provider.asr.text.includes(provider.classificationKnown.evidence[0].quote));
const demo = json('fixtures/mentor-demo.json');
assert.equal(demo.provenance, 'synthetic');
assert.equal(demo.releaseSeedAllowed, false);
assert(demo.mentorAnswer.bodyEn.includes('synthetic'));

const manifest = json('fixtures/media/manifest.json');
assert.equal(manifest.provenance, 'synthetic');
for (const file of manifest.files) {
  const bytes = readFileSync(resolve(root, 'fixtures/media', file.path));
  assert.equal(bytes.length, file.bytes, `Size: ${file.path}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `Hash: ${file.path}`);
}
const png = readFileSync(resolve(root, 'fixtures/media/question-card.png'));
assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 640);
const wav = readFileSync(resolve(root, 'fixtures/media/question-en.wav'));
assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
let fmt;
let audioBytes;
for (let offset = 12; offset + 8 <= wav.length;) {
  const type = wav.toString('ascii', offset, offset + 4);
  const size = wav.readUInt32LE(offset + 4);
  assert(offset + 8 + size <= wav.length, 'WAV chunk bounds');
  if (type === 'fmt ') fmt = wav.subarray(offset + 8, offset + 8 + size);
  if (type === 'data') audioBytes = size;
  offset += 8 + size + size % 2;
}
assert(fmt && audioBytes > 0);
assert.equal(fmt.readUInt16LE(0), 1, 'PCM encoding');
assert.equal(fmt.readUInt16LE(2), 1, 'Mono');
assert.equal(fmt.readUInt32LE(4), 16000);
assert.equal(fmt.readUInt16LE(14), 16);
const duration = audioBytes / fmt.readUInt32LE(8);
assert(duration > 0 && duration < 10);
assert(Math.abs(duration - manifest.audio.durationSeconds) < 0.002);
console.log(`PASS: ${files.length} text/JSON files, ${links} local links, 5 reviewed FAQs, 2 drafts, 24 scenarios, PNG and ${duration.toFixed(3)}s PCM WAV integrity.`);
console.log('Handoff integrity only. No application tests or network/API calls performed.');
