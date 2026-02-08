/**
 * Container Security Rules
 * Evaluates LXC container configurations for privilege escalation risks.
 */
import type { SecurityRule } from '../types';

export const containerRules: SecurityRule[] = [
  {
    id: 'privileged-containers',
    category: 'container',
    severity: 'high',
    title: 'Privileged LXC Containers Detected',
    description:
      'One or more LXC containers are running in privileged mode. Privileged containers share the host\'s UID namespace, meaning a root escape in the container gives root on the host.',
    test: (config) => {
      const containers = config.containers;
      if (!containers || containers.containers.length === 0) {
        return { passed: true, evidence: 'No container config provided' };
      }

      const privileged = containers.containers.filter(
        c => c.unprivileged === false || c.unprivileged === null
      );

      if (privileged.length > 0) {
        const ids = privileged.map(c => `CT ${c.id}${c.hostname ? ` (${c.hostname})` : ''}`);
        return {
          passed: false,
          evidence: `${privileged.length} privileged container(s): ${ids.join(', ')}`,
          details:
            'Privileged containers can potentially escape to the host. Convert to unprivileged where possible.',
        };
      }

      return {
        passed: true,
        evidence: `All ${containers.containers.length} container(s) are unprivileged`,
      };
    },
    remediation:
      'Convert containers to unprivileged mode. Backup, destroy, and recreate with "unprivileged: 1" in the container config. Note: some workloads require privileged mode (e.g., Docker-in-LXC).',
    remediationScript: `# Check container privilege status
pct config <CTID> | grep unprivileged
# To convert: backup, destroy, restore as unprivileged
# vzdump <CTID> --storage local
# pct restore <new-CTID> <backup-file> --unprivileged 1`,
  },

  {
    id: 'container-nesting',
    category: 'container',
    severity: 'medium',
    title: 'Container Nesting Enabled',
    description:
      'One or more containers have the nesting feature enabled. Nesting allows running containers inside containers (e.g., Docker in LXC) but increases the attack surface.',
    test: (config) => {
      const containers = config.containers;
      if (!containers || containers.containers.length === 0) {
        return { passed: true, evidence: 'No container config provided' };
      }

      const nested = containers.containers.filter(c => c.nesting);

      if (nested.length > 0) {
        const ids = nested.map(c => `CT ${c.id}${c.hostname ? ` (${c.hostname})` : ''}`);
        return {
          passed: false,
          evidence: `${nested.length} container(s) with nesting: ${ids.join(', ')}`,
          details:
            'Nesting grants additional kernel capabilities that increase container escape risk.',
        };
      }

      return {
        passed: true,
        evidence: `No containers have nesting enabled`,
      };
    },
    remediation:
      'Disable nesting unless required for Docker/Podman workloads. Remove "features: nesting=1" from container config.',
    remediationScript: `# Check nesting status
pct config <CTID> | grep features
# Disable nesting
pct set <CTID> --features nesting=0`,
  },
];
