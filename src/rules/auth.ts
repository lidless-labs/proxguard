/**
 * Authentication & Authorization Security Rules
 * Evaluates user.cfg for token management and role permissions, and
 * `pveum user tfa list` output for 2FA.
 */
import type { PVEUser, SecurityRule } from '../types';
import { hasRealSecondFactor } from '../parsers/tfa';

/** Secret-free source for 2FA state (the CLI form of GET /access/tfa) */
const TFA_LIST_COMMAND = 'pveum user tfa list --output-format json';

export const authRules: SecurityRule[] = [
  {
    id: 'no-2fa-users',
    category: 'auth',
    severity: 'high',
    title: 'Users Without Two-Factor Authentication',
    description:
      'One or more users do not have 2FA (TOTP/U2F/WebAuthn) configured. Without 2FA, a compromised password grants full access.',
    cisBenchmark: 'CIS Debian 11 - 5.4.2',
    test: (config) => {
      const auth = config.auth;
      if (!auth || auth.users.length === 0) {
        if (config.tfa) {
          return {
            passed: true,
            skipped: true,
            evidence: 'Not evaluated: 2FA data supplied without user.cfg, so the user list is unknown',
          };
        }
        return { passed: true, evidence: 'No user config provided' };
      }

      // Proxmox VE keeps second factors in priv/tfa.cfg, so user.cfg alone cannot answer this
      const tfa = config.tfa;
      if (!tfa) {
        return {
          passed: true,
          skipped: true,
          evidence: `Not evaluated: no 2FA data supplied. Add the output of ${TFA_LIST_COMMAND} on the tfa.json tab.`,
          details:
            'Proxmox VE stores second factors outside user.cfg, so user.cfg alone cannot show which users have 2FA.',
        };
      }

      const tfaByUser = new Map(tfa.users.map(u => [u.userid, u]));
      // Legacy x!-prefixed keys in user.cfg also mark an enrolled second factor
      const has2FA = (user: PVEUser) =>
        hasRealSecondFactor(tfaByUser.get(user.userid)) || Boolean(user.tfa);

      // Filter to enabled, non-system users
      const activeUsers = auth.users.filter(
        u => u.enable !== false && u.userid !== 'root@pam'
      );
      const usersWithout2FA = activeUsers.filter(u => !has2FA(u));

      if (usersWithout2FA.length > 0) {
        return {
          passed: false,
          evidence: `${usersWithout2FA.length}/${activeUsers.length} active users lack 2FA: ${usersWithout2FA.map(u => u.userid).join(', ')}`,
          details:
            'These accounts can be accessed with just a password. Recovery keys and disabled entries do not count as a second factor.',
        };
      }

      // Also check if root@pam has 2FA
      const root = auth.users.find(u => u.userid === 'root@pam');
      if (root && !has2FA(root)) {
        return {
          passed: false,
          evidence: 'root@pam does not have 2FA configured',
          details: 'The root account is the highest-privilege account and should always have 2FA.',
        };
      }

      return {
        passed: true,
        evidence: `All ${activeUsers.length} active users have 2FA configured`,
      };
    },
    remediation:
      `List enrolled factors with ${TFA_LIST_COMMAND}, then add TOTP or WebAuthn for each user missing one under Datacenter → Permissions → Two Factor in the Proxmox web UI. Recovery keys alone are not a second factor.`,
    remediationScript: `# Show which users have a second factor (metadata only, no secrets)
${TFA_LIST_COMMAND}
# Second factors are added per user in the web UI: Datacenter → Permissions → Two Factor
echo "Add TOTP or WebAuthn for each user listed without one"`,
  },

  {
    id: 'root-api-tokens',
    category: 'auth',
    severity: 'high',
    title: 'Root Account Has API Tokens',
    description:
      'The root@pam account has API tokens configured. API tokens for root grant unrestricted access and should be avoided in favor of dedicated service accounts.',
    cisBenchmark: 'CIS Debian 11 - 5.4.1',
    test: (config) => {
      const auth = config.auth;
      if (!auth) {
        return { passed: true, evidence: 'No user config provided' };
      }

      const rootTokens = auth.tokens.filter(t => t.userid === 'root@pam');

      if (rootTokens.length > 0) {
        return {
          passed: false,
          evidence: `root@pam has ${rootTokens.length} API token(s): ${rootTokens.map(t => t.tokenId).join(', ')}`,
          details:
            'Root API tokens have full system access. If leaked, an attacker has complete control.',
        };
      }

      return {
        passed: true,
        evidence: 'No API tokens found for root@pam',
      };
    },
    remediation:
      'Create dedicated service accounts with minimal required permissions instead of using root API tokens. Delete root tokens with: pveum user token remove root@pam <tokenid>',
    remediationScript: `# List root tokens
pveum user token list root@pam
# Remove a specific token
# pveum user token remove root@pam <tokenid>`,
  },

  {
    id: 'overpermissive-roles',
    category: 'auth',
    severity: 'medium',
    title: 'Users with Administrator Role',
    description:
      'One or more users or groups have the Administrator role assigned. This built-in role grants all privileges and should be restricted to a minimum number of accounts.',
    cisBenchmark: 'CIS Debian 11 - 5.3.1',
    test: (config) => {
      const auth = config.auth;
      if (!auth) {
        return { passed: true, evidence: 'No user config provided' };
      }

      const adminAcls = auth.acls.filter(
        acl => acl.role === 'Administrator' && acl.ugid !== 'root@pam'
      );

      if (adminAcls.length > 0) {
        const entities = [...new Set(adminAcls.map(a => a.ugid))];
        return {
          passed: false,
          evidence: `${entities.length} non-root entity(s) have Administrator role: ${entities.join(', ')}`,
          details:
            'The Administrator role grants ALL privileges. Use more restrictive roles like PVEAdmin or custom roles.',
        };
      }

      return {
        passed: true,
        evidence: 'No non-root users have the Administrator role',
      };
    },
    remediation:
      'Replace Administrator role assignments with more restrictive built-in roles (PVEAdmin, PVEVMAdmin, etc.) or create custom roles with minimum required privileges.',
    remediationScript: `# List current ACLs
pveum acl list
# Change a user from Administrator to PVEAdmin
# pveum acl modify <path> --roles PVEAdmin --users <userid>`,
  },
];
