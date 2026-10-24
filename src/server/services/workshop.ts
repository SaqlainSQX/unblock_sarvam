import 'server-only';
import { randomUUID } from 'node:crypto';
import { AppError, requireValue } from '@/domain/errors';
import { eligibleFAQs, exactFAQ, related, sameContext, scopeApplies } from '@/domain/matching';
import type { AppState, Answer, Board, Delivery, FAQ, Issue, IssueView, Session } from '@/domain/types';
import { answerSchema, contextSchema, faqEditSchema, faqSchema, feedbackSchema, groupSchema, issueSchema, revisionSchema } from '@/domain/schemas';
import { hash, mentorOnly } from '../auth';
import { getStore, type Store } from '../store';
const now = () => new Date().toISOString();
function event(state: AppState, actor: Session, entityId: string, operation: string) {
  state.events.push({ id: randomUUID(), actor: actor.id, entityId, operation, at: now() });
}
function owner(issue: Issue, actor: Session) { if (issue.ownerSessionId !== actor.id) throw new AppError(404, 'This request was not found.'); }
function revision(current: number, expected: number) { if (current !== expected) throw new AppError(409, 'This item changed. Refresh and try again.'); }
export function issueView(state: AppState, issue: Issue): IssueView {
  const { ownerSessionId: _owner, ...safe } = issue;
  void _owner;
  return { ...safe, media: state.media.filter(m => issue.mediaIds.includes(m.id)).map(({ id, kind, mime, status }) => ({ id, kind, mime, status })), deliveries: issue.answerDeliveryIds.map(id => {
    const delivery = requireValue(state.deliveries.find(d => d.id === id));
    const answer = requireValue(state.answers.find(a => a.id === delivery.answerId));
    const faq = state.faqs.find(f => f.id === answer.faqId);
    return { ...delivery, answer, withdrawn: !!faq?.withdrawnAt, superseded: !!faq && faq.revision !== answer.faqRevision };
  }) };
}
export function deliver(state: AppState, issue: Issue, answer: Answer) {
  const delivery: Delivery = { id: randomUUID(), issueId: issue.id, answerId: answer.id, deliveredAt: now(), outcome: 'pending', attemptedSteps: '' };
  state.deliveries.push(delivery); issue.answerDeliveryIds.push(delivery.id);
  issue.helpState = 'answer_available'; issue.updatedAt = now(); issue.revision++;
}
export function answerFromFAQ(state: AppState, faq: FAQ) {
  const existing = state.answers.find(a => a.faqId === faq.id && a.faqRevision === faq.revision);
  if (existing) return existing;
  const answer: Answer = { id: randomUUID(), version: faq.revision, title: faq.title, bodyEn: faq.bodyEn, bodyHi: faq.bodyHi, source: faq.source, scope: faq.scope, author: faq.approvedBy || 'Reviewed source', createdAt: now(), faqId: faq.id, faqRevision: faq.revision };
  state.answers.push(answer); return answer;
}
export class WorkshopService {
  constructor(readonly store: Store = getStore()) {}
  async mutate<T>(actor: Session, operation: string, key: string, payload: unknown, action: (state: AppState) => T): Promise<T> {
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) throw new AppError(400, 'A valid request key is required.');
    const fingerprint = hash(JSON.stringify(payload)); const id = `${actor.id}:${operation}:${key}`;
    return this.store.transaction(state => {
      const cached = state.idempotency[id];
      if (cached) { if (cached.hash !== fingerprint) throw new AppError(409, 'This request key was already used for different content.'); return cached.response as T; }
      const result = action(state); state.idempotency[id] = { hash: fingerprint, response: result, at: now() }; return result;
    });
  }
  async createIssue(actor: Session, payload: unknown, key: string) {
    if (actor.role !== 'participant') throw new AppError(403, 'Join as a participant to submit a request.');
    const input = issueSchema.parse(payload);
    return this.mutate(actor, 'issue:create', key, input, state => {
      const media = input.mediaIds.map(id => requireValue(state.media.find(m => m.id === id && m.ownerSessionId === actor.id), 400, 'One of the attachments is unavailable.'));
      if (media.filter(m => m.kind === 'image').length > 1 || media.filter(m => m.kind === 'audio').length > 1) throw new AppError(400, 'Attach at most one image and one recording.');
      const issue: Issue = { id: randomUUID(), workshopId: 'kivi', ownerSessionId: actor.id, revision: 1, inputRevision: 1, originalText: input.originalText ?? input.reviewedText, reviewedText: input.reviewedText, transcript: input.transcript, ocrText: input.ocrText, context: input.context, attemptedSteps: input.attemptedSteps, mediaIds: input.mediaIds, helpState: 'needs_mentor', processingState: 'idle', processingError: null, clarification: null, candidateGroupId: null, confirmedGroupId: null, answerDeliveryIds: [], createdAt: now(), updatedAt: now() };
      state.issues.push(issue);
      const candidates = eligibleFAQs(state.faqs, issue.context, issue.reviewedText);
      const faq = input.faqId ? candidates.find(f => f.id === input.faqId) : exactFAQ(candidates, issue.reviewedText);
      if (input.faqId && !faq) throw new AppError(400, 'That answer does not apply to the selected platform or version.');
      if (faq) { deliver(state, issue, answerFromFAQ(state, faq)); issue.processingState = 'complete'; }
      else if (issue.context.os === 'unknown' || issue.context.distribution === 'unknown') { issue.clarification = 'Which platform and app distribution are you using?'; issue.processingState = 'complete'; }
      event(state, actor, issue.id, 'issue_created'); return issueView(state, issue);
    });
  }
  async issues(actor: Session) { const state = await this.store.read(); return state.issues.filter(i => i.ownerSessionId === actor.id).map(i => issueView(state, i)).reverse(); }
  async editIssue(actor: Session, id: string, payload: unknown, key: string) {
    const input = issueSchema.extend({ revision: revisionSchema }).parse(payload);
    return this.mutate(actor, `issue:edit:${id}`, key, input, state => {
      const issue = requireValue(state.issues.find(i => i.id === id)); owner(issue, actor); revision(issue.revision, input.revision);
      for (const mediaId of input.mediaIds) requireValue(state.media.find(m => m.id === mediaId && m.ownerSessionId === actor.id), 400, 'Attachment unavailable.');
      Object.assign(issue, { reviewedText: input.reviewedText, transcript: input.transcript, ocrText: input.ocrText, context: input.context, attemptedSteps: input.attemptedSteps, mediaIds: input.mediaIds });
      issue.inputRevision++; issue.revision++; issue.updatedAt = now(); issue.helpState = 'needs_mentor'; issue.processingState = 'idle'; issue.processingError = null; issue.clarification = null; issue.candidateGroupId = null;
      if (issue.confirmedGroupId) { const group = state.groups.find(g => g.id === issue.confirmedGroupId); if (group) { group.issueIds = group.issueIds.filter(x => x !== id); group.revision++; } issue.confirmedGroupId = null; }
      event(state, actor, id, 'issue_edited'); return issueView(state, issue);
    });
  }
  async feedback(actor: Session, id: string, payload: unknown, key: string) {
    const input = feedbackSchema.parse(payload);
    return this.mutate(actor, `feedback:${id}`, key, input, state => {
      const issue = requireValue(state.issues.find(i => i.id === id)); owner(issue, actor); revision(issue.revision, input.revision);
      const latest = state.deliveries.find(d => d.id === issue.answerDeliveryIds.at(-1));
      if (input.outcome === 'reopen') { issue.helpState = issue.helpState === 'fix_failed' ? 'fix_failed' : 'needs_mentor'; }
      else {
        if (!latest || latest.answerId !== input.answerId) throw new AppError(409, 'Please respond to the latest answer.');
        latest.outcome = input.outcome; latest.attemptedSteps = input.attemptedSteps;
        issue.helpState = input.outcome === 'solved' ? 'resolved' : 'fix_failed';
      }
      issue.attemptedSteps = input.attemptedSteps || issue.attemptedSteps; issue.revision++; issue.updatedAt = now();
      event(state, actor, id, `feedback_${input.outcome}`); return issueView(state, issue);
    });
  }
  async faqs() {
    const state = await this.store.read();
    return state.faqs.filter(f => f.approval !== 'draft' && !f.withdrawnAt).map(f => ({ ...f, occurrences: state.deliveries.filter(d => state.answers.find(a => a.id === d.answerId)?.faqId === f.id).length })).sort((a,b) => b.occurrences - a.occurrences);
  }
  async board(actor: Session, health: Board['health']): Promise<Board> {
    mentorOnly(actor); const state = await this.store.read();
    const counts: Board['counts'] = { needs_mentor: 0, fix_failed: 0, answer_available: 0, resolved: 0 };
    state.issues.forEach(i => counts[i.helpState]++);
    const waiting = state.issues.filter(i => i.helpState === 'needs_mentor' || i.helpState === 'fix_failed');
    const unused = new Set(waiting.filter(i => !i.confirmedGroupId).map(i => i.id));
    const suggestions: Board['suggestions'] = [];
    for (const issue of waiting) {
      if (!unused.has(issue.id)) continue;
      const members = waiting.filter(other => unused.has(other.id) && (related(issue, other) || other.candidateGroupId === issue.candidateGroupId && !!issue.candidateGroupId && sameContext(issue.context, other.context)));
      if (members.length > 1) { suggestions.push({ issueIds: members.map(i => i.id), title: issue.reviewedText.slice(0, 100), context: issue.context }); members.forEach(i => unused.delete(i.id)); }
    }
    const groups = state.groups.map(g => ({ ...g, blockedCount: new Set(waiting.filter(i => g.issueIds.includes(i.id)).map(i => i.ownerSessionId)).size })).sort((a,b) => b.blockedCount - a.blockedCount || a.createdAt.localeCompare(b.createdAt));
    return { issues: state.issues.map(i => issueView(state, i)).sort((a,b) => a.createdAt.localeCompare(b.createdAt)), groups, suggestions, faqs: state.faqs.map(f => ({ ...f, occurrences: state.deliveries.filter(d => state.answers.find(a => a.id === d.answerId)?.faqId === f.id).length })), counts, blockedParticipants: new Set(state.issues.filter(i => i.helpState !== 'resolved').map(i => i.ownerSessionId)).size, health };
  }
  async publish(actor: Session, payload: unknown, key: string) {
    mentorOnly(actor); const input = answerSchema.parse(payload);
    return this.mutate(actor, 'answer:publish', key, input, state => {
      if (new Set(input.recipients.map(r => r.id)).size !== input.recipients.length) throw new AppError(400, 'Select each recipient once.');
      const issues = input.recipients.map(recipient => { const issue = requireValue(state.issues.find(i => i.id === recipient.id)); revision(issue.revision, recipient.revision); if (!scopeApplies(input.scope, issue.context)) throw new AppError(400, 'Answer scope must cover every selected request.'); return issue; });
      const answer: Answer = { id: randomUUID(), version: 1, title: input.title, bodyEn: input.bodyEn, bodyHi: input.bodyHi, scope: input.scope, source: input.source, author: actor.id, createdAt: now() };
      state.answers.push(answer); issues.forEach(issue => deliver(state, issue, answer));
      event(state, actor, answer.id, 'answer_published'); return answer;
    });
  }
  async approveFAQ(actor: Session, payload: unknown, key: string) {
    mentorOnly(actor); const input = faqSchema.parse(payload);
    return this.mutate(actor, 'faq:approve', key, input, state => {
      const answer = requireValue(state.answers.find(a => a.id === input.answerId));
      if (state.faqs.some(f => f.answerId === answer.id && !f.withdrawnAt)) throw new AppError(409, 'This answer is already in the reusable FAQ.');
      const faq: FAQ = { id: randomUUID(), revision: 1, title: answer.title, bodyEn: answer.bodyEn, bodyHi: answer.bodyHi, scope: answer.scope, source: answer.source, approval: 'mentor_approved', approvedBy: actor.id, reviewedAt: now(), withdrawnAt: null, supersedesVersion: null, searchPhrases: input.searchPhrases, answerId: answer.id };
      state.faqs.push(faq); event(state, actor, faq.id, 'faq_approved'); return faq;
    });
  }
  async editFAQ(actor: Session, id: string, payload: unknown, key: string) {
    mentorOnly(actor); const input = faqEditSchema.parse(payload);
    return this.mutate(actor, `faq:edit:${id}`, key, input, state => {
      const faq = requireValue(state.faqs.find(f => f.id === id)); revision(faq.revision, input.revision); state.faqHistory.push(structuredClone(faq));
      const { revision: _revision, withdraw, ...changes } = input; void _revision;
      Object.assign(faq, changes); faq.supersedesVersion = faq.revision; faq.revision++; faq.reviewedAt = now(); faq.approvedBy = actor.id;
      if (withdraw) faq.withdrawnAt = now();
      else { if (!faq.bodyEn || !faq.source.note || !scopeApplies(faq.scope, { os: faq.scope.os[0], distribution: faq.scope.distribution[0], version: faq.scope.versions[0] ?? null })) throw new AppError(400, 'Complete the answer, source and applicability before publishing.'); faq.approval = 'mentor_approved'; }
      event(state, actor, id, withdraw ? 'faq_withdrawn' : 'faq_revised'); return faq;
    });
  }
  async group(actor: Session, payload: unknown, key: string, id?: string) {
    mentorOnly(actor); const input = groupSchema.extend({ revision: revisionSchema.optional() }).parse(payload);
    return this.mutate(actor, `group:${id || 'new'}`, key, input, state => {
      const issues = input.members.map(m => { const issue = requireValue(state.issues.find(i => i.id === m.id)); revision(issue.revision, m.revision); return issue; });
      if (new Set(issues.map(i => i.id)).size !== issues.length || issues.some(i => !sameContext(i.context, issues[0].context))) throw new AppError(400, 'Group requests with the same known platform, distribution and version.');
      const existing = id ? requireValue(state.groups.find(g => g.id === id)) : null;
      if (existing) { if (!input.revision) throw new AppError(400, 'A group revision is required.'); revision(existing.revision, input.revision); }
      const group = existing ?? { id: randomUUID(), revision: 0, title: input.title, issueIds: [], context: issues[0].context, createdAt: now() };
      state.issues.filter(i => i.confirmedGroupId === group.id).forEach(i => { i.confirmedGroupId = null; i.revision++; });
      for (const issue of issues) {
        const prior = state.groups.find(g => g.id === issue.confirmedGroupId && g.id !== group.id);
        if (prior) { prior.issueIds = prior.issueIds.filter(member => member !== issue.id); prior.revision++; }
        issue.confirmedGroupId = group.id; issue.revision++;
      }
      group.title = input.title; group.issueIds = issues.map(i => i.id); group.revision++;
      if (!existing) state.groups.push(group);
      event(state, actor, group.id, 'group_confirmed'); return group;
    });
  }
}
export const issueEditSchema = issueSchema.extend({ revision: revisionSchema, context: contextSchema });
