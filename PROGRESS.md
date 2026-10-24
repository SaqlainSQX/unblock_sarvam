# Progress and evidence

## Current state

- Phase: implementation underway; GitHub connected, scaffold and domain/store implemented.
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
- [ ] Gate 2: complete text workflow
- [ ] Gate 3: media/adapters/budget/cache
- [ ] Gate 4: grounding/grouping
- [ ] Gate 5: full offline checks
- [ ] Gate 6: minimal real integration
- [ ] Gate 7: production cutover/regression

## Evidence log

The next agent must append real entries, not replace failures with summaries.

| Date/time | Gate | Command or action | Outcome | Evidence | Mode |
| --- | --- | --- | --- | --- | --- |
| 2026-10-24 16:02 IST | 0–1 | `npm run typecheck`; `npm test`; local dev startup | Typecheck passed; 5 tests passed, including individual feedback/reuse, scope, permissions, stale revisions, idempotency and concurrent/restarted store | Local command output | Offline; zero inference |
| 2026-10-24 16:02 IST | 0–1 | Initial domain test run | Failed because sandbox temporary directory denied replacement rename; tests moved to isolated `.data/tests` and passed without weakening atomic writes | Local command output | Offline |
| 2026-10-24 16:00 IST | GitHub | Initialize and push handoff | `main` tracks `origin/main`; initial handoff pushed | Commit `7eb0ba7` | GitHub; no inference |
| 2026-10-24 15:54 IST | Handoff only | `node scripts/validate-handoff.mjs` | Passed: JSON parsing, local links, seed/scenario references, safe env defaults, PNG/WAV integrity | Reproducible local checker; 5 source-reviewed FAQs, 2 drafts, 24 scenarios, 3.095s mono 16kHz PCM WAV | Offline; zero inference |
| 2026-10-24 15:54 IST | Handoff only | Visual inspection of generated question-card PNG | Readable question, context and synthetic label; no real attendee content | `fixtures/media/question-card.png` | Local image inspection |

These checks validate the handoff assets only. No application exists yet; no application tests, microphone capture check, ASR, OCR or TTS inference has been performed in this preparation pass. The sample audio was generated with a stock Windows offline voice; its container/duration were checked, not its recognition accuracy.

## Live implementation budget

- Cap: six inference submissions during development validation, distinct from the earlier independent chat smoke test.
- Target: four (one per capability), up to two justified repair/final-route checks.
- Used by implementing agent: 0.
- Persist authoritative usage in the application ledger; update this summary after a paid check.
- Never reset usage because the process restarts or fixture data is cleared.

## Known decisions and blockers

- Kivi public documentation describes Mac. The existing Windows installer does not establish workshop support instructions. Workshop-specific FAQs stay drafts until the mentor provides and approves their content.
- Public docs can be inconsistent about model versions and field names. Use current endpoint reference and test adapters offline; record any corrections.
- Before implementing Vision polling, inspect the current official JS SDK exports/types to resolve the new Document AI status/results namespace and transport paths. Do not mix the older Document Digitization schema with the new extract endpoint. The exact transport remains an explicit adapter-preflight task.
- Kivi support matching and Sarvam API entitlement are separate concerns.

## Next action

Read AGENTS.md, execute Gate 0, and implement the domain/store vertical slice. Keep inference disabled.

## Resume template

Last completed gate:
Changed files:
Checks actually run:
Unresolved failure:
Next concrete action:
Live dispatches used / remaining:
Production fixture-removal status:
