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

/**
 * Parse all provided config files into a unified ParsedConfig object.
 * Handles missing/empty inputs gracefully.
 */
export function parseAllConfigs(inputs: Partial<Record<ConfigFileType, string>>): ParsedConfig {
  // Build raw record with defaults
  const raw: Record<ConfigFileType, string> = {
    'sshd_config': inputs['sshd_config'] ?? '',
    'user.cfg': inputs['user.cfg'] ?? '',
    'cluster.fw': inputs['cluster.fw'] ?? '',
    'iptables': inputs['iptables'] ?? '',
    'lxc.conf': inputs['lxc.conf'] ?? '',
    'storage.cfg': inputs['storage.cfg'] ?? '',
  };

  // Parse each config
  const ssh = parseSSHConfig(raw['sshd_config']);
  const auth = parseUserConfig(raw['user.cfg']);
  const firewall = parseClusterFirewall(raw['cluster.fw']);
  const iptables = parseIptables(raw['iptables']);
  const containers = parseLXCConfig(raw['lxc.conf']);
  const storage = parseStorageConfig(raw['storage.cfg']);

  // Derive API config from auth tokens + relevant ACLs
  const api: ParsedAPI = {
    tokens: auth.tokens,
    tokenAcls: auth.acls.filter(acl => {
      // Include ACLs that reference token users
      return auth.tokens.some(t => acl.ugid === t.userid || acl.ugid.includes('!'));
    }),
  };

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
