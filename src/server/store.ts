import 'server-only';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import seed from '../../data/faq.seed.json';
import type { AppState, FAQ } from '@/domain/types';
type GlobalQueues = typeof globalThis & { __unblockQueues?: Map<string, Promise<unknown>> };
const queues = (globalThis as GlobalQueues).__unblockQueues ??= new Map();
export async function serialized<T>(path: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(path) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(work);
  queues.set(path, next);
  try { return await next; } finally { if (queues.get(path) === next) queues.delete(path); }
}
export async function atomicWrite(path: string, data: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data), { encoding: 'utf8', mode: 0o600 });
  await rename(tmp, path);
}
export async function readJSON<T>(path: string, fallback: () => T): Promise<T> {
  try { return JSON.parse(await readFile(path, 'utf8')) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback(); throw error; }
}
function emptyState(): AppState {
  return { schemaVersion: 1, seedVersion: seed.seedVersion, sessions: [], issues: [], faqs: structuredClone(seed.entries) as FAQ[], faqHistory: [], answers: [], deliveries: [], groups: [], media: [], events: [], idempotency: {} };
}
export class Store {
  readonly path: string;
  constructor(directory = process.env.DATA_DIR || '.data/app') { this.path = resolve(directory, 'state.json'); }
  async read() {
    const state = await readJSON<AppState>(this.path, emptyState);
    if (state.schemaVersion !== 1) throw new Error('Unsupported store version. Restore or migrate the local data before starting.');
    return state;
  }
  async transaction<T>(operation: (draft: AppState) => T | Promise<T>): Promise<T> {
    return serialized(this.path, async () => {
      const state = await this.read();
      const result = await operation(state);
      await atomicWrite(this.path, state);
      return structuredClone(result);
    });
  }
}
export const getStore = () => new Store();
