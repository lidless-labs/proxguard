/**
 * ProxGuard Zustand Store
 * Central state management for the audit engine.
 * Persists audit history to localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfigFileType, ParsedConfig, AuditReport, SecurityRule } from '../types';
import { parseAllConfigs } from '../parsers';
import { allRules } from '../rules';
import { generateAuditReport } from '../utils/scoring';
import { getSample, type SampleType } from '../data';

/** All config file types */
const CONFIG_FILE_TYPES: ConfigFileType[] = [
  'sshd_config',
  'user.cfg',
  'cluster.fw',
  'iptables',
  'lxc.conf',
  'storage.cfg',
];

/** Create empty config inputs */
function emptyConfigInputs(): Record<ConfigFileType, string> {
  const inputs: Partial<Record<ConfigFileType, string>> = {};
  for (const ft of CONFIG_FILE_TYPES) {
    inputs[ft] = '';
  }
  return inputs as Record<ConfigFileType, string>;
}

type RuleWithoutTest = Omit<SecurityRule, 'test'>;

/** Legacy summary-only history entry (kept for backward compatibility) */
interface LegacyStoredAuditReport {
  timestamp: number;
  overallGrade: AuditReport['overallGrade'];
  overallScore: number;
  sampleType?: string;
}

/** Serializable full report for localStorage (functions stripped from rules) */
export interface StoredFullReport extends Omit<AuditReport, 'findings' | 'categories'> {
  findings: Array<{
    rule: RuleWithoutTest;
    result: AuditReport['findings'][number]['result'];
  }>;
  categories: Array<{
    category: AuditReport['categories'][number]['category'];
    score: number;
    maxScore: number;
    findings: Array<{
      rule: RuleWithoutTest;
      result: AuditReport['findings'][number]['result'];
    }>;
  }>;
}

export type StoredHistoryEntry = StoredFullReport | LegacyStoredAuditReport;

const ruleById = new Map(allRules.map((rule) => [rule.id, rule]));

function isStoredFullReport(entry: StoredHistoryEntry): entry is StoredFullReport {
  return Array.isArray((entry as StoredFullReport).categories) && Array.isArray((entry as StoredFullReport).findings);
}

function serializeReport(report: AuditReport): StoredFullReport {
  return {
    ...report,
    findings: report.findings.map((finding) => ({
      rule: {
        id: finding.rule.id,
        category: finding.rule.category,
        severity: finding.rule.severity,
        title: finding.rule.title,
        description: finding.rule.description,
        remediation: finding.rule.remediation,
        remediationScript: finding.rule.remediationScript,
        cisBenchmark: finding.rule.cisBenchmark,
      },
      result: finding.result,
    })),
    categories: report.categories.map((category) => ({
      category: category.category,
      score: category.score,
      maxScore: category.maxScore,
      findings: category.findings.map((finding) => ({
        rule: {
          id: finding.rule.id,
          category: finding.rule.category,
          severity: finding.rule.severity,
          title: finding.rule.title,
          description: finding.rule.description,
          remediation: finding.rule.remediation,
          remediationScript: finding.rule.remediationScript,
          cisBenchmark: finding.rule.cisBenchmark,
        },
        result: finding.result,
      })),
    })),
  };
}

/** Build a fallback SecurityRule from stored metadata when rule no longer exists in codebase */
function buildFallbackRule(stored: RuleWithoutTest): SecurityRule {
  return {
    ...stored,
    test: () => ({ passed: false, evidence: 'Rule no longer available in current ruleset' }),
  };
}

export function hydrateStoredReport(entry: StoredHistoryEntry): AuditReport | null {
  if (!isStoredFullReport(entry)) return null;

  return {
    ...entry,
    findings: entry.findings.map((finding) => ({
      rule: ruleById.get(finding.rule.id) ?? buildFallbackRule(finding.rule),
      result: finding.result,
    })),
    categories: entry.categories.map((category) => ({
      category: category.category,
      score: category.score,
      maxScore: category.maxScore,
      findings: category.findings.map((finding) => ({
        rule: ruleById.get(finding.rule.id) ?? buildFallbackRule(finding.rule),
        result: finding.result,
      })),
    })),
  };
}

interface AuditState {
  // Inputs
  configInputs: Record<ConfigFileType, string>;
  lastConfigInputs: Record<ConfigFileType, string>;
  parsedConfig: ParsedConfig | null;

  // Results
  auditReport: AuditReport | null;

  // History (persisted — full reports when available, supports legacy summary-only entries)
  history: StoredHistoryEntry[];

  // UI state
  activeVariant: number;
  isAuditing: boolean;
  comparisonPair: [number, number] | null;

  // Actions
  setConfigInput: (fileType: ConfigFileType, content: string) => void;
  runAudit: () => void;
  loadSample: (type: SampleType) => void;
  loadLastConfig: () => void;
  clearResults: () => void;
  setVariant: (variant: number) => void;
  clearHistory: () => void;
  deleteHistoryEntry: (timestamp: number) => void;
  setComparisonPair: (a: number, b: number) => void;
  clearComparison: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      // Initial state
      configInputs: emptyConfigInputs(),
      lastConfigInputs: emptyConfigInputs(),
      parsedConfig: null,
      auditReport: null,
      history: [],
      activeVariant: 1,
      isAuditing: false,
      comparisonPair: null,

      /** Update a single config file's content */
      setConfigInput: (fileType: ConfigFileType, content: string) => {
        set((state) => ({
          configInputs: {
            ...state.configInputs,
            [fileType]: content,
          },
        }));
      },

      /** Run the full audit pipeline: parse → evaluate rules → score → report */
      runAudit: () => {
        set({ isAuditing: true });

        // Use setTimeout to allow UI to update with loading state
        setTimeout(() => {
          const { configInputs } = get();

          // Parse all configs
          const parsedConfig = parseAllConfigs(configInputs);

          // Generate audit report
          const auditReport = generateAuditReport(parsedConfig, allRules);

          // Add to history (store full serializable report)
          const historyEntry = serializeReport(auditReport);

          set((state) => ({
            parsedConfig,
            auditReport,
            isAuditing: false,
            lastConfigInputs: { ...configInputs },
            history: [historyEntry, ...state.history].slice(0, 50), // Keep last 50
          }));
        }, 100); // Small delay for UI responsiveness
      },

      /** Load a sample configuration set */
      loadSample: (type: SampleType) => {
        const sample = getSample(type);
        set({
          configInputs: { ...sample },
          parsedConfig: null,
          auditReport: null,
        });
      },

      /** Restore last audited config inputs */
      loadLastConfig: () => {
        const { lastConfigInputs } = get();
        set({
          configInputs: { ...lastConfigInputs },
          parsedConfig: null,
          auditReport: null,
        });
      },

      /** Clear all results (keep inputs) */
      clearResults: () => {
        set({
          parsedConfig: null,
          auditReport: null,
        });
      },

      /** Set the active UI theme (1: light, 2: dark) */
      setVariant: (variant: number) => {
        set({ activeVariant: Math.max(1, Math.min(2, variant)) });
      },

      /** Clear audit history */
      clearHistory: () => {
        set({ history: [], comparisonPair: null });
      },

      /** Delete a single history entry by timestamp */
      deleteHistoryEntry: (timestamp: number) => {
        set((state) => ({
          history: state.history.filter((e) => e.timestamp !== timestamp),
          comparisonPair: state.comparisonPair?.includes(timestamp) ? null : state.comparisonPair,
        }));
      },

      /** Set report pair for comparison by timestamps */
      setComparisonPair: (a: number, b: number) => {
        set({ comparisonPair: [a, b] });
      },

      /** Clear active comparison pair */
      clearComparison: () => {
        set({ comparisonPair: null });
      },
    }),
    {
      name: 'proxguard-storage',
      // Only persist history, comparison pair, variant selection, and last audited configs
      partialize: (state) => ({
        history: state.history,
        activeVariant: state.activeVariant,
        comparisonPair: state.comparisonPair,
        lastConfigInputs: state.lastConfigInputs,
      }),
      // Gracefully migrate old summary history entries (v0) to union format (v1)
      version: 1,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;

        const state = persistedState as {
          history?: unknown;
          activeVariant?: unknown;
          comparisonPair?: unknown;
          lastConfigInputs?: unknown;
        };

        const history = Array.isArray(state.history) ? state.history : [];

        if (version < 1) {
          return {
            ...state,
            history,
            comparisonPair: null,
            lastConfigInputs: emptyConfigInputs(),
          };
        }

        return {
          ...state,
          history,
          comparisonPair: Array.isArray(state.comparisonPair) ? state.comparisonPair : null,
          lastConfigInputs:
            state.lastConfigInputs && typeof state.lastConfigInputs === 'object'
              ? (state.lastConfigInputs as Record<ConfigFileType, string>)
              : emptyConfigInputs(),
        };
      },
    }
  )
);
