import { z, ZodError } from 'zod';
import { AppError } from '@/domain/errors';
import { assertOrigin, authenticate, checkPasscode, createSession, mentorOnly } from '@/server/auth';
import { WorkshopService } from '@/server/services/workshop';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
async function handle(request: Request) {
  try {
    const path = new URL(request.url).pathname.slice(5).split('/');
    const route = path.join('/'); const method = request.method;
    if (method !== 'GET') assertOrigin(request);
    const service = new WorkshopService();
    const key = request.headers.get('idempotency-key') || '';
    const body = async () => { const raw = await request.text(); if (raw.length > 32_000) throw new AppError(413, 'This request is too large.'); try { return JSON.parse(raw) as unknown; } catch { throw new AppError(400, 'Please send valid JSON.'); } };
    if (method === 'GET' && route === 'health') return Response.json({ ok: true, service: 'Unblock', storage: 'single-process local' }, { headers });
    if (method === 'POST' && (route === 'session' || route === 'mentor/session')) {
      if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) throw new AppError(400, 'A valid request key is required.');
      const input = z.object({ displayName: z.string().max(60).optional(), passcode: z.string().max(200).optional() }).strict().parse(await body());
      const role = route === 'session' ? 'participant' : 'mentor';
      if (role === 'mentor') checkPasscode(input.passcode || '');
      const { session, token } = await createSession(role, input.displayName || (role === 'mentor' ? 'Mentor' : ''));
      return Response.json({ role: session.role, displayName: session.displayName }, { headers: { ...headers, 'Set-Cookie': `unblock_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}` } });
    }
    const actor = await authenticate(request);
    if (method === 'GET' && route === 'me') return Response.json({ role: actor.role, displayName: actor.displayName }, { headers });
    if (method === 'POST' && route === 'logout') return Response.json({ ok: true }, { headers: { ...headers, 'Set-Cookie': 'unblock_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' } });
    if (method === 'GET' && route === 'workshop') return Response.json({ title: 'Kivi build session', slug: 'kivi', faqs: await service.faqs(), mode: 'local' }, { headers });
    if (method === 'GET' && route === 'issues') return Response.json({ issues: await service.issues(actor) }, { headers });
    if (method === 'POST' && route === 'issues') return Response.json(await service.createIssue(actor, await body(), key), { status: 201, headers });
    if (method === 'PATCH' && path[0] === 'issues' && path.length === 2) return Response.json(await service.editIssue(actor, path[1], await body(), key), { headers });
    if (method === 'POST' && path[0] === 'issues' && path[2] === 'feedback') return Response.json(await service.feedback(actor, path[1], await body(), key), { headers });
    if (method === 'GET' && route === 'mentor/board') { mentorOnly(actor); return Response.json(await service.board(actor, { configured: !!process.env.SARVAM_API_KEY, enabled: process.env.ALLOW_LIVE_API === 'true', used: 0, limit: 6, remaining: 6 }), { headers }); }
    if (method === 'POST' && route === 'groups') return Response.json(await service.group(actor, await body(), key), { status: 201, headers });
    if (method === 'PATCH' && path[0] === 'groups' && path.length === 2) return Response.json(await service.group(actor, await body(), key, path[1]), { headers });
    if (method === 'POST' && route === 'answers') return Response.json(await service.publish(actor, await body(), key), { status: 201, headers });
    if (method === 'POST' && route === 'faqs') return Response.json(await service.approveFAQ(actor, await body(), key), { status: 201, headers });
    if (method === 'PATCH' && path[0] === 'faqs' && path.length === 2) return Response.json(await service.editFAQ(actor, path[1], await body(), key), { headers });
    throw new AppError(404, 'This action was not found.');
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: error.issues.map(i => `${i.path.join('.') || 'Request'}: ${i.message}`).join(' '), code: 'validation' }, { status: 400, headers });
    if (error instanceof AppError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
    console.error('Unblock request failed:', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({ error: 'We could not save this change. Please try again.', code: 'internal' }, { status: 500, headers });
  }
}
export { handle as GET, handle as POST, handle as PATCH };
