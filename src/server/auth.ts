import 'server-only';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { AppError } from '@/domain/errors';
import type { Session } from '@/domain/types';
import { getStore, type Store } from './store';
export const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
export async function createSession(role: Session['role'], displayName = '', store = getStore()) {
  const token = randomBytes(32).toString('hex');
  const session: Session = { id: randomUUID(), tokenHash: hash(token), role, displayName: displayName.trim().slice(0, 60), createdAt: new Date().toISOString() };
  await store.transaction(state => { state.sessions.push(session); });
  return { token, session };
}
export async function authenticate(request: Request, store: Store = getStore()) {
  const cookie = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('unblock_session='))?.slice('unblock_session='.length);
  if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) throw new AppError(401, 'Please join the workshop or sign in again.');
  const session = (await store.read()).sessions.find(s => s.tokenHash === hash(cookie));
  if (!session) throw new AppError(401, 'Your session has expired. Please join again.');
  return session;
}
export function mentorOnly(session: Session) { if (session.role !== 'mentor') throw new AppError(403, 'Mentor access is required.'); }
export function assertOrigin(request: Request) {
  let origin: URL;
  try { origin = new URL(request.headers.get('origin') || ''); } catch { throw new AppError(403, 'This request must come from the workshop page.'); }
  const host = request.headers.get('host') || new URL(request.url).host;
  if (origin.host !== host || origin.protocol !== new URL(request.url).protocol) throw new AppError(403, 'This request must come from the workshop page.');
}
type LoginGlobal = typeof globalThis & { __unblockLogin?: { attempts: number; reset: number } };
export function checkPasscode(passcode: string) {
  const state = (globalThis as LoginGlobal).__unblockLogin ??= { attempts: 0, reset: 0 };
  if (Date.now() >= state.reset) { state.attempts = 0; state.reset = Date.now() + 60_000; }
  if (state.attempts >= 8) throw new AppError(429, 'Too many sign-in attempts. Try again in a minute.');
  const configured = process.env.MENTOR_PASSCODE;
  if (!configured || configured.length < 8) throw new AppError(503, 'Set a mentor passcode of at least eight characters in the local environment.');
  if (!timingSafeEqual(Buffer.from(hash(configured)), Buffer.from(hash(passcode)))) { state.attempts++; throw new AppError(401, 'That mentor passcode is incorrect.'); }
  state.attempts = 0;
}
