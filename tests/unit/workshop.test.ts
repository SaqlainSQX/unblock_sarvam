import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Store } from '@/server/store';
import { createSession } from '@/server/auth';
import { WorkshopService } from '@/server/services/workshop';
import type { Session } from '@/domain/types';
let directory: string, store: Store, service: WorkshopService, a: Session, b: Session, c: Session, mentor: Session;
const context = { os: 'windows', distribution: 'workshop', version: '1.9.6' };
const scope = { os: ['windows'], distribution: ['workshop'], versionPolicy: 'exact', versions: ['1.9.6'], rationale: 'Approved synthetic workshop exercise.' };
const request = { reviewedText: 'SYNTHETIC EXERCISE: worksheet DEMO_FOCUS_01 asks which practice box to use.', context };
const answer = { title: 'Synthetic practice box', bodyEn: 'For this synthetic exercise, use Practice A.', bodyHi: '', scope, source: { url: null, note: 'Synthetic worksheet reviewed by test mentor.' } };
beforeEach(async () => {
  await mkdir('.data/tests', { recursive: true });
  directory = await mkdtemp(join('.data/tests', 'domain-')); store = new Store(directory); service = new WorkshopService(store);
  a = (await createSession('participant', 'A', store)).session;
  b = (await createSession('participant', 'B', store)).session;
  c = (await createSession('participant', 'C', store)).session;
  mentor = (await createSession('mentor', 'Mentor', store)).session;
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });
describe('closed workshop loop', () => {
  it('preserves independent outcomes, history and explicit reuse approval', async () => {
    const ia = await service.createIssue(a, request, 'issue-key-a'); const ib = await service.createIssue(b, request, 'issue-key-b');
    const group = await service.group(mentor, { title: 'Practice question', members: [{ id: ia.id, revision: ia.revision }, { id: ib.id, revision: ib.revision }] }, 'group-key-1');
    expect(group.issueIds).toHaveLength(2);
    const freshA = (await service.issues(a))[0], freshB = (await service.issues(b))[0];
    const published = await service.publish(mentor, { ...answer, recipients: [{ id: ia.id, revision: freshA.revision }, { id: ib.id, revision: freshB.revision }] }, 'answer-key-1');
    expect((await service.issues(a))[0].helpState).toBe('answer_available');
    expect((await service.faqs()).some(f => f.answerId === published.id)).toBe(false);
    await service.feedback(a, ia.id, { outcome: 'solved', answerId: published.id, revision: (await service.issues(a))[0].revision }, 'feedback-a');
    await service.feedback(b, ib.id, { outcome: 'failed', answerId: published.id, attemptedSteps: 'Tried Practice A.', revision: (await service.issues(b))[0].revision }, 'feedback-b');
    expect((await service.issues(a))[0].helpState).toBe('resolved'); expect((await service.issues(b))[0].helpState).toBe('fix_failed');
    const faq = await service.approveFAQ(mentor, { answerId: published.id, searchPhrases: ['Which synthetic practice box?'] }, 'approve-key');
    const next = await service.createIssue(c, { ...request, reviewedText: 'Which synthetic practice box?' }, 'new-issue-c');
    expect(next.helpState).toBe('answer_available'); expect(next.deliveries[0].answer.faqId).toBe(faq.id);
    await service.editFAQ(mentor, faq.id, { revision: faq.revision, withdraw: true }, 'withdraw-key');
    expect((await service.issues(c))[0].deliveries[0].withdrawn).toBe(true);
    const unknown = await service.createIssue(c, { ...request, reviewedText: 'Which synthetic practice box?' }, 'new-issue-d'); expect(unknown.helpState).toBe('needs_mentor');
    expect((await service.issues(b))[0].deliveries[0].attemptedSteps).toBe('Tried Practice A.');
  });
  it('rejects cross-owner feedback, participant publication, stale revisions and wrong-scope answers', async () => {
    const issue = await service.createIssue(a, request, 'test-key-a');
    await expect(service.feedback(b, issue.id, { outcome: 'reopen', answerId: null, revision: issue.revision }, 'cross-owner')).rejects.toMatchObject({ status: 404 });
    await expect(service.publish(a, { ...answer, recipients: [{ id: issue.id, revision: issue.revision }] }, 'unauth-pub')).rejects.toMatchObject({ status: 403 });
    await expect(service.publish(mentor, { ...answer, recipients: [{ id: issue.id, revision: 99 }] }, 'stale-pub')).rejects.toMatchObject({ status: 409 });
    await expect(service.publish(mentor, { ...answer, scope: { ...scope, os: ['macos'] }, recipients: [{ id: issue.id, revision: issue.revision }] }, 'wrong-scope')).rejects.toMatchObject({ status: 400 });
    expect((await store.read()).answers).toHaveLength(0);
  });
  it('deduplicates mutation keys and survives concurrent writes and restart', async () => {
    const [first, repeat] = await Promise.all([service.createIssue(a, request, 'same-key-1'), service.createIssue(a, request, 'same-key-1')]);
    expect(first.id).toBe(repeat.id);
    await expect(service.createIssue(a, { ...request, reviewedText: 'Changed question.' }, 'same-key-1')).rejects.toMatchObject({ status: 409 });
    await Promise.all([service.createIssue(a, request, 'parallel-a'), service.createIssue(b, request, 'parallel-b')]);
    const restarted = new WorkshopService(new Store(directory)); expect((await restarted.store.read()).issues).toHaveLength(3);
    expect((await restarted.store.read()).faqs).toHaveLength(7);
  });
  it('keeps different OS/version reports out of proposed groups and deduplicates people', async () => {
    await service.createIssue(a, request, 'repeat-a-1'); await service.createIssue(a, request, 'repeat-a-2');
    await service.createIssue(b, { ...request, context: { ...context, version: '2.0' } }, 'version-b');
    const board = await service.board(mentor, { configured: false, enabled: false, used: 0, limit: 6, remaining: 6 });
    expect(board.blockedParticipants).toBe(2); expect(board.suggestions[0].issueIds).toHaveLength(2);
  });
});
