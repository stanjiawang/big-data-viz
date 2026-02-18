import fs from 'node:fs/promises';
import path from 'node:path';

const featuresRoot = path.resolve(process.cwd(), 'src/features');
const e2eRoot = path.resolve(process.cwd(), 'tests/e2e');

const FILE_IGNORES = new Set(['index.ts', 'types.ts']);
const COMPONENT_FILE_PATTERN = /^[A-Z][A-Za-z0-9]*\.tsx$/;
const UTILITY_FILE_PATTERN =
  /^(use[A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*|[A-Z][A-Za-z0-9]*)\.ts$/;
const TEST_FILE_PATTERN = /^[A-Za-z0-9]+(\.[A-Za-z0-9-]+)?\.test\.tsx?$/;
const E2E_FILE_PATTERN = /^[a-z0-9-]+\.e2e\.spec\.ts$/;
const DIR_PATTERN = /^[a-z][a-z0-9-]*$/;

function relativeToRepo(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, '/');
}

async function collectFiles(root) {
  const stack = [root];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else {
        files.push(absolute);
      }
    }
  }

  return files;
}

function validateFeatureFile(filePath, errors) {
  const fileName = path.basename(filePath);
  if (FILE_IGNORES.has(fileName)) {
    return;
  }

  if (fileName.endsWith('.tsx')) {
    if (!COMPONENT_FILE_PATTERN.test(fileName) && !TEST_FILE_PATTERN.test(fileName)) {
      errors.push(
        `${relativeToRepo(filePath)}: .tsx files must be PascalCase component files or *.test.tsx`,
      );
    }
    return;
  }

  if (fileName.endsWith('.ts')) {
    if (
      !UTILITY_FILE_PATTERN.test(fileName) &&
      !TEST_FILE_PATTERN.test(fileName) &&
      !fileName.endsWith('.d.ts')
    ) {
      errors.push(
        `${relativeToRepo(filePath)}: .ts files must be camelCase / useHookName / *.test.ts`,
      );
    }
  }
}

function validateFeatureDirs(filePath, errors) {
  const rel = path.relative(featuresRoot, filePath);
  const segments = rel.split(path.sep).slice(0, -1);
  for (const segment of segments) {
    if (!DIR_PATTERN.test(segment)) {
      errors.push(
        `${relativeToRepo(filePath)}: directory "${segment}" must be kebab-case lowercase`,
      );
    }
  }
}

function validateE2EFile(filePath, errors) {
  const fileName = path.basename(filePath);
  if (!E2E_FILE_PATTERN.test(fileName)) {
    errors.push(`${relativeToRepo(filePath)}: e2e spec filename must match *.e2e.spec.ts`);
  }
}

async function run() {
  const errors = [];

  const featureFiles = await collectFiles(featuresRoot);
  for (const filePath of featureFiles) {
    validateFeatureDirs(filePath, errors);
    validateFeatureFile(filePath, errors);
  }

  const e2eFiles = await collectFiles(e2eRoot);
  for (const filePath of e2eFiles) {
    validateE2EFile(filePath, errors);
  }

  if (errors.length > 0) {
    console.error('Feature structure validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Feature structure validation passed.');
  console.log(`- Features root: ${featuresRoot}`);
  console.log(`- E2E root: ${e2eRoot}`);
}

run().catch((error) => {
  console.error('Feature structure validation failed with unexpected error:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
