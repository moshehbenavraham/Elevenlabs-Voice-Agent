import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const configPath = resolve(process.cwd(), 'public/config.js');
const resetDemo = process.argv.includes('--reset-demo');
const stub = `/* Local development mode - no runtime config override */
/* This file is overwritten by demo mode with actual ngrok URLs */
`;

async function ensureConfigStub() {
  let current = null;

  try {
    current = await readFile(configPath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  const shouldWrite =
    current === null ||
    (resetDemo && current.includes('__DEMO_CONFIG__'));

  if (!shouldWrite) {
    return;
  }

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, stub);

  const action = current === null ? 'Created' : 'Reset';
  console.log(`${action} public/config.js local stub`);
}

ensureConfigStub().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
