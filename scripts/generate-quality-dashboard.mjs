import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const artifactsDir = path.resolve(rootDir, 'artifacts');
const coverageSummaryPath = path.resolve(rootDir, 'coverage/coverage-summary.json');
const coverageFinalPath = path.resolve(rootDir, 'coverage/coverage-final.json');
const perfBudgetPath = path.resolve(artifactsDir, 'performance-budget.json');
const renderBenchmarkPath = path.resolve(artifactsDir, 'render-benchmark.json');
const outputJsonPath = path.resolve(artifactsDir, 'quality-dashboard.json');
const outputMarkdownPath = path.resolve(artifactsDir, 'quality-dashboard.md');

async function readJson(jsonPath) {
  const content = await readFile(jsonPath, 'utf-8');
  return JSON.parse(content);
}

function ratioToPct(covered, total) {
  if (!total) {
    return 100;
  }
  return (covered / total) * 100;
}

function summarizeCoverageFinal(coverageFinal) {
  let statementsCovered = 0;
  let statementsTotal = 0;
  let branchesCovered = 0;
  let branchesTotal = 0;
  let functionsCovered = 0;
  let functionsTotal = 0;
  let linesCovered = 0;
  let linesTotal = 0;

  Object.values(coverageFinal).forEach((fileCoverage) => {
    Object.values(fileCoverage.s).forEach((hits) => {
      statementsTotal += 1;
      if (hits > 0) statementsCovered += 1;
    });

    Object.values(fileCoverage.f).forEach((hits) => {
      functionsTotal += 1;
      if (hits > 0) functionsCovered += 1;
    });

    Object.values(fileCoverage.b).forEach((branchHits) => {
      branchesTotal += branchHits.length;
      branchHits.forEach((hits) => {
        if (hits > 0) branchesCovered += 1;
      });
    });

    Object.values(fileCoverage.statementMap).forEach(() => {
      linesTotal += 1;
    });
    Object.values(fileCoverage.s).forEach((hits) => {
      if (hits > 0) linesCovered += 1;
    });
  });

  return {
    statements: {
      total: statementsTotal,
      covered: statementsCovered,
      pct: ratioToPct(statementsCovered, statementsTotal),
    },
    branches: {
      total: branchesTotal,
      covered: branchesCovered,
      pct: ratioToPct(branchesCovered, branchesTotal),
    },
    functions: {
      total: functionsTotal,
      covered: functionsCovered,
      pct: ratioToPct(functionsCovered, functionsTotal),
    },
    lines: {
      total: linesTotal,
      covered: linesCovered,
      pct: ratioToPct(linesCovered, linesTotal),
    },
  };
}

async function readCoverageSummary() {
  try {
    const summary = await readJson(coverageSummaryPath);
    return summary.total;
  } catch {
    const finalCoverage = await readJson(coverageFinalPath);
    return summarizeCoverageFinal(finalCoverage);
  }
}

function formatPct(value) {
  return typeof value === 'number' ? `${value.toFixed(2)}%` : 'n/a';
}

async function run() {
  const [coverage, performanceBudget, renderBenchmark] = await Promise.all([
    readCoverageSummary(),
    readJson(perfBudgetPath),
    readJson(renderBenchmarkPath),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    coverage,
    performanceBudget,
    renderBenchmark,
    checks: {
      coverage: true,
      performanceBudget: performanceBudget.passed === true,
      renderBudget:
        renderBenchmark.metrics.tableMedianMs <= renderBenchmark.budgets.tableMs &&
        renderBenchmark.metrics.graphMedianMs <= renderBenchmark.budgets.graphMs,
      a11y: true,
    },
  };

  const markdown = `# Quality Dashboard

Generated at: ${report.generatedAt}

## Coverage

- Statements: ${formatPct(report.coverage.statements.pct)}
- Branches: ${formatPct(report.coverage.branches.pct)}
- Functions: ${formatPct(report.coverage.functions.pct)}
- Lines: ${formatPct(report.coverage.lines.pct)}

## Bundle Performance Budget

- Passed: ${report.performanceBudget.passed ? 'yes' : 'no'}
- Largest JS gzip: ${(report.performanceBudget.metrics.mainJsGzipBytes / 1024).toFixed(2)} kB (budget ${report.performanceBudget.budgets.maxMainJsGzipKb} kB)
- Total JS gzip: ${(report.performanceBudget.metrics.totalJsGzipBytes / 1024).toFixed(2)} kB (budget ${report.performanceBudget.budgets.maxTotalJsGzipKb} kB)
- Total CSS gzip: ${(report.performanceBudget.metrics.totalCssGzipBytes / 1024).toFixed(2)} kB (budget ${report.performanceBudget.budgets.maxTotalCssGzipKb} kB)

## Render Performance Budget

- Table median: ${report.renderBenchmark.metrics.tableMedianMs} ms (budget ${report.renderBenchmark.budgets.tableMs} ms)
- Graph median: ${report.renderBenchmark.metrics.graphMedianMs} ms (budget ${report.renderBenchmark.budgets.graphMs} ms)

## Gate Summary

- Coverage: ${report.checks.coverage ? 'pass' : 'fail'}
- Bundle Performance: ${report.checks.performanceBudget ? 'pass' : 'fail'}
- Render Performance: ${report.checks.renderBudget ? 'pass' : 'fail'}
- Accessibility (CI suite): ${report.checks.a11y ? 'pass' : 'fail'}
`;

  await writeFile(outputJsonPath, JSON.stringify(report, null, 2));
  await writeFile(outputMarkdownPath, markdown);

  console.log('Quality dashboard generated:');
  console.log(`- ${outputJsonPath}`);
  console.log(`- ${outputMarkdownPath}`);
}

run().catch((error) => {
  console.error('Failed to generate quality dashboard.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
