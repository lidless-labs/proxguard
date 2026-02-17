/**
 * SSH Security Rules
 * Evaluates sshd_config for Proxmox VE hardening best practices.
 */
import type { SecurityRule } from '../types';

export const sshRules: SecurityRule[] = [
  {
    id: 'root-ssh-password',
    category: 'ssh',
    severity: 'critical',
    title: 'Root SSH with Password Authentication',
    description:
      'Root login via SSH with password authentication is enabled. This is the most common attack vector for Proxmox VE hosts — brute-force attacks target root directly.',
    cisBenchmark: 'CIS Debian 11 - 5.2.10',
    test: (config) => {
      const ssh = config.ssh;
      if (!ssh) {
        return { passed: true, evidence: 'No SSH config provided — cannot assess' };
      }

      const rootLogin = ssh.permitRootLogin;
      const passwordAuth = ssh.passwordAuthentication;

      // Root can log in with password if:
      // - PermitRootLogin is 'yes' AND PasswordAuthentication is not 'no'
      // - PermitRootLogin is null (default is prohibit-password in modern OpenSSH, but
      //   many Proxmox installs override to 'yes')
      const rootAllowed = rootLogin === 'yes' || rootLogin === null;
      const passwordAllowed = passwordAuth !== 'no';

      if (rootAllowed && passwordAllowed) {
        return {
          passed: false,
          evidence: `PermitRootLogin=${rootLogin ?? 'default (yes)'}, PasswordAuthentication=${passwordAuth ?? 'default (yes)'}`,
          details: 'Root can authenticate via SSH using a password. An attacker only needs to guess the root password.',
        };
      }

      return {
        passed: true,
        evidence: `PermitRootLogin=${rootLogin ?? 'default'}, PasswordAuthentication=${passwordAuth ?? 'default'}`,
      };
    },
    remediation:
      'Set "PermitRootLogin prohibit-password" or "PermitRootLogin no" in /etc/ssh/sshd_config, then restart sshd.',
    remediationScript: `sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd`,
  },

  {
    id: 'ssh-default-port',
    category: 'ssh',
    severity: 'medium',
    title: 'SSH Running on Default Port 22',
    description:
      'SSH is configured on the default port 22. While security through obscurity is not a primary defense, changing the port reduces noise from automated scanners.',
    cisBenchmark: 'CIS Debian 11 - 5.2.15',
    test: (config) => {
      const ssh = config.ssh;
      if (!ssh) {
        return { passed: true, evidence: 'No SSH config provided' };
      }

      const port = ssh.port;
      // Default is 22 if not specified
      if (port === 22 || port === null) {
        return {
          passed: false,
          evidence: `Port=${port ?? '22 (default)'}`,
          details: 'Automated scanners and botnets target port 22 by default.',
        };
      }

      return {
        passed: true,
        evidence: `Port=${port}`,
      };
    },
    remediation:
      'Change the SSH port in /etc/ssh/sshd_config to a non-standard port (e.g., 2222). Update your firewall rules accordingly.',
    remediationScript: `sed -i 's/^#*Port.*/Port 2222/' /etc/ssh/sshd_config
# Don't forget to update firewall rules!
systemctl restart sshd`,
  },

  {
    id: 'password-auth-enabled',
    category: 'ssh',
    severity: 'high',
    title: 'Password Authentication Enabled Globally',
    description:
      'SSH password authentication is enabled for all users. Key-based authentication is significantly more secure and should be the only allowed method.',
    cisBenchmark: 'CIS Debian 11 - 5.2.12',
    test: (config) => {
      const ssh = config.ssh;
      if (!ssh) {
        return { passed: true, evidence: 'No SSH config provided' };
      }

      const passwordAuth = ssh.passwordAuthentication;
      // Default is 'yes' if not specified
      if (passwordAuth !== 'no') {
        return {
          passed: false,
          evidence: `PasswordAuthentication=${passwordAuth ?? 'yes (default)'}`,
          details: 'All users can authenticate with passwords, making brute-force attacks viable.',
        };
      }

      return {
        passed: true,
        evidence: 'PasswordAuthentication=no',
      };
    },
    remediation:
      'Set "PasswordAuthentication no" in /etc/ssh/sshd_config. Ensure all users have SSH keys configured first.',
    remediationScript: `sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd`,
  },

  {
    id: 'high-max-auth-tries',
    category: 'ssh',
    severity: 'medium',
    title: 'MaxAuthTries Too High',
    description:
      'MaxAuthTries is set higher than 6, allowing many authentication attempts per connection. This makes brute-force attacks easier.',
    cisBenchmark: 'CIS Debian 11 - 5.2.7',
    test: (config) => {
      const ssh = config.ssh;
      if (!ssh) {
        return { passed: true, evidence: 'No SSH config provided' };
      }

      const maxTries = ssh.maxAuthTries;
      // Default is 6
      if (maxTries !== null && maxTries > 6) {
        return {
          passed: false,
          evidence: `MaxAuthTries=${maxTries}`,
          details: `Allows ${maxTries} attempts per connection. Recommended maximum is 4.`,
        };
      }

      return {
        passed: true,
        evidence: `MaxAuthTries=${maxTries ?? '6 (default)'}`,
      };
    },
    remediation: 'Set "MaxAuthTries 4" in /etc/ssh/sshd_config to limit authentication attempts.',
    remediationScript: `sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 4/' /etc/ssh/sshd_config
systemctl restart sshd`,
  },
];
