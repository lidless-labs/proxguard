/**
 * Authentication & Authorization Security Rules
 * Evaluates user.cfg for 2FA, token management, and role permissions.
 */
import type { SecurityRule } from '../types';

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
        return { passed: true, evidence: 'No user config provided' };
      }

      // Filter to enabled, non-system users
      const activeUsers = auth.users.filter(
        u => u.enable !== false && u.userid !== 'root@pam'
      );
      const usersWithout2FA = activeUsers.filter(u => !u.tfa);

      if (usersWithout2FA.length > 0) {
        return {
          passed: false,
          evidence: `${usersWithout2FA.length}/${activeUsers.length} active users lack 2FA: ${usersWithout2FA.map(u => u.userid).join(', ')}`,
          details: 'These accounts can be accessed with just a password.',
        };
      }

      // Also check if root@pam has 2FA
      const root = auth.users.find(u => u.userid === 'root@pam');
      if (root && !root.tfa) {
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
      'Configure TOTP or WebAuthn 2FA for all users via Datacenter → Permissions → Two Factor in the Proxmox web UI.',
    remediationScript: `# Enable TOTP for a user (must be done per-user in the web UI or via API)
# pveum user tfa setup totp <userid> --description "TOTP 2FA"
echo "2FA must be configured individually per user in the Proxmox web UI"`,
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
