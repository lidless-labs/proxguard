/**
 * Parser for Proxmox VE storage.cfg files.
 * Format: stanza-based configuration
 *
 *   <type>: <id>
 *       key value
 *       key value
 *
 * Types: dir, nfs, cifs, zfspool, lvm, lvmthin, iscsi, glusterfs, etc.
 */
import type { ParsedStorage, StorageEntry } from '../types';

export function parseStorageConfig(input: string): ParsedStorage {
  const result: ParsedStorage = {
    entries: [],
  };

  if (!input || !input.trim()) return result;

  const lines = input.split('\n');
  let currentEntry: StorageEntry | null = null;

  for (const rawLine of lines) {
    // Don't trim yet — we need to detect indentation for continuation lines
    const trimmed = rawLine.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Check for stanza header: <type>: <id>
    // Not indented (starts at column 0)
    const headerMatch = rawLine.match(/^(\S+):\s+(\S+)\s*$/);
    if (headerMatch) {
      // Save previous entry
      if (currentEntry) {
        result.entries.push(currentEntry);
      }

      currentEntry = {
        type: headerMatch[1].toLowerCase(),
        id: headerMatch[2],
        rawOptions: {},
      };
      continue;
    }

    // Continuation line (indented): key value
    if (currentEntry && /^\s+/.test(rawLine)) {
      const kvMatch = trimmed.match(/^(\S+)\s+(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1].toLowerCase();
        const value = kvMatch[2].trim();

        currentEntry.rawOptions[key] = value;

        switch (key) {
          case 'path':
            currentEntry.path = value;
            break;
          case 'server':
            currentEntry.server = value;
            break;
          case 'export':
            currentEntry.export = value;
            break;
          case 'share':
            currentEntry.share = value;
            break;
          case 'content':
            currentEntry.content = value.split(',').map(s => s.trim());
            break;
          case 'options':
            currentEntry.options = value;
            break;
          case 'mountoptions' /* Proxmox uses 'mount' in some versions */:
            currentEntry.mountOptions = value;
            break;
          case 'mount':
            currentEntry.mountOptions = value;
            break;
          case 'domain':
            currentEntry.domain = value;
            break;
          case 'username':
            currentEntry.username = value;
            break;
          case 'maxfiles':
            currentEntry.maxfiles = parseInt(value, 10) || undefined;
            break;
          case 'subdir':
            currentEntry.subdir = value;
            break;
        }
      }
    }
  }

  // Save last entry
  if (currentEntry) {
    result.entries.push(currentEntry);
  }

  return result;
}
