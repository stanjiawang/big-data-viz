import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cloudflareHeadersPath = path.join(rootDir, 'public', '_headers');
const vercelConfigPath = path.join(rootDir, 'vercel.json');

const requiredHeaderKeys = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'Content-Security-Policy',
];

const requiredCspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "object-src 'none'",
];

function fail(message) {
  console.error(`Security header validation failed: ${message}`);
  process.exit(1);
}

const cloudflareHeadersRaw = readFileSync(cloudflareHeadersPath, 'utf8');
for (const header of requiredHeaderKeys) {
  if (!cloudflareHeadersRaw.includes(`${header}:`)) {
    fail(`missing "${header}" in public/_headers`);
  }
}

for (const directive of requiredCspDirectives) {
  if (!cloudflareHeadersRaw.includes(directive)) {
    fail(`missing CSP directive "${directive}" in public/_headers`);
  }
}

const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
const vercelHeaders = Array.isArray(vercelConfig.headers) ? vercelConfig.headers : [];
if (vercelHeaders.length === 0) {
  fail('vercel.json must define at least one headers rule');
}

const flattenedVercelHeaders = vercelHeaders.flatMap((rule) =>
  Array.isArray(rule.headers) ? rule.headers : [],
);
for (const header of requiredHeaderKeys) {
  const exists = flattenedVercelHeaders.some((entry) => entry?.key === header);
  if (!exists) {
    fail(`missing "${header}" in vercel.json`);
  }
}

const cspValue =
  flattenedVercelHeaders.find((entry) => entry?.key === 'Content-Security-Policy')?.value ?? '';
for (const directive of requiredCspDirectives) {
  if (!cspValue.includes(directive)) {
    fail(`missing CSP directive "${directive}" in vercel.json`);
  }
}

console.log('Security header validation passed.');
