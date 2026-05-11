import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSESSMENT_DOC_PATH = 'docs/ongoing-projects/external-subtitle-overlay-assessment.md';
const ARCHITECTURE_DOC_PATH = 'docs/ARCHITECTURE.md';

const REQUIRED_HEADINGS = [
  'Status and Recommendation',
  'Sources and Revalidation',
  'Local References Reviewed',
  'Scope and Non-Goals',
  'Current In-App Caption and Transcript Baseline',
  'Overlay Architecture Options',
  'Server Boundary, Permissions, and Storage Constraints',
  'Accessibility and UX Constraints',
  'Privacy, Consent, and Retention Guardrails',
  'Cross-Site Compatibility Risks',
  'Lifecycle and Cleanup States',
  'Overlay Value Assessment',
  'Recommendation and Future Scope',
  'Future Test Strategy',
] as const;

const REQUIRED_LOCAL_REFERENCES = [
  'src/components/providers/OpenAITranslationLatestCaption.tsx',
  'src/components/conversation/TranslationTranscriptPanel.tsx',
  'src/components/providers/OpenAITranslationProvider.tsx',
  'src/components/providers/OpenAITranslationExportControls.tsx',
  'src/hooks/useOpenAITranslation.ts',
  'src/lib/openaiTranslation.ts',
  'src/types/openai-translation.ts',
  'docs/SECURITY.md',
  '.spec_system/SECURITY-COMPLIANCE.md',
  'EXAMPLE/open-realtime-translate/src/content/subtitle.ts',
  'EXAMPLE/open-realtime-translate/src/background/service-worker.ts',
  'EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts',
  'EXAMPLE/open-realtime-translate/src/shared/messages.ts',
] as const;

const REQUIRED_OVERLAY_OPTIONS = [
  'No build',
  'In-app floating captions',
  'Browser extension content script',
  'Offscreen document',
  'Shadow DOM isolation',
  'Companion sidecar',
] as const;

const REQUIRED_PRIVACY_GUARDRAILS = [
  'Keep `OPENAI_API_KEY` only on the server.',
  'Do not store a raw OpenAI API key',
  'Do not persist raw audio',
  'Do not log raw request bodies',
  'process-local rate limiting',
] as const;

const REQUIRED_ACCESSIBILITY_TERMS = [
  'caption size',
  'high contrast',
  'keyboard',
  'polite live region',
  'prefers-reduced-motion',
  'hide/show',
  'source and translated language labels',
] as const;

const REQUIRED_RECOMMENDATION_TERMS = [
  'Recommendation: defer an external subtitle overlay companion.',
  'Build later:',
  'Defer:',
  'Reject for the current product:',
  'Small future 2-4 hour scope if approved:',
  'Unproven assumptions:',
] as const;

const DISALLOWED_SHIPPED_CLAIMS = [
  'external subtitle overlay support is shipped',
  'chrome extension support is shipped',
  'content-script support is shipped',
  'arbitrary website injection is enabled by default',
  'registered overlay route',
  'persistent overlay transcript store is shipped',
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

describe('externalSubtitleOverlayDocs', () => {
  it('keeps the assessment document present and sectioned', () => {
    expect(existsSync(repositoryPath(ASSESSMENT_DOC_PATH))).toBe(true);

    const assessmentDoc = readRepositoryText(ASSESSMENT_DOC_PATH);
    for (const heading of REQUIRED_HEADINGS) {
      expect(assessmentDoc).toContain(`## ${heading}`);
    }
  });

  it('keeps local references and overlay options discoverable', () => {
    const assessmentDoc = readRepositoryText(ASSESSMENT_DOC_PATH);

    for (const referencePath of REQUIRED_LOCAL_REFERENCES) {
      expect(assessmentDoc).toContain(referencePath);
    }

    for (const overlayOption of REQUIRED_OVERLAY_OPTIONS) {
      expect(assessmentDoc).toContain(overlayOption);
    }
  });

  it('keeps future-only and not-shipped guardrails explicit', () => {
    const assessmentDoc = readRepositoryText(ASSESSMENT_DOC_PATH);
    const architectureDoc = readRepositoryText(ARCHITECTURE_DOC_PATH);
    const normalizedArchitectureDoc = normalizeWhitespace(architectureDoc);

    expect(assessmentDoc).toContain('Status: assessment document, no runtime implementation.');
    expect(assessmentDoc).toContain('This session does not add a Chrome extension');
    expect(assessmentDoc).toContain('No content script is shipped.');
    expect(assessmentDoc).toContain('No arbitrary website injection is shipped.');
    expect(architectureDoc).toContain(
      '[External Subtitle Overlay Assessment](./ongoing-projects/external-subtitle-overlay-assessment.md)'
    );
    expect(normalizedArchitectureDoc).toContain('assessment-only guidance');
    expect(normalizedArchitectureDoc).toContain('does not ship a Chrome extension');

    const combinedDocs = `${assessmentDoc}\n${architectureDoc}`.toLowerCase();
    for (const shippedClaim of DISALLOWED_SHIPPED_CLAIMS) {
      expect(combinedDocs).not.toContain(shippedClaim);
    }
  });

  it('keeps privacy, accessibility, and recommendation criteria actionable', () => {
    const assessmentDoc = readRepositoryText(ASSESSMENT_DOC_PATH);
    const normalizedAssessmentDoc = normalizeWhitespace(assessmentDoc);

    for (const guardrail of REQUIRED_PRIVACY_GUARDRAILS) {
      expect(normalizedAssessmentDoc).toContain(guardrail);
    }

    for (const accessibilityTerm of REQUIRED_ACCESSIBILITY_TERMS) {
      expect(normalizedAssessmentDoc).toContain(accessibilityTerm);
    }

    for (const recommendationTerm of REQUIRED_RECOMMENDATION_TERMS) {
      expect(assessmentDoc).toContain(recommendationTerm);
    }
  });
});
