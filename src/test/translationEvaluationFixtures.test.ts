import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

interface TranslationEvaluationDocument {
  readonly path: string;
  readonly requiredHeadings: readonly string[];
}

interface TranslationEvaluationAudioState {
  readonly required: boolean;
  readonly committedPath: string | null;
  readonly localPathPattern: string;
}

interface TranslationEvaluationFixture {
  readonly order: number;
  readonly id: string;
  readonly scriptId: string;
  readonly category: string;
  readonly state: string;
  readonly audio: TranslationEvaluationAudioState;
  readonly targetLanguageCodes: readonly string[];
  readonly reviewFocus: readonly string[];
  readonly latencyCheckpointIds: readonly string[];
}

interface TranslationEvaluationManifest {
  readonly schemaVersion: number;
  readonly generatedAt: string;
  readonly description: string;
  readonly privacy: {
    readonly requiresPrivateMedia: boolean;
    readonly privateMediaPath: string;
    readonly localOutputPaths: readonly string[];
    readonly disallowedCommittedData: readonly string[];
  };
  readonly documents: readonly TranslationEvaluationDocument[];
  readonly targetLanguages: readonly {
    readonly code: string;
    readonly label: string;
    readonly baseline: boolean;
  }[];
  readonly latencyCheckpoints: readonly {
    readonly id: string;
    readonly label: string;
    readonly manual: boolean;
    readonly targetMs: number;
    readonly description: string;
  }[];
  readonly fixtures: readonly TranslationEvaluationFixture[];
}

const EXPECTED_TARGET_LANGUAGE_CODES = [
  'es',
  'pt',
  'fr',
  'ja',
  'ru',
  'zh',
  'de',
  'ko',
  'hi',
  'id',
  'vi',
  'it',
  'en',
] as const;

const EXPECTED_SCRIPT_IDS = [
  'general-status-brief',
  'technical-release-check',
  'names-numbers-dates',
  'mixed-language-handoff',
] as const;

const EXPECTED_LATENCY_CHECKPOINT_IDS = [
  'capture-start',
  'translated-audio-ready',
  'transcript-delta',
  'session-stop',
] as const;

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function repositoryPath(relativePath: string): string {
  return resolve(REPOSITORY_ROOT, relativePath);
}

function readRepositoryText(relativePath: string): string {
  return readFileSync(repositoryPath(relativePath), 'utf8');
}

function readManifest(): TranslationEvaluationManifest {
  return JSON.parse(
    readRepositoryText('tests/fixtures/translation/manifest.json')
  ) as TranslationEvaluationManifest;
}

function expectUnique(values: readonly string[], label: string): void {
  expect(new Set(values).size, `${label} should be unique`).toBe(values.length);
}

describe('translationEvaluationFixtures', () => {
  it('parses the manifest and finds required repository-owned assets', () => {
    const manifest = readManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(manifest.description).toContain('OpenAI Translation');
    expect(manifest.fixtures).toHaveLength(EXPECTED_SCRIPT_IDS.length);

    for (const document of manifest.documents) {
      expect(existsSync(repositoryPath(document.path))).toBe(true);
    }
  });

  it('keeps manifest ordering, target languages, and checkpoint IDs deterministic', () => {
    const manifest = readManifest();

    expect(manifest.targetLanguages.map((language) => language.code)).toEqual(
      EXPECTED_TARGET_LANGUAGE_CODES
    );
    expect(manifest.latencyCheckpoints.map((checkpoint) => checkpoint.id)).toEqual(
      EXPECTED_LATENCY_CHECKPOINT_IDS
    );
    expect(manifest.fixtures.map((fixture) => fixture.order)).toEqual([1, 2, 3, 4]);
    expect(manifest.fixtures.map((fixture) => fixture.id)).toEqual(EXPECTED_SCRIPT_IDS);

    expectUnique(
      manifest.targetLanguages.map((language) => language.code),
      'target language codes'
    );
    expectUnique(
      manifest.latencyCheckpoints.map((checkpoint) => checkpoint.id),
      'latency checkpoint IDs'
    );
    expectUnique(
      manifest.fixtures.map((fixture) => fixture.id),
      'fixture IDs'
    );

    const supportedLanguageCodes = new Set(
      manifest.targetLanguages.map((language) => language.code)
    );
    const supportedCheckpointIds = new Set(
      manifest.latencyCheckpoints.map((checkpoint) => checkpoint.id)
    );

    for (const language of manifest.targetLanguages) {
      expect(language.code).toMatch(/^[a-z]{2}$/);
      expect(language.label.length).toBeGreaterThan(1);
      expect(typeof language.baseline).toBe('boolean');
    }

    for (const checkpoint of manifest.latencyCheckpoints) {
      expect(checkpoint.manual).toBe(true);
      expect(checkpoint.targetMs).toBeGreaterThan(0);
      expect(checkpoint.description.length).toBeGreaterThan(20);
    }

    for (const fixture of manifest.fixtures) {
      expect(fixture.category.length).toBeGreaterThan(0);
      expect(fixture.reviewFocus.length).toBeGreaterThan(0);
      expect(fixture.targetLanguageCodes.length).toBeGreaterThan(0);
      expect(fixture.latencyCheckpointIds).toEqual(EXPECTED_LATENCY_CHECKPOINT_IDS);

      for (const languageCode of fixture.targetLanguageCodes) {
        expect(supportedLanguageCodes.has(languageCode)).toBe(true);
      }

      for (const checkpointId of fixture.latencyCheckpointIds) {
        expect(supportedCheckpointIds.has(checkpointId)).toBe(true);
      }
    }
  });

  it('references committed golden scripts by stable ID', () => {
    const manifest = readManifest();
    const goldenScripts = readRepositoryText('tests/fixtures/translation/golden-scripts.md');

    expect(manifest.fixtures.map((fixture) => fixture.scriptId)).toEqual(EXPECTED_SCRIPT_IDS);

    for (const scriptId of EXPECTED_SCRIPT_IDS) {
      expect(goldenScripts).toContain(`## Script ID: ${scriptId}`);
    }
  });

  it('keeps required documentation headings discoverable', () => {
    const manifest = readManifest();

    for (const document of manifest.documents) {
      const documentText = readRepositoryText(document.path);

      for (const heading of document.requiredHeadings) {
        expect(documentText).toContain(`## ${heading}`);
      }
    }
  });

  it('keeps private local media optional for the committed baseline', () => {
    const manifest = readManifest();
    const gitignore = readRepositoryText('tests/fixtures/translation/.gitignore');

    expect(manifest.privacy.requiresPrivateMedia).toBe(false);
    expect(manifest.privacy.privateMediaPath).toBe('tests/fixtures/translation/local/');
    expect(manifest.privacy.localOutputPaths).toEqual([
      'tests/fixtures/translation/outputs/',
      'tests/fixtures/translation/runs/',
    ]);
    expect(manifest.privacy.disallowedCommittedData).toEqual(
      expect.arrayContaining([
        'customer media',
        'private meeting recordings',
        'raw provider payloads',
        'api keys',
        'unsanitized transcripts',
      ])
    );
    expect(gitignore).toContain('local/*');
    expect(gitignore).toContain('!local/.gitkeep');
    expect(gitignore).toContain('outputs/');
    expect(gitignore).toContain('runs/');
    expect(existsSync(repositoryPath('tests/fixtures/translation/local/.gitkeep'))).toBe(true);

    for (const fixture of manifest.fixtures) {
      expect(fixture.state).toBe('script-only');
      expect(fixture.audio.required).toBe(false);
      expect(fixture.audio.committedPath).toBeNull();
      expect(fixture.audio.localPathPattern).toContain('tests/fixtures/translation/local/');
    }
  });
});
