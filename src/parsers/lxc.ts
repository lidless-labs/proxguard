/**
 * Parser for LXC container configuration files.
 * Handles multiple container configs separated by "# Container <id>" markers
 * or [CT:<id>] section headers. Also handles single-container format.
 *
 * Key directives:
 *   lxc.idmap / unprivileged: 1   — unprivileged container flag
 *   features: nesting=1            — nesting enabled
 *   lxc.mount.entry / mp0:         — mount points
 *   lxc.cap.drop / lxc.cap.keep   — capabilities
 */
import type { ParsedContainers, ContainerConfig } from '../types';

export function parseLXCConfig(input: string): ParsedContainers {
  const result: ParsedContainers = {
    containers: [],
  };

  if (!input || !input.trim()) return result;

  // Split into container blocks
  // Look for markers: "# Container 100", "[CT:100]", "# /etc/pve/lxc/100.conf"
  const blocks = splitIntoContainerBlocks(input);

  for (const block of blocks) {
    const container = parseContainerBlock(block.id, block.lines);
    result.containers.push(container);
  }

  // If no blocks found, treat entire input as single container
  if (result.containers.length === 0) {
    const container = parseContainerBlock('unknown', input.split('\n'));
    if (container.rawLines.length > 0) {
      result.containers.push(container);
    }
  }

  return result;
}

interface ContainerBlock {
  id: string;
  lines: string[];
}

function splitIntoContainerBlocks(input: string): ContainerBlock[] {
  const blocks: ContainerBlock[] = [];
  const lines = input.split('\n');
  let currentId: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    // Check for container header patterns
    const headerPatterns = [
      /^#\s*Container\s+(\d+)/i,
      /^\[CT:(\d+)\]/i,
      /^#\s*\/etc\/pve\/lxc\/(\d+)\.conf/i,
      /^#\s*CTID:\s*(\d+)/i,
      /^#\s*=+\s*(\d+)\s*=+/,
    ];

    let matched = false;
    for (const pattern of headerPatterns) {
      const m = line.match(pattern);
      if (m) {
        // Save previous block
        if (currentId !== null && currentLines.length > 0) {
          blocks.push({ id: currentId, lines: currentLines });
        }
        currentId = m[1];
        currentLines = [];
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentLines.push(line);
    }
  }

  // Save last block
  if (currentId !== null && currentLines.length > 0) {
    blocks.push({ id: currentId, lines: currentLines });
  }

  return blocks;
}

function parseContainerBlock(id: string, lines: string[]): ContainerConfig {
  const container: ContainerConfig = {
    id,
    unprivileged: null,
    nesting: false,
    mountPoints: [],
    capabilities: [],
    rawLines: [],
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    container.rawLines.push(line);

    // Key: value format (Proxmox style)
    const kvMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase();
      const value = kvMatch[2].trim();

      switch (key) {
        case 'unprivileged':
          container.unprivileged = value === '1' || value.toLowerCase() === 'true';
          break;
        case 'hostname':
          container.hostname = value;
          break;
        case 'features': {
          // features: nesting=1,keyctl=1,mount=nfs
          const features = value.split(',');
          for (const feat of features) {
            const [fKey, fVal] = feat.split('=');
            if (fKey?.trim() === 'nesting' && (fVal?.trim() === '1' || fVal?.trim() === 'true')) {
              container.nesting = true;
            }
          }
          break;
        }
        default: {
          // Mount points: mp0, mp1, etc.
          if (/^mp\d+$/.test(key)) {
            container.mountPoints.push(value);
          }
          break;
        }
      }
    }

    // LXC native format: lxc.key = value
    const lxcMatch = line.match(/^(lxc\.\S+)\s*=\s*(.+)$/);
    if (lxcMatch) {
      const key = lxcMatch[1].toLowerCase();
      const value = lxcMatch[2].trim();

      if (key === 'lxc.idmap') {
        // Presence of idmap implies unprivileged
        container.unprivileged = true;
      } else if (key === 'lxc.mount.entry') {
        container.mountPoints.push(value);
      } else if (key === 'lxc.cap.drop') {
        container.capabilities.push(`drop:${value}`);
      } else if (key === 'lxc.cap.keep') {
        container.capabilities.push(`keep:${value}`);
      }
    }
  }

  return container;
}
