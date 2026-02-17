import fs from 'node:fs/promises';
import path from 'node:path';

const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
const releaseChecklistPath = path.resolve(process.cwd(), 'docs/release-checklist.md');
const rollbackChecklistPath = path.resolve(process.cwd(), 'docs/rollback-checklist.md');
const authRolloutChecklistPath = path.resolve(process.cwd(), 'docs/auth-rollout-checklist.md');
const authIncidentPlaybookPath = path.resolve(process.cwd(), 'docs/auth-incident-playbook.md');

function hasSection(content, heading) {
  return new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm').test(content);
}

function hasChecklistItem(content, snippet) {
  return new RegExp(`^- \\[ \\].*${snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi').test(
    content,
  );
}

async function readFileOrNull(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function run() {
  const errors = [];

  const [
    changelog,
    releaseChecklist,
    rollbackChecklist,
    authRolloutChecklist,
    authIncidentPlaybook,
  ] = await Promise.all([
    readFileOrNull(changelogPath),
    readFileOrNull(releaseChecklistPath),
    readFileOrNull(rollbackChecklistPath),
    readFileOrNull(authRolloutChecklistPath),
    readFileOrNull(authIncidentPlaybookPath),
  ]);

  if (!changelog) {
    errors.push(`Missing changelog file: ${changelogPath}`);
  } else {
    if (!hasSection(changelog, 'Unreleased')) {
      errors.push('CHANGELOG.md must include a "## Unreleased" section');
    }
    if (!hasSection(changelog, 'Release Procedure')) {
      errors.push('CHANGELOG.md must include a "## Release Procedure" section');
    }
  }

  if (!releaseChecklist) {
    errors.push(`Missing release checklist: ${releaseChecklistPath}`);
  } else {
    const requiredItems = [
      'Version and scope are finalized',
      'Changelog entry is updated',
      'Reliability, performance, and contract gates passed',
      'Dependency policy gate passed',
      'SBOM artifact generated and attached',
      'Rollback plan and owner confirmed',
      'Post-release monitoring window scheduled',
      'Auth rollout checklist completed for the target environment',
    ];
    for (const item of requiredItems) {
      if (!hasChecklistItem(releaseChecklist, item)) {
        errors.push(`docs/release-checklist.md missing checklist item: "${item}"`);
      }
    }
  }

  if (!rollbackChecklist) {
    errors.push(`Missing rollback checklist: ${rollbackChecklistPath}`);
  } else {
    const requiredItems = [
      'Release identifier and blast radius documented',
      'Rollback trigger condition confirmed',
      'Known good target release identified',
      'Customer communication prepared',
      'Post-rollback verification complete',
    ];
    for (const item of requiredItems) {
      if (!hasChecklistItem(rollbackChecklist, item)) {
        errors.push(`docs/rollback-checklist.md missing checklist item: "${item}"`);
      }
    }
  }

  if (!authRolloutChecklist) {
    errors.push(`Missing auth rollout checklist: ${authRolloutChecklistPath}`);
  } else {
    const requiredItems = [
      'OIDC client configuration matches environment',
      'Sign-in callback succeeds and dashboard renders for viewer role',
      'RBAC validation passed for viewer, analyst, and admin personas',
      'Session refresh succeeds at least once before token expiry window',
      'Fallback config (`VITE_ENABLE_AUTH=false`) is prepared and verified',
    ];
    for (const item of requiredItems) {
      if (!hasChecklistItem(authRolloutChecklist, item)) {
        errors.push(`docs/auth-rollout-checklist.md missing checklist item: "${item}"`);
      }
    }
  }

  if (!authIncidentPlaybook) {
    errors.push(`Missing auth incident playbook: ${authIncidentPlaybookPath}`);
  } else {
    const requiredSectionHeadings = [
      'Trigger Signals',
      'Triage Steps',
      'Mitigation',
      'Recovery Verification',
    ];
    for (const heading of requiredSectionHeadings) {
      if (!hasSection(authIncidentPlaybook, heading)) {
        errors.push(`docs/auth-incident-playbook.md missing section: "## ${heading}"`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Release governance validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Release governance validation passed.');
  console.log(`- Changelog: ${changelogPath}`);
  console.log(`- Release checklist: ${releaseChecklistPath}`);
  console.log(`- Rollback checklist: ${rollbackChecklistPath}`);
  console.log(`- Auth rollout checklist: ${authRolloutChecklistPath}`);
  console.log(`- Auth incident playbook: ${authIncidentPlaybookPath}`);
}

run().catch((error) => {
  console.error('Release governance validation failed with an unexpected error:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
