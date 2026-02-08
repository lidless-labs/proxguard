/**
 * Firewall Security Rules
 * Evaluates cluster.fw and iptables configurations.
 */
import type { SecurityRule } from '../types';

export const firewallRules: SecurityRule[] = [
  {
    id: 'firewall-disabled',
    category: 'firewall',
    severity: 'critical',
    title: 'Cluster Firewall Not Enabled',
    description:
      'The Proxmox VE cluster firewall is not enabled. Without the firewall, all network traffic is allowed to reach cluster services, including the API (port 8006), SSH, and inter-node communication.',
    test: (config) => {
      const fw = config.firewall;
      if (!fw) {
        return {
          passed: false,
          evidence: 'No firewall config provided — firewall status unknown',
          details: 'Cannot verify firewall state without cluster.fw configuration.',
        };
      }

      if (fw.enabled !== true) {
        return {
          passed: false,
          evidence: `Firewall enabled=${fw.enabled ?? 'not set'}`,
          details:
            'The cluster firewall must be explicitly enabled in [OPTIONS] with "enable: 1".',
        };
      }

      return {
        passed: true,
        evidence: 'Cluster firewall is enabled',
      };
    },
    remediation:
      'Enable the cluster firewall: Datacenter → Firewall → Options → Enable: Yes. Or add "enable: 1" under [OPTIONS] in /etc/pve/firewall/cluster.fw.',
    remediationScript: `# Enable via pvesh
pvesh set /cluster/firewall/options --enable 1
# Or manually edit /etc/pve/firewall/cluster.fw and add under [OPTIONS]:
# enable: 1`,
  },

  {
    id: 'default-accept-input',
    category: 'firewall',
    severity: 'high',
    title: 'Default INPUT Policy is ACCEPT',
    description:
      'The default INPUT policy is ACCEPT, meaning any traffic not explicitly blocked is allowed. A secure configuration should DROP by default and only allow explicitly permitted traffic.',
    test: (config) => {
      const fw = config.firewall;
      if (!fw) {
        return { passed: true, evidence: 'No firewall config provided' };
      }

      // Check cluster.fw policy
      if (fw.policyIn === 'ACCEPT') {
        return {
          passed: false,
          evidence: `cluster.fw policy_in=${fw.policyIn}`,
          details: 'All inbound traffic is allowed by default. Only explicitly blocked traffic is dropped.',
        };
      }

      // Also check iptables INPUT chain
      const ipt = config.iptables;
      if (ipt) {
        const inputChain = ipt.chains.find(c => c.name === 'INPUT');
        if (inputChain && inputChain.policy === 'ACCEPT') {
          return {
            passed: false,
            evidence: `iptables INPUT chain default policy=ACCEPT`,
            details: 'The iptables INPUT chain accepts all traffic by default.',
          };
        }
      }

      return {
        passed: true,
        evidence: `policy_in=${fw.policyIn ?? 'not set (Proxmox default: DROP)'}`,
      };
    },
    remediation:
      'Set the default INPUT policy to DROP: Datacenter → Firewall → Options → Input Policy: DROP.',
    remediationScript: `pvesh set /cluster/firewall/options --policy_in DROP`,
  },

  {
    id: 'no-firewall-rules',
    category: 'firewall',
    severity: 'medium',
    title: 'No Firewall Rules Defined',
    description:
      'Zero firewall rules are defined in the cluster firewall. Without explicit rules, the firewall relies entirely on the default policy, which may be too permissive or too restrictive.',
    test: (config) => {
      const fw = config.firewall;
      if (!fw) {
        return { passed: true, evidence: 'No firewall config provided' };
      }

      if (fw.rules.length === 0) {
        return {
          passed: false,
          evidence: 'Zero firewall rules defined in cluster.fw',
          details:
            'A properly configured firewall should have explicit rules for allowed services (SSH, web UI, SPICE, etc.).',
        };
      }

      return {
        passed: true,
        evidence: `${fw.rules.length} firewall rule(s) defined`,
      };
    },
    remediation:
      'Define explicit firewall rules for required services. At minimum, allow SSH (22/tcp), Proxmox web UI (8006/tcp), and VNC/SPICE (3128/tcp) from trusted networks.',
    remediationScript: `# Add basic rules via pvesh
pvesh create /cluster/firewall/rules --action ACCEPT --type in --proto tcp --dport 8006 --comment "Proxmox Web UI"
pvesh create /cluster/firewall/rules --action ACCEPT --type in --proto tcp --dport 22 --comment "SSH"`,
  },
];
