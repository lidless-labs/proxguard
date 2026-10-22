/**
 * Regression: issue #15 — no-2fa-users must read 2FA state from `pveum user tfa list` output,
 * because Proxmox VE keeps second factors outside user.cfg.
 * Pinned production: parseAllConfigs, parseTfaList, allRules, generateAuditReport,
 * calculateCategoryScore, sample data.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import type { Finding, ParsedConfig, RuleResult } from '../src/types';
import { parseAllConfigs, parseTfaList } from '../src/parsers/index';
import { allRules } from '../src/rules/index';
import { calculateCategoryScore, generateAuditReport } from '../src/utils/scoring';
import { getSample } from '../src/data/index';
import { readFixture } from './helpers';

const USER_CFG = readFixture('issue15-three-users.user.cfg');
const TFA_TWO_USERS = readFixture('issue15-tfa-two-users.json');

const no2faRule = allRules.find((r) => r.id === 'no-2fa-users');
if (!no2faRule) throw new Error('no-2fa-users rule missing');
const rule = no2faRule;

function evaluate(config: ParsedConfig): RuleResult {
  return rule.test(config);
}

function no2faFinding(findings: Finding[]): Finding {
  const finding = findings.find((f) => f.rule.id === 'no-2fa-users');
  assert.ok(finding, 'no-2fa-users must be evaluated when auth input is supplied');
  return finding;
}

test('issue #15: TFA list covering two of three active users reports exactly one user without 2FA', () => {
  const result = evaluate(parseAllConfigs({ 'user.cfg': USER_CFG, 'tfa.json': TFA_TWO_USERS }));

  assert.equal(result.passed, false);
  assert.notEqual(result.skipped, true);
  assert.match(result.evidence, /^1\/3 active users lack 2FA: carol@pve$/);
});

test('issue #15: user.cfg without TFA input is skipped with no deduction and no "lacks 2FA" evidence', () => {
  const report = generateAuditReport(parseAllConfigs({ 'user.cfg': USER_CFG }), allRules);
  assert.ok(report, 'user.cfg must produce a report');

  const finding = no2faFinding(report.findings);
  assert.equal(finding.result.skipped, true);
  assert.doesNotMatch(finding.result.evidence, /lack/i);
  assert.match(finding.result.evidence, /pveum user tfa list --output-format json/);

  // The fixture passes the other auth rules, so any deduction would come from no-2fa-users
  const auth = report.categories.find((c) => c.category === 'auth');
  assert.ok(auth, 'auth category must be assessed');
  assert.equal(auth.score, 100);
});

test('issue #15: TFA input with every active user covered passes', () => {
  const tfa = JSON.stringify([
    ...JSON.parse(TFA_TWO_USERS),
    { userid: 'carol@pve', entries: [{ id: 'u2f/1', type: 'u2f', enable: true }] },
  ]);
  const result = evaluate(parseAllConfigs({ 'user.cfg': USER_CFG, 'tfa.json': tfa }));

  assert.equal(result.passed, true);
  assert.notEqual(result.skipped, true);
  assert.equal(result.evidence, 'All 3 active users have 2FA configured');
});

test('issue #15: recovery-only and all-disabled users count as lacking 2FA', () => {
  const tfa = JSON.stringify([
    { userid: 'alice@pve', entries: [{ id: 'recovery', type: 'recovery', enable: true }] },
    {
      userid: 'bob@pve',
      entries: [
        { id: 'totp/1', type: 'totp', enable: false },
        { id: 'webauthn/2', type: 'webauthn', enable: 0 },
      ],
    },
    { userid: 'carol@pve', entries: [{ id: 'yubico/3', type: 'yubico', enable: true }] },
  ]);
  const result = evaluate(parseAllConfigs({ 'user.cfg': USER_CFG, 'tfa.json': tfa }));

  assert.equal(result.passed, false);
  assert.match(result.evidence, /^2\/3 active users lack 2FA: alice@pve, bob@pve$/);
});

test('issue #15: entries without an explicit enable flag count as enabled', () => {
  const parsed = parseTfaList(JSON.stringify([{ userid: 'a@pve', entries: [{ type: 'TOTP' }] }]));
  assert.deepEqual(parsed, {
    users: [{ userid: 'a@pve', entries: [{ type: 'totp', id: undefined, description: undefined, enable: true }] }],
  });
});

test('issue #15: empty or malformed TFA JSON does not throw and is treated as not supplied', () => {
  const notSupplied = [
    '',
    '   \n\t',
    '{not json',
    'null',
    '"text"',
    '42',
    '[1, 2, 3]',
    '[{"entries": []}]',
    // Shape of priv/tfa.cfg: never parsed, even if someone pastes it
    '{"users": {"alice@pve": {"totp": [{"enable": true}]}}}',
  ];

  for (const input of notSupplied) {
    assert.doesNotThrow(() => parseTfaList(input), `parseTfaList threw on ${JSON.stringify(input)}`);
    assert.equal(parseTfaList(input), undefined, `expected undefined for ${JSON.stringify(input)}`);

    const config = parseAllConfigs({ 'user.cfg': USER_CFG, 'tfa.json': input });
    assert.equal(config.tfa, undefined);

    const report = generateAuditReport(config, allRules);
    assert.ok(report);
    assert.ok(!report.inputFiles.includes('tfa.json'), `tfa.json must not count as an input for ${JSON.stringify(input)}`);
    assert.equal(no2faFinding(report.findings).result.skipped, true);
  }
});

test('issue #15: malformed TFA JSON alone is not an assessable input', () => {
  const report = generateAuditReport(parseAllConfigs({ 'tfa.json': '{oops' }), allRules);
  assert.equal(report, null);
});

test('issue #15: an empty TFA list from a cluster with no factors is real data, not missing data', () => {
  const result = evaluate(parseAllConfigs({ 'user.cfg': USER_CFG, 'tfa.json': '[]' }));
  assert.equal(result.passed, false);
  assert.match(result.evidence, /^3\/3 active users lack 2FA/);
});

test('issue #15: pvesh-style {"data": [...]} wrapper is accepted', () => {
  const wrapped = JSON.stringify({ data: JSON.parse(TFA_TWO_USERS) });
  const result = evaluate(parseAllConfigs({ 'user.cfg': USER_CFG, 'tfa.json': wrapped }));
  assert.match(result.evidence, /^1\/3 active users lack 2FA: carol@pve$/);
});

test('issue #15: root@pam without a second factor still fails once TFA data is supplied', () => {
  const userCfg = `${USER_CFG}\nuser:root@pam:1:0::::Superuser::\n`;
  const tfa = JSON.stringify([
    ...JSON.parse(TFA_TWO_USERS),
    { userid: 'carol@pve', entries: [{ type: 'totp', enable: true }] },
  ]);
  const result = evaluate(parseAllConfigs({ 'user.cfg': userCfg, 'tfa.json': tfa }));
  assert.equal(result.passed, false);
  assert.equal(result.evidence, 'root@pam does not have 2FA configured');
});

test('issue #15: TFA input without user.cfg is skipped, since the user list is unknown', () => {
  const report = generateAuditReport(parseAllConfigs({ 'tfa.json': TFA_TWO_USERS }), allRules);
  assert.ok(report);
  assert.deepEqual(report.inputFiles, ['tfa.json']);
  assert.equal(no2faFinding(report.findings).result.skipped, true);
});

test('issue #15: calculateCategoryScore ignores skipped results even when marked failed', () => {
  const finding: Finding = {
    rule,
    result: { passed: false, skipped: true, evidence: 'Not evaluated' },
  };
  assert.equal(calculateCategoryScore('auth', [finding]).score, 100);
});

test('issue #15: demo samples carry their 2FA state in tfa.json, not user.cfg', () => {
  for (const type of ['insecure', 'partial', 'hardened'] as const) {
    const sample = getSample(type);
    assert.doesNotMatch(sample['user.cfg'], /^tfa:/m, `${type} user.cfg must not use tfa: lines`);
    assert.ok(parseTfaList(sample['tfa.json']), `${type} tfa.json must parse`);
  }

  const results = Object.fromEntries(
    (['insecure', 'partial', 'hardened'] as const).map((type) => [type, evaluate(parseAllConfigs(getSample(type)))]),
  );
  assert.match(results.insecure.evidence, /^4\/4 active users lack 2FA/);
  assert.match(results.partial.evidence, /^2\/4 active users lack 2FA: devops@pve, readonly@pve$/);
  assert.equal(results.hardened.passed, true);
});

test('issue #15: README and the tfa.json tab never point users at priv/tfa.cfg', () => {
  const repoRoot = join(__dirname, '../..');
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
  const auditPage = readFileSync(join(repoRoot, 'src/components/AuditPage.tsx'), 'utf8');

  for (const [name, text] of [['README.md', readme], ['AuditPage.tsx', auditPage]] as const) {
    assert.doesNotMatch(text, /tfa\.cfg/, `${name} must not mention tfa.cfg`);
  }
  assert.match(auditPage, /pveum user tfa list --output-format json/);
  assert.match(readme, /pveum user tfa list --output-format json/);
});
