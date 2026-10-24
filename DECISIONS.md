# Accepted design decisions

These decisions keep a one-workshop build focused. Record a short reason and test impact here before changing one; no separate approval is needed for routine implementation details.

| ID | Decision | Reason and consequence |
| --- | --- | --- |
| D01 | Independent Kivi workshop companion | Useful to attendees and the ecosystem team without undocumented Kivi integrations or access to devices. |
| D02 | Approved FAQ selection, not open-ended troubleshooting generation | Answers have provenance and scope. Unknown questions become mentor work, not invented fixes. |
| D03 | Mentor confirms groups and approves reusable answers | Similar wording can hide different platforms or root causes. Model output is a proposal. |
| D04 | Answer delivery and participant resolution are separate | A broadcast answer does not prove anyone was unblocked. Metrics count actual feedback. |
| D05 | Public Mac guidance cannot answer unknown Windows workshop setup | The installer filename is not an authoritative support manual. Campus-specific FAQs start as drafts. |
| D06 | Next.js/TypeScript, one Node process | UI and protected server routes share types; minimal deployment surface for a laptop demo. |
| D07 | Serialized atomic JSON persistence behind a store interface | No native database setup in the timed build. Requires one process and durable local disk; test concurrency/restarts. Migrate to SQLite before multi-process use. |
| D08 | No embeddings/vector database or agent framework | A handful of FAQs and groups fit one bounded classification call. Fewer moving parts and paid operations. |
| D09 | Explicit media processing and on-demand TTS | Users review sensitive inputs and avoid repeated charges. Text remains usable when a capability fails. |
| D10 | Separate help and processing states | Provider failure does not erase a saved support request or falsely resolve it. |
| D11 | Test-first fixture workflow; real provider at release | Full regression remains affordable. Production failures stay honest. |
| D12 | Four-call target, six-call validation ceiling | Enough for one proof per capability and limited repairs; ledger persists across restarts and data resets. |
| D13 | English/Hindi UI content and voice demo first | Demonstrate a credible multilingual workflow without claiming every capability supports every scheduled language. Expand only after validation. |
| D14 | No external publishing during implementation by default | Localhost is enough for the interview demo. Multi-device HTTPS hosting and durable storage need a separate deployment choice. |

## Deliberate limitations

Anonymous sessions are a workshop convenience, not full account recovery. Clearing a browser cookie loses self-service access to that private history. A mentor passcode is suitable for this controlled prototype, not production organization access control. The application is not a general support agent, a computer-control tool, or a substitute for official Kivi instructions.

The ambitious one-hour plan is a scope/prioritization target. Correctness gates outrank the timer. Cut optional decoration before cutting the closed loop of approved answer -> recipient feedback -> reusable knowledge.
