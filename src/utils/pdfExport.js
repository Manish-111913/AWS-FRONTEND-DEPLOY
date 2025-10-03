import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generic multi-section PDF export.
 * @param {Object} opts
 * @param {HTMLElement} container root element containing sections
 * @param {string[]} sectionSelectors ordered selectors to capture
 * @param {string} title document title header
 * @param {string} periodLabel secondary period label
 * @param {function=} beforeCapture optional hook(el) to mutate DOM per section
 * @param {function=} afterCapture optional hook(el) to revert DOM per section
 */
export async function exportSectionsToPDF(opts) {
  const { container, sectionSelectors, title='Report', periodLabel='', beforeCapture, afterCapture, hideSelectorsDuringCapture } = opts;
  if (!container) throw new Error('Missing container');
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerHeight = 8;
  const contentWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin - (margin + headerHeight);
  const addHeaderFooter = (pageNo) => {
    pdf.setFontSize(12);
    pdf.text(title, margin, margin + 5);
    pdf.setFontSize(9);
    if (periodLabel) pdf.text(`Period: ${periodLabel}`, pageWidth - margin, margin + 5, { align: 'right' });
    pdf.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };
  const pxToMm = (px, canvasWidthPx) => (px * contentWidth) / canvasWidthPx;
  const startY = margin + headerHeight;
  let currentY = startY;
  let currentPage = 1;
  addHeaderFooter(currentPage);
  const sectionSpacing = 4;

  // Trim pure white rows top/bottom with tolerance.
  const trimCanvas = (cv) => {
    const ctx = cv.getContext('2d');
    const { width, height } = cv;
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const isRowWhite = (y) => {
      const rowStart = y * width * 4;
      const rowEnd = rowStart + width * 4;
      for (let i = rowStart; i < rowEnd; i += 4) {
        const r = imgData[i], g = imgData[i+1], b = imgData[i+2], a = imgData[i+3];
        if (a > 10 && (r < 250 || g < 250 || b < 250)) return false;
      }
      return true;
    };
    let top = 0, bottom = height - 1;
    while (top < height && isRowWhite(top)) top++;
    while (bottom > top && isRowWhite(bottom)) bottom--;
    const newH = bottom - top + 1;
    if (newH >= height || newH <= 0) return cv;
    const trimmed = document.createElement('canvas');
    trimmed.width = width; trimmed.height = newH;
    trimmed.getContext('2d').drawImage(cv, 0, top, width, newH, 0, 0, width, newH);
    return trimmed;
  };

  for (const selector of sectionSelectors) {
    const el = container.querySelector(selector);
    if (!el) continue;
    // Apply temporary hiding of elements (e.g., non-pie charts) if configured
    let hiddenNodes = [];
    if (hideSelectorsDuringCapture && Array.isArray(hideSelectorsDuringCapture)) {
      hideSelectorsDuringCapture.forEach(sel => {
        el.querySelectorAll(sel).forEach(node => {
          hiddenNodes.push({ node, original: node.style.display });
          node.style.display = 'none';
        });
      });
    }
    if (beforeCapture) await beforeCapture(el);
    let canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    if (afterCapture) afterCapture(el);
    // Restore hidden nodes
    hiddenNodes.forEach(({ node, original }) => { node.style.display = original || ''; });
    canvas = trimCanvas(canvas);
    const fullHeightMm = pxToMm(canvas.height, canvas.width);
    if (fullHeightMm <= (pageHeight - margin - currentY)) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, fullHeightMm, undefined, 'FAST');
      currentY += fullHeightMm + sectionSpacing;
      continue;
    }
    if (fullHeightMm <= usableHeight) {
      if (currentY !== startY) {
        pdf.addPage(); currentPage++; addHeaderFooter(currentPage); currentY = startY;
      }
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, fullHeightMm, undefined, 'FAST');
      currentY += fullHeightMm + sectionSpacing;
      continue;
    }
    const sliceHeightPx = Math.floor((usableHeight * canvas.width) / contentWidth);
    let y = 0;
    while (y < canvas.height) {
      const remainingPx = canvas.height - y;
      const nextSlicePx = Math.min(sliceHeightPx, remainingPx);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width; sliceCanvas.height = nextSlicePx;
      sliceCanvas.getContext('2d').drawImage(canvas, 0, y, canvas.width, nextSlicePx, 0, 0, canvas.width, nextSlicePx);
      const sliceMm = pxToMm(nextSlicePx, canvas.width);
      if (currentY !== startY) { pdf.addPage(); currentPage++; addHeaderFooter(currentPage); currentY = startY; }
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, sliceMm, undefined, 'FAST');
      y += nextSlicePx;
      if (y < canvas.height) { pdf.addPage(); currentPage++; addHeaderFooter(currentPage); currentY = startY; } else { currentY += sliceMm + sectionSpacing; }
    }
  }
  const ts = new Date().toISOString().replace(/[:T]/g,'-').split('.')[0];
  pdf.save(`${title.replace(/\s+/g,'_')}_${ts}.pdf`);
}
