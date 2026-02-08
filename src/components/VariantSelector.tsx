/**
 * VariantSelector — Polished theme picker in the header.
 * Shows numbered buttons with tooltips, keyboard shortcuts (1-5),
 * active variant highlighted with framer-motion layout animation.
 */
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import { themeList } from '../variants/themes';
import { useTheme } from '../variants/ThemeProvider';

export function VariantSelector() {
  const activeVariant = useAuditStore((s) => s.activeVariant);
  const setVariant = useAuditStore((s) => s.setVariant);
  const theme = useTheme();

  // Keyboard shortcuts: 1-5 to switch variants
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        setVariant(num);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setVariant]);

  return (
    <div className="flex items-center gap-2">
      <Palette className={`w-4 h-4 ${theme.classes.textSecondary}`} />
      <div className="flex items-center gap-1 relative">
        {themeList.map((t) => {
          const isActive = t.id === activeVariant;
          return (
            <motion.button
              key={t.id}
              onClick={() => setVariant(t.id)}
              title={`${t.name} (${t.id})`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative w-7 h-7 rounded-md text-xs font-bold transition-colors
                flex items-center justify-center
                ${isActive
                  ? `${theme.classes.accent} ring-1 ring-current`
                  : `${theme.classes.textSecondary} hover:${theme.classes.textPrimary}`
                }
              `}
            >
              {/* Active indicator background */}
              {isActive && (
                <motion.div
                  layoutId="variant-active-bg"
                  className="absolute inset-0 rounded-md bg-current opacity-15"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t.id}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
