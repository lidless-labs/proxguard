/**
 * Storage Security Rules
 * Evaluates storage.cfg for NFS/CIFS security issues.
 */
import type { SecurityRule } from '../types';

export const storageRules: SecurityRule[] = [
  {
    id: 'nfs-no-root-squash',
    category: 'storage',
    severity: 'high',
    title: 'NFS Mount with no_root_squash',
    description:
      'An NFS storage backend is configured with no_root_squash mount option. This allows root on the Proxmox host to act as root on the NFS server, which is a privilege escalation vector.',
    cisBenchmark: 'PVE-STOR-001',
    test: (config) => {
      const storage = config.storage;
      if (!storage || storage.entries.length === 0) {
        return { passed: true, evidence: 'No storage config provided' };
      }

      const nfsEntries = storage.entries.filter(e => e.type === 'nfs');
      const vulnerable = nfsEntries.filter(e => {
        const opts = (e.options || '') + ' ' + (e.mountOptions || '') + ' ' + (e.rawOptions['options'] || '');
        return opts.includes('no_root_squash');
      });

      if (vulnerable.length > 0) {
        return {
          passed: false,
          evidence: `${vulnerable.length} NFS mount(s) with no_root_squash: ${vulnerable.map(e => e.id).join(', ')}`,
          details:
            'Root on this host can read/write any file on the NFS server as root. An attacker who compromises a container can leverage this.',
        };
      }

      if (nfsEntries.length === 0) {
        return { passed: true, evidence: 'No NFS storage backends configured' };
      }

      return {
        passed: true,
        evidence: `${nfsEntries.length} NFS mount(s) — none use no_root_squash`,
      };
    },
    remediation:
      'Remove no_root_squash from NFS mount options. Configure the NFS server with root_squash (the default) to map remote root to nobody.',
    remediationScript: `# Check current NFS options
grep -A5 'nfs:' /etc/pve/storage.cfg
# Remove no_root_squash from mount options on the NFS SERVER's /etc/exports
# Then re-export: exportfs -ra`,
  },

  {
    id: 'cifs-world-readable',
    category: 'storage',
    severity: 'medium',
    title: 'CIFS Mount with Broad Permissions',
    description:
      'A CIFS/SMB storage backend is configured with world-readable permissions (file_mode=0777 or dir_mode=0777) or without explicit credentials, allowing any local user to access the share.',
    cisBenchmark: 'PVE-STOR-002',
    test: (config) => {
      const storage = config.storage;
      if (!storage || storage.entries.length === 0) {
        return { passed: true, evidence: 'No storage config provided' };
      }

      const cifsEntries = storage.entries.filter(e => e.type === 'cifs');
      const vulnerable = cifsEntries.filter(e => {
        const allOpts = Object.values(e.rawOptions).join(' ') + ' ' + (e.options || '') + ' ' + (e.mountOptions || '');
        // Check for overly permissive modes
        return (
          allOpts.includes('0777') ||
          allOpts.includes('0666') ||
          allOpts.includes('file_mode=0777') ||
          allOpts.includes('dir_mode=0777') ||
          // Guest access (no credentials)
          allOpts.includes('guest') ||
          allOpts.includes('sec=none')
        );
      });

      if (vulnerable.length > 0) {
        return {
          passed: false,
          evidence: `${vulnerable.length} CIFS mount(s) with broad permissions: ${vulnerable.map(e => e.id).join(', ')}`,
          details:
            'World-readable CIFS mounts or guest access allow any process on the host to access storage content.',
        };
      }

      if (cifsEntries.length === 0) {
        return { passed: true, evidence: 'No CIFS storage backends configured' };
      }

      return {
        passed: true,
        evidence: `${cifsEntries.length} CIFS mount(s) — permissions look reasonable`,
      };
    },
    remediation:
      'Set restrictive file and directory modes (e.g., file_mode=0600, dir_mode=0700) on CIFS mounts and ensure proper credentials are configured.',
    remediationScript: `# Update CIFS storage options
pvesm set <storage-id> --options "file_mode=0600,dir_mode=0700"`,
  },
];
