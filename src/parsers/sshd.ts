/**
 * Parser for OpenSSH sshd_config files.
 * Handles standard key-value directives, comments, and Match blocks.
 */
import type { ParsedSSH } from '../types';

export function parseSSHConfig(input: string): ParsedSSH {
  const result: ParsedSSH = {
    permitRootLogin: null,
    passwordAuthentication: null,
    pubkeyAuthentication: null,
    port: null,
    maxAuthTries: null,
    permitEmptyPasswords: null,
    x11Forwarding: null,
    usePAM: null,
    protocol: null,
    loginGraceTime: null,
    rawDirectives: {},
  };

  if (!input || !input.trim()) return result;

  const lines = input.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue;

    // Skip Match blocks (we only parse global config)
    if (/^match\s+/i.test(line)) break;

    // Parse "Key Value" or "Key=Value" format
    const match = line.match(/^(\S+)\s+(.+)$/);
    if (!match) continue;

    const key = match[1].toLowerCase();
    const value = match[2].trim();

    // Store in raw directives
    result.rawDirectives[match[1]] = value;

    // Map to typed fields
    switch (key) {
      case 'permitrootlogin':
        result.permitRootLogin = value.toLowerCase();
        break;
      case 'passwordauthentication':
        result.passwordAuthentication = value.toLowerCase();
        break;
      case 'pubkeyauthentication':
        result.pubkeyAuthentication = value.toLowerCase();
        break;
      case 'port':
        result.port = parseInt(value, 10) || null;
        break;
      case 'maxauthtries':
        result.maxAuthTries = parseInt(value, 10) || null;
        break;
      case 'permitemptypasswords':
        result.permitEmptyPasswords = value.toLowerCase();
        break;
      case 'x11forwarding':
        result.x11Forwarding = value.toLowerCase();
        break;
      case 'usepam':
        result.usePAM = value.toLowerCase();
        break;
      case 'protocol':
        result.protocol = value;
        break;
      case 'logingracetime':
        result.loginGraceTime = value;
        break;
    }
  }

  return result;
}
