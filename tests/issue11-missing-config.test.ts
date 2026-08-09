/**
 * Regression: issue #11 — unsupplied config files must not be assessed or affect score.
 * Pinned production: parseAllConfigs, generateAuditReport, allRules.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AuditCategory } from '../src/types';
import { parseAllConfigs } from '../src/parsers/index';
import { allRules } from '../src/rules/index';
import { generateAuditReport } from '../src/utils/scoring';
import { readFixture } from './helpers';

const UNSUPPLIED_CATEGORIES: AuditCategory[] = [
  'firewall',
  'auth',
  'container',
  'storage',
  'api',
];

test('issue #11: ssh-only input must not produce findings for other categories', () => {
  const fixture = readFixture('issue11-ssh-only.sshd_config');
  const config = parseAllConfigs({ 'sshd_config': fixture });
  const report = generateAuditReport(config, allRules);

  assert.deepEqual(report.inputFiles, ['sshd_config']);

  const otherFindings = report.findings.filter((f) =>
    UNSUPPLIED_CATEGORIES.includes(f.rule.category),
  );

  assert.equal(
    otherFindings.length,
    0,
    `unsupplied categories must not be assessed; got rule ids: ${otherFindings
      .map((f) => f.rule.id)
      .join(', ')}`,
  );
});

test('issue #11: overall score must only reflect supplied categories', () => {
  const fixture = readFixture('issue11-ssh-only.sshd_config');
  const config = parseAllConfigs({ 'sshd_config': fixture });
  const report = generateAuditReport(config, allRules);

  const sshCategory = report.categories.find((c) => c.category === 'ssh');
  assert.ok(sshCategory, 'ssh category score must exist when sshd_config is supplied');

  assert.equal(
    report.overallScore,
    sshCategory.score,
    `overall score must equal ssh-only score; overall=${report.overallScore} ssh=${sshCategory.score}`,
  );
});
