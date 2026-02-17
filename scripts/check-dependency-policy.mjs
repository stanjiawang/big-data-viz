import { spawnSync } from 'node:child_process';

const severityOrder = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const minimumSeverity = process.env.DEPENDENCY_POLICY_MIN_SEVERITY ?? 'high';
const minimumRank = severityOrder[minimumSeverity] ?? severityOrder.high;

function extractJsonPayload(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function readVulnerabilityCounts(payload) {
  const counts = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };

  const metadata = payload?.metadata?.vulnerabilities;
  if (metadata && typeof metadata === 'object') {
    for (const key of Object.keys(counts)) {
      const value = Number(metadata[key] ?? 0);
      counts[key] = Number.isFinite(value) ? value : 0;
    }
    return counts;
  }

  const vulnerabilities = payload?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== 'object') {
    return counts;
  }

  for (const value of Object.values(vulnerabilities)) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const severity = String(value.severity ?? '').toLowerCase();
    if (severity in counts) {
      counts[severity] += 1;
    }
  }

  return counts;
}

const result = spawnSync('pnpm', ['audit', '--prod', '--json'], {
  encoding: 'utf8',
});

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const payload = extractJsonPayload(output);

if (!payload) {
  console.error('Dependency policy validation failed: could not parse pnpm audit JSON output.');
  if (output.trim()) {
    console.error(output.trim());
  }
  process.exit(1);
}

const counts = readVulnerabilityCounts(payload);
const violatingCount = Object.entries(counts)
  .filter(([severity]) => (severityOrder[severity] ?? 0) >= minimumRank)
  .reduce((sum, [, value]) => sum + value, 0);

if (violatingCount > 0) {
  console.error(
    `Dependency policy validation failed: found ${violatingCount} vulnerabilities at severity ${minimumSeverity} or higher.`,
  );
  console.error(`Counts: ${JSON.stringify(counts)}`);
  process.exit(1);
}

console.log('Dependency policy validation passed.');
console.log(`Counts: ${JSON.stringify(counts)}`);
