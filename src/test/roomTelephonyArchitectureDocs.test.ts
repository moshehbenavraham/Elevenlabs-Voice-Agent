import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DECISION_DOC_PATH = 'docs/ongoing-projects/room-telephony-translation-architecture.md';
const ARCHITECTURE_DOC_PATH = 'docs/ARCHITECTURE.md';

const REQUIRED_HEADINGS = [
  'Status and Recommendation',
  'Sources Checked',
  'Local References Reviewed',
  'Scope and Non-Goals',
  'Existing Browser WebRTC and Raw-Audio Boundaries',
  'Telephony Adapter Boundary',
  'Room and Media-Worker Options',
  'Topology Comparison',
  'Data Plane, Control Plane, and Cleanup Ownership',
  'Security Checklist',
  'Operational Model',
  'Lifecycle States and Failure Handling',
  'Deployment Posture and Residual Risks',
  'Recommendation',
  'Future Implementation Scope',
  'Future Test Strategy',
] as const;

const SOURCE_LINKS = [
  'https://developers.openai.com/api/docs/guides/realtime-translation',
  'https://developers.openai.com/api/docs/models/gpt-realtime-translate',
  'https://developers.openai.com/api/docs/guides/realtime-sip',
  'https://www.twilio.com/docs/voice/media-streams',
  'https://www.twilio.com/docs/usage/webhooks/webhooks-security',
  'https://docs.livekit.io/intro/basics/rooms-participants-tracks/',
  'https://docs.livekit.io/agents/server/',
  'https://docs.livekit.io/sip/dispatch-rule/',
] as const;

const REQUIRED_TOPOLOGY_TERMS = [
  'one-session-per-direction',
  'one-session-per-speaker-language',
  'one-session-per-listener-language',
  'Twilio',
  'SIP',
  'LiveKit',
  'room media worker',
  'target-language',
] as const;

const REQUIRED_SECURITY_GUARDRAILS = [
  'Keep `OPENAI_API_KEY` only on the server.',
  'Verify every Twilio webhook',
  'Authenticate SIP trunks',
  'Do not log raw audio',
  'Do not persist',
  'process-local rate limiting',
] as const;

const DISALLOWED_SHIPPED_CLAIMS = [
  'Twilio support is shipped',
  'SIP support is shipped',
  'LiveKit support is shipped',
  'room fanout is shipped',
  'telephony translation is shipped',
  'registered telephony route',
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

describe('roomTelephonyArchitectureDocs', () => {
  it('keeps the decision document present and sectioned', () => {
    expect(existsSync(repositoryPath(DECISION_DOC_PATH))).toBe(true);

    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);
    for (const heading of REQUIRED_HEADINGS) {
      expect(decisionDoc).toContain(`## ${heading}`);
    }
  });

  it('keeps current source links and checked dates visible', () => {
    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);

    expect(decisionDoc).toContain('Checked on 2026-05-12.');
    for (const sourceLink of SOURCE_LINKS) {
      expect(decisionDoc).toContain(sourceLink);
    }
  });

  it('keeps topology terms and future-only scope explicit', () => {
    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);
    const architectureDoc = readRepositoryText(ARCHITECTURE_DOC_PATH);
    const normalizedArchitectureDoc = normalizeWhitespace(architectureDoc);

    for (const topologyTerm of REQUIRED_TOPOLOGY_TERMS) {
      expect(decisionDoc).toContain(topologyTerm);
    }

    expect(decisionDoc).toContain(
      'Status: architecture decision document, no runtime implementation.'
    );
    expect(decisionDoc).toContain('This session does not add a production route');
    expect(decisionDoc).toContain('No SIP, Twilio, LiveKit, room, carrier');
    expect(architectureDoc).toContain(
      '[Room and Telephony Translation Architecture](./ongoing-projects/room-telephony-translation-architecture.md)'
    );
    expect(normalizedArchitectureDoc).toContain('future architecture outside the shipped runtime');

    for (const shippedClaim of DISALLOWED_SHIPPED_CLAIMS) {
      expect(decisionDoc).not.toContain(shippedClaim);
      expect(architectureDoc).not.toContain(shippedClaim);
    }
  });

  it('keeps security and recommendation criteria actionable', () => {
    const decisionDoc = readRepositoryText(DECISION_DOC_PATH);
    const normalizedDecisionDoc = normalizeWhitespace(decisionDoc);

    for (const guardrail of REQUIRED_SECURITY_GUARDRAILS) {
      expect(normalizedDecisionDoc).toContain(guardrail);
    }

    expect(decisionDoc).toContain('Recommendation: defer room and telephony');
    expect(decisionDoc).toContain('Build later:');
    expect(decisionDoc).toContain('Defer:');
    expect(decisionDoc).toContain('Reject for the current product:');
    expect(decisionDoc).toContain('Unproven assumptions:');
  });
});
