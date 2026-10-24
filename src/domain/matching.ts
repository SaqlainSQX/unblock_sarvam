import type { Context, FAQ, Issue, Scope } from './types';
export const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}_]+/gu, ' ').trim();
export function scopeApplies(scope: Scope, context: Context, text = '') {
  if (context.os === 'unknown' || context.distribution === 'unknown') return false;
  if (!scope.os.includes(context.os) || !scope.distribution.includes(context.distribution)) return false;
  if (scope.versionPolicy === 'exact') return !!context.version && scope.versions.includes(context.version);
  if (scope.versionPolicy === 'documented_public') return context.os === 'macos' && context.distribution === 'public' && !/\b(?:crash|broken|error|fails?|not working|doesn.t work|version)\b/i.test(text);
  return !!scope.rationale.trim();
}
export function eligibleFAQs(faqs: FAQ[], context: Context, text: string) {
  return faqs.filter(f => f.approval !== 'draft' && !f.withdrawnAt && scopeApplies(f.scope, context, text));
}
export function exactFAQ(faqs: FAQ[], text: string) {
  const key = normalize(text);
  const matches = faqs.filter(f => [f.title, ...f.searchPhrases].some(p => normalize(p) === key));
  return matches.length === 1 ? matches[0] : undefined;
}
export function sameContext(a: Context, b: Context) { return a.os !== 'unknown' && a.distribution !== 'unknown' && a.os === b.os && a.distribution === b.distribution && a.version === b.version; }
export function related(a: Issue, b: Issue) {
  if (!sameContext(a.context, b.context)) return false;
  const ta = normalize(a.reviewedText), tb = normalize(b.reviewedText);
  if (ta === tb) return true;
  const aa = new Set(ta.split(' ').filter(w => w.length > 2));
  const bb = new Set(tb.split(' ').filter(w => w.length > 2));
  const overlap = [...aa].filter(w => bb.has(w)).length;
  return overlap >= 4 && overlap / Math.max(aa.size, bb.size) >= 0.6;
}
