import { z, ZodError } from 'zod';
import { AppError } from '@/domain/errors';
import { assertOrigin, authenticate, checkPasscode, createSession, mentorOnly } from '@/server/auth';
import { WorkshopService } from '@/server/services/workshop';
import { providerHealth } from '@/server/providers';
import { analyze } from '@/server/services/analysis';
import { MediaService } from '@/server/services/media';
import { readFile } from 'node:fs/promises';
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
    if (method === 'POST' && route === 'issues') { const issue=await service.createIssue(actor,await body(),key); if(issue.processingState==='idle') await analyze(actor,issue.id); return Response.json((await service.issues(actor)).find(i=>i.id===issue.id),{status:201,headers}); }
    if (method === 'PATCH' && path[0] === 'issues' && path.length === 2) return Response.json(await service.editIssue(actor, path[1], await body(), key), { headers });
    if (method === 'POST' && path[0] === 'issues' && path[2] === 'feedback') return Response.json(await service.feedback(actor, path[1], await body(), key), { headers });
    if (method === 'POST' && path[0]==='issues' && path[2]==='analyze') { const input=z.object({revision:z.number().int().positive()}).strict().parse(await body()); const item=(await service.store.read()).issues.find(i=>i.id===path[1]&&(i.ownerSessionId===actor.id||actor.role==='mentor')); if(!item) throw new AppError(404,'Request not found.'); if(item.revision!==input.revision)throw new AppError(409,'The request changed. Refresh first.'); const started=await service.mutate(actor,`analyze:${path[1]}`,key,input,()=>true); if(started)await analyze(actor,path[1],true); return Response.json({ok:true},{headers}); }
    if (method === 'GET' && route === 'mentor/board') { mentorOnly(actor); return Response.json(await service.board(actor, await providerHealth()), { headers }); }
    if (method==='POST' && route==='media') {
      if(Number(request.headers.get('content-length')||0)>5*1024*1024+10000)throw new AppError(413,'Attachment exceeds 5 MB.');
      const reader=request.body?.getReader();if(!reader)throw new AppError(400,'Attach a file.');const chunks:Uint8Array[]=[];let size=0;
      while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>5*1024*1024+10000){await reader.cancel();throw new AppError(413,'Attachment exceeds 5 MB.');}chunks.push(part.value);}
      const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData(); const file=form.get('file');if(!(file instanceof File))throw new AppError(400,'Attach a file.');
      return Response.json(await new MediaService().upload(actor,Buffer.from(await file.arrayBuffer()),file.type,key),{status:201,headers});
    }
    if(path[0]==='media'&&path.length===3){const media=new MediaService();if(method==='POST'&&path[2]==='process'){const input=z.object({language:z.enum(['en-IN','hi-IN']).default('en-IN')}).strict().parse(await body());return Response.json(await media.process(actor,path[1],input.language),{headers});}if(method==='GET'&&path[2]==='status')return Response.json(await media.status(actor,path[1]),{headers});if(method==='GET'&&path[2]==='content'){const item=await media.owned(actor,path[1]);return new Response(new Uint8Array(await readFile(item.path)),{headers:{...headers,'Content-Type':item.mime,'Content-Disposition':'inline'}});}}
    if(method==='POST'&&path[0]==='answers'&&path[2]==='audio'){const input=z.object({language:z.enum(['en-IN','hi-IN'])}).strict().parse(await body());return Response.json(await new MediaService().audio(actor,path[1],input.language),{headers});}
    if (method === 'POST' && route === 'groups') return Response.json(await service.group(actor, await body(), key), { status: 201, headers });
    if (method === 'PATCH' && path[0] === 'groups' && path.length === 2) return Response.json(await service.group(actor, await body(), key, path[1]), { headers });
    if (method === 'POST' && route === 'answers') return Response.json(await service.publish(actor, await body(), key), { status: 201, headers });
    if (method === 'POST' && route === 'faqs') return Response.json(await service.approveFAQ(actor, await body(), key), { status: 201, headers });
    if (method === 'PATCH' && path[0] === 'faqs' && path.length === 2) return Response.json(await service.editFAQ(actor, path[1], await body(), key), { headers });
    throw new AppError(404, 'This action was not found.');
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: error.issues.map(i => `${i.path.join('.') || 'Request'}: ${i.message}`).join(' '), code: 'validation' }, { status: 400, headers });
    if (error instanceof AppError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
    console.error('Unblock request failed:', error instanceof Error ? error.stack : 'UnknownError');
    return Response.json({ error: 'We could not save this change. Please try again.', code: 'internal' }, { status: 500, headers });
  }
}
export { handle as GET, handle as POST, handle as PATCH };
