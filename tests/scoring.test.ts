/**
 * Pins the scoring math in src/utils/scoring.ts and the demo grade bands (issue #19).
 * Deductions: critical=40, high=25, medium=10, info=5, floored at 0.
 * Weights: ssh=25, auth=20, firewall=25, container=15, storage=10, api=5 (sum 100).
 * Grades: A>=90, B>=80, C>=70, D>=60, F<60.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AuditCategory, CategoryScore, Finding, Grade, SecurityRule, Severity } from '../src/types';
import { getSample } from '../src/data/index';
import { parseAllConfigs } from '../src/parsers/index';
import { allRules } from '../src/rules/index';
import {
  calculateCategoryScore,
  calculateOverallScore,
  generateAuditReport,
  scoreToGrade,
} from '../src/utils/scoring';
import { readFixture } from './helpers';

function finding(severity: Severity, passed: boolean, category: AuditCategory = 'ssh'): Finding {
  const rule: SecurityRule = {
    id: `synthetic-${severity}`,
    category,
    severity,
    title: 'synthetic',
    description: 'synthetic rule for scoring tests',
    test: () => ({ passed, evidence: 'synthetic' }),
    remediation: '',
    remediationScript: '',
  };
  return { rule, result: { passed, evidence: 'synthetic' } };
}

function categoryScore(category: AuditCategory, score: number): CategoryScore {
  return { category, score, findings: [], maxScore: 100 };
}

const SEVERITY_DEDUCTIONS: [Severity, number][] = [
  ['critical', 40],
  ['high', 25],
  ['medium', 10],
  ['info', 5],
];

const CATEGORY_WEIGHTS: [AuditCategory, number][] = [
  ['ssh', 25],
  ['auth', 20],
  ['firewall', 25],
  ['container', 15],
  ['storage', 10],
  ['api', 5],
];

for (const [severity, deduction] of SEVERITY_DEDUCTIONS) {
  test(`category score: one failed ${severity} finding deducts ${deduction}`, () => {
    const result = calculateCategoryScore('ssh', [finding(severity, false)]);
    assert.equal(result.score, 100 - deduction);
    assert.equal(result.maxScore, 100);
  });

  test(`category score: a passed ${severity} finding deducts nothing`, () => {
    assert.equal(calculateCategoryScore('ssh', [finding(severity, true)]).score, 100);
  });
}

test('category score: deductions add up across findings', () => {
  const findings = [finding('high', false), finding('medium', false), finding('info', false)];
  assert.equal(calculateCategoryScore('auth', findings).score, 100 - 25 - 10 - 5);
});

test('category score: floors at 0 instead of going negative', () => {
  const findings = [finding('critical', false), finding('critical', false), finding('critical', false)];
  assert.equal(calculateCategoryScore('firewall', findings).score, 0);
});

test('category score: no findings scores 100', () => {
  assert.equal(calculateCategoryScore('storage', []).score, 100);
});

for (const [category, weight] of CATEGORY_WEIGHTS) {
  test(`overall score: ${category} alone at 100 with every other category at 0 yields its weight ${weight}`, () => {
    // Weights sum to 100, so a lone perfect category contributes exactly its weight.
    // Moving any weight by 1 changes both numerator and total and shifts the rounded result.
    const categories = CATEGORY_WEIGHTS.map(([cat]) => categoryScore(cat, cat === category ? 100 : 0));
    assert.equal(calculateOverallScore(categories), weight);
  });
}

test('overall score: weighted combination across all categories, rounded', () => {
  // (40*25 + 75*20 + 90*25 + 65*15 + 100*10 + 50*5) / 100 = 69.75 -> 70
  const categories = [
    categoryScore('ssh', 40),
    categoryScore('auth', 75),
    categoryScore('firewall', 90),
    categoryScore('container', 65),
    categoryScore('storage', 100),
    categoryScore('api', 50),
  ];
  assert.equal(calculateOverallScore(categories), 70);
});

test('overall score: weighting uses only the categories passed in', () => {
  // (60*25 + 100*5) / 30 = 66.67 -> 67
  assert.equal(calculateOverallScore([categoryScore('ssh', 60), categoryScore('api', 100)]), 67);
});

test('overall score: no categories scores 0', () => {
  assert.equal(calculateOverallScore([]), 0);
});

const GRADE_BOUNDARIES: [number, Grade][] = [
  [0, 'F'],
  [59, 'F'],
  [60, 'D'],
  [69, 'D'],
  [70, 'C'],
  [79, 'C'],
  [80, 'B'],
  [89, 'B'],
  [90, 'A'],
  [100, 'A'],
];

for (const [score, grade] of GRADE_BOUNDARIES) {
  test(`grade: score ${score} is ${grade}`, () => {
    assert.equal(scoreToGrade(score), grade);
  });
}

test('report: a missing input leaves its categories unassessed and out of the score', () => {
  // storage only: one no_root_squash mount (high) -> storage 75, overall 75
  const storageOnly = generateAuditReport(
    parseAllConfigs({ 'storage.cfg': readFixture('nfs-no-root-squash.fail.storage.cfg') }),
    allRules,
  );
  assert.ok(storageOnly, 'storage.cfg input must produce a report');
  assert.deepEqual(
    storageOnly.categories.map((c) => c.category),
    ['storage'],
  );
  assert.ok(storageOnly.findings.every((f) => f.rule.category === 'storage'));
  assert.equal(storageOnly.categories[0].score, 75);
  assert.equal(storageOnly.overallScore, 75);
  assert.equal(storageOnly.overallGrade, 'C');

  // ssh + storage: ssh fails password-auth (high) and default port (medium) -> 65.
  // (65*25 + 75*10) / 35 = 67.86 -> 68, grade D. Auth, firewall, container and api stay out.
  const sshAndStorage = generateAuditReport(
    parseAllConfigs({
      'sshd_config': readFixture('password-auth-enabled.fail.sshd_config'),
      'storage.cfg': readFixture('nfs-no-root-squash.fail.storage.cfg'),
    }),
    allRules,
  );
  assert.ok(sshAndStorage, 'sshd_config + storage.cfg input must produce a report');
  assert.deepEqual(
    sshAndStorage.categories.map((c) => [c.category, c.score]),
    [
      ['ssh', 65],
      ['storage', 75],
    ],
  );
  assert.equal(sshAndStorage.overallScore, 68);
  assert.equal(sshAndStorage.overallGrade, 'D');
});

const DEMO_GRADES: [Parameters<typeof getSample>[0], Grade][] = [
  ['insecure', 'F'],
  ['partial', 'C'],
  ['hardened', 'A'],
];

for (const [sample, grade] of DEMO_GRADES) {
  test(`demo: the ${sample} sample grades ${grade} as the README states`, () => {
    const report = generateAuditReport(parseAllConfigs(getSample(sample)), allRules);
    assert.ok(report, `${sample} sample must produce a report`);
    assert.equal(report.categories.length, 6, `${sample} sample must assess all six categories`);
    assert.equal(
      report.overallGrade,
      grade,
      `${sample} sample scored ${report.overallScore} (${report.overallGrade}), expected ${grade}`,
    );
  });
}
