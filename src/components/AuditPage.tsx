/**
 * AuditPage — Primary audit interface.
 * Two-panel layout: config input (left) + results (right).
 * Responsive: side-by-side on desktop, stacked on mobile.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import type { ConfigFileType, AuditCategory } from '../types';
import { AnimatedGauge } from './AnimatedGauge';
import { CategoryRadar } from './CategoryRadar';
import { CategoryCard } from './CategoryCard';
import { FindingCard } from './FindingCard';
import { ScoreSummary } from './ScoreSummary';

// ─── Config tab definitions ─────────────────────────────────────────────────

interface ConfigTab {
  key: ConfigFileType;
  label: string;
  placeholder: string;
}

const CONFIG_TABS: ConfigTab[] = [
  {
    key: 'sshd_config',
    label: 'sshd_config',
    placeholder: `# /etc/ssh/sshd_config
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
UsePAM yes`,
  },
  {
    key: 'user.cfg',
    label: 'user.cfg',
    placeholder: `# /etc/pve/user.cfg
user:root@pam:1:0:::root@example.com::x]
user:admin@pve:1:0:::admin@example.com:::
acl:1:/:@admins:Administrator:
group:admins:admin@pve::`,
  },
  {
    key: 'cluster.fw',
    label: 'cluster.fw',
    placeholder: `# /etc/pve/firewall/cluster.fw
[OPTIONS]
enable: 1
policy_in: DROP
policy_out: ACCEPT

[RULES]
IN ACCEPT -p tcp -dport 8006
IN ACCEPT -p tcp -dport 22`,
  },
  {
    key: 'iptables',
    label: 'iptables',
    placeholder: `# iptables -L -n -v
Chain INPUT (policy DROP)
target   prot  source    destination
ACCEPT   all   0.0.0.0/0 0.0.0.0/0  state RELATED,ESTABLISHED
ACCEPT   tcp   0.0.0.0/0 0.0.0.0/0  tcp dpt:22`,
  },
  {
    key: 'lxc.conf',
    label: 'lxc.conf',
    placeholder: `# /etc/pve/lxc/100.conf
arch: amd64
cores: 2
hostname: ct100
memory: 512
ostype: debian
unprivileged: 1
rootfs: local-lvm:vm-100-disk-0,size=8G`,
  },
  {
    key: 'storage.cfg',
    label: 'storage.cfg',
    placeholder: `# /etc/pve/storage.cfg
dir: local
\tpath /var/lib/vz
\tcontent images,rootdir,vztmpl,iso,backup
\tmaxfiles 3

lvmthin: local-lvm
\tthinpool data
\tvgname pve
\tcontent rootdir,images`,
  },
];

// ─── Severity sort order ────────────────────────────────────────────────────

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, info: 3 } as const;

/** Category display labels */
const CATEGORY_LABELS: Record<AuditCategory, string> = {
  ssh: 'SSH Security',
  auth: 'Authentication',
  firewall: 'Firewall',
  container: 'Container Security',
  storage: 'Storage',
  api: 'API Security',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AuditPage() {
  const [activeTab, setActiveTab] = useState<ConfigFileType>('sshd_config');
  const [inputCollapsed, setInputCollapsed] = useState(false);

  const configInputs = useAuditStore((s) => s.configInputs);
  const setConfigInput = useAuditStore((s) => s.setConfigInput);
  const runAudit = useAuditStore((s) => s.runAudit);
  const loadSample = useAuditStore((s) => s.loadSample);
  const auditReport = useAuditStore((s) => s.auditReport);
  const isAuditing = useAuditStore((s) => s.isAuditing);

  /** Check if a config tab has content */
  const hasContent = (key: ConfigFileType) => configInputs[key].trim().length > 0;

  /** Any config has content */
  const hasAnyContent = Object.values(configInputs).some((v) => v.trim().length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Left Panel: Config Input ────────────────────────── */}
        <div className={`${auditReport ? 'lg:w-[380px] lg:shrink-0' : 'lg:w-1/2'} transition-all`}>
          <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-300">Config Input</span>
              </div>
              {/* Collapse toggle (visible when results shown, on mobile always visible) */}
              {auditReport && (
                <button
                  onClick={() => setInputCollapsed(!inputCollapsed)}
                  className="lg:hidden flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                >
                  {inputCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  {inputCollapsed ? 'Expand' : 'Collapse'}
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {!inputCollapsed && (
                <motion.div
                  initial={false}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Sample buttons */}
                  <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500 mr-1">Load Sample:</span>
                    <button
                      onClick={() => loadSample('insecure')}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                    >
                      Insecure
                    </button>
                    <button
                      onClick={() => loadSample('partial')}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                    >
                      Partial
                    </button>
                    <button
                      onClick={() => loadSample('hardened')}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                    >
                      Hardened
                    </button>
                  </div>

                  {/* Config tabs */}
                  <div className="px-4 pt-3 flex gap-1 overflow-x-auto scrollbar-thin">
                    {CONFIG_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative px-3 py-1.5 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                          activeTab === tab.key
                            ? 'bg-gray-800 text-gray-100'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                        }`}
                      >
                        {tab.label}
                        {/* Content indicator dot */}
                        {hasContent(tab.key) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Textarea */}
                  <div className="px-4 pb-3">
                    <textarea
                      value={configInputs[activeTab]}
                      onChange={(e) => setConfigInput(activeTab, e.target.value)}
                      placeholder={CONFIG_TABS.find((t) => t.key === activeTab)?.placeholder}
                      spellCheck={false}
                      className="w-full h-56 sm:h-64 bg-gray-950/60 border border-gray-800/60 rounded-lg p-3 text-sm font-mono text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  {/* Run Audit button */}
                  <div className="px-4 pb-4">
                    <motion.button
                      onClick={runAudit}
                      disabled={isAuditing || !hasAnyContent}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                        isAuditing || !hasAnyContent
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      {isAuditing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Auditing…
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run Audit
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Right Panel: Results ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {!auditReport ? (
              /* Empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-10 h-10 text-gray-700" />
                </div>
                <h2 className="text-lg font-semibold text-gray-500 mb-2">No audit results yet</h2>
                <p className="text-sm text-gray-600 max-w-sm">
                  Paste your Proxmox config files or load a sample, then click{' '}
                  <span className="text-emerald-500 font-medium">Run Audit</span> to see your
                  security score.
                </p>
              </motion.div>
            ) : (
              /* Results panel */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Grade Hero + Radar side by side */}
                <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <AnimatedGauge
                      score={auditReport.overallScore}
                      grade={auditReport.overallGrade}
                      size={180}
                    />
                    <div className="flex-1 w-full">
                      <CategoryRadar categories={auditReport.categories} />
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <ScoreSummary findings={auditReport.findings} />

                {/* Category Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {auditReport.categories.map((cat, i) => (
                    <CategoryCard key={cat.category} categoryScore={cat} index={i} />
                  ))}
                </div>

                {/* Findings by Category */}
                <div className="space-y-6">
                  {auditReport.categories.map((cat) => {
                    const sortedFindings = [...cat.findings].sort(
                      (a, b) => SEVERITY_ORDER[a.rule.severity] - SEVERITY_ORDER[b.rule.severity]
                    );

                    if (sortedFindings.length === 0) return null;

                    return (
                      <div key={cat.category}>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          {CATEGORY_LABELS[cat.category]}
                          <span className="ml-2 text-gray-600">
                            ({sortedFindings.filter((f) => !f.result.passed).length} issues)
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {sortedFindings.map((finding) => (
                            <FindingCard key={finding.rule.id} finding={finding} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
