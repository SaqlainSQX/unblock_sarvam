# Progress and evidence

## Current state

- Phase: application implemented; all four capabilities passed live integration; final release regression passed.
- Implementing agent intended by user: Sol 6.1.
- Current user scope: implement the handoff and push each completed task directly to GitHub main.
- Workspace: `G:\Sarvam`.
- Existing file preserved: `Kivi-win-x64-stable-1.9.6.exe`.
- Installed runtime observed: Node v22.13.1, npm 10.9.2, Python 3.13 executable.
- No application dependencies installed by handoff preparation.
- No credential saved in handoff files.
- No new Sarvam requests made during handoff preparation.

## Earlier independent API evidence

Chat request returned HTTP 200 for `sarvam-105b-conversations`, 28 prompt + 12 completion = 40 total tokens, measured 0.62 s. This happened before the handoff. Speech and vision were not checked. These numbers are a historical test result, not a performance claim or an application test.

## Gates

- [x] Gate 0: scaffold/runtime/scripts (final verification scripts arrive with their gates)
- [x] Gate 1: domain/store/authorization
- [x] Gate 2: complete text workflow
- [x] Gate 3: media/adapters/budget/cache
- [x] Gate 4: grounding/grouping
- [x] Gate 5: full offline checks
- [x] Gate 6: minimal real integration
- [x] Gate 7: production cutover/regression

## Evidence log

The next agent must append real entries, not replace failures with summaries.

| Date/time | Gate | Command or action | Outcome | Evidence | Mode |
| --- | --- | --- | --- | --- | --- |
| 2026-10-24 16:45 IST | 6 | Production routes: ASR -> Vision extract -> chat -> TTS | All four passed live. Six submissions total, including two chat repair attempts; prior ASR/Vision stages resumed without another inference | Private `.evidence/live-smoke.json`, `.data/dispatch-ledger.json`, real TTS WAV | Fresh live integration; no placeholder fallback |
| 2026-10-24 16:45 IST | 7 | `npm run typecheck`; `npm run lint`; `npm test`; `npm run test:e2e`; `npm run verify:release` | All passed: 27 unit/integration tests, four production-build browser tests, 66 bundles/eight dependency traces inspected | Local command output and `.evidence/` screenshots | Offline regression on real adapters with test-only interception |
| 2026-10-24 16:45 IST | 7 | `npm run start` | Production ready at http://127.0.0.1:3000; key configured privately, no startup inference | Local server output | Release, live provider enabled |
| 2026-10-24 16:33 IST | 5 | Typecheck, lint, 27 tests, four Playwright browser checks, production build and `verify:release` | Passed. No runtime fixture branch was introduced; all provider simulations live in external test transport tooling. Real implementation dispatch ledger remains absent/zero | Local command output and ignored evidence | Offline only |
| 2026-10-24 16:30 IST | 3–4 | `npm test`; `npm run test:e2e` | 27 unit/integration tests and 4 browser tests passed. Actual adapters intercepted offline; microphone worklet captured supplied browser audio as WAV; screenshot/ASR review and user-triggered TTS tested | `.evidence/media-workflow.png`; local test output | Offline transport interception; no external inference |
| 2026-10-24 16:30 IST | 5 in progress | `npm run build` | Production build passed with elevated Windows junction permission; correcting overly broad file tracing before final release verification | Local build output | No inference |
| 2026-10-24 16:24 IST | 2 | `npm run test:e2e` | 2 passed: complete participant/mentor/group/independent-outcome/reuse/withdrawal loop and desktop/mobile layout | Playwright output; `.evidence/participant-desktop.png`, `.evidence/participant-mobile.png`, `.evidence/gate2-mentor.png` | Offline; real app routes, zero inference |
| 2026-10-24 16:24 IST | 2 | Browser failure repairs | Corrected Origin comparison for Next's internal host rewriting; added bounded Windows rename retry; corrected ambiguous test locator | Re-ran full browser suite successfully | Offline |
| 2026-10-24 16:02 IST | 0–1 | `npm run typecheck`; `npm test`; local dev startup | Typecheck passed; 5 tests passed, including individual feedback/reuse, scope, permissions, stale revisions, idempotency and concurrent/restarted store | Local command output | Offline; zero inference |
| 2026-10-24 16:02 IST | 0–1 | Initial domain test run | Failed because sandbox temporary directory denied replacement rename; tests moved to isolated `.data/tests` and passed without weakening atomic writes | Local command output | Offline |
| 2026-10-24 16:00 IST | GitHub | Initialize and push handoff | `main` tracks `origin/main`; initial handoff pushed | Commit `7eb0ba7` | GitHub; no inference |
| 2026-10-24 15:54 IST | Handoff only | `node scripts/validate-handoff.mjs` | Passed: JSON parsing, local links, seed/scenario references, safe env defaults, PNG/WAV integrity | Reproducible local checker; 5 source-reviewed FAQs, 2 drafts, 24 scenarios, 3.095s mono 16kHz PCM WAV | Offline; zero inference |
| 2026-10-24 15:54 IST | Handoff only | Visual inspection of generated question-card PNG | Readable question, context and synthetic label; no real attendee content | `fixtures/media/question-card.png` | Local image inspection |

The original handoff-preparation checks validated assets only. At that time no application existed and no application tests or new inference had been performed; later implementation and live evidence are recorded above. The sample audio was generated with a stock Windows offline voice; its container/duration were checked, not its recognition accuracy.

## Live implementation budget

- Cap: six inference submissions during development validation, distinct from the earlier independent chat smoke test.
- Target: four (one per capability), up to two justified repair/final-route checks.
- Used for live validation: 6 (ASR 1, Vision 1, chat 3 including repairs, TTS 1).
- User then explicitly authorized additional paid demo usage. Private local cap is now 30 cumulative submissions, leaving 24 after validation. No ledger reset occurred; example configuration retains conservative six-call default.
- Persist authoritative usage in the application ledger; update this summary after a paid check.
- Never reset usage because the process restarts or fixture data is cleared.

## Known decisions and blockers

- Kivi public documentation describes Mac. The existing Windows installer does not establish workshop support instructions. Workshop-specific FAQs stay drafts until the mentor provides and approves their content.
- Public docs can be inconsistent about model versions and field names. Use current endpoint reference and test adapters offline; record any corrections.
- Vision transport was verified from official sarvamai 1.1.12 source and passed live extraction/status/results calls.
- Chat repair: strict JSON Schema prevents code fences/incorrect evidence keys; numeric usage counters are extracted while nested/null detail objects are accepted. These cases have offline regression assertions.
- Browser tests now use the production build. Parallel development servers rewrote Next-generated types and caused reload loops; production testing removes that file-watcher conflict.
- Physical laptop microphone/noisy-room accuracy was not manually established; automated browser capture used the supplied speech WAV and passed. No public deployment or multi-device HTTPS setup was attempted.
- Kivi support matching and Sarvam API entitlement are separate concerns.

## Next action

Use the local participant page and mentor desk. Private mentor access is also in ignored `.evidence/mentor-access.txt`. All subsequent work should preserve the dispatch history and reuse the existing implementation.

## Resume template

Last completed gate:
Changed files:
Checks actually run:
Unresolved failure:
Next concrete action:
Live dispatches used / remaining:
Production fixture-removal status:
