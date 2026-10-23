/**
 * API Security Rules
 * Evaluates API token configuration and permissions, and who can reach the
 * pveproxy web UI and API (port 8006).
 */
import type { ParsedPveproxy, RuleResult, SecurityRule } from '../types';

/** Address list values pveproxy treats as "every address" (`all` is an alias for 0/0 and ::/0). */
const ALL_ADDRESSES = new Set(['all', '0/0', '0.0.0.0/0', '::/0']);

/** LISTEN_IP values that still bind every interface. */
const WILDCARD_LISTEN = new Set(['0.0.0.0', '::', '::0', '0:0:0:0:0:0:0:0', '*']);

function addressList(value: string | null): string[] {
  return (value ?? '')
    .split(/[\s,]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function show(value: string | null, unsetNote: string): string {
  return value === null || value === '' ? `unset (${unsetNote})` : `"${value}"`;
}

/** Evaluate pveproxy host based access control (ALLOW_FROM / DENY_FROM / POLICY / LISTEN_IP). */
export function evaluatePveproxyAccess(proxy: ParsedPveproxy): RuleResult {
  const allow = addressList(proxy.allowFrom);
  const deny = addressList(proxy.denyFrom);
  const policy = (proxy.policy ?? '').trim().toLowerCase();
  const listenIp = (proxy.listenIp ?? '').trim().replace(/^\[|\]$/g, '');

  // An allow list only restricts access when it names something narrower than every address
  const allowRestricts = allow.length > 0 && !allow.some((entry) => ALL_ADDRESSES.has(entry));
  const denyAll = deny.some((entry) => ALL_ADDRESSES.has(entry));
  const specificListen = listenIp.length > 0 && !WILDCARD_LISTEN.has(listenIp);

  if (policy === 'deny' && allowRestricts) {
    return {
      passed: true,
      evidence: `POLICY="${proxy.policy}" with ALLOW_FROM="${proxy.allowFrom}"`,
    };
  }

  if (denyAll && allowRestricts) {
    return {
      passed: true,
      evidence: `DENY_FROM="${proxy.denyFrom}" with ALLOW_FROM="${proxy.allowFrom}"`,
    };
  }

  if (specificListen) {
    return {
      passed: true,
      evidence: `LISTEN_IP="${proxy.listenIp}" binds pveproxy to one address`,
    };
  }

  return {
    passed: false,
    evidence: [
      `ALLOW_FROM=${show(proxy.allowFrom, 'no allow list')}`,
      `DENY_FROM=${show(proxy.denyFrom, 'nothing denied')}`,
      `POLICY=${show(proxy.policy, 'defaults to allow')}`,
      `LISTEN_IP=${show(proxy.listenIp, 'listens on every address')}`,
    ].join(', '),
    details:
      'pveproxy accepts connections on port 8006 from any address that can reach the host. Restrict it with ALLOW_FROM plus DENY_FROM="all" or POLICY="deny", or bind it to a management address with LISTEN_IP.',
  };
}

export const apiRules: SecurityRule[] = [
  {
    id: 'admin-api-tokens',
    requiresInput: 'user.cfg',
    category: 'api',
    severity: 'high',
    title: 'API Tokens with Full Admin Privileges',
    description:
      'One or more API tokens are associated with users that have Administrator or PVEAdmin role at the root path (/). These tokens can perform any action on the cluster.',
    cisBenchmark: 'PVE-API-001',
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
    requiresInput: 'user.cfg',
    category: 'api',
    severity: 'medium',
    title: 'API Tokens Without Expiration',
    description:
      'One or more API tokens have no expiration date set. Long-lived tokens that are forgotten or leaked remain valid indefinitely.',
    cisBenchmark: 'PVE-API-002',
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

  {
    id: 'pveproxy-unrestricted',
    category: 'api',
    severity: 'medium',
    title: 'Web UI and API Reachable From Any Address',
    description:
      'pveproxy serves the web UI and REST API on port 8006. /etc/default/pveproxy sets no allow list with a deny-all default and no specific LISTEN_IP, so any network that can reach the host can reach the management API.',
    cisBenchmark: 'PVE-API-003',
    requiresInput: 'pveproxy',
    test: (config) => {
      if (!config.pveproxy) {
        return { passed: true, evidence: 'No pveproxy config provided' };
      }
      return evaluatePveproxyAccess(config.pveproxy);
    },
    remediation:
      'Limit pveproxy to your management networks in /etc/default/pveproxy: set ALLOW_FROM to the management subnets (include every cluster node address), DENY_FROM="all" and POLICY="allow", then restart pveproxy and spiceproxy. See the "Host based access control" section of pveproxy(8): https://pve.proxmox.com/pve-docs/pveproxy.8.html',
    remediationScript: `# Restrict the web UI and API (port 8006) to a management network.
# Replace 192.0.2.0/24 with your management subnet and add every cluster node address.
cp /etc/default/pveproxy /etc/default/pveproxy.bak 2>/dev/null || true
cat >> /etc/default/pveproxy <<'EOF'
ALLOW_FROM="192.0.2.0/24"
DENY_FROM="all"
POLICY="allow"
EOF
# Restarting can drop open console and shell sessions; use a maintenance window
systemctl restart pveproxy.service spiceproxy.service`,
  },
];
