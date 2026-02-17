import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const requiredFiles = [
  'dist/index.html',
  '.env.demo',
  'docs/deploy.md',
  'docs/quality-dashboard.md',
  'docs/demo-handoff.md',
  'docs/release-checklist.md',
];

const requiredDemoEnv = {
  VITE_RUNTIME_PROFILE: 'demo',
  VITE_ENABLE_MSW: 'true',
  VITE_ENABLE_AUTH: 'false',
  VITE_ENABLE_TELEMETRY: 'false',
};

async function ensureFile(relativeFilePath) {
  const absolutePath = path.resolve(rootDir, relativeFilePath);
  const result = await stat(absolutePath).catch(() => null);
  if (!result?.isFile()) {
    throw new Error(`Missing required file: ${relativeFilePath}`);
  }
}

function parseDotEnv(content) {
  const lines = content.split(/\r?\n/);
  const output = {};

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) {
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    output[key] = value;
  });

  return output;
}

async function verifyDemoEnv() {
  const envFilePath = path.resolve(rootDir, '.env.demo');
  const envContent = await readFile(envFilePath, 'utf-8');
  const env = parseDotEnv(envContent);

  Object.entries(requiredDemoEnv).forEach(([key, value]) => {
    if (env[key] !== value) {
      throw new Error(`Expected ${key}=${value} in .env.demo`);
    }
  });
}

async function run() {
  for (const filePath of requiredFiles) {
    await ensureFile(filePath);
  }

  await verifyDemoEnv();

  console.log('Demo package verification passed.');
  console.log(`Verified ${requiredFiles.length} required files and demo runtime env defaults.`);
}

run().catch((error) => {
  console.error('Demo package verification failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
