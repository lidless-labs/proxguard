/**
 * Security Rules Registry
 * Aggregates all security rules from all categories.
 */
import type { SecurityRule } from '../types';
import { sshRules } from './ssh';
import { authRules } from './auth';
import { firewallRules } from './firewall';
import { containerRules } from './container';
import { storageRules } from './storage';
import { apiRules } from './api';

/** All security rules, sorted by severity */
export const allRules: SecurityRule[] = [
  ...sshRules,
  ...authRules,
  ...firewallRules,
  ...containerRules,
  ...storageRules,
  ...apiRules,
];

/** Get rules filtered by category */
export function getRulesByCategory(category: string): SecurityRule[] {
  return allRules.filter(r => r.category === category);
}

/** Get rule by ID */
export function getRuleById(id: string): SecurityRule | undefined {
  return allRules.find(r => r.id === id);
}

export { sshRules } from './ssh';
export { authRules } from './auth';
export { firewallRules } from './firewall';
export { containerRules } from './container';
export { storageRules } from './storage';
export { apiRules } from './api';
