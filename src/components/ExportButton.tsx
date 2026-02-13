/**
 * ExportButton — PDF report export using jsPDF + html2canvas.
 * Captures the results panel and generates a multi-page PDF with a title page.
 */
import { useState, useCallback } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { useTheme } from '../variants/ThemeProvider';
import type { AuditReport } from '../types';

interface ExportButtonProps {
  report: AuditReport;
  /** Ref ID of the results container to capture */
  resultsContainerId: string;
}

export function ExportButton({ report, resultsContainerId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const theme = useTheme();

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      // Dynamic imports to avoid loading these heavy libs until needed
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // ─── Title Page ─────────────────────────────────────────────
      const dateStr = new Date(report.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Background color
      pdf.setFillColor(15, 15, 25);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('ProxGuard', margin, 60);

      pdf.setFontSize(16);
      pdf.setTextColor(16, 185, 129); // emerald
      pdf.text('Security Audit Report', margin, 72);

      // Divider line
      pdf.setDrawColor(16, 185, 129);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 80, pageWidth - margin, 80);

      // Grade & Score
      pdf.setFontSize(72);
      pdf.setTextColor(255, 255, 255);
      pdf.text(report.overallGrade, pageWidth / 2, 130, { align: 'center' });

      pdf.setFontSize(20);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Score: ${report.overallScore}/100`, pageWidth / 2, 145, { align: 'center' });

      // Date
      pdf.setFontSize(11);
      pdf.setTextColor(120, 120, 120);
      pdf.text(dateStr, margin, pageHeight - 40);

      // Category summary
      pdf.setFontSize(12);
      pdf.setTextColor(200, 200, 200);
      let y = 170;
      pdf.text('Category Scores:', margin, y);
      y += 10;

      pdf.setFontSize(10);
      for (const cat of report.categories) {
        const failed = cat.findings.filter((f) => !f.result.passed).length;
        pdf.setTextColor(160, 160, 160);
        pdf.text(
          `${cat.category.toUpperCase().padEnd(12)} ${cat.score}/100  (${failed} issues)`,
          margin + 5,
          y
        );
        y += 7;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text(
        '100% client-side — your configs never leave your browser',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );

      // ─── Results Screenshot Page(s) ─────────────────────────────
      const container = document.getElementById(resultsContainerId);
      if (container) {
        const canvas = await html2canvas(container, {
          backgroundColor: theme.vars['--pg-bg'] || '#0a0a0f',
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Split into pages if the image is taller than one page
        let remainingHeight = imgHeight;
        let srcY = 0;
        const availableHeight = pageHeight - margin * 2;

        while (remainingHeight > 0) {
          pdf.addPage();
          const sliceHeight = Math.min(remainingHeight, availableHeight);

          // Calculate source region in canvas coordinates
          const sourceSliceHeight = (sliceHeight / imgHeight) * canvas.height;

          // Create a temporary canvas for this slice
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sourceSliceHeight;
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, srcY, canvas.width, sourceSliceHeight,
              0, 0, canvas.width, sourceSliceHeight
            );
            const sliceData = sliceCanvas.toDataURL('image/png');
            pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceHeight);
          }

          srcY += sourceSliceHeight;
          remainingHeight -= availableHeight;
        }
      }

      // ─── Download ───────────────────────────────────────────────
      const fileName = `proxguard-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [report, resultsContainerId, theme]);

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        isExporting ? theme.classes.buttonDisabled : theme.classes.button
      }`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting…
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Export PDF
        </>
      )}
    </button>
  );
}
