import 'server-only';
import { AppError, requireValue } from '@/domain/errors';
import { eligibleFAQs, sameContext } from '@/domain/matching';
import type { Session } from '@/domain/types';
import { getStore, type Store } from '../store';
import { classify } from '../providers';
import { answerFromFAQ, deliver, issueView } from './workshop';
export async function analyze(actor: Session, id: string, force = false, store: Store = getStore()) {
  const snapshot = await store.transaction(state => {
    const issue = requireValue(state.issues.find(i => i.id===id && (i.ownerSessionId===actor.id || actor.role==='mentor')));
    if (!force && issue.processingState!=='idle') return null;
    if (issue.processingState==='processing') throw new AppError(409,'This request is already being checked.');
    issue.processingState='processing'; issue.processingError=null;
    return { issue, faqs:eligibleFAQs(state.faqs,issue.context,issue.reviewedText), groups:state.groups.filter(g=>sameContext(g.context,issue.context)) };
  });
  if (!snapshot) return;
  try {
    if (snapshot.issue.context.os==='unknown' || snapshot.issue.context.distribution==='unknown') throw new AppError(400,'Choose your platform and distribution so guidance can be matched safely.');
    const result=await classify(snapshot.issue.ownerSessionId,snapshot.issue,snapshot.faqs,snapshot.groups,force);
    await store.transaction(state=>{
      const issue=requireValue(state.issues.find(i=>i.id===id)); if(issue.inputRevision!==snapshot.issue.inputRevision) return;
      if (result.value.intent==='faq') { const faq=eligibleFAQs(state.faqs,issue.context,issue.reviewedText).find(f=>f.id===result.value.faqId && snapshot.faqs.some(old=>old.id===f.id && old.revision===f.revision)); if(!faq) throw new AppError(409,'Guidance changed while matching. Ask the mentor for the latest version.'); deliver(state,issue,answerFromFAQ(state,faq)); }
      if(result.value.intent==='group') issue.candidateGroupId=result.value.groupId;
      issue.clarification=result.value.clarification; issue.processingState='complete'; issue.processingError=null; issue.revision++;
    });
  } catch(error) { await store.transaction(state=>{ const issue=state.issues.find(i=>i.id===id); if(!issue || issue.inputRevision!==snapshot.issue.inputRevision) return; issue.processingState='failed'; issue.processingError=error instanceof AppError ? error.message : 'We could not safely match a reviewed answer.'; issue.revision++; }); }
  const state=await store.read(); return issueView(state,requireValue(state.issues.find(i=>i.id===id)));
}
