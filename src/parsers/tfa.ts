/**
 * Parser for `pveum user tfa list --output-format json` (the CLI form of GET /access/tfa).
 *
 * Proxmox VE keeps second factors in /etc/pve/priv/tfa.cfg, not in user.cfg. That file
 * holds TOTP secrets, so ProxGuard never asks for it. The tfa list output carries only
 * metadata per user:
 *
 *   [
 *     {
 *       "userid": "admin@pve",
 *       "entries": [{ "id": "totp/1", "type": "totp", "description": "phone", "enable": true }],
 *       "totp-locked": false,
 *       "tfa-locked-until": 1700000000
 *     }
 *   ]
 *
 * A pvesh-style `{ "data": [...] }` wrapper is accepted too.
 * Returns undefined when the input is not usable, so the audit treats TFA data as not supplied.
 */
import type { ParsedTfa, TfaEntry, TfaUser } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Proxmox reports booleans as true/false or 1/0 depending on the client. */
function isDisabled(value: unknown): boolean {
  return value === false || value === 0 || value === '0';
}

function parseEntry(raw: unknown): TfaEntry | null {
  if (!isRecord(raw) || typeof raw.type !== 'string' || !raw.type.trim()) return null;

  return {
    type: raw.type.trim().toLowerCase(),
    id: typeof raw.id === 'string' ? raw.id : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    enable: !isDisabled(raw.enable),
  };
}

function parseUser(raw: unknown): TfaUser | null {
  if (!isRecord(raw) || typeof raw.userid !== 'string' || !raw.userid.trim()) return null;

  const entries = Array.isArray(raw.entries)
    ? raw.entries.map(parseEntry).filter((e): e is TfaEntry => e !== null)
    : [];

  const user: TfaUser = { userid: raw.userid.trim(), entries };
  if (typeof raw['totp-locked'] === 'boolean') user.totpLocked = raw['totp-locked'];
  if (typeof raw['tfa-locked-until'] === 'number') user.tfaLockedUntil = raw['tfa-locked-until'];
  return user;
}

export function parseTfaList(input: string): ParsedTfa | undefined {
  if (!input || !input.trim()) return undefined;

  let json: unknown;
  try {
    json = JSON.parse(input);
  } catch {
    return undefined;
  }

  const list = Array.isArray(json)
    ? json
    : isRecord(json) && Array.isArray(json.data)
      ? json.data
      : null;
  if (!list) return undefined;

  const users = list.map(parseUser).filter((u): u is TfaUser => u !== null);

  // A non-empty list with no recognizable user objects is the wrong file, not "nobody has 2FA"
  if (list.length > 0 && users.length === 0) return undefined;

  return { users };
}

/**
 * True when the user has at least one enabled second factor.
 * Recovery keys are a fallback for a lost factor, not a second factor of their own.
 */
export function hasRealSecondFactor(user: TfaUser | undefined): boolean {
  if (!user) return false;
  return user.entries.some(e => e.enable && e.type !== 'recovery');
}
