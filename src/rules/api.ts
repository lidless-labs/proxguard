/**
 * API Security Rules
 * Evaluates API token configuration and permissions.
 */
import type { SecurityRule } from '../types';

export const apiRules: SecurityRule[] = [
  {
    id: 'admin-api-tokens',
    category: 'api',
    severity: 'high',
    title: 'API Tokens with Full Admin Privileges',
    description:
      'One or more API tokens are associated with users that have Administrator or PVEAdmin role at the root path (/). These tokens can perform any action on the cluster.',
    test: (config) => {
      const auth = config.auth;
      const api = config.api;
      if (!auth || !api || api.tokens.length === 0) {
        return { passed: true, evidence: 'No API tokens configured' };
      }

      // Find tokens whose users have admin-level ACLs
      const adminRoles = ['Administrator', 'PVEAdmin'];
      const adminTokens: string[] = [];

      for (const token of api.tokens) {
        const userAcls = auth.acls.filter(
          acl => acl.ugid === token.userid && adminRoles.includes(acl.role)
        );
        if (userAcls.length > 0) {
          // Check if privsep is disabled (token inherits full user privs)
          if (token.privsep === false || token.privsep === undefined) {
            adminTokens.push(`${token.userid}!${token.tokenId}`);
          }
        }
      }

      if (adminTokens.length > 0) {
        return {
          passed: false,
          evidence: `${adminTokens.length} admin-level API token(s): ${adminTokens.join(', ')}`,
          details:
            'These tokens can perform destructive operations (delete VMs, modify cluster config). Use privilege-separated tokens with minimal roles.',
        };
      }

      return {
        passed: true,
        evidence: `${api.tokens.length} API token(s) — none have unrestricted admin access`,
      };
    },
    remediation:
      'Create API tokens with privsep=1 (privilege separation) and assign minimal required roles instead of Administrator/PVEAdmin.',
    remediationScript: `# Create a privilege-separated token with limited role
pveum user token add <userid> <tokenid> --privsep 1
pveum acl modify <path> --tokens <userid>!<tokenid> --roles PVEAuditor`,
  },

  {
    id: 'no-token-expiry',
    category: 'api',
    severity: 'medium',
    title: 'API Tokens Without Expiration',
    description:
      'One or more API tokens have no expiration date set. Long-lived tokens that are forgotten or leaked remain valid indefinitely.',
    test: (config) => {
      const api = config.api;
      if (!api || api.tokens.length === 0) {
        return { passed: true, evidence: 'No API tokens configured' };
      }

      const noExpiry = api.tokens.filter(
        t => !t.expire || t.expire === 0
      );

      if (noExpiry.length > 0) {
        const names = noExpiry.map(t => `${t.userid}!${t.tokenId}`);
        return {
          passed: false,
          evidence: `${noExpiry.length} token(s) without expiration: ${names.join(', ')}`,
          details:
            'Tokens without expiry remain valid until manually revoked. Set expiration dates for all tokens.',
        };
      }

      return {
        passed: true,
        evidence: `All ${api.tokens.length} token(s) have expiration dates`,
      };
    },
    remediation:
      'Set expiration dates on all API tokens. Rotate tokens regularly (every 90 days recommended).',
    remediationScript: `# Set token expiry (epoch timestamp, e.g., 90 days from now)
EXPIRY=$(date -d "+90 days" +%s)
pveum user token modify <userid> <tokenid> --expire $EXPIRY`,
  },
];
