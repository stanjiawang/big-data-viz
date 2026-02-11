import fs from 'node:fs/promises';
import path from 'node:path';

const templatePath = path.resolve(process.cwd(), 'docs/templates/incident.md');
const incidentsRoot = path.resolve(process.cwd(), 'docs/incidents');

function parseArgs(argv) {
  const output = {
    severity: 'SEV3',
    title: 'Untitled Incident',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--severity' && argv[i + 1]) {
      output.severity = argv[i + 1].toUpperCase();
      i += 1;
    } else if (arg === '--title' && argv[i + 1]) {
      output.title = argv[i + 1];
      i += 1;
    }
  }

  return output;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function run() {
  const { severity, title } = parseArgs(process.argv.slice(2));

  if (!['SEV1', 'SEV2', 'SEV3', 'SEV4'].includes(severity)) {
    throw new Error('Invalid --severity value. Use SEV1, SEV2, SEV3, or SEV4.');
  }

  const template = await fs.readFile(templatePath, 'utf8');
  const now = new Date();
  const iso = now.toISOString();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const incidentId = `INC-${iso.slice(0, 10).replace(/-/g, '')}-${iso.slice(11, 19).replace(/:/g, '')}`;
  const fileName = `${incidentId}-${slugify(title)}.md`;
  const incidentDir = path.join(incidentsRoot, year, month);
  const outputPath = path.join(incidentDir, fileName);

  await fs.mkdir(incidentDir, { recursive: true });

  const content = template
    .replaceAll('{{INCIDENT_ID}}', incidentId)
    .replaceAll('{{SEVERITY}}', severity)
    .replaceAll('{{TITLE}}', title)
    .replaceAll('{{CREATED_AT}}', iso)
    .replaceAll('{{DATE}}', `${year}-${month}-${day}`);

  await fs.writeFile(outputPath, content, 'utf8');

  console.log('Incident document created.');
  console.log(outputPath);
}

run().catch((error) => {
  console.error('Failed to create incident document.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
