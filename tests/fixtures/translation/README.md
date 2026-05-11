# Translation Evaluation Fixtures

This directory contains committed, non-sensitive baseline assets for the
OpenAI Translation evaluation workflow.

## Committed Baseline

Committed files may include:

- Golden scripts written for this repository.
- Manifest metadata that describes expected target languages, review focus,
  optional audio fixture states, and latency checkpoints.
- Empty placeholders that make local-only directories discoverable.
- Future sanitized examples only when they are reviewed intentionally.

Committed files must not include:

- Customer calls, private meetings, support recordings, or personal media.
- Raw provider payloads, SDP bodies, browser credentials, API keys, cookies, or
  authorization headers.
- Unsanitized translation transcripts or reviewer notes.
- Local cost reports that reveal account usage details.

## Local-Only Paths

Use `tests/fixtures/translation/local/` for private maintainer media and
domain-specific samples. The path is ignored except for `.gitkeep`.

Use `tests/fixtures/translation/outputs/` or
`tests/fixtures/translation/runs/` for local review notes, generated
transcripts, and temporary reports. Those paths are ignored.

## Fixture States

The manifest supports these committed states:

- `script-only`: The baseline is the committed text script. No audio fixture is
  required.
- `optional-local-media`: A maintainer may add private local audio under the
  ignored `local/` path for their own review.
- `future-sanitized-media`: A future session may add reviewed, non-sensitive
  media after privacy review.

No committed validation test may require private local media.

## Recording Or Generation Rules

When creating local audio from a script:

1. Use only the text from `golden-scripts.md` or another intentionally
   non-sensitive script.
2. Record yourself or use an approved local generation tool. Do not use
   customer media or private meeting audio.
3. Store the result under `tests/fixtures/translation/local/`.
4. Keep generated transcripts and reviewer notes in `outputs/` or `runs/`.
5. Delete local files when they are no longer needed.

### Self-Recorded Samples

Self-recorded samples are useful when a maintainer wants a stable voice and
pace for repeat local checks. Keep them local unless a future session defines
an explicit sanitized fixture review.

Recommended local naming:

```text
tests/fixtures/translation/local/general-status-brief.es.self.wav
tests/fixtures/translation/local/technical-release-check.ja.self.webm
```

Rules:

- Use the committed script text without adding private facts.
- Speak at a natural demo pace.
- Keep the original file and any transcript output under ignored paths.
- Do not commit waveform screenshots or transcripts from private samples.

### Generated Samples

Generated samples are optional. Do not add a new cloud service, provider
dependency, or generated media file as part of the committed baseline in this
session.

If a maintainer generates audio locally:

- Use only approved local tools and non-sensitive script text.
- Store output under `tests/fixtures/translation/local/`.
- Record generation settings in local notes if they matter for comparison.
- Treat generated transcripts as local output unless they are reviewed and
  intentionally sanitized later.

### Future Committed Media

A future session may add sanitized committed media only if it includes:

- Source text that already exists in this repository or is newly reviewed.
- A documented generation or recording method.
- A privacy review confirming no customer, personal, credential, or provider
  payload content is present.
- Validation that tests do not require private media paths.

## Review Boundary

The fixture validation test checks repository-owned metadata and documentation
only. It does not call OpenAI, load audio files, run browser automation, or
read private local media.

Manual bilingual review remains a human quality check. It should be recorded in
local notes unless a future session defines a sanitized committed format.
