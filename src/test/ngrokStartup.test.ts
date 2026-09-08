// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import {
  symlinkSync,
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const temporary: string[] = [];
const children: number[] = [];
afterEach(() => {
  for (const pid of children.splice(0)) {
    try {
      process.kill(pid);
    } catch {
      /* Already exited. */
    }
  }
  for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pupu-ngrok-'));
  temporary.push(root);
  const scripts = join(root, 'scripts/ngrok');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(join(root, 'bin'));
  symlinkSync(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir');
  for (const file of ['start-tunnels.sh', 'generate-ngrok-config.sh', 'ngrok.yml.template']) {
    copyFileSync(join(process.cwd(), 'scripts/ngrok', file), join(scripts, file));
  }
  const executable = (path: string, text: string) => writeFileSync(path, text, { mode: 0o755 });
  executable(
    join(scripts, 'wait-for-tunnels.sh'),
    '#!/bin/bash\necho DEMO_URL=https://demo.example.test\n'
  );
  writeFileSync(join(root, 'saved.yml'), 'version: "2"\n');
  executable(
    join(root, 'bin/ngrok'),
    `#!/bin/bash
if [[ "$1" == config ]]; then echo "Valid configuration file at $FIXTURE_ROOT/saved.yml"; exit; fi
printf '%s\\n' "$@" > "$FIXTURE_ROOT/arguments"
printf '%s' "\${NGROK_AUTHTOKEN:-}" > "$FIXTURE_ROOT/token"
if [[ "\${FAIL_START:-}" == true ]]; then echo "secret-$NGROK_AUTHTOKEN ERR_NGROK_105"; exit 1; fi
exec /bin/sleep 60
`
  );
  const run = (extra: Record<string, string> = {}) => {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith('NGROK_'))
    );
    const output = execFileSync('bash', [join(scripts, 'start-tunnels.sh')], {
      env: { ...env, PATH: `${root}/bin:${process.env.PATH}`, FIXTURE_ROOT: root, ...extra },
      encoding: 'utf8',
      timeout: 10000,
    });
    const pid = output.match(/NGROK_PID=(\d+)/)?.[1];
    if (pid) children.push(Number(pid));
    return output;
  };
  return { root, scripts, run };
}

describe('ngrok demo startup', () => {
  it('ignores example values, merges saved login, and starts only the demo tunnel', () => {
    const { root, scripts, run } = fixture();
    writeFileSync(
      join(root, '.env'),
      'NGROK_AUTHTOKEN=<your-token>\nNGROK_DOMAIN=<your-domain>.ngrok.io\n'
    );
    expect(run()).toContain('DEMO_URL=https://demo.example.test');
    expect(readFileSync(join(root, 'token'), 'utf8')).toBe('');
    expect(readFileSync(join(root, 'arguments'), 'utf8').split('\n')).toEqual([
      'start',
      'demo',
      '--config',
      join(root, 'saved.yml'),
      '--config',
      join(scripts, 'ngrok.yml'),
      '',
    ]);
    expect(readFileSync(join(scripts, 'ngrok.yml'), 'utf8')).not.toContain('domain:');
  });

  it('honors an explicitly supplied token before the project environment file', () => {
    const { root, run } = fixture();
    writeFileSync(join(root, '.env'), 'NGROK_AUTHTOKEN=file-token\n');
    const output = run({ NGROK_AUTHTOKEN: 'process-token' });
    expect(readFileSync(join(root, 'token'), 'utf8')).toBe('process-token');
    expect(output).not.toContain('process-token');
  });

  it('reports startup diagnostic codes without echoing credentials', () => {
    const { run } = fixture();
    try {
      run({ NGROK_AUTHTOKEN: 'private-test-token', FAIL_START: 'true' });
      throw new Error('Expected startup failure');
    } catch (error) {
      const result = error as { stdout: string; stderr: string; status: number };
      expect(result.status).toBe(1);
      expect(`${result.stdout}${result.stderr}`).toContain('ERR_NGROK_105');
      expect(`${result.stdout}${result.stderr}`).not.toContain('private-test-token');
    }
  });
  it('preserves quoted password characters and safely encodes basic authentication', () => {
    const { root, scripts, run } = fixture();
    const password = 'test#with"quotes\\and:colon';
    writeFileSync(join(root, '.env'), `NGROK_AUTH_USER=demo\nNGROK_AUTH_PASS='${password}'\n`);
    const output = run();
    const config = readFileSync(join(scripts, 'ngrok.yml'), 'utf8');
    const encoded = config.match(/basic_auth:\n\s+- (.+)/)?.[1];
    expect(JSON.parse(encoded!)).toBe(`demo:${password}`);
    expect(output).not.toContain(password);
  });
  it('refuses incomplete basic authentication rather than starting a public tunnel', () => {
    const { run } = fixture();
    expect(() => run({ NGROK_AUTH_USER: 'demo' })).toThrow();
  });
});
