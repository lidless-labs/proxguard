/**
 * ScriptGenerator — Generates a combined bash remediation script
 * from all failed findings. Includes DRY_RUN mode, confirmation prompts,
 * and section-by-section fix commands.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../variants/ThemeProvider';
import type { Finding } from '../types';

interface ScriptGeneratorProps {
  findings: Finding[];
}

/** Build the full bash remediation script from failed findings */
function buildScript(findings: Finding[]): string {
  const failed = findings.filter((f) => !f.result.passed && f.rule.remediationScript.trim());
  if (failed.length === 0) return '';

  const date = new Date().toISOString().split('T')[0];
  const lines: string[] = [
    '#!/bin/bash',
    'set -e',
    '',
    '###############################################################################',
    `# ProxGuard Remediation Script — Generated ${date}`,
    `# Total fixes: ${failed.length}`,
    '#',
    '# Usage:',
    '#   chmod +x proxguard-fix.sh',
    '#   sudo ./proxguard-fix.sh            # Interactive mode (confirms each fix)',
    '#   sudo ./proxguard-fix.sh --dry-run  # Preview mode (shows commands only)',
    '###############################################################################',
    '',
    '# ─── Parse arguments ─────────────────────────────────────────────────────────',
    'DRY_RUN=false',
    'if [ "$1" = "--dry-run" ]; then',
    '  DRY_RUN=true',
    '  echo "══════════════════════════════════════════════════════════"',
    '  echo "  DRY RUN MODE — No changes will be made"',
    '  echo "══════════════════════════════════════════════════════════"',
    '  echo ""',
    'fi',
    '',
    'APPLIED=0',
    'SKIPPED=0',
    'ERRORS=0',
    '',
    'echo "ProxGuard Remediation Script"',
    `echo "Generated: ${date}"`,
    `echo "Fixes to apply: ${failed.length}"`,
    'echo "──────────────────────────────────────────────────────────"',
    'echo ""',
    '',
  ];

  failed.forEach((finding, idx) => {
    const num = idx + 1;
    const { rule } = finding;
    // Escape any problematic chars in the title for shell comments
    const safeTitle = rule.title.replace(/'/g, "'\\''");
    const safeSeverity = rule.severity.toUpperCase();
    const safeCategory = rule.category.toUpperCase();

    lines.push(`# ─── Fix ${num}/${failed.length}: ${safeTitle} ────`);
    lines.push(`# Severity: ${safeSeverity} | Category: ${safeCategory}`);
    lines.push(`# ${rule.description.replace(/\n/g, '\n# ')}`);
    lines.push('');
    lines.push(`echo "[${num}/${failed.length}] ${safeSeverity}: ${safeTitle}"`);
    lines.push('');

    lines.push('if [ "$DRY_RUN" = true ]; then');
    lines.push('  echo "  Would run:"');
    // Show the commands in dry-run mode
    rule.remediationScript.split('\n').forEach((cmdLine) => {
      lines.push(`  echo "    ${cmdLine.replace(/"/g, '\\"')}"`);
    });
    lines.push('  echo ""');
    lines.push('else');
    lines.push('  read -p "  Apply this fix? [y/N] " confirm');
    lines.push('  if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then');
    lines.push('    echo "  Applying..."');
    // Indent the actual script
    rule.remediationScript.split('\n').forEach((cmdLine) => {
      if (cmdLine.trim()) {
        lines.push(`    ${cmdLine}`);
      }
    });
    lines.push('    if [ $? -eq 0 ]; then');
    lines.push('      echo "  ✓ Applied successfully"');
    lines.push('      APPLIED=$((APPLIED + 1))');
    lines.push('    else');
    lines.push('      echo "  ✗ Error applying fix"');
    lines.push('      ERRORS=$((ERRORS + 1))');
    lines.push('    fi');
    lines.push('  else');
    lines.push('    echo "  → Skipped"');
    lines.push('    SKIPPED=$((SKIPPED + 1))');
    lines.push('  fi');
    lines.push('fi');
    lines.push('echo ""');
    lines.push('');
  });

  lines.push('# ─── Summary ─────────────────────────────────────────────────────────────');
  lines.push('echo "══════════════════════════════════════════════════════════"');
  lines.push('echo "  Remediation Summary"');
  lines.push('echo "══════════════════════════════════════════════════════════"');
  lines.push('if [ "$DRY_RUN" = true ]; then');
  lines.push(`  echo "  Mode:    DRY RUN (no changes made)"`);
  lines.push(`  echo "  Fixes:   ${failed.length} available"`);
  lines.push('else');
  lines.push('  echo "  Applied: $APPLIED"');
  lines.push('  echo "  Skipped: $SKIPPED"');
  lines.push('  echo "  Errors:  $ERRORS"');
  lines.push('fi');
  lines.push('echo "══════════════════════════════════════════════════════════"');
  lines.push('');

  return lines.join('\n');
}

export function ScriptGenerator({ findings }: ScriptGeneratorProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const failedWithScripts = useMemo(
    () => findings.filter((f) => !f.result.passed && f.rule.remediationScript.trim()),
    [findings]
  );

  const script = useMemo(() => buildScript(findings), [findings]);

  // Nothing to generate if no failed findings have scripts
  if (failedWithScripts.length === 0) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = script;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxguard-fix-${new Date().toISOString().split('T')[0]}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl overflow-hidden`}>
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-5 py-4 flex items-center justify-between transition-colors hover:opacity-80`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-current/10`}>
            <Terminal className={`w-5 h-5 ${theme.classes.accent}`} />
          </div>
          <div className="text-left">
            <span className={`text-sm font-semibold ${theme.classes.textPrimary}`}>
              Generate Fix Script
            </span>
            <span className={`text-xs ${theme.classes.textSecondary} ml-2`}>
              {failedWithScripts.length} fixes available
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className={`w-5 h-5 ${theme.classes.textSecondary}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${theme.classes.textSecondary}`} />
        )}
      </button>

      {/* Expanded script view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 border-t ${theme.classes.cardBorder}`}>
              {/* Action buttons */}
              <div className="flex items-center gap-2 py-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme.classes.button}`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Script
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme.classes.button}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .sh
                </button>
              </div>

              {/* Code block */}
              <div className="rounded-lg overflow-hidden border border-gray-700/30">
                <pre
                  className={`p-4 text-xs leading-relaxed overflow-x-auto max-h-96 overflow-y-auto`}
                  style={{ fontFamily: theme.fonts.mono, background: theme.vars['--pg-bg'] }}
                >
                  <code className={theme.classes.textPrimary}>{script}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
