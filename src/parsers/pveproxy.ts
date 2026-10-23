/**
 * Parser for /etc/default/pveproxy.
 * Format: shell-style KEY="value" lines, read by pveproxy at startup.
 *
 *   ALLOW_FROM="192.0.2.0/24"
 *   DENY_FROM="all"
 *   POLICY="allow"
 *   LISTEN_IP="192.0.2.1"
 *
 * Values may be double-quoted, single-quoted or bare. Full-line and inline
 * `#` comments are ignored. A later assignment of the same key wins.
 */
import type { ParsedPveproxy } from '../types';

/** Strip quotes and inline comments from the right-hand side of an assignment. */
function parseValue(rhs: string): string {
  const value = rhs.trim();
  const quote = value[0];

  if (quote === '"' || quote === "'") {
    const end = value.indexOf(quote, 1);
    // Unterminated quote: take everything after the opening quote
    return end === -1 ? value.slice(1).trim() : value.slice(1, end).trim();
  }

  // Bare value: a `#` starts a comment, as in the shell
  const hash = value.indexOf('#');
  return (hash === -1 ? value : value.slice(0, hash)).trim();
}

export function parsePveproxyConfig(input: string): ParsedPveproxy {
  const result: ParsedPveproxy = {
    allowFrom: null,
    denyFrom: null,
    policy: null,
    listenIp: null,
    ciphers: null,
    rawDirectives: {},
  };

  if (!input || !input.trim()) return result;

  for (const rawLine of input.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
    if (!match) continue;

    // Shell variable names are case-sensitive; pveproxy only reads the upper-case ones
    const key = match[1];
    const value = parseValue(match[2]);
    result.rawDirectives[key] = value;

    switch (key) {
      case 'ALLOW_FROM':
        result.allowFrom = value;
        break;
      case 'DENY_FROM':
        result.denyFrom = value;
        break;
      case 'POLICY':
        result.policy = value;
        break;
      case 'LISTEN_IP':
        result.listenIp = value;
        break;
      case 'CIPHERS':
        result.ciphers = value;
        break;
    }
  }

  return result;
}
