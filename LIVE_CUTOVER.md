# Live integration and final cutover

This is the final implementation phase. Do not perform these calls while preparing the handoff. [TESTING.md](TESTING.md) must pass offline first.

## Spend policy

The user wants to conserve credits. Target **four inference submissions**: one ASR, one vision extraction job, one chat classification, one TTS. Permit at most **six total** implementation validation submissions, including repairs and a necessary final-route check. The earlier independent chat check is historical and outside this new six-call allowance.

This cap is a local engineering guard, not a statement of rupee cost or provider billing. Models may charge by different units; record tokens, characters, audio duration and pages when available. Do not infer current prices or discounts from a pasted banner. Status/result HTTP requests are recorded separately and are not new inference submissions; do not claim that makes them free under every billing policy.

Before each submission, atomically persist a reservation in a durable ledger separate from resettable application test state. Attempted and uncertain requests consume a slot. Never refund an ambiguous timeout, silently retry a POST, clear usage on restart, switch API keys to bypass the cap, or raise the cap automatically. Disable SDK retries for chargeable requests. On cap exhaustion, finish unaffected work and report the exact remaining integration blocker.

The ledger has one deployment-wide owner on the single server. After validation, the same six-dispatch guard remains conservative by default. Before an actual workshop, the human can choose a new explicit event budget; do not silently convert validation mode into unrestricted spending.

## Readiness checklist

- [ ] Gates 0–5 complete with recorded evidence.
- [ ] Exact API methods/fields verified against current reference and tested with intercepted transport.
- [ ] Real adapters, timeout handling, cache, job persistence, ledger and auth already implemented.
- [ ] No live calls happen on install, build, startup, GET, health checks or UI polling.
- [ ] A legible non-sensitive PNG and short valid speech WAV are ready; both are labelled synthetic test input if generated offline.
- [ ] Cache fingerprints include input bytes/revision, model, prompt/schema version, scope, language and relevant answer/FAQ versions.
- [ ] Key and mentor passcode configured privately in `.env.local`/environment; neither printed. Missing key is requested only now if unavailable.
- [ ] Explicit local opt-in enables live mode; default remains disabled. Test runner must not turn it on by itself.

## One chain, four calls

Use the sample question “How can I edit selected text in Kivi?” with macOS/public context. The source-reviewed FAQ `kivi-selected-text` is the intended candidate. The supplied screenshot is a question card, not a screenshot of the real Kivi product. The WAV is stock offline speech, not evidence of accent robustness. Separately test an actual human microphone recording locally without calling ASR again unless needed and budgeted.

| Step | Submission | Evidence required |
| --- | --- | --- |
| 1 | ASR on the short WAV | Nonempty recognizable question, language metadata if supplied, duration, provider request ID |
| 2 | Document AI extract on one PNG | Stored job ID, terminal successful state, usable extracted question text; bounded status polling |
| 3 | Chat once on reviewed transcript/OCR plus compatible candidates | Valid schema, only allowed FAQ/group IDs, grounded evidence; correct FAQ or conservative no-match |
| 4 | TTS on short approved FAQ text | Decoded real playable audio; correct language/model; user-initiated playback |

Route these through the actual application services/routes where possible so the same four calls prove integration, not just standalone scripts. A deterministic explicit FAQ selection normally avoids chat; for this diagnostic step deliberately exercise the actual classifier once on a paraphrase. Do not force a false correct match if the live classifier returns no-match: inspect the prompt locally, record the result, and repair within the remaining allowance if needed.

Keep inputs small: speech under 10 seconds, one image under 5 MB, chat candidate list small and completion bounded, one TTS text under 450 characters. No autonomous retry loops or model benchmarking.

## Failure handling

- Authentication, entitlement, exhausted credit or unsupported model: stop that capability. Inspect safe status/configuration and explain the issue. No repeated probing.
- Invalid request schema: correct from official reference; retest serialization offline before spending a repair call.
- Timeout after dispatch: count as spent. Vision resumes the existing job when its ID is known; never submit another job just because polling timed out.
- Poll at about five-second intervals with a maximum twenty polls per attempt. Persist status and permit explicit resume on the same job. Stop immediately on terminal rejected/failed or completed states.
- Empty/partial/malformed output: save safe diagnostic metadata, show honest failure, keep the participant issue. No fixture substitution.
- Four successful capabilities with two slots unused is the ideal result; unused capacity is not an instruction to spend.

## Remove placeholders correctly

Fixtures and test doubles **stay in test tooling** so future checks cost nothing. Remove their production imports, runtime mode selector, fallback responses, fake participants/groups, preset impact metrics and demo answer injection. A visible fixture banner during development is mandatory; a release banner saying “live” must reflect the actual adapter.

Keep the real source-reviewed FAQ seed and deliberate empty states. They are product content, not placeholders. A missing key, provider failure or exhausted budget must never select a fake provider. Development fixture commands must refuse production execution; `verify:release` checks the dependency graph and built assets, not just a single filename search.

Use a fresh release application-data directory or scoped cleanup of known synthetic records; keep ledger and real-response cache/evidence separately. Do not recursively delete arbitrary `.data/` contents or the existing installer. Do not delete the paid-call ledger to obtain a clean-looking demo.

## Final regression

1. Repeat typecheck, lint, all unit/integration/browser checks and production build after removing runtime fixtures.
2. Start the production server with real adapters. Verify no startup inference. Inspect browser bundle/network for credentials and fake data.
3. Exercise the same inputs through final routes. A stored, authentic response may be reused with visible “cached” provenance. A transport replay belongs to testing and must not be smuggled into the production provider. Record exactly which checks were fresh live, real-cache hits, or offline replay.
4. Verify participant submission, mentor grouping/publication, individual feedback and new FAQ reuse on the final server. These can work without additional model calls using explicit approved FAQ selection and mentor decisions.
5. If a final production route needs one new call, use a remaining reservation. Do not exceed six. Verify real playback and manual microphone capture locally.
6. Run `verify:release`, record evidence/usage and update README with working commands and limits. Ensure no synthetic issue remains in the clean release workspace.

Only mark complete when required functionality genuinely passes. If credits/entitlement prevent a capability, preserve the finished offline work and identify that capability and the exact next action. Do not call an incomplete four-model demo finished.
