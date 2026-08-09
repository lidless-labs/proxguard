/**
 * Regression: issue #11 — unsupplied config files must not be assessed or affect score.
 * Pinned production: parseAllConfigs, generateAuditReport, allRules, auditStore.runAudit.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AuditCategory, ConfigFileType } from '../src/types';
import { parseAllConfigs } from '../src/parsers/index';
import { allRules } from '../src/rules/index';
import { useAuditStore } from '../src/store/auditStore';
import { generateAuditReport } from '../src/utils/scoring';
import { readFixture } from './helpers';

function emptyConfigInputs(): Record<ConfigFileType, string> {
  return {
    'sshd_config': '',
    'user.cfg': '',
    'cluster.fw': '',
    'iptables': '',
    'lxc.conf': '',
    'storage.cfg': '',
  };
}

function installLocalStorageMock(): void {
  const storage = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: (key) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    key: (index) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    },
  };
}

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
  assert.ok(report, 'supplied sshd_config must produce an audit report');

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
  assert.ok(report, 'supplied sshd_config must produce an audit report');

  const sshCategory = report.categories.find((c) => c.category === 'ssh');
  assert.ok(sshCategory, 'ssh category score must exist when sshd_config is supplied');

  assert.equal(
    report.overallScore,
    sshCategory.score,
    `overall score must equal ssh-only score; overall=${report.overallScore} ssh=${sshCategory.score}`,
  );
});

test('issue #11: entirely empty input must be rejected as unassessed', () => {
  const config = parseAllConfigs(emptyConfigInputs());
  const report = generateAuditReport(config, allRules);

  assert.equal(
    report,
    null,
    `generateAuditReport must reject empty input as unassessed, not return a scored report (got grade=${report?.overallGrade} score=${report?.overallScore})`,
  );
});

test('issue #11: whitespace-only input must be rejected as unassessed', () => {
  const config = parseAllConfigs({
    ...emptyConfigInputs(),
    'sshd_config': ' \n\t  \n',
  });
  const report = generateAuditReport(config, allRules);

  assert.equal(
    report,
    null,
    `whitespace-only config must not become a scored audit (got grade=${report?.overallGrade} score=${report?.overallScore})`,
  );
});

test('issue #11: runAudit must not persist empty input to history', async () => {
  installLocalStorageMock();

  useAuditStore.setState({
    configInputs: emptyConfigInputs(),
    lastConfigInputs: emptyConfigInputs(),
    parsedConfig: null,
    auditReport: null,
    history: [],
    isAuditing: false,
    comparisonPair: null,
  });

  useAuditStore.getState().runAudit();

  await new Promise((resolve) => setTimeout(resolve, 150));

  const state = useAuditStore.getState();
  assert.equal(
    state.history.length,
    0,
    'empty audit must not be saved to history',
  );
  assert.equal(state.auditReport, null, 'empty audit must not set auditReport');
});
