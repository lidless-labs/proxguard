/**
 * Config Parser Orchestrator
 * Parses all Proxmox config files into a unified ParsedConfig.
 */
import type { ConfigFileType, ParsedConfig, ParsedAPI } from '../types';
import { parseSSHConfig } from './sshd';
import { parseUserConfig } from './userCfg';
import { parseClusterFirewall } from './clusterFw';
import { parseIptables } from './iptables';
import { parseLXCConfig } from './lxc';
import { parseStorageConfig } from './storage';

/** True when the caller supplied non-empty content for this file type. */
function isSupplied(
  inputs: Partial<Record<ConfigFileType, string>>,
  fileType: ConfigFileType
): boolean {
  return (inputs[fileType] ?? '').trim().length > 0;
}

/**
 * Parse all provided config files into a unified ParsedConfig object.
 * Unsupplied (missing/empty) sources stay undefined so rules and scoring can skip them.
 */
export function parseAllConfigs(inputs: Partial<Record<ConfigFileType, string>>): ParsedConfig {
  // Build raw record with defaults (empty string = not supplied)
  const raw: Record<ConfigFileType, string> = {
    'sshd_config': inputs['sshd_config'] ?? '',
    'user.cfg': inputs['user.cfg'] ?? '',
    'cluster.fw': inputs['cluster.fw'] ?? '',
    'iptables': inputs['iptables'] ?? '',
    'lxc.conf': inputs['lxc.conf'] ?? '',
    'storage.cfg': inputs['storage.cfg'] ?? '',
  };

  // Parse only supplied configs — omit truthy empty objects for missing sources
  const ssh = isSupplied(inputs, 'sshd_config') ? parseSSHConfig(raw['sshd_config']) : undefined;
  const auth = isSupplied(inputs, 'user.cfg') ? parseUserConfig(raw['user.cfg']) : undefined;
  const firewall = isSupplied(inputs, 'cluster.fw')
    ? parseClusterFirewall(raw['cluster.fw'])
    : undefined;
  const iptables = isSupplied(inputs, 'iptables') ? parseIptables(raw['iptables']) : undefined;
  const containers = isSupplied(inputs, 'lxc.conf') ? parseLXCConfig(raw['lxc.conf']) : undefined;
  const storage = isSupplied(inputs, 'storage.cfg')
    ? parseStorageConfig(raw['storage.cfg'])
    : undefined;

  // Derive API config from auth tokens + relevant ACLs (only when user.cfg was supplied)
  const api: ParsedAPI | undefined = auth
    ? {
        tokens: auth.tokens,
        tokenAcls: auth.acls.filter(acl => {
          // Include ACLs that reference token users
          return auth.tokens.some(t => acl.ugid === t.userid || acl.ugid.includes('!'));
        }),
      }
    : undefined;

  return {
    ssh,
    firewall,
    auth,
    containers,
    api,
    storage,
    iptables,
    raw,
  };
}

export { parseSSHConfig } from './sshd';
export { parseUserConfig } from './userCfg';
export { parseClusterFirewall } from './clusterFw';
export { parseIptables } from './iptables';
export { parseLXCConfig } from './lxc';
export { parseStorageConfig } from './storage';
