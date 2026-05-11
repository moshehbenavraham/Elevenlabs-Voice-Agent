# OpenAI Translation Evaluation Workflow

This guide defines the repeatable local evaluation workflow for the OpenAI
Translation tab. It uses committed, non-sensitive scripts and metadata as the
baseline, then allows optional private media only from ignored local paths.

## Purpose

Use this workflow before demos, release checks, or translation-quality review
sessions that need more structure than a smoke test. The baseline can be
followed without a live OpenAI call, private recordings, customer media, or
committed transcripts.

## Prerequisites

- Install dependencies with `npm install`.
- Review the main [OpenAI Translation Demo Guide](../OPENAI_TRANSLATION_DEMO.md)
  before any live provider run.
- Keep `OPENAI_API_KEY` only in `.env` or another server runtime secret
  source. Never expose it through `VITE_*` variables, committed files, browser
  config, screenshots, or review notes.
- Enable the translation tab with `VITE_OPENAI_TRANSLATION_ENABLED=true` before
  starting Vite or building the frontend.
- Use HTTPS or localhost for browser media capture. ngrok demo URLs satisfy
  this requirement when the demo tunnel is active.
- Confirm the reviewer understands which checks are offline, which require a
  live OpenAI session, and which require bilingual judgment.

## Safety And Budget Gates

Do not start a live OpenAI Translation session until all gates below are true:

- An approved `OPENAI_API_KEY` is available in the server runtime only.
- The maintainer has an explicit usage budget for the evaluation window.
- The planned run length fits within
  `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES`; the default guard is 30
  minutes and the hard cap is 120 minutes.
- The script is committed, fictional, and non-sensitive, or the media sample is
  private and stored only under `tests/fixtures/translation/local/`.
- Review notes will remain local unless they are sanitized and intentionally
  committed in a future session.

Stop the session as soon as the script segment ends. Provider usage should be
checked outside the app for any live account-level accounting.

## Baseline Assets

The committed baseline is self-contained:

- `tests/fixtures/translation/golden-scripts.md` contains safe scripts for
  general speech, technical terms, names/numbers/dates, and mixed-language
  behavior.
- `tests/fixtures/translation/manifest.json` describes stable IDs, target
  languages, optional audio state, review focus, and latency checkpoints.
- `tests/fixtures/translation/README.md` defines fixture policy and local-only
  paths.
- `tests/fixtures/translation/.gitignore` prevents private media and local run
  output from being committed.

Private audio, private video, generated transcripts, reviewer notes, provider
payloads, client secrets, API keys, cookies, authorization headers, and raw SDP
must not be committed. The baseline must remain runnable as metadata and
documentation even when `tests/fixtures/translation/local/` is empty.

## Run Modes

| Mode                     | Live provider | Private media       | Purpose                                                                    |
| ------------------------ | ------------- | ------------------- | -------------------------------------------------------------------------- |
| Metadata validation      | No            | No                  | Run the fixture validation test and confirm docs/manifest structure.       |
| Script dry-run           | No            | No                  | Read scripts and confirm the workflow is understandable before a demo.     |
| Live microphone baseline | Yes           | No                  | Read committed scripts through the microphone source with approved budget. |
| Live local-media review  | Yes           | Optional local only | Play a private local sample for domain review without committing it.       |
| ngrok demo review        | Yes           | No by default       | Use the same-origin demo path for a shareable HTTPS check.                 |

The committed baseline is the metadata validation plus script dry-run. Live
provider modes are optional and budget-gated.

## Target-Language Matrix

Use the matrix below as the default baseline coverage. It balances common
demo languages, non-Latin scripts, same-language behavior, and language pairs
that exercise names, numbers, and technical terms.

| Script ID                 | Category                | Baseline target languages  |
| ------------------------- | ----------------------- | -------------------------- |
| `general-status-brief`    | General speech          | Spanish, French, German    |
| `technical-release-check` | Technical terms         | Spanish, Japanese, Korean  |
| `names-numbers-dates`     | Names, numbers, dates   | Portuguese, Italian, Hindi |
| `mixed-language-handoff`  | Mixed-language behavior | English, Spanish, Chinese  |

Additional supported app targets can be sampled when a demo requires them:
Russian, Indonesian, and Vietnamese. Keep those notes local unless the review
is intentionally sanitized for a future committed baseline.

## Golden-Script Workflow

1. Open `tests/fixtures/translation/golden-scripts.md`.
2. Choose one `Script ID` from the target-language matrix.
3. Confirm the matching fixture entry exists in
   `tests/fixtures/translation/manifest.json`.
4. Start with the `Microphone` source. Use `Tab audio` only after the normal
   demo guide checks confirm the browser and share target can provide audio.
5. Select one baseline target language for the script.
6. Read the script at a steady pace. Do not add private names, customer facts,
   account details, or incident details.
7. Stop the session when the script ends.
8. Review translated audio, transcript rows, and exported Markdown if export is
   part of the local check.
9. Record results locally under `tests/fixtures/translation/outputs/` or
   `tests/fixtures/translation/runs/` if notes are needed.

Repeat the workflow across all four script IDs for a baseline release or demo
readiness pass.

## Latency Checkpoints

Latency checks are manual stopwatch checks for now. They are not CI gates and
should be treated as release-readiness evidence, not a provider SLA.

Use one timer per checkpoint:

| Checkpoint ID            | Start                      | Stop                                                                              | Target     |
| ------------------------ | -------------------------- | --------------------------------------------------------------------------------- | ---------- |
| `capture-start`          | Click `Start`              | Browser capture is active or the UI reaches the first pending capture state       | 3 seconds  |
| `translated-audio-ready` | First spoken phrase begins | Translated audio is audible or the translated audio player reports a ready stream | 10 seconds |
| `transcript-delta`       | First spoken phrase begins | A source or translated transcript row appears or updates                          | 10 seconds |
| `session-stop`           | Click `Stop`               | The UI returns to a stopped/idle state and capture tracks are released            | 3 seconds  |

Procedure:

1. Choose a script and target language from the matrix.
2. Start the app in the intended run mode.
3. Open a local note file under `tests/fixtures/translation/outputs/`.
4. Record browser, source mode, target language, script ID, and start time.
5. Measure each checkpoint once during the first pass.
6. If a checkpoint misses the target, repeat it once to rule out a setup error.
7. Record both values locally and note any visible diagnostic message.
8. Do not paste raw provider payloads, client secrets, SDP, API keys, cookies,
   authorization headers, private transcripts, or private media paths into the
   notes.

Expected interpretation:

- Passing targets means the run is suitable for demo confidence checks.
- A missed target with a clear diagnostic can still be acceptable for a local
  investigation run.
- Repeated missed targets should be handled as product or provider follow-up,
  not hidden in the evaluation notes.

## Manual Review Rubric

Manual review should be performed by someone who can judge the source language
and the selected target language. If no bilingual reviewer is available, record
only setup, latency, and transcript-shape observations.

Use these ratings:

- `Pass`: Meaning is preserved and no release-blocking issue is observed.
- `Watch`: Meaning is mostly usable, but the reviewer found a minor omission,
  awkward rendering, or timing issue that should be tracked.
- `Fail`: Meaning, safety, names, numbers, dates, or key domain terms are wrong
  enough to block a demo or release recommendation.

Review categories:

| Category                | What to check                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Meaning                 | Main intent, final action item, negation, and speaker handoff are preserved.                                                         |
| Names                   | Fictional names remain identifiable and are not merged with nearby words.                                                            |
| Numbers                 | Counts, percentages, currency values, sample IDs, and times keep the same values.                                                    |
| Dates                   | Dates remain accurate even when local date formatting changes.                                                                       |
| Domain terms            | API, HTTPS, route names, environment variables, CI, media capture, and fallback states remain understandable.                        |
| Mixed-language segments | Short non-English phrases do not cause surrounding English context to disappear or produce invented detail.                          |
| Transcript export       | Source and translated rows are present when expected, final/partial state is understandable, and exported Markdown excludes secrets. |

Local note template:

```text
Script ID:
Target language:
Source mode:
Reviewer:
Run mode:
Latency:
- capture-start:
- translated-audio-ready:
- transcript-delta:
- session-stop:
Rubric:
- meaning:
- names:
- numbers:
- dates:
- domain terms:
- mixed-language:
- transcript export:
Decision: Pass | Watch | Fail
Follow-up:
```

Keep completed templates under ignored local output paths unless the content is
sanitized and intentionally committed in a future session.

## Private Local Media

Private local media is optional and must never be required for the committed
baseline.

Use this workflow only when a maintainer needs a domain-specific sample:

1. Place private audio or video under `tests/fixtures/translation/local/`.
2. Use a filename that includes the script ID or local scenario name, target
   language, source mode, and date when useful.
3. Run the app from the main demo guide with an approved API key and budget.
4. Play the local sample through the chosen source mode.
5. Store generated transcripts, exported Markdown, screenshots, timing notes,
   and reviewer notes under `tests/fixtures/translation/outputs/` or
   `tests/fixtures/translation/runs/`.
6. Before committing, run `git status --short` and confirm private media and
   local outputs are not listed.
7. If a note must be committed later, rewrite it as a sanitized summary with no
   private transcript text, no provider payloads, and no credentials.

Guardrails:

- Do not add private files outside `tests/fixtures/translation/local/`.
- Do not weaken `tests/fixtures/translation/.gitignore` to commit local media
  or local outputs.
- Do not add tests that read from `local/`, `outputs/`, or `runs/`.
- Do not paste raw provider responses, SDP, client secrets, cookies,
  authorization headers, API keys, or private transcripts into documentation.
- Do not use customer or meeting media as a future committed fixture.

## Result Handling

Evaluation results are local by default.

Acceptable committed output from this session is limited to:

- Documentation.
- Golden scripts.
- Manifest metadata.
- Fixture policy.
- Validation tests.
- Session implementation and security notes.

Do not commit live run results, cost reports, transcripts, audio, video, or
provider payloads unless a future session explicitly defines a sanitized
artifact format and privacy review.

## Future CI Candidates

## References

- [OpenAI Translation Demo Guide](../OPENAI_TRANSLATION_DEMO.md)
- [Translation Fixtures](../../tests/fixtures/translation/README.md)
