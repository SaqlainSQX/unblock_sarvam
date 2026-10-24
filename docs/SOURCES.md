# Source register

Reviewed on 2026-10-24. These sources support product facts and adapter planning; reading documentation is not live API verification. No pricing, valuation, speaker biography or interview outcome is assumed by this build.

| Source | What it supports | Limitation |
| --- | --- | --- |
| [Kivi homepage](https://heykivi.ai/) | Public Mac dictation, selected-text Fn + Control workflow, correction memory, app preferences | Public page describes Mac and a Windows waitlist; campus build can differ. |
| [Kivi FAQ](https://heykivi.ai/faq.html) | Dictation versus Hey Kivi mode, Hindi/English mixing, Mac platform | Marketing feature description, not a version-specific troubleshooting manual. |
| [Sarvam chat reference](https://docs.sarvam.ai/api-reference/chat/chat-completions-v1) | Chat request and response fields | Model availability and credentials require actual integration validation. |
| [Chat guide](https://docs.sarvam.ai/api/api-guides-tutorials/chat-completion/overview) | Structured response options | Validate all model output locally regardless of format controls. |
| [Speech REST guide](https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/rest-api) | Short audio submission and transcription | Some examples retain older model names; explicit current model selection matters. |
| [Speech overview](https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview) | `saaras:v4` and transcription mode | Language breadth is not proof of this app's tested language coverage. |
| [TTS reference](https://docs.sarvam.ai/api-reference/text-to-speech/convert) | `text`, `language_code`, model, audio response | Use model-compatible voices; do not mix old request fields. |
| [Bulbul model](https://docs.sarvam.ai/api/getting-started/models/bulbul) | Explicit v4 Flash model and voice compatibility | No assumed account discount or API default. |
| [Document AI guide](https://docs.sarvam.ai/api/api-guides-tutorials/document-intelligence/overview) | New extraction lifecycle and Sarvam Vision 1.5 | Current guide and some older reference pages disagree on API generation; inspect current SDK before implementing status/results transport. |
| [Official documentation index](https://docs.sarvam.ai/llms.txt) | Discovery of guides and SDK references | Index labels can lag endpoint pages; not the sole authority for current model IDs. |

## Evidence categories

- `source_reviewed`: handoff author checked the linked official page and paraphrased a limited feature instruction. This does **not** mean a Sarvam employee approved the entry or it was tested on every build.
- `mentor_approved`: an authenticated workshop mentor explicitly approved this answer, source note and scope in the app.
- `draft`: missing workshop-specific content; excluded from matching and public FAQ answers.
- `synthetic`: locally invented test data. Never seed it into a release workspace as a real Kivi issue/fix.

Hindi FAQ bodies are handoff translations of the brief English source paraphrases, not quotations from Kivi. A mentor can review/revise them; retain version history. Source-reviewed seed entries use `documented_public` version policy. This permits generic documented feature questions for matching public Mac context, not diagnosing version-dependent failures.

## Unresolved facts

The existing `Kivi-win-x64-stable-1.9.6.exe` establishes only that a file with that name is present. Its installation flow, shortcut, supported Windows versions, permissions and workshop distribution policy have not been verified. Leave those FAQ drafts empty until the speakers supply guidance. Never import Mac shortcuts into Windows answers automatically.

ASR, TTS and Vision account entitlement remains untested. Chat succeeded in an earlier independent smoke check, but that is not application proof. No statement here claims Unblock is endorsed by Sarvam, used by Vivek Gupta, or likely to win the competition. The design hypothesis is that reducing repeated mentor explanations while retaining unresolved reports is useful for an AI ecosystem workshop; demonstrate that workflow rather than claiming measured time savings.
