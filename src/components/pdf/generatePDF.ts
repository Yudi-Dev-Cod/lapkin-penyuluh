import jsPDF from 'jspdf';
import type { Report, UserProfile, PrintSettings } from '../../types';
import { getMonthName, formatDateShort } from '../../utils/helpers';
import { getPhotosByReport } from '../../services/storage';

// Helper function to draw dynamic header bar
function drawDynamicSectionHeader(
  doc: jsPDF,
  title: string,
  type: 'document' | 'camera',
  xStart: number,
  yStart: number,
  contentWidth: number
) {
  const iconBoxWidth = 8;
  const titleBarWidth = contentWidth - iconBoxWidth;
  const paddingLeft = 4;
  const textWidth = titleBarWidth - paddingLeft - 4;
  const barHeightSpacing = 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const titleLines = doc.splitTextToSize(title, textWidth);
  const barHeight = Math.max(8, titleLines.length * 4.5 + 4);

  // Dark blue square
  doc.setFillColor(11, 46, 89);
  doc.rect(xStart, yStart, iconBoxWidth, barHeight, 'F');

  // Draw icon inside square
  doc.setDrawColor(255, 255, 255);
  const cx = xStart + iconBoxWidth / 2;
  const cy = yStart + barHeight / 2;

  if (type === 'document') {
    doc.setLineWidth(0.3);
    const ix = cx - 2;
    const iy = cy - 2.5;
    doc.line(ix, iy, ix + 2.5, iy);
    doc.line(ix + 2.5, iy, ix + 4, iy + 1.5);
    doc.line(ix + 4, iy + 1.5, ix + 4, iy + 5);
    doc.line(ix + 4, iy + 5, ix, iy + 5);
    doc.line(ix, iy + 5, ix, iy);
    doc.line(ix + 2.5, iy, ix + 2.5, iy + 1.5);
    doc.line(ix + 2.5, iy + 1.5, ix + 4, iy + 1.5);
    doc.setLineWidth(0.2);
    doc.line(ix + 1, iy + 2.5, ix + 3, iy + 2.5);
    doc.line(ix + 1, iy + 3.7, ix + 3, iy + 3.7);
  } else {
    doc.setLineWidth(0.3);
    doc.line(cx - 2.5, cy - 1.2, cx + 2.5, cy - 1.2);
    doc.line(cx + 2.5, cy - 1.2, cx + 2.5, cy + 1.8);
    doc.line(cx + 2.5, cy + 1.8, cx - 2.5, cy + 1.8);
    doc.line(cx - 2.5, cy + 1.8, cx - 2.5, cy - 1.2);
    doc.line(cx - 1, cy - 1.2, cx - 1, cy - 1.8);
    doc.line(cx - 1, cy - 1.8, cx + 0.2, cy - 1.8);
    doc.line(cx + 0.2, cy - 1.8, cx + 0.2, cy - 1.2);
    doc.circle(cx, cy + 0.3, 0.8);
  }

  // Light blue background bar
  doc.setFillColor(230, 240, 252);
  doc.rect(xStart + iconBoxWidth, yStart, titleBarWidth, barHeight, 'F');

  // Title text
  doc.setTextColor(11, 46, 89);
  const textHeight = titleLines.length * 4.5;
  const startTextY = yStart + (barHeight - textHeight) / 2 + 3;
  titleLines.forEach((line: string, idx: number) => {
    doc.text(line, xStart + iconBoxWidth + paddingLeft, startTextY + idx * 4.5);
  });

  return barHeight + barHeightSpacing;
}

// Helper function to draw a metadata table row
function drawTableRow(
  doc: jsPDF,
  label: string,
  lines: string[],
  rowHeight: number,
  xStart: number,
  yStart: number,
  col1Width: number,
  col2Width: number,
  contentWidth: number
) {
  // Fill left column (dark blue)
  doc.setFillColor(11, 46, 89);
  doc.rect(xStart, yStart, col1Width, rowHeight, 'F');

  // Fill right column (white)
  doc.setFillColor(255, 255, 255);
  doc.rect(xStart + col1Width, yStart, col2Width, rowHeight, 'F');

  // Outer border of row
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(xStart, yStart, contentWidth, rowHeight);

  // Divider line
  doc.line(xStart + col1Width, yStart, xStart + col1Width, yStart + rowHeight);

  // Print label (white bold)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(label, xStart + 4, yStart + rowHeight / 2 + 0.5, { baseline: 'middle' });

  // Print values (black normal)
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const textHeight = lines.length * 5.5;
  const startTextY = yStart + (rowHeight - textHeight) / 2 + 3.5;
  lines.forEach((line: string, idx: number) => {
    doc.text(line, xStart + col1Width + 4, startTextY + idx * 5.5);
  });
}

export async function generateMonthlyPDF(
  reports: Report[],
  month: number,
  year: number,
  profile: UserProfile,
  printSettings: PrintSettings
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== KOP SURAT =====
  if (printSettings.logo) {
    try {
      doc.addImage(printSettings.logo, 'AUTO', margin, y, 18, 18);
    } catch (e) {
      // logo not available
    }
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  printSettings.kopSurat.forEach((line, i) => {
    doc.setFontSize(i === 0 ? 13 : 11);
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    doc.text(line, pageWidth / 2, y + 4 + i * 6, { align: 'center' });
  });

  y += printSettings.kopSurat.length * 6 + 8;

  // Garis KOP
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
  y += 10;

  // ===== JUDUL =====
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KINERJA PENYULUH AGAMA BUDDHA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bulan ${getMonthName(month)} ${year}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // ===== ACTIVITIES (Replaces big summary table and photo index) =====
  for (let index = 0; index < sortedReports.length; index++) {
    const report = sortedReports[index];

    // Each activity starts on a new page, except the first one which starts on page 1.
    if (index > 0) {
      doc.addPage();
      y = margin;
    }

    const col1Width = 45;
    const col2Width = contentWidth - col1Width; // 125

    const titleText = report.title || '-';
    const titleLines = doc.splitTextToSize(titleText, col2Width - 8);
    const row1Height = Math.max(12, titleLines.length * 5.5 + 6.5);

    const locText = report.location || '-';
    const locLines = doc.splitTextToSize(locText, col2Width - 8);
    const row2Height = Math.max(12, locLines.length * 5.5 + 6.5);

    const dateText = report.day ? `${report.day}, ${formatDateShort(report.date)}` : formatDateShort(report.date);
    const dateLines = doc.splitTextToSize(dateText, col2Width - 8);
    const row3Height = Math.max(12, dateLines.length * 5.5 + 6.5);

    // Draw metadata table
    drawTableRow(doc, 'Judul Kegiatan', titleLines, row1Height, margin, y, col1Width, col2Width, contentWidth);
    y += row1Height;
    drawTableRow(doc, 'Lokasi Kegiatan', locLines, row2Height, margin, y, col1Width, col2Width, contentWidth);
    y += row2Height;
    drawTableRow(doc, 'Tanggal Kegiatan', dateLines, row3Height, margin, y, col1Width, col2Width, contentWidth);
    y += row3Height;

    y += 8;

    // ===== KETERANGAN / DESKRIPSI =====
    const descText = report.description || '-';
    const descLines = doc.splitTextToSize(descText, contentWidth - 8);
    const padding = 4;
    const lineGap = 5.5;
    const descBoxHeight = descLines.length * lineGap + padding * 2;
    const barHeight = 8;
    const spacing = 2;
    const totalDescHeight = barHeight + spacing + descBoxHeight;

    if (y + totalDescHeight > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }

    const drawnHeaderHeight = drawDynamicSectionHeader(doc, 'KETERANGAN / DESKRIPSI', 'document', margin, y, contentWidth);
    y += drawnHeaderHeight;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, descBoxHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    descLines.forEach((line: string, idx: number) => {
      doc.text(line, margin + padding, y + padding + 3.5 + idx * lineGap);
    });

    y += descBoxHeight;
    y += 8;

    // ===== DOKUMENTASI FOTO =====
    const photoData = await getPhotosByReport(report.id);
    if (photoData.length > 0) {
      const gapX = 5;
      const gapY = 5;
      const cardWidth = (contentWidth - 2 * gapX) / 3;
      const photoHeight = 36;
      const captionHeight = 8;
      const cardHeight = photoHeight + captionHeight;

      if (y + barHeight + spacing + cardHeight > pageHeight - 35) {
        doc.addPage();
        y = margin;
      }

      const drawnPhotoHeaderHeight = drawDynamicSectionHeader(doc, 'DOKUMENTASI KEGIATAN', 'camera', margin, y, contentWidth);
      y += drawnPhotoHeaderHeight;

      for (let i = 0; i < photoData.length; i += 3) {
        if (y + cardHeight > pageHeight - 35) {
          doc.addPage();
          y = margin;
        }

        for (let col = 0; col < 3; col++) {
          const idx = i + col;
          if (idx >= photoData.length) break;

          const x = margin + col * (cardWidth + gapX);

          // Card border
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.rect(x, y, cardWidth, cardHeight, 'FD');

          const imgPadding = 1.5;
          const imgW = cardWidth - imgPadding * 2;
          const imgH = photoHeight - imgPadding * 2;

          try {
            doc.addImage(photoData[idx].data, 'JPEG', x + imgPadding, y + imgPadding, imgW, imgH);
          } catch (e) {
            doc.setFillColor(240, 240, 240);
            doc.rect(x + imgPadding, y + imgPadding, imgW, imgH, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text('[Gambar tidak valid]', x + cardWidth / 2, y + photoHeight / 2, { align: 'center' });
          }

          const captionText = (photoData[idx].name && !photoData[idx].name.startsWith('photo_'))
            ? photoData[idx].name
            : 'Keterangan foto';
          const captionLines = doc.splitTextToSize(captionText, cardWidth - 4);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(80, 80, 80);
          captionLines.slice(0, 2).forEach((line: string, cIdx: number) => {
            doc.text(line, x + cardWidth / 2, y + photoHeight + 3.5 + cIdx * 3, { align: 'center' });
          });
        }

        y += cardHeight + gapY;
      }
    }
  }

  if (sortedReports.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tidak ada kegiatan pada bulan ini.', pageWidth / 2, y + 10, { align: 'center' });
    y += 20;
  }

  // ===== TANDA TANGAN =====
  if (y + 60 > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const now = new Date();
  const dateStr = `${now.getDate()} ${getMonthName(now.getMonth())} ${now.getFullYear()}`;

  // Left: Penyuluh
  const leftX = margin;
  doc.text('Penyuluh,', leftX, y);

  if (printSettings.signPenyuluh) {
    try {
      doc.addImage(printSettings.signPenyuluh, 'AUTO', leftX, y + 3, 30, 15);
    } catch (e) { }
  }

  const signY = y;
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, leftX, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${profile.nip}`, leftX, y);

  // Right: Atasan
  const rightX = pageWidth - margin - 55;
  let yRight = signY;
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', rightX, yRight);
  yRight += 4;
  doc.text('Atasan', rightX, yRight);

  if (printSettings.signAtasan) {
    try {
      doc.addImage(printSettings.signAtasan, 'AUTO', rightX, yRight + 2, 30, 15);
    } catch (e) { }
  }

  yRight += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(printSettings.atasanName, rightX, yRight);
  yRight += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${printSettings.atasanNip}`, rightX, yRight);

  // ===== FOOTER on every page =====
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dicetak otomatis pada ${dateStr} - LAPKIN Penyuluh Agama Buddha | Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save
  const filename = `Laporan_Kinerja_${getMonthName(month)}_${year}.pdf`;
  doc.save(filename);
}

export async function generateSinglePDF(
  report: Report,
  _profile: UserProfile,
  printSettings: PrintSettings
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== KOP SURAT =====
  if (printSettings.logo) {
    try {
      doc.addImage(printSettings.logo, 'AUTO', margin, y, 18, 18);
    } catch (e) { }
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  printSettings.kopSurat.forEach((line, i) => {
    doc.setFontSize(i === 0 ? 13 : 11);
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    doc.text(line, pageWidth / 2, y + 4 + i * 6, { align: 'center' });
  });
  y += printSettings.kopSurat.length * 6 + 8;
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
  y += 10;

  // ===== METADATA TABLE =====
  const col1Width = 45;
  const col2Width = contentWidth - col1Width; // 125

  const titleText = report.title || '-';
  const titleLines = doc.splitTextToSize(titleText, col2Width - 8);
  const row1Height = Math.max(12, titleLines.length * 5.5 + 6.5);

  const locText = report.location || '-';
  const locLines = doc.splitTextToSize(locText, col2Width - 8);
  const row2Height = Math.max(12, locLines.length * 5.5 + 6.5);

  const dateText = report.day ? `${report.day}, ${formatDateShort(report.date)}` : formatDateShort(report.date);
  const dateLines = doc.splitTextToSize(dateText, col2Width - 8);
  const row3Height = Math.max(12, dateLines.length * 5.5 + 6.5);

  drawTableRow(doc, 'Judul Kegiatan', titleLines, row1Height, margin, y, col1Width, col2Width, contentWidth);
  y += row1Height;
  drawTableRow(doc, 'Lokasi Kegiatan', locLines, row2Height, margin, y, col1Width, col2Width, contentWidth);
  y += row2Height;
  drawTableRow(doc, 'Tanggal Kegiatan', dateLines, row3Height, margin, y, col1Width, col2Width, contentWidth);
  y += row3Height;

  y += 8;

  // ===== KETERANGAN / DESKRIPSI =====
  const descText = report.description || '-';
  const descLines = doc.splitTextToSize(descText, contentWidth - 8);
  const padding = 4;
  const lineGap = 5.5;
  const descBoxHeight = descLines.length * lineGap + padding * 2;
  const barHeight = 8;
  const spacing = 2;
  const totalDescHeight = barHeight + spacing + descBoxHeight;

  if (y + totalDescHeight > pageHeight - 35) {
    doc.addPage();
    y = margin;
  }

  // Draw header using our helper
  const drawnHeaderHeight = drawDynamicSectionHeader(doc, 'KETERANGAN / DESKRIPSI', 'document', margin, y, contentWidth);
  y += drawnHeaderHeight;

  // Draw description box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, descBoxHeight, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  descLines.forEach((line: string, idx: number) => {
    doc.text(line, margin + padding, y + padding + 3.5 + idx * lineGap);
  });

  y += descBoxHeight;
  y += 8;

  // ===== DOKUMENTASI FOTO =====
  const photoData = await getPhotosByReport(report.id);
  if (photoData.length > 0) {
    const gapX = 5;
    const gapY = 5;
    const cardWidth = (contentWidth - 2 * gapX) / 3;
    const photoHeight = 36;
    const captionHeight = 8;
    const cardHeight = photoHeight + captionHeight;

    if (y + barHeight + spacing + cardHeight > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }

    // Draw header using helper
    const drawnPhotoHeaderHeight = drawDynamicSectionHeader(doc, 'DOKUMENTASI KEGIATAN', 'camera', margin, y, contentWidth);
    y += drawnPhotoHeaderHeight;

    for (let i = 0; i < photoData.length; i += 3) {
      if (y + cardHeight > pageHeight - 35) {
        doc.addPage();
        y = margin;
      }

      for (let col = 0; col < 3; col++) {
        const idx = i + col;
        if (idx >= photoData.length) break;

        const x = margin + col * (cardWidth + gapX);

        // Draw Card border
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(0.3);
        doc.rect(x, y, cardWidth, cardHeight, 'FD');

        const imgPadding = 1.5;
        const imgW = cardWidth - imgPadding * 2;
        const imgH = photoHeight - imgPadding * 2;

        try {
          doc.addImage(
            photoData[idx].data,
            'JPEG',
            x + imgPadding,
            y + imgPadding,
            imgW,
            imgH
          );
        } catch (e) {
          doc.setFillColor(240, 240, 240);
          doc.rect(x + imgPadding, y + imgPadding, imgW, imgH, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text('[Gambar tidak valid]', x + cardWidth / 2, y + photoHeight / 2, { align: 'center' });
        }

        const captionText = (photoData[idx].name && !photoData[idx].name.startsWith('photo_'))
          ? photoData[idx].name
          : 'Keterangan foto';
        const captionLines = doc.splitTextToSize(captionText, cardWidth - 4);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        captionLines.slice(0, 2).forEach((line: string, cIdx: number) => {
          doc.text(line, x + cardWidth / 2, y + photoHeight + 3.5 + cIdx * 3, { align: 'center' });
        });
      }

      y += cardHeight + gapY;
    }
  }

  // Footer on all pages
  const now = new Date();
  const dateStr = `${now.getDate()} ${getMonthName(now.getMonth())} ${now.getFullYear()}`;
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dicetak otomatis pada ${dateStr} - LAPKIN Penyuluh Agama Buddha | Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  const filename = `Laporan_${report.title.replace(/\s+/g, '_').substring(0, 30)}.pdf`;
  doc.save(filename);
}

export async function generateMonthlyTablePDF(
  reports: Report[],
  month: number,
  year: number,
  profile: UserProfile,
  printSettings: PrintSettings
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== KOP SURAT =====
  if (printSettings.logo) {
    try {
      doc.addImage(printSettings.logo, 'AUTO', margin, y, 18, 18);
    } catch (e) { }
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  printSettings.kopSurat.forEach((line, i) => {
    doc.setFontSize(i === 0 ? 13 : 11);
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    doc.text(line, pageWidth / 2, y + 4 + i * 6, { align: 'center' });
  });

  y += printSettings.kopSurat.length * 6 + 8;

  // Garis KOP
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
  y += 10;

  // ===== JUDUL =====
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KINERJA PENYULUH AGAMA BUDDHA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bulan ${getMonthName(month)} ${year}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // ===== TABEL KEGIATAN =====
  const tableHeaders = ['No', 'Hari/Tanggal', 'Nama Kegiatan', 'Lokasi', 'Jumlah Foto'];
  const colWidths = [10, 35, 65, 40, 20];
  const startX = margin;

  // Draw header row
  doc.setFillColor(11, 46, 89);
  doc.rect(startX, y, contentWidth, 8, 'F');

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  let currentX = startX;
  tableHeaders.forEach((header, idx) => {
    const align = idx === 0 || idx === 4 ? 'center' : 'left';
    const textX = align === 'center' ? currentX + colWidths[idx] / 2 : currentX + 3;
    doc.text(header, textX, y + 5.5, { align });
    currentX += colWidths[idx];
  });

  y += 8;

  sortedReports.forEach((report, i) => {
    const dayDateText = report.day ? `${report.day}\n${formatDateShort(report.date)}` : formatDateShort(report.date);
    const dateLines = doc.splitTextToSize(dayDateText, colWidths[1] - 6);

    const titleLines = doc.splitTextToSize(report.title || '-', colWidths[2] - 6);
    const locLines = doc.splitTextToSize(report.location || '-', colWidths[3] - 6);

    const maxLines = Math.max(dateLines.length, titleLines.length, locLines.length, 1);
    const rowHeight = maxLines * 5 + 5;

    // Check page break
    if (y + rowHeight > pageHeight - 35) {
      doc.addPage();
      y = margin;

      // Draw header row on new page
      doc.setFillColor(11, 46, 89);
      doc.rect(startX, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      let pageX = startX;
      tableHeaders.forEach((header, idx) => {
        const align = idx === 0 || idx === 4 ? 'center' : 'left';
        const textX = align === 'center' ? pageX + colWidths[idx] / 2 : pageX + 3;
        doc.text(header, textX, y + 5.5, { align });
        pageX += colWidths[idx];
      });
      y += 8;
    }

    doc.setFillColor(255, 255, 255);
    doc.rect(startX, y, contentWidth, rowHeight, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    // Col 0: No
    doc.text(String(i + 1), startX + colWidths[0] / 2, y + rowHeight / 2 + 1, { align: 'center' });

    // Col 1: Date
    let lineY = y + (rowHeight - dateLines.length * 5) / 2 + 3.5;
    dateLines.forEach((line: string) => {
      doc.text(line, startX + colWidths[0] + 3, lineY);
      lineY += 5;
    });

    // Col 2: Title
    lineY = y + (rowHeight - titleLines.length * 5) / 2 + 3.5;
    titleLines.forEach((line: string) => {
      doc.text(line, startX + colWidths[0] + colWidths[1] + 3, lineY);
      lineY += 5;
    });

    // Col 3: Location
    lineY = y + (rowHeight - locLines.length * 5) / 2 + 3.5;
    locLines.forEach((line: string) => {
      doc.text(line, startX + colWidths[0] + colWidths[1] + colWidths[2] + 3, lineY);
      lineY += 5;
    });

    // Col 4: Photo count
    const photoCount = String(report.photoIds.length);
    doc.text(photoCount, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, y + rowHeight / 2 + 1, { align: 'center' });

    // Cell borders
    let cellX = startX;
    colWidths.forEach((w) => {
      doc.rect(cellX, y, w, rowHeight);
      cellX += w;
    });

    y += rowHeight;
  });

  if (sortedReports.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tidak ada kegiatan pada bulan ini.', pageWidth / 2, y + 10, { align: 'center' });
    y += 20;
  }

  // ===== TANDA TANGAN =====
  if (y + 60 > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const now = new Date();
  const dateStr = `${now.getDate()} ${getMonthName(now.getMonth())} ${now.getFullYear()}`;

  // Left: Penyuluh
  const leftX = margin;
  doc.text('Penyuluh,', leftX, y);

  if (printSettings.signPenyuluh) {
    try {
      doc.addImage(printSettings.signPenyuluh, 'AUTO', leftX, y + 3, 30, 15);
    } catch (e) { }
  }

  const signY = y;
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, leftX, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${profile.nip}`, leftX, y);

  // Right: Atasan
  const rightX = pageWidth - margin - 55;
  let yRight = signY;
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', rightX, yRight);
  yRight += 4;
  doc.text('Atasan', rightX, yRight);

  if (printSettings.signAtasan) {
    try {
      doc.addImage(printSettings.signAtasan, 'AUTO', rightX, yRight + 2, 30, 15);
    } catch (e) { }
  }

  yRight += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(printSettings.atasanName, rightX, yRight);
  yRight += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${printSettings.atasanNip}`, rightX, yRight);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dicetak otomatis pada ${dateStr} - LAPKIN Penyuluh Agama Buddha | Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  const filename = `Tabel_Kegiatan_${getMonthName(month)}_${year}.pdf`;
  doc.save(filename);
}

