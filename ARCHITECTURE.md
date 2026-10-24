# Architecture and domain contract

## Stack

Use Next.js App Router + React + TypeScript on a single Node 22 server. Use plain CSS/CSS Modules (or the scaffold's supported Tailwind version if already present), Zod, Vitest, and Playwright. Keep Sarvam HTTP/SDK details in server-only adapters. Native `fetch` is adequate; use an official SDK only if it measurably simplifies the verified API, pinning its version. Avoid extra orchestration frameworks.

For this one-workshop prototype, use a serialized JSON file store under `.data/`, with one writer process. Store interface first; implement atomic temp-write/rename, a process-local write queue, schema version, migrations, and optimistic entity revisions. Commit each operation as one transaction. Concurrent writes and restarts are required tests. If persistence fails, return a failure without publishing a state that was not saved. Do not deploy this store to ephemeral/serverless/multi-instance hosting; document that limitation. SQLite is a later migration, not a prerequisite.

## Proposed source layout

```text
src/app/w/[slug]/page.tsx             participant UI
src/app/mentor/page.tsx               mentor UI
src/app/api/.../route.ts              small validated route handlers
src/components/                     recorder, upload, answer card, queues
src/domain/types.ts                  shared safe DTOs, enums
src/domain/schemas.ts                runtime validators
src/domain/state-machine.ts          transitions and invariants
src/domain/matching.ts               scope filters and deterministic rules
src/domain/grouping.ts               candidate grouping and manual decisions
src/server/store/                    interface, atomic file implementation
src/server/auth.ts                   participant/mentor cookie authorization
src/server/budget.ts                 atomic dispatch reservations
src/server/cache.ts                  content/version-sensitive caches
src/server/providers/sarvam/         chat, ASR, TTS, vision adapters
src/server/providers/contracts.ts    provider-independent typed interfaces
src/server/services/                 issue, answer, FAQ, media services
tests/unit/ tests/integration/ tests/e2e/ tests/helpers/
fixtures/                           synthetic inputs and offline scenarios
data/faq.seed.json                   real, source-reviewed seed knowledge
.data/                              ignored state, private uploads, ledger
```

Client components must never import `src/server`, credentials, raw provider responses, or fixture implementations. Route handlers use Node runtime. All public API responses are projected DTOs with private fields removed.

## Entities

- Workshop: `id`, slug, title, revision, source-reviewed FAQ seed version, createdAt.
- ParticipantSession: opaque random ID, cookie token hash, optional displayName, createdAt. Never accept an arbitrary participant ID as authorization.
- Issue: ID, workshopId, ownerSessionId, revision, inputRevision, originalText, reviewedText, optional transcript, OCR text, context, attemptedSteps, mediaIds, helpState, processingState, processingError, candidateGroupId, confirmedGroupId, answerDeliveryIds, timestamps.
- Context: OS, distribution, Kivi version or null, target app or null, exact error text or null. Do not infer a version from the installer's filename for every attendee.
- FAQ: ID, revision, title, search phrases, approved English/Hindi answer text, scope, approval state (`source_reviewed`, `mentor_approved`, `draft`), approvedBy, source URL/note, reviewedAt, withdrawnAt, supersedesVersion, occurrence count computed from actual assignments.
- Answer: immutable ID/version, author role, approved body and optional Hindi body, source, scope, reusable flag, createdAt. FAQ publication references an answer version.
- AnswerDelivery: issueId, answerVersionId, deliveredAt, participant outcome (`pending`, `solved`, `failed`), attemptedSteps. A new delivery never rewrites an older outcome.
- Group: ID, revision, candidate/confirmed members, normalized symptom, scope, evidence, createdAt. Counts are derived from issues and sessions.
- Media: ID, ownerSessionId, MIME, bytes, SHA-256, private storage path, processing status/job ID, createdAt. No filenames/paths from client are trusted.
- Event: ID, actor, issue/group/FAQ ID, operation, before/after revisions, timestamp. Keep content logs minimal; never include credentials.
- DispatchLedger: persisted entries with request fingerprint, capability, model, startedAt, result, request ID if available, usage if returned, retryOf. Ambiguous failures remain spent.

## API surface to implement

Every mutation validates Origin for browser sessions, checks authorization, validates Zod input, and accepts `Idempotency-Key`. Same key + different payload -> 409. Do not store browser keys containing secrets. Mutation responses include entity revision. Use 409 for stale revisions.

| Route | Access | Contract |
| --- | --- | --- |
| POST `/api/session` | public workshop join | creates participant cookie; no paid request |
| POST `/api/mentor/session` | passcode | creates mentor cookie; throttle failures |
| GET `/api/workshop` | participant/mentor | safe title, FAQs, no private reports |
| GET `/api/issues` | participant | own issues only |
| POST `/api/media` | participant/mentor | accept validated image/audio, return mediaId |
| POST `/api/media/:id/process` | owner/mentor | ASR/OCR once; return status/text; persist job ID |
| GET `/api/media/:id/status` | owner/mentor | processing status; no new inference submission |
| GET `/api/media/:id/content` | owner/mentor | private image/audio, safe Content-Type |
| POST `/api/issues` | participant | save reviewed issue, enqueue/analyze once |
| PATCH `/api/issues/:id` | owner | edit context/text, increment revision, invalidate old analysis |
| POST `/api/issues/:id/analyze` | owner/mentor | explicit retry/re-analysis; cache-aware and budgeted |
| POST `/api/issues/:id/feedback` | owner | solved/failed/reopen, answerVersionId |
| GET `/api/mentor/board` | mentor | queue, suggestions, counts, diagnostics |
| POST `/api/groups` | mentor | confirm members or create group |
| PATCH `/api/groups/:id` | mentor | split/change members with revision check |
| POST `/api/answers` | mentor | reviewed body + selected issue IDs; atomic delivery |
| POST `/api/faqs` | mentor | approve reusable answer with source and scope |
| PATCH `/api/faqs/:id` | mentor | new version or withdrawal |
| POST `/api/answers/:id/audio` | authorized recipient/mentor | requested language of approved version; cached TTS |
| GET `/api/health` | public | non-secret availability only |

Only a mentor sees detailed provider health and dispatch counts. Participant and mentor screens poll ordinary app state every 3–5 seconds, pause when hidden, and never invoke models through GET. Same-session issue queries must not leak other attendees' identities.

## Critical processing rules

1. Save issue -> mark processing -> local scope and exact-match checks -> optional one chat call -> validate proposal -> transactionally apply if input revision still matches -> mark complete.
2. Discard stale completions after edit. They may remain in the ledger but cannot overwrite newer state.
3. Provider timeout leaves the saved issue in `needs_mentor` with an explanatory processing error. An explicit retry is available if budget permits.
4. The chat call may combine FAQ selection and group suggestion. It returns references, not approved answers. Grouping can also use deterministic fingerprints; do not call a second model just to summarize a title.
5. Source-reviewed seed FAQs are real application content. Synthetic reports and fabricated mentor fixes are test-only content.
6. Media submission and processing are separate. Validate and preview first; charge only on explicit processing. A screenshot OCR request reads text only, not a live screen or arbitrary UI state.
7. Keep PDF/archive input out of MVP. Vision provider output may still be an archive; if used, extract text in memory with file-count/size/path limits. Prefer structured extract results when practical.

## Security and runtime basics

Random HttpOnly SameSite cookies; Secure on HTTPS, localhost-compatible in dev. Mentor passcode is an environment secret, checked on server, with no query-string token. Unauthenticated mentor requests -> 401/403. Read ownership applies to media and answers as well as issue routes.

Uploads: MIME + magic-byte checks, generated IDs, size limits, no arbitrary remote URLs, no SVG/HTML uploads, no public upload directory, no path traversal. Enforce bounded image dimensions and audio duration/decoded size. For credentials visible in a screenshot, offer removal/replacement before sending; do not claim perfect automatic redaction. Never log multipart bodies, authorization headers, or complete upstream error payloads. Controlled errors include capability and safe status/code.

A single laptop demo can use localhost and multiple browser sessions. Remote microphone use requires HTTPS; a LAN HTTP URL is not a valid microphone deployment plan. Keep publishing/tunnels as a separate explicit decision.
