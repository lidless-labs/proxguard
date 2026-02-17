import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import { useTheme } from '../variants/ThemeProvider';

const STORAGE_KEY = 'proxguard-storage';

function hasStoredVariantPreference(): boolean {
  if (typeof window === 'undefined') return true;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as { state?: { activeVariant?: unknown } };
    return typeof parsed?.state?.activeVariant === 'number';
  } catch {
    return false;
  }
}

export function VariantSelector() {
  const activeVariant = useAuditStore((s) => s.activeVariant);
  const setVariant = useAuditStore((s) => s.setVariant);
  const theme = useTheme();
  const isDark = activeVariant === 2;

  // First load preference: if no explicit saved choice yet, follow system setting.
  useEffect(() => {
    if (hasStoredVariantPreference()) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setVariant(prefersDark ? 2 : 1);
  }, [setVariant]);

  // Keyboard shortcut: D toggles light/dark mode.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'd') {
        setVariant(activeVariant === 2 ? 1 : 2);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeVariant, setVariant]);

  return (
    <motion.button
      type="button"
      onClick={() => setVariant(isDark ? 1 : 2)}
      title={isDark ? 'Switch to Light Mode (D)' : 'Switch to Dark Mode (D)'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center justify-center w-9 h-9 rounded-md border transition-colors
        ${theme.classes.cardBorder} ${theme.classes.textSecondary} hover:text-[#d97706]
        ${isDark ? 'bg-[#2a2a2a]' : 'bg-white/70'}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </motion.button>
  );
}
