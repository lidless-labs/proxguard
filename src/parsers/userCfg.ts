/**
 * Parser for Proxmox VE user.cfg files.
 * Format: section-based with colon-delimited fields.
 *
 * Lines:
 *   user:<userid>:<enable>:<expire>:<firstname>:<lastname>:<email>:<comment>:<keys>:
 *   group:<groupid>:<userlist>:<comment>:
 *   role:<roleid>:<privs>:
 *   acl:<propagate>:<path>:<ugid>:<role>:
 *   token:<userid>:<tokenid>:<expire>:<privsep>:<comment>:
 */
import type { ParsedAuth, PVEUser, PVEGroup, PVEAcl, PVEToken } from '../types';

export function parseUserConfig(input: string): ParsedAuth {
  const result: ParsedAuth = {
    users: [],
    groups: [],
    acls: [],
    tokens: [],
    roles: {},
  };

  if (!input || !input.trim()) return result;

  const lines = input.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(':');
    const type = parts[0]?.toLowerCase();

    try {
      switch (type) {
        case 'user': {
          // user:<userid>:<enable>:<expire>:<firstname>:<lastname>:<email>:<comment>:<keys>:
          const user: PVEUser = {
            userid: parts[1] || '',
            enable: parts[2] ? parts[2] === '1' : undefined,
            expire: parts[3] ? parseInt(parts[3], 10) || undefined : undefined,
            firstName: parts[4] || undefined,
            lastName: parts[5] || undefined,
            email: parts[6] || undefined,
            comment: parts[7] || undefined,
          };

          // Check for TFA in keys field or separate tfa: line
          // In PVE 8.x, TFA is in separate tfa: lines, but some older formats
          // store it in the keys field (index 8)
          if (parts[8] && parts[8].startsWith('x!')) {
            user.tfa = parts[8];
          }

          if (user.userid) {
            result.users.push(user);
          }
          break;
        }

        case 'group': {
          // group:<groupid>:<userlist>:<comment>:
          const group: PVEGroup = {
            groupid: parts[1] || '',
            users: parts[2] ? parts[2].split(',').filter(Boolean) : [],
            comment: parts[3] || undefined,
          };
          if (group.groupid) {
            result.groups.push(group);
          }
          break;
        }

        case 'role': {
          // role:<roleid>:<privs>:
          const roleId = parts[1] || '';
          const privs = parts[2] || '';
          if (roleId) {
            result.roles[roleId] = privs;
          }
          break;
        }

        case 'acl': {
          // acl:<propagate>:<path>:<ugid>:<roleid>:
          const acl: PVEAcl = {
            propagate: parts[1] === '1',
            path: parts[2] || '/',
            ugid: parts[3] || '',
            role: parts[4] || '',
          };
          if (acl.ugid) {
            result.acls.push(acl);
          }
          break;
        }

        case 'token': {
          // token:<userid>:<tokenid>:<expire>:<privsep>:<comment>:
          const token: PVEToken = {
            userid: parts[1] || '',
            tokenId: parts[2] || '',
            expire: parts[3] ? parseInt(parts[3], 10) || undefined : undefined,
            privsep: parts[4] ? parts[4] === '1' : undefined,
            comment: parts[5] || undefined,
          };
          if (token.userid && token.tokenId) {
            result.tokens.push(token);
          }
          break;
        }

        case 'tfa': {
          // tfa:<userid>:<type>:<data>:
          // Mark the user as having 2FA configured
          const tfaUserId = parts[1] || '';
          const tfaType = parts[2] || 'totp';
          const user = result.users.find(u => u.userid === tfaUserId);
          if (user) {
            user.tfa = tfaType;
          } else {
            // User might appear after tfa line; store for later matching
            // We'll do a second pass below
            result.users.push({
              userid: tfaUserId,
              tfa: tfaType,
            });
          }
          break;
        }
      }
    } catch {
      // Skip malformed lines gracefully
      continue;
    }
  }

  // Deduplicate users (merge tfa-only entries with full user entries)
  const userMap = new Map<string, PVEUser>();
  for (const u of result.users) {
    const existing = userMap.get(u.userid);
    if (existing) {
      // Merge: prefer non-undefined values
      if (u.tfa) existing.tfa = u.tfa;
      if (u.email) existing.email = u.email;
      if (u.firstName) existing.firstName = u.firstName;
      if (u.lastName) existing.lastName = u.lastName;
      if (u.enable !== undefined) existing.enable = u.enable;
      if (u.expire !== undefined) existing.expire = u.expire;
      if (u.comment) existing.comment = u.comment;
    } else {
      userMap.set(u.userid, { ...u });
    }
  }
  result.users = Array.from(userMap.values());

  return result;
}
