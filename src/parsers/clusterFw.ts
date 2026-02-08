/**
 * Parser for Proxmox VE cluster.fw (cluster-level firewall configuration).
 *
 * Sections:
 *   [OPTIONS]        — key: value pairs (enable, policy_in, policy_out, etc.)
 *   [RULES]          — firewall rules: |IN/OUT| ACTION -source ... -dest ... -p proto -dport port
 *   [IPSET name]     — IP set definitions
 *   [GROUP name]     — Security group rules
 */
import type { ParsedFirewall, FirewallRule, IPSetEntry } from '../types';

type Section = 'options' | 'rules' | 'ipset' | 'group' | 'aliases' | null;

export function parseClusterFirewall(input: string): ParsedFirewall {
  const result: ParsedFirewall = {
    enabled: null,
    policyIn: null,
    policyOut: null,
    rules: [],
    ipSets: [],
    options: {},
  };

  if (!input || !input.trim()) return result;

  let currentSection: Section = null;
  let currentIPSet: IPSetEntry | null = null;

  const lines = input.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Detect section headers
    const sectionMatch = line.match(/^\[(\w+)(?:\s+(.+))?\]$/);
    if (sectionMatch) {
      // Save previous IP set if any
      if (currentIPSet) {
        result.ipSets.push(currentIPSet);
        currentIPSet = null;
      }

      const sectionName = sectionMatch[1].toLowerCase();
      if (sectionName === 'options') {
        currentSection = 'options';
      } else if (sectionName === 'rules') {
        currentSection = 'rules';
      } else if (sectionName === 'ipset') {
        currentSection = 'ipset';
        currentIPSet = {
          name: sectionMatch[2] || 'default',
          entries: [],
        };
      } else if (sectionName === 'group') {
        currentSection = 'group';
      } else if (sectionName === 'aliases') {
        currentSection = 'aliases';
      }
      continue;
    }

    switch (currentSection) {
      case 'options': {
        // Format: key: value  or  key value
        const optMatch = line.match(/^(\w+)[:\s]+(.+)$/);
        if (optMatch) {
          const key = optMatch[1].toLowerCase();
          const value = optMatch[2].trim();
          result.options[key] = value;

          if (key === 'enable') {
            result.enabled = value === '1' || value.toLowerCase() === 'true';
          } else if (key === 'policy_in') {
            result.policyIn = value.toUpperCase();
          } else if (key === 'policy_out') {
            result.policyOut = value.toUpperCase();
          }
        }
        break;
      }

      case 'rules':
      case 'group': {
        // Rule format: |IN/OUT| ACTION [OPTIONS]
        // Can also be: IN ACTION ... or OUT ACTION ...
        // Optional leading | for enable/disable: |IN ACCEPT -source ...
        const rule = parseFirewallRule(line);
        if (rule) {
          result.rules.push(rule);
        }
        break;
      }

      case 'ipset': {
        if (currentIPSet) {
          // Each line is an IP/CIDR, optionally with comment
          const ipMatch = line.match(/^([^\s#]+)/);
          if (ipMatch) {
            currentIPSet.entries.push(ipMatch[1]);
          }
        }
        break;
      }
    }
  }

  // Save last IP set
  if (currentIPSet) {
    result.ipSets.push(currentIPSet);
  }

  return result;
}

/**
 * Parse a single firewall rule line.
 * Formats:
 *   IN ACCEPT -source 192.0.2.0/24 -p tcp -dport 22
 *   |IN ACCEPT -source 192.0.2.0/24 -p tcp -dport 22   (disabled with leading |)
 *   OUT DROP
 */
function parseFirewallRule(line: string): FirewallRule | null {
  // Check for disabled rule (leading |)
  let enabled = true;
  let ruleLine = line;
  if (ruleLine.startsWith('|')) {
    enabled = false;
    ruleLine = ruleLine.substring(1).trim();
  }

  // Match direction and action
  const ruleMatch = ruleLine.match(/^(IN|OUT|GROUP)\s+(\S+)(.*)?$/i);
  if (!ruleMatch) return null;

  const rule: FirewallRule = {
    type: ruleMatch[1].toUpperCase() as 'IN' | 'OUT' | 'GROUP',
    action: ruleMatch[2].toUpperCase(),
    enable: enabled,
  };

  const rest = ruleMatch[3] || '';

  // Parse options: -source, -dest, -p, -dport, -sport, -i, -log
  const sourceMatch = rest.match(/-source\s+(\S+)/);
  if (sourceMatch) rule.source = sourceMatch[1];

  const destMatch = rest.match(/-dest\s+(\S+)/);
  if (destMatch) rule.dest = destMatch[1];

  const protoMatch = rest.match(/-p\s+(\S+)/);
  if (protoMatch) rule.proto = protoMatch[1];

  const dportMatch = rest.match(/-dport\s+(\S+)/);
  if (dportMatch) rule.dport = dportMatch[1];

  const sportMatch = rest.match(/-sport\s+(\S+)/);
  if (sportMatch) rule.sport = sportMatch[1];

  const ifaceMatch = rest.match(/-i\s+(\S+)/);
  if (ifaceMatch) rule.iface = ifaceMatch[1];

  // Comment after # at end
  const commentMatch = rest.match(/#\s*(.+)$/);
  if (commentMatch) rule.comment = commentMatch[1].trim();

  return rule;
}
