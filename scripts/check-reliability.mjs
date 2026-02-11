import fs from 'node:fs/promises';
import path from 'node:path';

const configPath = path.resolve(process.cwd(), 'config/reliability/slo.json');

function fail(message) {
  console.error(`- ${message}`);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function inRange(value, min, max) {
  return isFiniteNumber(value) && value >= min && value <= max;
}

async function run() {
  let raw;
  try {
    raw = await fs.readFile(configPath, 'utf8');
  } catch {
    console.error('Reliability policy validation failed:');
    fail(`Missing reliability config: ${configPath}`);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('Reliability policy validation failed:');
    fail(`Invalid JSON in ${configPath}`);
    process.exit(1);
  }

  const errors = [];

  if (!parsed.service || typeof parsed.service !== 'string') {
    errors.push('service must be a non-empty string');
  }

  const availability = parsed.availability ?? {};
  if (!inRange(availability.targetPercent, 90, 100)) {
    errors.push('availability.targetPercent must be between 90 and 100');
  }
  if (!inRange(availability.errorBudgetPercent, 0, 10)) {
    errors.push('availability.errorBudgetPercent must be between 0 and 10');
  }
  if (
    !Number.isInteger(availability.measurementWindowDays) ||
    availability.measurementWindowDays < 7
  ) {
    errors.push('availability.measurementWindowDays must be an integer >= 7');
  }

  if (
    inRange(availability.targetPercent, 90, 100) &&
    inRange(availability.errorBudgetPercent, 0, 10)
  ) {
    const expectedBudget = Number((100 - availability.targetPercent).toFixed(2));
    const delta = Math.abs(availability.errorBudgetPercent - expectedBudget);
    if (delta > 0.05) {
      errors.push(
        `availability.errorBudgetPercent should equal ~${expectedBudget} for target ${availability.targetPercent}`,
      );
    }
  }

  const latency = parsed.latency ?? {};
  if (!Number.isInteger(latency.pageLoadP95Ms) || latency.pageLoadP95Ms <= 0) {
    errors.push('latency.pageLoadP95Ms must be a positive integer');
  }
  if (!Number.isInteger(latency.routeTransitionP95Ms) || latency.routeTransitionP95Ms <= 0) {
    errors.push('latency.routeTransitionP95Ms must be a positive integer');
  }

  const incident = parsed.incident ?? {};
  const sev1 = incident.sev1AckMinutes;
  const sev2 = incident.sev2AckMinutes;
  const sev3 = incident.sev3AckMinutes;
  const sev4 = incident.sev4AckMinutes;

  if (![sev1, sev2, sev3, sev4].every((value) => Number.isInteger(value) && value > 0)) {
    errors.push('incident.sev*AckMinutes must all be positive integers');
  } else if (!(sev1 <= sev2 && sev2 <= sev3 && sev3 <= sev4)) {
    errors.push('incident.sev*AckMinutes must be ordered from SEV1 to SEV4');
  }

  if (!Number.isInteger(incident.targetMttrMinutes) || incident.targetMttrMinutes <= 0) {
    errors.push('incident.targetMttrMinutes must be a positive integer');
  }

  const alerting = parsed.alerting ?? {};
  if (
    typeof alerting.onCallSlackChannel !== 'string' ||
    !alerting.onCallSlackChannel.startsWith('#')
  ) {
    errors.push('alerting.onCallSlackChannel must be a #channel string');
  }
  if (typeof alerting.pagerService !== 'string' || alerting.pagerService.trim().length === 0) {
    errors.push('alerting.pagerService must be a non-empty string');
  }

  if (errors.length > 0) {
    console.error('Reliability policy validation failed:');
    errors.forEach(fail);
    process.exit(1);
  }

  console.log('Reliability policy validation passed.');
  console.log(`- Service: ${parsed.service}`);
  console.log(`- Availability target: ${availability.targetPercent}%`);
  console.log(`- Error budget: ${availability.errorBudgetPercent}%`);
  console.log(
    `- Latency p95 targets: load ${latency.pageLoadP95Ms}ms, route ${latency.routeTransitionP95Ms}ms`,
  );
  console.log(`- Incident MTTR target: ${incident.targetMttrMinutes}m`);
}

run().catch((error) => {
  console.error('Reliability policy validation failed with an unexpected error:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
