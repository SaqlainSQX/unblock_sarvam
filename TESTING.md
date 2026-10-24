# Verification plan

This file specifies tests to implement. It does not claim the application or tests exist yet. Read [PRD.md](PRD.md), [AI contracts](docs/AI_CONTRACTS.md), and [scenario catalog](fixtures/scenarios.json).

## Three distinct forms of evidence

1. **Offline fixture tests:** deterministic behavior, no Sarvam requests. Test domain logic and the actual HTTP adapters with transport interception.
2. **Live integration:** one small real request per capability, only after Gate 5, recorded in the persistent ledger. Follow [LIVE_CUTOVER.md](LIVE_CUTOVER.md).
3. **Final regression:** repeat offline checks after runtime fixture removal; start the production build; exercise its routes with real adapters and previously verified real cache entries where appropriate. Label a cache hit or replay accurately.

Never describe a fake provider result as live evidence. A passing typecheck is not a working browser flow. A 200 response with empty or unusable content is not successful integration.

## Required commands

The implementing agent creates these scripts and documents their exact behavior:

| Command | Requirement |
| --- | --- |
| `npm run typecheck` | Strict application and test TypeScript |
| `npm run lint` | Supported linter CLI; no dependency on removed framework commands |
| `npm test` | Unit + route/store/provider integration; outbound inference denied |
| `npm run test:e2e` | Playwright against isolated persistent test data; outbound inference denied |
| `npm run build` | Actual production build; no credentials needed to compile |
| `npm run verify:release` | Production fixture graph, fake data, env, assets and secret checks |
| `npm run test:live` | Explicit opt-in only; ledger reservations; never part of default test/build/start |

Use temporary data directories for tests. Never wipe the developer's `.data/` or dispatch ledger. Block external inference at the transport layer, including unexpected calls; missing mocks must fail rather than reach the network. Test mode does not imply permission to bypass authorization or schema validation.

## Domain and persistence matrix

| Area | Required assertions |
| --- | --- |
| State machine | New unknown -> needs_mentor; delivery -> answer_available; owner feedback -> resolved/fix_failed; reopen -> needs_mentor. Processing status never substitutes for help state. |
| Independent feedback | Two recipients receive one answer. One resolves, one fails. Only the first leaves the blocked count; group delivery does not resolve everyone. |
| Revision integrity | Edit during model request; discard stale completion. A delayed feedback event for an old answer cannot override the latest delivery. |
| Idempotency | Same key/body returns original result without duplicate issue, delivery, publication or charge. Same key/different body returns 409. |
| Atomic store | Concurrent writes preserve both changes; failed persistence publishes neither a partial write nor false success; restart reloads state. |
| Transaction boundaries | Answer + all selected deliveries + event commit together. No partially answered group. |
| FAQ versions | New version does not mutate past delivered text; withdrawal prevents reuse and invalidates matching/TTS caches for new requests. |
| Seed import | Runs twice and across restart without duplicating FAQs or overwriting mentor edits. Drafts never become match candidates. |
| Counts | Distinct participant counts, repeated submissions, failed fixes, and resolved states agree with actual stored events. No synthetic impact multipliers. |

## Matching and grouping matrix

Run all `S01`–`S24` scenarios in [fixtures/scenarios.json](fixtures/scenarios.json). Convert expectations to executable tests; the JSON is a specification, not already a test runner.

- Hard-filter by OS/distribution and known version constraints before and after the model. Missing required context produces a clarification/mentor outcome, not an assumed match.
- Match an approved FAQ by ID only if compatible; copy its approved body. Do not let the classifier write troubleshooting instructions.
- English/Hindi/Hinglish paraphrases can select the same eligible FAQ. Do not compare whole multilingual strings for exact equality in the live semantic smoke check.
- A quoted symptom must be present in reviewed input. Reject invented IDs, injected commands, unsupported evidence, duplicate keys and schema violations.
- Same error code on different distributions/versions is not enough for grouping. Model suggestions never silently confirm group membership.
- Repeated unresolved questions without a safe answer remain visible. A low-confidence/ambiguous result is a useful outcome, not a reason to fabricate certainty.

## Provider contract tests

Use the real adapter implementation with an intercepted `fetch` or SDK transport. Synthetic normalized responses alone cannot prove serialization is correct.

| Adapter | Success checks | Failure checks |
| --- | --- | --- |
| Chat | Correct model/header, bounded token request, JSON parse + schema + candidate/evidence validation | Missing choice, empty content, truncated completion, malformed JSON, invented FAQ/group ID, 401/403/402/429/5xx, timeout |
| ASR | Multipart has genuine WAV bytes and model/mode; transcript + nullable language mapped | Empty transcript, unsupported format, invalid magic, excessive duration, cancelled recording, upstream errors |
| Vision | Correct extract multipart, persist job ID, bounded status polling, structured result retrieval | Pending timeout, restart with existing job, failed/rejected/partial unusable result, malformed fields, no duplicate submission |
| TTS | Exact approved body/version/language; base64 audio decoded and MIME validated; caching | Invalid/empty base64, invalid container, unsupported language/body, withdrawn answer, playback rejection, upstream errors |
| Budget/cache | Atomic reservations; deduplicate concurrent same fingerprint; returned usage recorded | Six already spent -> no dispatch; ambiguous timeout stays spent; restart preserves total; changed input/model/FAQ revision is a miss |

Budget tests should launch concurrent reservations when one slot remains and assert exactly one is admitted. Cache tests must include workshop/user scope, language, audio format, prompt version, and FAQ revision. A cache hit is not a new paid dispatch. Count ordinary HTTP polling separately.

## Authorization and uploads

- Independent browser contexts A/B: B cannot read, edit, provide feedback on, or obtain audio/media for A's private issue by guessing IDs.
- Participant cannot access mentor board, publish answer, change FAQ approval, or confirm group. No role from request body is trusted.
- Mentor passcode failure is throttled; no secret appears in URL, response or browser bundle. Browser mutation Origin checks reject cross-site requests.
- Reject oversized, empty, invalid-magic, mismatched MIME, excessive-dimension images and path-traversal filenames. SVG/HTML/PDF/archive are outside this MVP upload contract.
- Validate WAV container/duration and bounded decoding. ASR upload alternative remains usable when microphone permission is denied.
- Screenshot and transcript prompt injection stays text; HTML/Markdown output cannot execute scripts. Public health leaks no key, paths, passcode or participant details.

## Browser acceptance walkthrough

1. In participant A, choose macOS/public context and ask the known selected-text question. Show the sourced answer and **Solved / Still stuck** controls. Mark solved.
2. In B and C, submit the same explicitly synthetic unknown issue. Both stay unresolved. In mentor context, inspect evidence and confirm the proposed group.
3. Publish one reviewed answer to B/C. Their cards update through app polling; neither is automatically resolved.
4. B marks solved; C marks still stuck and adds attempted steps. Verify queue, labels and counts.
5. Mentor explicitly publishes the answer as a scoped reusable FAQ. In D, the same compatible question receives the new approved version. Wrong-platform participant E does not.
6. Amend/withdraw that FAQ. Preserve previous delivery history, prevent stale automatic reuse, and display the changed status.
7. Record or upload actual audio, preview, process with mocked ASR, edit transcript; upload image, process mocked OCR, edit extracted text; submit once. Play mocked TTS only on click. Cancel and permission-denied paths work.
8. Refresh and restart server; private history and mentor decisions persist. Stop provider responses: text submission still reaches mentor with an honest error.

At least one automated test uses a real browser audio file injection, rather than replacing the entire recorder component. Manually verify microphone permission/capture and audible playback on the target laptop; synthetic media cannot prove the physical microphone works.

## Visual and accessibility checks

Inspect desktop (approximately 1440px) and narrow mobile (390px). Capture readable screenshots of participant empty/input/answer/failed states and mentor grouped queue. Verify tab order, visible focus, field labels, keyboard activation, live status announcements, contrast, long Hindi text wrapping, no overlap, and no autoplay. Resolve errors from the browser console. Do not use fixed delays when a role/status assertion can wait for the actual state.

## Evidence and exit criteria

Append timestamp, command/action, mode, outcome and artifact location to [PROGRESS.md](PROGRESS.md). Store private live payloads only in ignored local evidence. Record failing assertions and what was fixed before re-running. Do not fill the evidence table with planned actions.

Gate 5 requires the entire offline matrix, application build and P01–P16 acceptance checks. Gate 7 requires these checks again after cutover, production smoke evidence, no runtime placeholder path, and a truthful list of remaining limitations. If a required capability is blocked by entitlement, say the project is incomplete for the four-model objective; do not pass it with a fixture.
