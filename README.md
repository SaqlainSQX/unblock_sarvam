# Unblock — Kivi Workshop Edition

A multilingual workshop help desk: answer recurring questions from verified guidance, group related unresolved reports, let mentors answer once, and track who is actually unblocked.

## Current status

**This repository is an implementation handoff, not a working application.** The user requested documents and fixtures for Sol 6.1 to implement. No application dependencies have been installed. No application tests or new Sarvam calls have been run during preparation.

An earlier, separate chat smoke test succeeded with `sarvam-105b-conversations` (HTTP 200, 40 total tokens). This establishes that chat worked then; it does not establish speech, vision, current credits, or application readiness. No credential is stored here.

## Start here

1. Read [AGENTS.md](AGENTS.md).
2. Read [PRD.md](PRD.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
3. Execute [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) in order.
4. Follow [TESTING.md](TESTING.md) and [LIVE_CUTOVER.md](LIVE_CUTOVER.md).
5. Update [PROGRESS.md](PROGRESS.md) after every milestone.

Paste [HANDOFF.md](HANDOFF.md) into the implementing agent to begin.

The handoff itself can be checked now, without installing dependencies: `node scripts/validate-handoff.mjs`. The [checker](scripts/validate-handoff.mjs) validates local links, FAQ/scenario consistency, empty credential defaults, and sample-media integrity. It does not validate an application that has not been built.

## The product in one minute

- A participant asks by text or a short voice recording and optionally attaches a screenshot.
- An applicable approved FAQ is offered with its source and platform scope.
- Unanswered or ambiguous issues enter a mentor queue; related issues are suggested as groups.
- A mentor publishes an answer to selected members and can approve it for future reuse.
- Each participant independently selects **Solved** or **Still stuck**.
- Dashboard counts represent actual participant states, not invented impact metrics.

This is an independent workshop companion built with Sarvam APIs. It does not require a Kivi API, plugin, account integration, or access to participants' computers.

## Handoff map

| File | Purpose |
| --- | --- |
| [PRD.md](PRD.md) | User flows, UI, scope, acceptance criteria |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, persistence, boundaries, data model, routes |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Ordered milestones and completion gates |
| [TESTING.md](TESTING.md) | Offline test matrix, browser tests, regression requirements |
| [LIVE_CUTOVER.md](LIVE_CUTOVER.md) | Budget, actual integration, removal of runtime fixtures |
| [DECISIONS.md](DECISIONS.md) | Accepted tradeoffs and how to change them |
| [docs/AI_CONTRACTS.md](docs/AI_CONTRACTS.md) | Provider interface, prompt constraints, API references |
| [docs/DEMO.md](docs/DEMO.md) | Honest demo, rehearsals, release checklist |
| [docs/SOURCES.md](docs/SOURCES.md) | Official sources, scope, unresolved facts |
| [data/faq.seed.json](data/faq.seed.json) | Source-reviewed starter guidance and unpublished drafts |
| [fixtures/README.md](fixtures/README.md) | Synthetic test data and expected use |

## Intended implementation

Next.js App Router, React, TypeScript, a single Node server, local file persistence, Zod validation, Vitest, and Playwright. Use the installed Node 22 runtime. Choose mutually compatible current package versions once and commit the lockfile when implementation begins. Keep the existing `Kivi-win-x64-stable-1.9.6.exe` untouched and untracked.

The implementing agent will create these commands; **they do not exist yet**:

```text
npm run dev:fixtures      # unmistakably labelled, offline development only
npm run typecheck
npm run lint
npm test
npm run test:e2e          # offline transport interception
npm run build
npm run start            # release: live provider only, no sample data
npm run test:live         # explicitly enabled, budget-limited smoke checks
npm run verify:release   # fixture import, credential, route and data checks
```

## Working agreement

Use fixtures until all offline gates pass. Only then use a small, measured live validation run. Keep fixtures in test tooling after cutover, but remove fixture responses, sample participants, fake counts, and fixture controls from the released app. A failed API call must produce an honest failure state, never a fabricated success.

Do not publish this app or upload real participant material as part of the handoff. Local implementation and narrowly scoped live checks are the next agent's task.
