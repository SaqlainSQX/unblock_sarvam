# Product requirements

## Product and audience

Unblock is a support companion for a Kivi workshop. Participants need fast, applicable answers. Mentors need a view of unanswered questions, recurring issues, attempted fixes, and people who remain blocked. This is a workshop prototype, not an official Kivi support service or a general autonomous troubleshooting agent.

Success is observable: a known question gets an appropriate sourced answer; unfamiliar reports reach a mentor; one answer can help several people; unresolved participants stay visible; an approved answer can serve a future matching request. Report actual resolution counts and waiting time. Do not claim time or money saved without measurement.

## P0 scope

- One workshop, one mentor role, anonymous participant sessions with optional display name.
- English and Hindi/Hinglish input; output choice English or Hindi. No claim of end-to-end support for all 22 languages.
- Text question (up to 2,000 characters), push-to-talk recording (up to 20 seconds), optional single PNG/JPEG screenshot (up to 5 MB).
- Participant reviews transcription and extracted screenshot text before submitting the issue. Editing resets analysis and uses a new input revision.
- Context: OS (`macos`, `windows`, `other`, `unknown`), distribution (`public`, `workshop`, `unknown`), Kivi version (optional), target app (optional), error text (optional), steps tried.
- Five source-reviewed FAQ entries plus unpublished workshop-specific drafts.
- Source-linked, scope-aware answer matching; no invented fixes.
- Mentor queue, suggested groups, manual group confirmation/splitting, individual and selected-group answers.
- Answer reuse requires explicit mentor approval and applicability fields.
- Per-person Solved / Still stuck, issue history, answer version history.
- Local persistence, reload recovery, actual counters, visible provider errors, cost guard.

## Explicitly deferred

Public deployment, enterprise authentication, arbitrary video/PDF uploads, real-time voice calls, automatic Kivi control, executing commands, WhatsApp/email sending, browser extension, CRM, billing, advanced analytics, cross-workshop recommendations, automatic discovery of new fixes from the internet, and learning a global FAQ from unreviewed user reports.

## Participant flow

1. Open `/w/kivi`; receive a private participant session cookie.
2. Browse approved common FAQs. Ordering uses workshop occurrence counts; with no reports, use a stable editorial order, never fabricated popularity.
3. Type or record a question, optionally upload a screenshot, and provide platform context.
4. Confirm transcript/OCR text and send. The server saves the issue before analysis.
5. Receive an applicable answer with title, exact approved steps, scope, source, and optional approved Hindi text. A proposed answer is labelled Suggested, not guaranteed.
6. Select Solved or Still stuck. Still stuck records the offered answer and attempted steps without forcing the participant to start again.
7. See mentor responses through polling, retaining ownership after reload.

Known FAQ exact selection should be free of model calls. Unstructured questions may use one combined classifier call after conservative local candidate filtering. Questions are not automatically resubmitted on typing, rendering, refresh, or polling.

## Help states

| State | Meaning |
| --- | --- |
| `answer_available` | An applicable approved answer has been delivered but the participant has not confirmed resolution |
| `needs_mentor` | No safe applicable answer, missing context, provider failure, or the participant has reopened the issue |
| `fix_failed` | The participant says the delivered answer did not solve it |
| `resolved` | The participant explicitly confirms resolution |

Processing is separate: `idle`, `processing`, `complete`, `failed`. Never put `processing` in the help-state enum.

Transitions: creation starts `needs_mentor`; valid answer assignment -> `answer_available`; participant failed -> `fix_failed`; participant solved -> `resolved`; participant reopen -> `needs_mentor` unless retrying an existing failed answer, which stays `fix_failed`; new mentor answer -> `answer_available`. The mentor cannot mark a participant resolved. Repeated feedback with the same idempotency key changes nothing.

## Matching and grouping

Filter to non-draft answers whose platform/distribution/version requirements apply. Unknown required context triggers clarification, not a guessed fix. Different version scopes are hard boundaries unless a mentor explicitly marks an answer as version-independent with a rationale. Expired, superseded, or withdrawn answers cannot be reused.

The model selects IDs with evidence; the server verifies those IDs and scope. It must not compose a new troubleshooting solution. If two candidates conflict, ask a targeted question or send to mentor. Do not represent LLM confidence as calibrated certainty.

Related reports may share symptoms without sharing a cause. Suggestions show normalized symptom, relevant quoted text, scope, and distinct original reports. Mentor confirms group membership before bulk publication. Do not include raw participant screenshots in the public board. A participant sees their own report and approved FAQs only.

## Mentor flow

`/mentor` requires the configured mentor passcode. Display:

- Needs mentor; Fix didn't work; Answer available; Resolved history.
- Group cards: number of distinct currently blocked participants, oldest unanswered age, platform/version breakdown, and preview evidence.
- Sort work needing attention by distinct blocked participants descending, then oldest waiting time. A person with several reports is counted once in the group headline.
- Filters by state and platform; view original reports; split or merge with confirmation.
- Compose answer or record one, review text, select recipients, publish. Sending changes only those participants' answer state; it does not resolve them.
- Separate checkbox/action to approve as reusable FAQ, with source, platform/distribution/version scope and approved language variants. Draft by default.
- Add/edit/withdraw FAQs. Editing creates a new version; old answer deliveries keep their original version. A corrected/withdrawn answer is clearly marked for previous recipients.
- A small setup/health panel: provider enabled/configuration status, actual live dispatch totals, budget remaining, and failures. No credential values.

## UI direction

Use a clean light interface, readable type, restrained purple/teal accents, spacious cards, and text labels alongside state colors. Participant page has one obvious Ask for help action. Mentor board prioritizes current work. Mobile single-column participant layout; desktop mentor columns or filtered list. Do not label the prototype as an official Sarvam product.

Show empty, loading, matching, waiting, error, and retry states. Use keyboard-accessible buttons, focus management, `aria-live` status, recording timer, stop/cancel controls, accessible audio playback, and a text alternative to voice. Never autoplay speech. A failed screenshot analysis allows manual error entry; a failed recording allows typing. Label this as manual input, not a successful model result.

## Acceptance criteria

P01 Known scoped FAQ delivered with source; P02 mismatch/unknown scope escalates; P03 voice review works; P04 image OCR review works; P05 similar reports suggested and mentor-confirmed; P06 one mentor answer reaches selected reports; P07 participants resolve independently; P08 approved reuse works; P09 stale versions withdrawn correctly; P10 persistence survives restart; P11 role/ownership enforced; P12 accessible desktop/mobile states; P13 failures never fabricate answers; P14 no paid calls in ordinary tests; P15 release contains no runtime sample behavior; P16 complete live pipeline evidence exists.
