import jsPDF from 'jspdf';
import type { Report, UserProfile, PrintSettings } from '../../types';
import { getMonthName, getDayName, formatDateShort } from '../../utils/helpers';
import { getPhotosByReport } from '../../services/storage';

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

  // ===== IDENTITAS =====
  doc.setFontSize(10);
  const identitas = [
    ['Nama', profile.name],
    ['NIP', profile.nip],
    ['Jabatan', profile.jabatan],
    ['Instansi', profile.instansi],
  ];

  identitas.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}`, margin, y);
    doc.text(`: ${value}`, margin + 30, y);
    y += 5;
  });
  y += 5;

  // ===== TABEL =====
  const headers = ['No', 'Hari/Tanggal', 'Nama Kegiatan', 'Lokasi', 'Deskripsi', 'Foto'];
  const colWidths = [10, 28, 38, 28, 45, 14];
  const headerRowHeight = 10;

  // Header tabel
  doc.setFillColor(128, 0, 0);
  doc.rect(margin, y, contentWidth, headerRowHeight, 'F');
  
  // Draw header borders
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  let headerX = margin;
  for (let i = 0; i < colWidths.length - 1; i++) {
    headerX += colWidths[i];
    doc.line(headerX, y, headerX, y + headerRowHeight);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  let xPos = margin;
  headers.forEach((h, i) => {
    doc.text(h, xPos + 2, y + 6.5);
    xPos += colWidths[i];
  });
  doc.setTextColor(0, 0, 0);
  y += headerRowHeight;

  // Pre-fetch all photos for all reports
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  const minRowHeight = 8;

  for (let index = 0; index < sortedReports.length; index++) {
    const report = sortedReports[index];
    
    // Split text for dynamic height calculation
    const titleLines = doc.splitTextToSize(report.title, colWidths[2] - 3);
    const locLines = doc.splitTextToSize(report.location || '-', colWidths[3] - 3);
    const descLines = doc.splitTextToSize(report.description, colWidths[4] - 3);
    
    const maxLines = Math.max(titleLines.length, locLines.length, descLines.length, 1);
    const rowHeight = Math.max(minRowHeight, maxLines * 4 + 4);

    // Check page break
    if (y + rowHeight > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    // Draw cell border (outer)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowHeight);

    // Draw vertical cell borders (inner)
    let innerX = margin;
    for (let i = 0; i < colWidths.length - 1; i++) {
      innerX += colWidths[i];
      doc.line(innerX, y, innerX, y + rowHeight);
    }

    // Text columns
    let textX = margin;
    const textData = [
      String(index + 1),
      `${getDayName(report.date)}, ${formatDateShort(report.date)}`,
      titleLines,
      locLines,
      descLines,
      `${report.photoIds.length} Terlampir`,
    ];

    textData.forEach((text, i) => {
      // align slightly from top
      doc.text(text, textX + 2, y + 5.5);
      textX += colWidths[i];
    });

    y += rowHeight;
  }

  if (sortedReports.length === 0) {
    doc.setFontSize(9);
    doc.text('Tidak ada kegiatan pada bulan ini.', pageWidth / 2, y + 10, { align: 'center' });
    y += 20;
  }

  // ===== DOKUMENTASI FOTO =====
  // Fetch all photos for all reports
  const reportsWithPhotos: { report: Report; photos: string[] }[] = [];
  for (const report of sortedReports) {
    if (report.photoIds.length > 0) {
      const photoData = await getPhotosByReport(report.id);
      if (photoData.length > 0) {
        reportsWithPhotos.push({
          report,
          photos: photoData.map((p) => p.data),
        });
      }
    }
  }

  if (reportsWithPhotos.length > 0) {
    // Start photos on new page
    doc.addPage();
    y = margin;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DOKUMENTASI FOTO KEGIATAN', pageWidth / 2, y, { align: 'center' });
    y += 10;

    const photoWidth = 75; // mm
    const photoHeight = 55; // mm
    const gapX = 10;
    const gapY = 8;
    const captionHeight = 12;

    for (const { report, photos } of reportsWithPhotos) {
      // Section title for each report
      if (y + 15 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 0);
      doc.text(
        `${getDayName(report.date)}, ${formatDateShort(report.date)} — ${report.title}`,
        margin,
        y
      );
      doc.setTextColor(0, 0, 0);
      y += 6;

      // Render photos 2 per row
      for (let i = 0; i < photos.length; i += 2) {
        const neededHeight = photoHeight + captionHeight + gapY;
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Left photo
        try {
          doc.addImage(photos[i], 'AUTO', margin, y, photoWidth, photoHeight);
          // Border
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, y, photoWidth, photoHeight);
          // Caption
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(`Foto ${i + 1}`, margin + photoWidth / 2, y + photoHeight + 4, { align: 'center' });
        } catch (e) {
          doc.setFontSize(7);
          doc.text(`[Foto ${i + 1} tidak dapat dimuat]`, margin, y + photoHeight / 2);
        }

        // Right photo (if exists)
        if (i + 1 < photos.length) {
          const rightX = margin + photoWidth + gapX;
          try {
            doc.addImage(photos[i + 1], 'AUTO', rightX, y, photoWidth, photoHeight);
            doc.setDrawColor(200, 200, 200);
            doc.rect(rightX, y, photoWidth, photoHeight);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`Foto ${i + 2}`, rightX + photoWidth / 2, y + photoHeight + 4, { align: 'center' });
          } catch (e) {
            doc.setFontSize(7);
            doc.text(`[Foto ${i + 2} tidak dapat dimuat]`, rightX, y + photoHeight / 2);
          }
        }

        y += photoHeight + captionHeight + gapY;
      }

      y += 4; // Extra spacing between reports
    }
  }

  // ===== TANDA TANGAN (on new page or after photos) =====
  // Check if enough space, otherwise new page
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
    } catch (e) {}
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
    } catch (e) {}
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
  profile: UserProfile,
  printSettings: PrintSettings
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // KOP
  if (printSettings.logo) {
    try {
      doc.addImage(printSettings.logo, 'AUTO', margin, y, 18, 18);
    } catch (e) {}
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

  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KEGIATAN', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const details = [
    ['Nama Kegiatan', report.title],
    ['Hari', report.day],
    ['Tanggal', formatDateShort(report.date)],
    ['Lokasi', report.location || '-'],
    ['Penyuluh', profile.name],
    ['Jumlah Foto', String(report.photoIds.length)],
  ];

  details.forEach(([label, value]) => {
    doc.text(`${label}`, margin, y);
    doc.text(`: ${value}`, margin + 35, y);
    y += 6;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Deskripsi:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(report.description || '-', pageWidth - margin * 2);
  doc.text(descLines, margin, y);
  y += descLines.length * 4 + 5;

  // ===== FOTO KEGIATAN =====
  if (report.photoIds.length > 0) {
    const photoData = await getPhotosByReport(report.id);

    if (photoData.length > 0) {
      // Check space or new page
      if (y + 20 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Dokumentasi Foto:', margin, y);
      y += 8;

      const photoWidth = 75;
      const photoHeight = 55;
      const gapX = 10;
      const captionHeight = 10;
      const gapY = 6;

      for (let i = 0; i < photoData.length; i += 2) {
        const neededHeight = photoHeight + captionHeight + gapY;
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Left photo
        try {
          doc.addImage(photoData[i].data, 'AUTO', margin, y, photoWidth, photoHeight);
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, y, photoWidth, photoHeight);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(`Foto ${i + 1}`, margin + photoWidth / 2, y + photoHeight + 4, { align: 'center' });
        } catch (e) {
          doc.setFontSize(7);
          doc.text(`[Foto ${i + 1} tidak dapat dimuat]`, margin, y + photoHeight / 2);
        }

        // Right photo
        if (i + 1 < photoData.length) {
          const rightX = margin + photoWidth + gapX;
          try {
            doc.addImage(photoData[i + 1].data, 'AUTO', rightX, y, photoWidth, photoHeight);
            doc.setDrawColor(200, 200, 200);
            doc.rect(rightX, y, photoWidth, photoHeight);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`Foto ${i + 2}`, rightX + photoWidth / 2, y + photoHeight + 4, { align: 'center' });
          } catch (e) {
            doc.setFontSize(7);
            doc.text(`[Foto ${i + 2} tidak dapat dimuat]`, rightX, y + photoHeight / 2);
          }
        }

        y += photoHeight + captionHeight + gapY;
      }
    }
  }

  // Footer
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
