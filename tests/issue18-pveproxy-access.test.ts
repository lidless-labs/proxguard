/**
 * Issue #18 — /etc/default/pveproxy input and the pveproxy-unrestricted rule.
 * Pinned production: parsePveproxyConfig, parseAllConfigs, apiRules, generateAuditReport, demo samples.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ConfigFileType, RuleResult } from '../src/types';
import { parseAllConfigs, parsePveproxyConfig } from '../src/parsers/index';
import { allRules } from '../src/rules/index';
import { apiRules, evaluatePveproxyAccess } from '../src/rules/api';
import { generateAuditReport } from '../src/utils/scoring';
import { getSample } from '../src/data/index';
import { readFixture } from './helpers';

const RULE_ID = 'pveproxy-unrestricted';

const USER_CFG = `user:root@pam:1:0:::root@example.com::
token:root@pam:automation:1893456000:1:CI token:
`;

function rule() {
  const found = apiRules.find((r) => r.id === RULE_ID);
  assert.ok(found, `${RULE_ID} rule must exist`);
  return found;
}

function inputs(overrides: Partial<Record<ConfigFileType, string>>): Record<ConfigFileType, string> {
  return {
    'sshd_config': '',
    'user.cfg': '',
    'cluster.fw': '',
    'iptables': '',
    'lxc.conf': '',
    'storage.cfg': '',
    'pveproxy': '',
    ...overrides,
  };
}

function evaluate(pveproxy: string): RuleResult {
  const config = parseAllConfigs(inputs({ pveproxy }));
  assert.ok(config.pveproxy, 'supplied pveproxy must be parsed');
  return rule().test(config);
}

function evaluateFixture(name: string): RuleResult {
  return evaluate(readFixture(name));
}

test('rule metadata matches the issue', () => {
  const r = rule();
  assert.equal(r.category, 'api');
  assert.equal(r.severity, 'medium');
  assert.equal(r.cisBenchmark, 'PVE-API-003');
  assert.ok(allRules.some((x) => x.id === RULE_ID), 'rule must be registered in allRules');
  assert.match(r.remediationScript, /ALLOW_FROM="192\.0\.2\.0\/24"/);
  assert.match(r.remediationScript, /DENY_FROM="all"/);
  assert.match(r.remediationScript, /POLICY=/);
  assert.match(r.remediationScript, /systemctl restart pveproxy/);
});

test('missing pveproxy leaves the rule unevaluated and the api score unchanged', () => {
  const config = parseAllConfigs(inputs({ 'user.cfg': USER_CFG }));
  assert.equal(config.pveproxy, undefined);

  const report = generateAuditReport(config, allRules);
  assert.ok(report);
  assert.ok(
    !report.findings.some((f) => f.rule.id === RULE_ID),
    'rule must not appear in findings when pveproxy is not supplied',
  );

  const withoutRule = generateAuditReport(config, allRules.filter((r) => r.id !== RULE_ID));
  assert.ok(withoutRule);
  assert.equal(report.overallScore, withoutRule.overallScore);
  assert.deepEqual(
    report.categories.map((c) => [c.category, c.score]),
    withoutRule.categories.map((c) => [c.category, c.score]),
  );
});

test('empty or whitespace-only pveproxy is treated as not supplied', () => {
  for (const blank of ['', ' \n\t \n']) {
    const config = parseAllConfigs(inputs({ 'user.cfg': USER_CFG, pveproxy: blank }));
    assert.equal(config.pveproxy, undefined);
    const report = generateAuditReport(config, allRules);
    assert.ok(report);
    assert.ok(!report.inputFiles.includes('pveproxy'));
    assert.ok(!report.findings.some((f) => f.rule.id === RULE_ID));
  }

  assert.equal(generateAuditReport(parseAllConfigs(inputs({ pveproxy: '  \n' })), allRules), null);
});

test('a pveproxy-only audit assesses the api category', () => {
  const config = parseAllConfigs(inputs({ pveproxy: readFixture('issue18-comments-only.pveproxy') }));
  const report = generateAuditReport(config, allRules);
  assert.ok(report);
  assert.deepEqual(report.inputFiles, ['pveproxy']);
  assert.deepEqual(report.categories.map((c) => c.category), ['api']);

  const finding = report.findings.find((f) => f.rule.id === RULE_ID);
  assert.ok(finding, 'rule must be evaluated when pveproxy is supplied');
  assert.equal(finding.result.passed, false);
  assert.equal(report.categories[0].score, 90, 'one medium failure deducts 10 from the api category');
});

test('a file with only comments fails', () => {
  const result = evaluateFixture('issue18-comments-only.pveproxy');
  assert.equal(result.passed, false);
  assert.match(result.evidence, /ALLOW_FROM=unset/);
  assert.match(result.evidence, /POLICY=unset \(defaults to allow\)/);
});

test('ALLOW_FROM="192.0.2.0/24" with DENY_FROM="all" passes', () => {
  const result = evaluateFixture('issue18-allow-deny-all.pveproxy');
  assert.equal(result.passed, true, result.evidence);
});

test('POLICY="allow" with no ALLOW_FROM fails and names the values found', () => {
  const result = evaluateFixture('issue18-policy-allow-no-allow-list.pveproxy');
  assert.equal(result.passed, false);
  assert.match(result.evidence, /POLICY="allow"/);
  assert.match(result.evidence, /ALLOW_FROM=unset/);
});

test('LISTEN_IP="0.0.0.0" is treated as not restricted', () => {
  const result = evaluateFixture('issue18-listen-wildcard.pveproxy');
  assert.equal(result.passed, false);
  assert.match(result.evidence, /LISTEN_IP="0\.0\.0\.0"/);

  for (const wildcard of ['::', '[::]', '*']) {
    assert.equal(evaluate(`LISTEN_IP="${wildcard}"\n`).passed, false, `LISTEN_IP=${wildcard} must fail`);
  }
});

test('LISTEN_IP set to a specific address passes', () => {
  assert.equal(evaluate('LISTEN_IP="192.0.2.1"\n').passed, true);
  assert.equal(evaluate('LISTEN_IP="2001:db8::1"\n').passed, true);
});

test('POLICY="deny" with an allow list passes, without one fails', () => {
  assert.equal(evaluate('ALLOW_FROM="192.0.2.0/24"\nPOLICY="deny"\n').passed, true);
  assert.equal(evaluate('POLICY="deny"\n').passed, false);
});

test('DENY_FROM="all" without an allow list fails', () => {
  assert.equal(evaluate('DENY_FROM="all"\n').passed, false);
});

test('an allow list that names every address does not count as a restriction', () => {
  assert.equal(evaluate('ALLOW_FROM="all"\nDENY_FROM="all"\n').passed, false);
  assert.equal(evaluate('ALLOW_FROM="0.0.0.0/0"\nPOLICY="deny"\n').passed, false);
});

test('quoted and unquoted values parse and inline comments are ignored', () => {
  const parsed = parsePveproxyConfig(readFixture('issue18-quoting.pveproxy'));
  assert.equal(parsed.allowFrom, '192.0.2.0/24,198.51.100.10');
  assert.equal(parsed.denyFrom, 'all');
  assert.equal(parsed.policy, 'deny');
  assert.equal(parsed.listenIp, '');
  assert.equal(parsed.ciphers, 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384');
  assert.deepEqual(Object.keys(parsed.rawDirectives).sort(), [
    'ALLOW_FROM',
    'CIPHERS',
    'DENY_FROM',
    'LISTEN_IP',
    'POLICY',
  ]);

  assert.equal(evaluatePveproxyAccess(parsed).passed, true);
});

test('a later assignment of the same key wins, as in the shell', () => {
  const parsed = parsePveproxyConfig('POLICY="deny"\nPOLICY="allow"\n');
  assert.equal(parsed.policy, 'allow');
});

test('demo samples exercise the rule', () => {
  const expected = { insecure: false, partial: false, hardened: true } as const;
  for (const [type, passed] of Object.entries(expected) as [keyof typeof expected, boolean][]) {
    const sample = getSample(type);
    assert.ok(sample.pveproxy.trim().length > 0, `${type} sample must include pveproxy`);
    const report = generateAuditReport(parseAllConfigs(sample), allRules);
    assert.ok(report);
    const finding = report.findings.find((f) => f.rule.id === RULE_ID);
    assert.ok(finding, `${type} sample must evaluate ${RULE_ID}`);
    assert.equal(finding.result.passed, passed, `${type}: ${finding.result.evidence}`);
  }
});
