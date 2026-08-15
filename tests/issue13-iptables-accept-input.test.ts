/**
 * Regression: issue #13 — iptables-only audit must report default INPUT ACCEPT finding.
 * The early return for missing cluster.fw must not skip the iptables INPUT policy check.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAllConfigs } from '../src/parsers/index';
import { firewallRules } from '../src/rules/firewall';
import { readFixture } from './helpers';
import type { ConfigFileType } from '../src/types';

function makeInputs(iptables: string): Record<ConfigFileType, string> {
  return {
    'sshd_config': '',
    'user.cfg': '',
    'cluster.fw': '',
    'iptables': iptables,
    'lxc.conf': '',
    'storage.cfg': '',
  };
}

test('default-accept-input fails when iptables INPUT policy is ACCEPT and no cluster.fw', () => {
  const raw = readFixture('issue13-iptables-accept-input.iptables');
  const config = parseAllConfigs(makeInputs(raw));

  // Confirm cluster.fw is absent so the test validates the iptables-only path
  assert.equal(config.firewall, undefined, 'config.firewall must be undefined for an iptables-only input');

  const rule = firewallRules.find(r => r.id === 'default-accept-input');
  assert.ok(rule, 'default-accept-input rule must exist');

  const result = rule.test(config);
  assert.strictEqual(result.passed, false, 'rule must fail when iptables INPUT policy is ACCEPT');
  assert.ok(
    result.evidence.includes('ACCEPT'),
    `evidence must mention ACCEPT, got: ${result.evidence}`,
  );
});
