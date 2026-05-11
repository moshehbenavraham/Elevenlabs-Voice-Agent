import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DECISION_DOC_PATH = 'docs/ongoing-projects/raw-audio-bridge-spike.md';
const ARCHITECTURE_DOC_PATH = 'docs/ARCHITECTURE.md';

const REQUIRED_HEADINGS = [
  'Status and Recommendation',
  'Sources Checked',
  'Local References Reviewed',
  'Scope and Non-Goals',
  'Existing Browser WebRTC Baseline',
  'Future Backend WebSocket Session Contract',
  'Input Audio Constraints',
  'Output Audio and Transcript Constraints',
  'Browser WebRTC Versus Backend Raw-Audio Bridge',
  'Lifecycle and Cleanup States',
  'Security and Privacy Posture',
  'Errors and Observability',
  'Recommendation',
  'Future Test Strategy',
] as const;

const OPENAI_SOURCE_LINKS = [
  'https://developers.openai.com/api/docs/guides/realtime-translation',
  'https://developers.openai.com/cookbook/examples/voice_solutions/realtime_translation_guide',
  'https://developers.openai.com/api/docs/models/gpt-realtime-translate',
] as const;

const REQUIRED_PROTOCOL_TERMS = [
  '/v1/realtime/translations',
  'wss://api.openai.com/v1/realtime/translations?model=gpt-realtime-translate',
  'gpt-realtime-translate',
  'session.update',
  'session.audio.output.language',
  'session.input_audio_buffer.append',
  'session.output_audio.delta',
  'session.output_transcript.delta',
  'session.input_transcript.delta',
  '24 kHz',
  'little-endian PCM16',
  'response.create',
] as const;

const REQUIRED_SECURITY_GUARDRAILS = [
  'Keep `OPENAI_API_KEY` only on the server.',
  'Do not log raw audio',
  'Do not persist audio or transcript text.',
  'process-local rate limits do not protect',
  'raw media still counts as personal data',
] as const;

const DISALLOWED_SHIPPED_CLAIMS = [
  'raw-audio support is shipped',
  'Twilio support is shipped',
  'SIP support is shipped',
  'room fanout is shipped',
  'raw-audio UI support is shipped',
  'registered raw-audio route',
] as const;

function repositoryPath(relativePath: string): string {
  return resolve(REPOSITORY_ROOT, relativePath);
}

function readRepositoryText(relativePath: string): string {
  return readFileSync(repositoryPath(relativePath), 'utf8');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

describe('rawAudioBridgeDocs', () => {
  it('keeps the raw-audio decision document present and sectioned', () => {
    expect(existsSync(repositoryPath(DECISION_DOC_PATH))).toBe(true);

    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);
    for (const heading of REQUIRED_HEADINGS) {
      expect(decisionDoc).toContain(`## ${heading}`);
    }
  });

  it('keeps current OpenAI source links and protocol constraints visible', () => {
    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);

    expect(decisionDoc).toContain('Checked on 2026-05-12.');
    for (const sourceLink of OPENAI_SOURCE_LINKS) {
      expect(decisionDoc).toContain(sourceLink);
    }
    for (const protocolTerm of REQUIRED_PROTOCOL_TERMS) {
      expect(decisionDoc).toContain(protocolTerm);
    }
  });

  it('keeps no-runtime and not-shipped guardrails explicit', () => {
    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);
    const architectureDoc = readRepositoryText(ARCHITECTURE_DOC_PATH);

    expect(decisionDoc).toContain('Status: decision spike, no runtime implementation.');
    expect(decisionDoc).toContain('does not add a production route');
    expect(decisionDoc).toContain('No default raw-audio UI path is shipped.');
    expect(decisionDoc).toContain('Not shipped; future architecture only');
    expect(architectureDoc).toContain(
      '[Raw-Audio Bridge Spike](./ongoing-projects/raw-audio-bridge-spike.md)'
    );
    expect(architectureDoc).toContain('does not ship a route, webhook, provider tab');

    for (const shippedClaim of DISALLOWED_SHIPPED_CLAIMS) {
      expect(decisionDoc.toLowerCase()).not.toContain(shippedClaim);
      expect(architectureDoc.toLowerCase()).not.toContain(shippedClaim);
    }
  });

  it('keeps security, privacy, and recommendation criteria actionable', () => {
    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);
    const normalizedDecisionDoc = normalizeWhitespace(decisionDoc);

    for (const guardrail of REQUIRED_SECURITY_GUARDRAILS) {
      expect(normalizedDecisionDoc).toContain(guardrail);
    }

    expect(decisionDoc).toContain('Proceed with a future prototype');
    expect(decisionDoc).toContain('Defer implementation');
    expect(decisionDoc).toContain('Reject implementation');
    expect(decisionDoc).toContain('Unproven assumptions');
  });
});
