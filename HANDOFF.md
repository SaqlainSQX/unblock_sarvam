# Prompt for Sol 6.1

Implement **Unblock — Kivi Workshop Edition** in `G:\Sarvam` from this handoff. The user has selected this product and wants a finished, tested local application; this preparation pass created documents and fixtures only. Inspect the current files before making changes.

Read `AGENTS.md`, `README.md`, `PRD.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `TESTING.md`, `LIVE_CUTOVER.md`, `docs/AI_CONTRACTS.md`, and `PROGRESS.md`. Use `docs/SOURCES.md` for verified API/product references. Keep existing files, including the Kivi installer, intact.

Build the narrow workshop loop: participant text/voice/screenshot -> applicable sourced FAQ or mentor queue -> mentor-confirmed grouping -> one answer delivered to selected participants -> independent Solved/Still stuck feedback -> explicitly approved scoped FAQ reuse. Make the participant and mentor interfaces polished, clear and usable on desktop/mobile. Do not add a general chatbot, vector database, Kivi integration, or unrelated features.

Execute Gates 0–7 in order and continue through implementation, testing and local release. Make routine choices yourself and keep `PROGRESS.md` current with actual checks, failures, next actions and dispatch counts. Do not stop after scaffolding or a mock demo. Do not claim a test ran unless it did.

Conserve API credits: use the supplied synthetic fixtures and intercepted HTTP to implement and verify every route, media path and failure state first. Default tests must block external inference. Only after all offline gates pass may you run the minimal real Sarvam validation: target one call each for ASR, vision, chat and TTS; maximum six inference submissions total including repairs/final-route checks. Enforce the ceiling in a persistent server ledger before network dispatch. Disable automatic paid retries. Use the key from private environment configuration only; never copy it into code or echo it. If missing, finish offline work before asking for it.

After successful integration remove runtime placeholder selection, sample participants/fixes and fake metrics from the production application. Retain fixtures only for tests. Repeat the entire regression suite and verify the final production server; authentic cached responses may save credits, but label cache/replay evidence honestly. No fallback may fabricate a successful API result.

Public Kivi guidance currently describes Mac; the local Windows installer does not authorize guessed Windows instructions. Preserve FAQ source/platform/version restrictions. Model suggestions cannot approve a fix, confirm a group, execute commands, or mark participants resolved. The user decides Solved/Still stuck independently.

Deliver the working local URL, exact commands, recorded tests, actual live-call count, and material limitations. If a provider capability is blocked by credits or entitlement, report the precise blocker and unfinished gate while preserving completed work. Do not deploy or publish externally as part of this task. Do not spawn other agents unless the human explicitly requests delegation.
