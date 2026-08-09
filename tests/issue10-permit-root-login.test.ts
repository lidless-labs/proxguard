/**
 * Regression: issue #10 — absent PermitRootLogin must not be treated as password-enabled root login.
 * Pinned production: src/rules/ssh.ts root-ssh-password rule (sshRules[0]).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ConfigFileType } from '../src/types';
import { parseSSHConfig } from '../src/parsers/sshd';
import { sshRules } from '../src/rules/ssh';
import { readFixture } from './helpers';

const EMPTY_RAW: Record<ConfigFileType, string> = {
  'sshd_config': '',
  'user.cfg': '',
  'cluster.fw': '',
  'iptables': '',
  'lxc.conf': '',
  'storage.cfg': '',
};

test('issue #10: modern default sshd without PermitRootLogin is not root password login', () => {
  const fixture = readFixture('issue10-modern-sshd-default.sshd_config');
  const ssh = parseSSHConfig(fixture);
  const rule = sshRules.find((r) => r.id === 'root-ssh-password');
  assert.ok(rule, 'root-ssh-password rule must exist');

  const result = rule.test({
    ssh,
    raw: { ...EMPTY_RAW, 'sshd_config': fixture },
  });

  assert.equal(
    result.passed,
    true,
    `absent PermitRootLogin must not fail as root password login; evidence=${result.evidence}`,
  );
  assert.ok(
    !result.evidence.includes('default (yes)'),
    `must not assume PermitRootLogin default is yes; evidence=${result.evidence}`,
  );
});
