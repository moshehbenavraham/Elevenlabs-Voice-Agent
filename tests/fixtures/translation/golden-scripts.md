# OpenAI Translation Golden Scripts

These scripts are safe committed baseline material for local translation
evaluation. They do not contain customer data, private recordings, personal
messages, credentials, or provider payloads.

Use the `Script ID` values exactly as written. The fixture manifest and
validation test treat these IDs as stable references.

## Usage

1. Read one script aloud through the `Microphone` source, or record a
   self-owned non-sensitive sample from the text.
2. Select one target language from the evaluation matrix.
3. Capture reviewer notes locally. Do not commit raw live transcripts unless
   they are sanitized and intentionally added to a future baseline.
4. Compare the translated transcript and translated audio against the review
   focus for the script.

## Script ID: general-status-brief

**Category**: General speech

**Recommended targets**: Spanish, French, German

**Review focus**:

- Meaning stays complete across short sentences.
- Common workplace terms remain natural.
- The translated transcript does not omit the final action item.
- The translated audio starts quickly after speech begins.

**Source text**:

Good morning. Here is the status brief for the product review. The prototype is
stable, the setup instructions are current, and the demo checklist is ready.
We still need one person to confirm the browser audio setting before the call.
If that check passes, we can start the walkthrough at 2:30 this afternoon.

## Script ID: technical-release-check

**Category**: Technical and domain terms

**Recommended targets**: Spanish, Japanese, Korean

**Review focus**:

- Product and infrastructure terms remain recognizable.
- Route names, environment variables, and commands are not translated in a way
  that changes their meaning.
- Acronyms such as API, CI, and HTTPS are preserved or rendered clearly.
- Error-state language remains actionable.

**Source text**:

The OpenAI Translation tab uses a server route called
`/api/openai/translation-session`. The browser receives only a short-lived
client secret and never receives the server API key. Before release, run the
CI checks, confirm HTTPS media capture, and verify that the fallback message is
clear when tab audio is not available.

## Script ID: names-numbers-dates

**Category**: Names, numbers, dates, and units

**Recommended targets**: Portuguese, Italian, Hindi

**Review focus**:

- Fictional names stay identifiable.
- Dates, times, currency values, percentages, and counts remain accurate.
- The translated transcript does not swap digits or reorder the action owner.
- The reviewer can tell whether local conventions changed the date or number
  format without changing the value.

**Source text**:

On May 14, 2026, Avery Chen will send Jordan Patel the release summary by
9:15 AM. The test run includes 24 samples, a 12.5 percent error budget, and a
local cost limit of 18 dollars. If sample 17 fails twice, pause the review and
write a note for the next maintainer.

## Script ID: mixed-language-handoff

**Category**: Mixed-language and same-language segments

**Recommended targets**: English, Spanish, Chinese

**Review focus**:

- Short foreign-language phrases are handled without dropping surrounding
  English context.
- Same-language target behavior is understandable when English is selected.
- The translated transcript marks partial or unclear segments without inventing
  unsupported detail.
- The final summary sentence remains intact.

**Source text**:

The first speaker says hello, then adds "gracias por esperar" before the demo
starts. The second speaker answers in English and says that the audio level is
clear. Later, someone says "bonjour a tous" during the handoff. The key point
is simple: keep the meeting moving and confirm the translated caption before
the final question.
