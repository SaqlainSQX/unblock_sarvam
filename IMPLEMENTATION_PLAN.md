# Implementation plan for Sol 6.1

## Execution contract

Implement the application after reading the handoff. No paid calls before Gate 6. Complete and record each gate in `PROGRESS.md`; do not mark unchecked work done. The one-hour budget is a prioritization target, not permission to hide failures or stop at a polished mock. If actual time runs longer, report it and continue within scope.

Suggested first-hour allocation: 0–8 min scaffold/types, 8–22 domain/store/routes, 22–38 UI + core workflow, 38–48 media/provider adapters, 48–56 offline checks, 56–60 readiness review. Live validation follows only when genuinely ready; do not skip testing to hit the clock.

## Gate 0 — Inspect and establish environment

- Inspect workspace and instructions. Preserve existing files, including the Kivi installer.
- Use Node 22; scaffold Next.js without overwriting these documents or fixtures.
- Choose compatible packages and pin with a lockfile. Add Zod, Vitest, Playwright; avoid unnecessary component packages.
- Implement documented npm scripts. Create `.env.local` from `.env.example` with live access disabled and empty key if one is not already configured. Do not put the chat key into source.
- Add a short architecture decision only if changing the chosen stack.

Exit: application shell starts; typecheck and the first genuine domain test run; zero inference dispatches.

## Gate 1 — Freeze domain types, state machine, store

- Implement entities and DTO projections from `ARCHITECTURE.md`.
- Import FAQ seed idempotently; never overwrite mentor edits on restart.
- Implement status transitions, immutable answers/deliveries, independent outcomes, optimistic revisions, idempotency, and event records.
- Implement one-process persistent store with serialized atomic transactions and reload recovery.
- Add role/ownership checks and mentor login. Test these before rendering private data.

Exit: tests cover state transitions, duplicate feedback, concurrent writes, stale revisions, restart, and authorization.

## Gate 2 — Deliver the complete text-only product

- Participant can submit text, choose context, view own history, get known scoped answer, mark solved/failed/reopen.
- Mentor sees queues and counts, confirms/splits candidate groups, publishes one answer to selected recipients, approves reusable FAQ.
- A new participant can receive the newly approved answer. Cache/matching uses new FAQ version; older deliveries retain old text.
- Build the participant and mentor views with useful empty/loading/error states. Poll state only; never trigger inference from render/effect loops.

Use an injected deterministic fixture classifier now. Its rules and output must be visible as test data, not hidden canned product behavior. Fixture development displays a persistent banner.

Exit: browser test demonstrates A -> known FAQ; B/C -> unknown grouped; mentor answers; B solved/C failed; D -> approved reuse. No paid calls.

## Gate 3 — Media and provider boundaries

- Implement recorder with actual microphone capture, stop/cancel, 20s cap, preview and transcript review. Prefer a small browser PCM-to-WAV path using AudioContext/AudioWorklet; do not rename WebM bytes to WAV. If using MediaRecorder, validate actual supported MIME against the endpoint before choosing it and test the target browser. Keep upload alternative.
- Implement screenshot validation, preview, OCR progress, review and manual-text fallback.
- Implement typed provider interface and HTTP adapters. Unit test request serialization against referenced API contracts using intercepted HTTP.
- Implement on-demand speech playback from approved answer text. Reject unsupported/missing language variants honestly; do not generate a separate unapproved troubleshooting answer through TTS.
- Implement ledger, cache, in-flight deduplication, job ID persistence, error mapping, timeouts, and bounded polling.

Exit: all media controls function with explicit synthetic inputs, mocked provider success/failure, and no external inference traffic.

## Gate 4 — Grounding, grouping, answer quality

- Apply hard scope filters before classifier call and again after output validation.
- Prompt only with candidate approved answer IDs and candidate group summaries, limited source data, and a JSON contract.
- Validate quotations against actual input, verify IDs, handle malformed or contradictory proposals, and reject injected instructions.
- Group suggestions remain proposals until mentor review. Same error code without same context is insufficient.
- Ensure answer_available never means resolved; counts are derived from participants and states.
- Ensure failed fixes retain attempted steps, and withdrawn FAQs cannot be silently reused from cache.

Exit: relevant matching/grouping tests from `TESTING.md` pass, including different OS/version and stale cache.

## Gate 5 — Offline completeness and production adapter readiness

- Run typecheck, lint, unit/integration tests, offline Playwright, and production build.
- Exercise all P0 paths and failure states, desktop/mobile, keyboard navigation, and restart persistence.
- Intercept provider HTTP at transport boundary so the real adapter parsing/serialization is tested. Do not test only a fake provider implementation.
- Validate release provider factory and absence of credential leakage. Confirm live dispatch ledger remains zero.
- Make sure all application code for the live path is ready. Review exact SDK/HTTP signatures; do not spend calls to guess them.

Exit: record passing commands and limitations. If any P0 path is missing, continue offline work.

## Gate 6 — Minimal real integration proof

Follow `LIVE_CUTOVER.md` exactly. Target one compact chain: a short real audio file (human recording or labelled offline synthesized speech) -> ASR; one legible synthetic question-card image -> OCR; combined reviewed text -> chat matching; short approved answer -> TTS. Separately check actual microphone capture locally.

- Use configured key only. A missing key blocks this gate, not earlier work.
- Reserve each dispatch before network use. Four capabilities target four inference submissions, with a maximum six total development submissions for repair.
- Save sanitized real response evidence privately for replay and mark its origin.
- Stop blind retries on auth, entitlement, billing, schema, or uncertain timeout. Fix locally and spend a repair dispatch only when justified.

Exit: all four capabilities demonstrably work or remain explicitly blocked. Earlier chat success does not waive current integration verification.

## Gate 7 — Remove runtime placeholders, retest, release locally

- Remove temporary dev provider selection from the production dependency graph; keep fixtures and test doubles only in testing tooling.
- Clear synthetic participants, groups, answers, and metrics from the release data directory. Retain real source-reviewed FAQs; do not clear the budget ledger.
- Require real server provider configuration in release. Missing key returns a setup error; there is no sample-result fallback.
- Re-run the full offline suite using transport interception, then build and start production with the live adapter.
- Re-run the verified chain through actual production routes using identical approved inputs and correctly labelled cached real responses where possible. One extra chat dispatch may be used if the final route path has not been genuinely exercised, within the six-dispatch cap. Do not call a replay a fresh live test.
- Verify mentor publication/participant feedback/FAQ reuse in the final server; these operations need no extra inference if selecting the approved FAQ directly.
- Update README with exact commands, local URL, configuration, known limitations; record evidence and ledger totals.

Exit: `docs/DEMO.md` release checklist and all P0 criteria pass. Do not deliver an application with fixture mode active or a hidden fake success path.

## If time gets tight

Cut decorative animation, charts, transcript timestamps, advanced filters, drag-and-drop, and visual group editing first. Keep text input, actual media paths, correct matching scope, answer reuse, independent outcomes, authorization, persistence, budget controls, and honest errors. Do not substitute a static screenshot for a working interaction.
