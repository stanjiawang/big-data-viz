import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const outputDir = resolve(process.cwd(), 'artifacts');
const outputPath = resolve(outputDir, 'sbom.cdx.json');

mkdirSync(outputDir, { recursive: true });

const commands = [
  {
    cmd: 'pnpm',
    args: [
      'exec',
      'cyclonedx-npm',
      '--ignore-npm-errors',
      '--of',
      'JSON',
      '--output-file',
      outputPath,
      '--spec-version',
      '1.5',
    ],
  },
  {
    cmd: 'npx',
    args: [
      '--yes',
      '@cyclonedx/cyclonedx-npm',
      '--ignore-npm-errors',
      '--of',
      'JSON',
      '--output-file',
      outputPath,
      '--spec-version',
      '1.5',
    ],
  },
];

let lastFailure = null;
for (const command of commands) {
  const result = spawnSync(command.cmd, command.args, {
    encoding: 'utf8',
  });

  if (result.status === 0) {
    console.log(`SBOM generated at ${outputPath}`);
    process.exit(0);
  }

  lastFailure = {
    command: `${command.cmd} ${command.args.join(' ')}`,
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  };
}

console.error('SBOM generation failed.');
if (lastFailure) {
  console.error(`Last command: ${lastFailure.command}`);
  if (lastFailure.stdout?.trim()) {
    console.error(lastFailure.stdout.trim());
  }
  if (lastFailure.stderr?.trim()) {
    console.error(lastFailure.stderr.trim());
  }
}
process.exit(1);
