import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.resolve(process.cwd(), 'dist');
const assetsDir = path.resolve(distDir, 'assets');

const budgets = {
  maxMainJsGzipKb: Number(process.env.PERF_MAX_MAIN_JS_GZIP_KB ?? 550),
  maxTotalJsGzipKb: Number(process.env.PERF_MAX_TOTAL_JS_GZIP_KB ?? 700),
  maxTotalCssGzipKb: Number(process.env.PERF_MAX_TOTAL_CSS_GZIP_KB ?? 30),
  maxTotalAssetsGzipKb: Number(process.env.PERF_MAX_TOTAL_ASSETS_GZIP_KB ?? 760),
};

async function listFilesRecursively(rootDir) {
  const output = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        output.push(fullPath);
      }
    }
  }

  return output;
}

function gzipSizeBytes(content) {
  return zlib.gzipSync(content, { level: 9 }).byteLength;
}

function kb(bytes) {
  return bytes / 1024;
}

function formatKb(bytes) {
  return `${kb(bytes).toFixed(2)} kB`;
}

function validateBudgets(metrics) {
  const failures = [];

  if (kb(metrics.mainJsGzipBytes) > budgets.maxMainJsGzipKb) {
    failures.push(
      `Main JS gzip size ${formatKb(metrics.mainJsGzipBytes)} exceeds budget ${budgets.maxMainJsGzipKb.toFixed(2)} kB`,
    );
  }

  if (kb(metrics.totalJsGzipBytes) > budgets.maxTotalJsGzipKb) {
    failures.push(
      `Total JS gzip size ${formatKb(metrics.totalJsGzipBytes)} exceeds budget ${budgets.maxTotalJsGzipKb.toFixed(2)} kB`,
    );
  }

  if (kb(metrics.totalCssGzipBytes) > budgets.maxTotalCssGzipKb) {
    failures.push(
      `Total CSS gzip size ${formatKb(metrics.totalCssGzipBytes)} exceeds budget ${budgets.maxTotalCssGzipKb.toFixed(2)} kB`,
    );
  }

  if (kb(metrics.totalAssetsGzipBytes) > budgets.maxTotalAssetsGzipKb) {
    failures.push(
      `Total assets gzip size ${formatKb(metrics.totalAssetsGzipBytes)} exceeds budget ${budgets.maxTotalAssetsGzipKb.toFixed(2)} kB`,
    );
  }

  return failures;
}

async function run() {
  const assetsStat = await fs.stat(assetsDir).catch(() => null);
  if (!assetsStat?.isDirectory()) {
    throw new Error(`Missing assets directory at ${assetsDir}. Run the build first.`);
  }

  const files = await listFilesRecursively(assetsDir);

  let mainJsGzipBytes = 0;
  let totalJsGzipBytes = 0;
  let totalCssGzipBytes = 0;
  let totalAssetsGzipBytes = 0;

  for (const filePath of files) {
    const buffer = await fs.readFile(filePath);
    const gzipBytes = gzipSizeBytes(buffer);
    totalAssetsGzipBytes += gzipBytes;

    if (filePath.endsWith('.js')) {
      totalJsGzipBytes += gzipBytes;
      if (gzipBytes > mainJsGzipBytes) {
        mainJsGzipBytes = gzipBytes;
      }
    }

    if (filePath.endsWith('.css')) {
      totalCssGzipBytes += gzipBytes;
    }
  }

  const metrics = {
    mainJsGzipBytes,
    totalJsGzipBytes,
    totalCssGzipBytes,
    totalAssetsGzipBytes,
  };

  const failures = validateBudgets(metrics);

  console.log('Performance budget metrics:');
  console.log(`- Largest JS chunk (gzip): ${formatKb(metrics.mainJsGzipBytes)}`);
  console.log(`- Total JS (gzip): ${formatKb(metrics.totalJsGzipBytes)}`);
  console.log(`- Total CSS (gzip): ${formatKb(metrics.totalCssGzipBytes)}`);
  console.log(`- Total assets (gzip): ${formatKb(metrics.totalAssetsGzipBytes)}`);
  console.log('Performance budgets:');
  console.log(`- PERF_MAX_MAIN_JS_GZIP_KB=${budgets.maxMainJsGzipKb}`);
  console.log(`- PERF_MAX_TOTAL_JS_GZIP_KB=${budgets.maxTotalJsGzipKb}`);
  console.log(`- PERF_MAX_TOTAL_CSS_GZIP_KB=${budgets.maxTotalCssGzipKb}`);
  console.log(`- PERF_MAX_TOTAL_ASSETS_GZIP_KB=${budgets.maxTotalAssetsGzipKb}`);

  if (failures.length > 0) {
    console.error('Performance budget validation failed:');
    failures.forEach((failure) => {
      console.error(`- ${failure}`);
    });
    process.exit(1);
  }

  console.log('Performance budget validation passed.');
}

run().catch((error) => {
  console.error('Performance budget validation failed with an unexpected error:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
