import { z } from 'zod';
export const contextSchema = z.object({
  os: z.enum(['macos', 'windows', 'other', 'unknown']), distribution: z.enum(['public', 'workshop', 'unknown']),
  version: z.string().trim().max(40).nullable().default(null), targetApp: z.string().trim().max(100).optional(), errorText: z.string().trim().max(500).optional(),
}).strict();
export const scopeSchema = z.object({
  os: z.array(z.enum(['macos', 'windows', 'other'])).min(1).max(3),
  distribution: z.array(z.enum(['public', 'workshop'])).min(1).max(2),
  versionPolicy: z.enum(['documented_public', 'exact', 'independent']), versions: z.array(z.string().trim().min(1).max(40)).max(10), rationale: z.string().trim().min(5).max(500),
}).strict().refine(s => s.versionPolicy !== 'exact' || s.versions.length > 0, { message: 'Enter at least one exact Kivi version.' });
export const sourceSchema = z.object({ url: z.union([z.url().refine(s => /^https?:\/\//.test(s), 'Use an HTTP or HTTPS source URL.'), z.null()]), note: z.string().trim().min(5).max(600) }).strict();
export const issueSchema = z.object({
  reviewedText: z.string().trim().min(3).max(2000), originalText: z.string().max(2000).optional(), transcript: z.string().max(2000).default(''), ocrText: z.string().max(4000).default(''),
  context: contextSchema, attemptedSteps: z.string().max(1000).default(''), mediaIds: z.array(z.string().uuid()).max(2).default([]), faqId: z.string().max(100).optional(),
}).strict();
export const revisionSchema = z.number().int().min(1);
export const feedbackSchema = z.object({ outcome: z.enum(['solved', 'failed', 'reopen']), answerId: z.string().max(100).nullable(), attemptedSteps: z.string().max(1000).default(''), revision: revisionSchema }).strict();
export const answerSchema = z.object({
  title: z.string().trim().min(3).max(120), bodyEn: z.string().trim().min(5).max(2000), bodyHi: z.string().trim().max(2000).default(''),
  source: sourceSchema, scope: scopeSchema, recipients: z.array(z.object({ id: z.string().uuid(), revision: revisionSchema })).min(1).max(100),
}).strict();
export const faqSchema = z.object({ answerId: z.string().max(100), searchPhrases: z.array(z.string().trim().min(3).max(200)).min(1).max(12) }).strict();
export const faqEditSchema = z.object({ revision: revisionSchema, withdraw: z.boolean().optional(), title: z.string().trim().min(3).max(120).optional(), bodyEn: z.string().trim().min(5).max(2000).optional(), bodyHi: z.string().trim().max(2000).optional(), scope: scopeSchema.optional(), source: sourceSchema.optional(), searchPhrases: z.array(z.string().trim().min(3).max(200)).min(1).max(12).optional() }).strict();
export const groupSchema = z.object({ title: z.string().trim().min(3).max(120), members: z.array(z.object({ id: z.string().uuid(), revision: revisionSchema })).min(1).max(100) }).strict();
export type IssueInput = z.infer<typeof issueSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
