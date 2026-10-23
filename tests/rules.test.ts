/**
 * Table-driven pass/fail tests for every rule in allRules (issue #19).
 * Each rule has two fixtures in tests/fixtures named <rule-id>.pass.<file> and
 * <rule-id>.fail.<file>, where <file> is the config file type the rule reads.
 * Severity and category are pinned so an edit to either shows up as a failure.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import type { AuditCategory, ConfigFileType, Severity } from '../src/types';
import { parseAllConfigs } from '../src/parsers/index';
import { allRules, getRuleById } from '../src/rules/index';
import { readFixture } from './helpers';

interface RuleCase {
  id: string;
  category: AuditCategory;
  severity: Severity;
  file: ConfigFileType;
}

const RULE_CASES: RuleCase[] = [
  { id: 'root-ssh-password', category: 'ssh', severity: 'critical', file: 'sshd_config' },
  { id: 'ssh-default-port', category: 'ssh', severity: 'medium', file: 'sshd_config' },
  { id: 'password-auth-enabled', category: 'ssh', severity: 'high', file: 'sshd_config' },
  { id: 'high-max-auth-tries', category: 'ssh', severity: 'medium', file: 'sshd_config' },
  { id: 'no-2fa-users', category: 'auth', severity: 'high', file: 'user.cfg' },
  { id: 'root-api-tokens', category: 'auth', severity: 'high', file: 'user.cfg' },
  { id: 'overpermissive-roles', category: 'auth', severity: 'medium', file: 'user.cfg' },
  { id: 'firewall-disabled', category: 'firewall', severity: 'critical', file: 'cluster.fw' },
  { id: 'default-accept-input', category: 'firewall', severity: 'high', file: 'cluster.fw' },
  { id: 'no-firewall-rules', category: 'firewall', severity: 'medium', file: 'cluster.fw' },
  { id: 'privileged-containers', category: 'container', severity: 'high', file: 'lxc.conf' },
  { id: 'container-nesting', category: 'container', severity: 'medium', file: 'lxc.conf' },
  { id: 'nfs-no-root-squash', category: 'storage', severity: 'high', file: 'storage.cfg' },
  { id: 'cifs-world-readable', category: 'storage', severity: 'medium', file: 'storage.cfg' },
  { id: 'admin-api-tokens', category: 'api', severity: 'high', file: 'user.cfg' },
  { id: 'no-token-expiry', category: 'api', severity: 'medium', file: 'user.cfg' },
  { id: 'pveproxy-unrestricted', category: 'api', severity: 'medium', file: 'pveproxy' },
];

const fixturesDir = join(__dirname, '../../tests/fixtures');

function fixtureName(ruleCase: RuleCase, outcome: 'pass' | 'fail'): string {
  return `${ruleCase.id}.${outcome}.${ruleCase.file}`;
}

function runRule(ruleCase: RuleCase, outcome: 'pass' | 'fail') {
  const rule = getRuleById(ruleCase.id);
  assert.ok(rule, `rule ${ruleCase.id} must exist in allRules`);
  const config = parseAllConfigs({
    [ruleCase.file]: readFixture(fixtureName(ruleCase, outcome)),
    ...(ruleCase.id === 'no-2fa-users'
      ? { 'tfa.json': readFixture(`no-2fa-users.${outcome}.tfa.json`) }
      : {}),
  });
  return rule.test(config);
}

test('coverage: every rule in allRules has a fixture entry, and every entry is a real rule', () => {
  const ruleIds = allRules.map((r) => r.id).sort();
  const caseIds = RULE_CASES.map((c) => c.id).sort();

  const missing = ruleIds.filter((id) => !caseIds.includes(id));
  assert.deepEqual(missing, [], `rules with no fixture entry: ${missing.join(', ')}`);

  const unknown = caseIds.filter((id) => !ruleIds.includes(id));
  assert.deepEqual(unknown, [], `fixture entries for unknown rules: ${unknown.join(', ')}`);

  assert.equal(new Set(caseIds).size, caseIds.length, 'each rule appears in the table once');
});

test('coverage: every fixture entry has a pass and a fail fixture file', () => {
  const absent = RULE_CASES.flatMap((c) => [fixtureName(c, 'pass'), fixtureName(c, 'fail')]).filter(
    (name) => !existsSync(join(fixturesDir, name)),
  );
  assert.deepEqual(absent, [], `missing fixture files: ${absent.join(', ')}`);
});

for (const ruleCase of RULE_CASES) {
  test(`${ruleCase.id}: severity and category are pinned`, () => {
    const rule = getRuleById(ruleCase.id);
    assert.ok(rule, `rule ${ruleCase.id} must exist in allRules`);
    assert.equal(rule.severity, ruleCase.severity, `${ruleCase.id} severity changed`);
    assert.equal(rule.category, ruleCase.category, `${ruleCase.id} category changed`);
  });

  test(`${ruleCase.id}: fails on ${fixtureName(ruleCase, 'fail')}`, () => {
    const result = runRule(ruleCase, 'fail');
    assert.equal(result.passed, false, `expected failure, evidence: ${result.evidence}`);
    assert.ok(result.evidence.length > 0, 'a failing result must carry evidence');
  });

  test(`${ruleCase.id}: passes on ${fixtureName(ruleCase, 'pass')}`, () => {
    const result = runRule(ruleCase, 'pass');
    assert.equal(result.passed, true, `expected pass, evidence: ${result.evidence}`);
    assert.notEqual(result.skipped, true, 'a passing fixture must actually evaluate the rule');
  });
}
