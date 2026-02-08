/**
 * ProxGuard — Core Type Definitions
 * All types for the Proxmox Security Auditor engine.
 */

// ─── Enums & Literal Types ─────────────────────────────────────────────────

/** Security audit categories mapping to Proxmox subsystems */
export type AuditCategory = 'ssh' | 'firewall' | 'auth' | 'container' | 'api' | 'storage';

/** Severity levels for security findings */
export type Severity = 'critical' | 'high' | 'medium' | 'info';

/** Overall security grade */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Proxmox configuration file types that can be audited */
export type ConfigFileType =
  | 'user.cfg'
  | 'sshd_config'
  | 'cluster.fw'
  | 'iptables'
  | 'lxc.conf'
  | 'storage.cfg';

// ─── Parsed Configuration Sub-Types ────────────────────────────────────────

/** Parsed SSH daemon configuration */
export interface ParsedSSH {
  permitRootLogin: string | null;
  passwordAuthentication: string | null;
  pubkeyAuthentication: string | null;
  port: number | null;
  maxAuthTries: number | null;
  permitEmptyPasswords: string | null;
  x11Forwarding: string | null;
  usePAM: string | null;
  protocol: string | null;
  loginGraceTime: string | null;
  rawDirectives: Record<string, string>;
}

/** Firewall rule from cluster.fw */
export interface FirewallRule {
  type: 'IN' | 'OUT' | 'GROUP';
  action: string;
  source?: string;
  dest?: string;
  proto?: string;
  dport?: string;
  sport?: string;
  iface?: string;
  comment?: string;
  enable?: boolean;
}

/** IP set entry */
export interface IPSetEntry {
  name: string;
  entries: string[];
}

/** Parsed cluster firewall configuration */
export interface ParsedFirewall {
  enabled: boolean | null;
  policyIn: string | null;
  policyOut: string | null;
  rules: FirewallRule[];
  ipSets: IPSetEntry[];
  options: Record<string, string>;
}

/** User entry from user.cfg */
export interface PVEUser {
  userid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enable?: boolean;
  expire?: number;
  comment?: string;
  tfa?: string;
}

/** ACL entry from user.cfg */
export interface PVEAcl {
  path: string;
  ugid: string;
  role: string;
  propagate: boolean;
}

/** API token from user.cfg */
export interface PVEToken {
  userid: string;
  tokenId: string;
  expire?: number;
  privsep?: boolean;
  comment?: string;
}

/** Group entry */
export interface PVEGroup {
  groupid: string;
  users: string[];
  comment?: string;
}

/** Parsed auth/user configuration */
export interface ParsedAuth {
  users: PVEUser[];
  groups: PVEGroup[];
  acls: PVEAcl[];
  tokens: PVEToken[];
  roles: Record<string, string>;
}

/** Individual container config */
export interface ContainerConfig {
  id: string;
  unprivileged: boolean | null;
  nesting: boolean;
  mountPoints: string[];
  capabilities: string[];
  hostname?: string;
  rawLines: string[];
}

/** Parsed LXC container configurations */
export interface ParsedContainers {
  containers: ContainerConfig[];
}

/** Parsed API-related config (derived from user.cfg tokens + acls) */
export interface ParsedAPI {
  tokens: PVEToken[];
  tokenAcls: PVEAcl[];
}

/** Storage backend entry */
export interface StorageEntry {
  id: string;
  type: string;
  path?: string;
  server?: string;
  export?: string;
  share?: string;
  content?: string[];
  options?: string;
  mountOptions?: string;
  domain?: string;
  username?: string;
  maxfiles?: number;
  subdir?: string;
  rawOptions: Record<string, string>;
}

/** Parsed storage configuration */
export interface ParsedStorage {
  entries: StorageEntry[];
}

/** Iptables chain */
export interface IptablesChain {
  name: string;
  policy: string;
  rules: IptablesRule[];
}

/** Individual iptables rule */
export interface IptablesRule {
  target: string;
  protocol: string;
  source: string;
  destination: string;
  options: string;
  raw: string;
}

/** Parsed iptables output */
export interface ParsedIptables {
  chains: IptablesChain[];
}

// ─── Top-Level Parsed Config ───────────────────────────────────────────────

/** Aggregated parsed configuration from all input files */
export interface ParsedConfig {
  ssh?: ParsedSSH;
  firewall?: ParsedFirewall;
  auth?: ParsedAuth;
  containers?: ParsedContainers;
  api?: ParsedAPI;
  storage?: ParsedStorage;
  iptables?: ParsedIptables;
  raw: Record<ConfigFileType, string>;
}

// ─── Rule Engine Types ─────────────────────────────────────────────────────

/** Result of evaluating a single security rule */
export interface RuleResult {
  passed: boolean;
  evidence: string;
  details?: string;
}

/** A security rule definition */
export interface SecurityRule {
  id: string;
  category: AuditCategory;
  severity: Severity;
  title: string;
  description: string;
  test: (parsedConfig: ParsedConfig) => RuleResult;
  remediation: string;
  remediationScript: string;
  cisBenchmark?: string;
}

/** A finding is a rule paired with its evaluation result */
export interface Finding {
  rule: SecurityRule;
  result: RuleResult;
}

// ─── Scoring & Report Types ────────────────────────────────────────────────

/** Score breakdown for a single category */
export interface CategoryScore {
  category: AuditCategory;
  score: number;
  findings: Finding[];
  maxScore: number;
}

/** Complete audit report */
export interface AuditReport {
  timestamp: number;
  overallGrade: Grade;
  overallScore: number;
  categories: CategoryScore[];
  findings: Finding[];
  inputFiles: ConfigFileType[];
}
