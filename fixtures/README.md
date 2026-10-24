# Fixture inventory and rules

All reports, provider outputs and media here are **synthetic**. They are not Sarvam responses, attendee records, or evidence that a Kivi fix works. Genuine source-reviewed FAQ content lives separately in [faq.seed.json](../data/faq.seed.json).

| File | Use |
| --- | --- |
| [scenarios.json](scenarios.json) | 24 behavior cases to turn into automated tests |
| [provider-responses.json](provider-responses.json) | Normalized success/error values for early development; not wire-format fixtures |
| [classification.schema.json](classification.schema.json) | Local JSON Schema for classifier output; enforce semantic scope/evidence checks separately |
| [mentor-demo.json](mentor-demo.json) | Multi-participant answer/feedback/reuse exercise; invented issue and solution |
| [media/question-card.png](media/question-card.png) | Legible generated question card for upload/OCR; not a Kivi screenshot |
| [media/question-en.wav](media/question-en.wav) | Stock Windows offline synthesized English speech; no Sarvam call |
| [media/manifest.json](media/manifest.json) | Provenance, expected text, file sizes/hashes and audio format |

The speech says: “How can I edit selected text in Kivi?” The image contains that question plus a synthetic-input label and explicit public Mac context. The expected OCR result may include labels; match the meaningful question, not the entire image to an exact string. Proper-name transcription can vary; permit review before issue submission.

For early development, inject deterministic fixtures through a test-only provider factory and show a persistent fixture banner. Never expose a production query parameter or public route that activates fixtures. Later, intercept HTTP at the actual Sarvam adapter boundary so parsing and request formation are tested too. Fixture schemaVersion is 1; reject unknown versions clearly.

The WAV can test audio validation, file upload and playback. Its words are a question, so it must not be presented as the real spoken FAQ answer. For a semantic TTS assertion, inspect the outgoing approved text and use a test-specific audio double; at the final live stage inspect the real returned speech. Stock synthesized audio does not prove real microphone access, Hindi accuracy or noisy-room robustness.

The future test suite should generate invalid/oversized inputs in isolated temporary directories rather than committing huge binaries. Keep response fixtures after release for zero-cost regression, but exclude their implementation and data from the production import graph and release workspace.

To validate this handoff's links, JSON and media integrity without installing dependencies, run `node scripts/validate-handoff.mjs`. That checker validates the handoff only; it does not test the application.
