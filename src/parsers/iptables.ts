/**
 * Parser for iptables-save / iptables -L -n output.
 * Handles both formats:
 *   1. iptables-save format: *table, :CHAIN POLICY, -A CHAIN ...
 *   2. iptables -L -n format: Chain NAME (policy POLICY), target prot ...
 */
import type { ParsedIptables, IptablesChain, IptablesRule } from '../types';

export function parseIptables(input: string): ParsedIptables {
  const result: ParsedIptables = {
    chains: [],
  };

  if (!input || !input.trim()) return result;

  const lines = input.split('\n');

  // Detect format
  const isIptablesSave = lines.some(l => l.startsWith('*') || l.startsWith(':'));
  const isIptablesL = lines.some(l => /^Chain\s+\S+/.test(l));

  if (isIptablesSave) {
    parseIptablesSaveFormat(lines, result);
  } else if (isIptablesL) {
    parseIptablesListFormat(lines, result);
  }

  return result;
}

/** Parse iptables-save format */
function parseIptablesSaveFormat(lines: string[], result: ParsedIptables): void {
  const chainMap = new Map<string, IptablesChain>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line === 'COMMIT' || line.startsWith('*')) continue;

    // Chain definition: :INPUT ACCEPT [0:0]
    const chainMatch = line.match(/^:(\S+)\s+(\S+)/);
    if (chainMatch) {
      const chain: IptablesChain = {
        name: chainMatch[1],
        policy: chainMatch[2],
        rules: [],
      };
      chainMap.set(chain.name, chain);
      continue;
    }

    // Rule: -A INPUT -s 192.0.2.0/24 -p tcp --dport 22 -j ACCEPT
    const ruleMatch = line.match(/^-A\s+(\S+)\s+(.+)$/);
    if (ruleMatch) {
      const chainName = ruleMatch[1];
      const ruleText = ruleMatch[2];

      // Ensure chain exists
      if (!chainMap.has(chainName)) {
        chainMap.set(chainName, { name: chainName, policy: '-', rules: [] });
      }

      const rule = parseIptablesRule(ruleText, line);
      chainMap.get(chainName)!.rules.push(rule);
    }
  }

  result.chains = Array.from(chainMap.values());
}

/** Parse iptables -L -n format */
function parseIptablesListFormat(lines: string[], result: ParsedIptables): void {
  let currentChain: IptablesChain | null = null;
  let headerSkipped = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      headerSkipped = false;
      continue;
    }

    // Chain header: Chain INPUT (policy ACCEPT)
    const chainMatch = line.match(/^Chain\s+(\S+)\s+\(policy\s+(\S+)\)/);
    if (chainMatch) {
      if (currentChain) {
        result.chains.push(currentChain);
      }
      currentChain = {
        name: chainMatch[1],
        policy: chainMatch[2],
        rules: [],
      };
      headerSkipped = false;
      continue;
    }

    // Also handle chains without policy: Chain NAME (0 references)
    const chainMatch2 = line.match(/^Chain\s+(\S+)/);
    if (chainMatch2 && !chainMatch) {
      if (currentChain) {
        result.chains.push(currentChain);
      }
      currentChain = {
        name: chainMatch2[1],
        policy: '-',
        rules: [],
      };
      headerSkipped = false;
      continue;
    }

    // Skip the header line (target prot opt source destination)
    if (currentChain && !headerSkipped && /^target\s+prot/.test(line)) {
      headerSkipped = true;
      continue;
    }

    // Parse rule lines
    if (currentChain && headerSkipped) {
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        currentChain.rules.push({
          target: parts[0],
          protocol: parts[1],
          source: parts[3],
          destination: parts[4],
          options: parts.slice(5).join(' '),
          raw: line,
        });
      }
    }
  }

  if (currentChain) {
    result.chains.push(currentChain);
  }
}

/** Parse a single iptables rule string into a structured rule */
function parseIptablesRule(ruleText: string, rawLine: string): IptablesRule {
  const rule: IptablesRule = {
    target: '',
    protocol: 'all',
    source: '0.0.0.0/0',
    destination: '0.0.0.0/0',
    options: '',
    raw: rawLine,
  };

  // Extract target (-j)
  const targetMatch = ruleText.match(/-j\s+(\S+)/);
  if (targetMatch) rule.target = targetMatch[1];

  // Extract protocol (-p)
  const protoMatch = ruleText.match(/-p\s+(\S+)/);
  if (protoMatch) rule.protocol = protoMatch[1];

  // Extract source (-s)
  const srcMatch = ruleText.match(/-s\s+(\S+)/);
  if (srcMatch) rule.source = srcMatch[1];

  // Extract destination (-d)
  const dstMatch = ruleText.match(/-d\s+(\S+)/);
  if (dstMatch) rule.destination = dstMatch[1];

  // Everything else is options
  const optParts: string[] = [];
  const dportMatch = ruleText.match(/--dport\s+(\S+)/);
  if (dportMatch) optParts.push(`dpt:${dportMatch[1]}`);
  const sportMatch = ruleText.match(/--sport\s+(\S+)/);
  if (sportMatch) optParts.push(`spt:${sportMatch[1]}`);
  rule.options = optParts.join(' ');

  return rule;
}
