/**
 * ProxGuard Zustand Store
 * Central state management for the audit engine.
 * Persists audit history to localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfigFileType, ParsedConfig, AuditReport } from '../types';
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

/** Serializable version of AuditReport for localStorage (without functions) */
interface StoredAuditReport {
  timestamp: number;
  overallGrade: AuditReport['overallGrade'];
  overallScore: number;
  sampleType?: string;
}

interface AuditState {
  // Inputs
  configInputs: Record<ConfigFileType, string>;
  parsedConfig: ParsedConfig | null;

  // Results
  auditReport: AuditReport | null;

  // History (persisted — stores summary only, not full findings with functions)
  history: StoredAuditReport[];

  // UI state
  activeVariant: number;
  isAuditing: boolean;

  // Actions
  setConfigInput: (fileType: ConfigFileType, content: string) => void;
  runAudit: () => void;
  loadSample: (type: SampleType) => void;
  clearResults: () => void;
  setVariant: (variant: number) => void;
  clearHistory: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      // Initial state
      configInputs: emptyConfigInputs(),
      parsedConfig: null,
      auditReport: null,
      history: [],
      activeVariant: 1,
      isAuditing: false,

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

          // Add to history (store summary only)
          const historyEntry: StoredAuditReport = {
            timestamp: auditReport.timestamp,
            overallGrade: auditReport.overallGrade,
            overallScore: auditReport.overallScore,
          };

          set((state) => ({
            parsedConfig,
            auditReport,
            isAuditing: false,
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

      /** Clear all results (keep inputs) */
      clearResults: () => {
        set({
          parsedConfig: null,
          auditReport: null,
        });
      },

      /** Set the active UI variant (1-5) */
      setVariant: (variant: number) => {
        set({ activeVariant: Math.max(1, Math.min(5, variant)) });
      },

      /** Clear audit history */
      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: 'proxguard-storage',
      // Only persist history and variant selection
      partialize: (state) => ({
        history: state.history,
        activeVariant: state.activeVariant,
      }),
    }
  )
);
