# Demonstration and release checklist

## Product story

“In a build session, the same question can stop several people. Unblock answers from approved workshop guidance, brings unanswered questions to the mentor, and remembers the mentor's approved solution. Each participant confirms whether it actually worked.”

The distinguishing moment is **one answer, different outcomes**. Show one attendee solved and another still stuck; then show a new attendee receiving an approved reusable answer. This makes the productivity claim observable without invented minutes saved.

## Three-minute rehearsal

| Time | Action | What the audience learns |
| --- | --- | --- |
| 0:00–0:25 | Show a question spoken or typed in Hindi/Hinglish; review transcript and optional extracted screenshot text. | Speech and visual context reduce reporting effort. |
| 0:25–0:50 | For compatible public Mac context, show sourced selected-text FAQ and optional spoken playback. | Approved answers are reusable and accessible. |
| 0:50–1:20 | Show two explicitly staged unresolved reports in mentor view; inspect context and confirm grouping. | Repeated requests become one manageable mentor task. |
| 1:20–1:55 | Mentor answers selected participants. One clicks Solved; the other Still stuck. | Delivered answers do not inflate success counts. |
| 1:55–2:25 | Approve the answer as scoped reusable guidance; a new matching report receives it. | The workshop builds its own reviewed knowledge. |
| 2:25–3:00 | Show wrong-platform ambiguity staying in mentor queue and the actual counts. | Scope and honest escalation make the system useful. |

Use [synthetic rehearsal data](../fixtures/mentor-demo.json) in fixture development only. In the final live demo, create staged reports through normal UI and label them as demonstrations; enter a real mentor-approved workshop answer if available. If demonstrating the invented exercise, say it is synthetic and never present its sample answer as a Kivi fix. Do not hide preloaded fake user counts.

## Paid-call preparation

Rehearse the complete flow offline before live validation. Four capabilities have distinct jobs; avoid gratuitous calls to make logos light up. Show authentic previously generated audio/OCR with cache provenance if conserving credits. Explain that it is cached instead of pretending it was generated on stage. A later audience demo can consume credits too; its budget must be explicitly configured by the human rather than bypassing the six-call validation cap.

For a Windows-only workshop, demonstrate public Mac FAQ behavior as an explicitly separate example, or have the mentor supply actual Windows instructions before the demo. The system's refusal to guess is a legitimate demonstration; an empty draft is not an answer.

## Release checklist

- [ ] Gates 0–7 recorded; all P01–P16 acceptance criteria checked.
- [ ] All four capabilities passed actual integration, with fresh/cache evidence distinguished.
- [ ] No runtime fake provider, sample issue injection or invented productivity statistics.
- [ ] Clean release workspace retains real FAQ seed and budget ledger.
- [ ] Participant and mentor sessions work; one cannot read another participant's private data.
- [ ] Independent solved/failed states, scoped reuse, FAQ corrections and restart persistence work.
- [ ] Offline regression passes after cutover; production server tested.
- [ ] Microphone capture and audio playback checked on target laptop; manual input remains available.
- [ ] Desktop/mobile layout and keyboard paths inspected.
- [ ] Exact setup/run commands, local URL, limits and evidence delivered.

## Questions the demo should answer

Why not a chatbot? Because the mentor needs a queue, reviewed reusable answers, grouped reports and individual outcomes. Why Sarvam? Voice input, multilingual intent handling, screenshot text and spoken answers support that workflow. Why Kivi? A live workshop provides recurring questions and accessible mentors; this is an independent companion with no undocumented integration. What is measured? Only submitted reports, approved answers and explicit participant outcomes until actual time studies exist.
