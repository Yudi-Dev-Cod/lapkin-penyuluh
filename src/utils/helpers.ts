import { format, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Report } from '../types';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getMonthName(month: number): string {
  return MONTHS_ID[month] || '';
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return DAYS_ID[date.getDay()];
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMMM yyyy', { locale: id });
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy');
}

export function getWeeklyStats(reports: Report[], month: number, year: number): { week: string; count: number }[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

  return weeks.map((weekStart, i) => {
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const count = reports.filter((r) => {
      const d = new Date(r.date);
      return isWithinInterval(d, { start: weekStart, end: wEnd > monthEnd ? monthEnd : wEnd });
    }).length;
    return { week: `Minggu ${i + 1}`, count };
  });
}

export function getMonthlyStats(reports: Report[], year: number): { month: string; count: number }[] {
  return MONTHS_ID.map((name, i) => {
    const count = reports.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === i && d.getFullYear() === year;
    }).length;
    return { month: name.substring(0, 3), count };
  });
}

export function getActivityTypeStats(reports: Report[]): { name: string; value: number }[] {
  const types: Record<string, number> = {};
  const keywords: Record<string, string[]> = {
    'Penyuluhan': ['penyuluhan', 'ceramah', 'dharma', 'dhamma', 'wejangan', 'kotbah'],
    'Pembinaan': ['pembinaan', 'bimbingan', 'konseling', 'pendampingan'],
    'Kegiatan Sosial': ['sosial', 'bakti', 'donor', 'bantuan', 'charity'],
    'Administrasi': ['administrasi', 'rapat', 'koordinasi', 'laporan', 'surat'],
    'Pelatihan': ['pelatihan', 'workshop', 'seminar', 'diklat', 'training'],
    'Keagamaan': ['puja', 'ibadah', 'kebaktian', 'meditasi', 'retret', 'waisak', 'kathina', 'magha'],
  };

  reports.forEach((r) => {
    const text = `${r.title} ${r.description}`.toLowerCase();
    let matched = false;
    for (const [type, kws] of Object.entries(keywords)) {
      if (kws.some((kw) => text.includes(kw))) {
        types[type] = (types[type] || 0) + 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      types['Lainnya'] = (types['Lainnya'] || 0) + 1;
    }
  });

  return Object.entries(types).map(([name, value]) => ({ name, value }));
}

export function getMostActiveMonth(reports: Report[], year: number): string {
  const counts = MONTHS_ID.map((name, i) => {
    const count = reports.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === i && d.getFullYear() === year;
    }).length;
    return { name, count };
  });
  const max = counts.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), counts[0]);
  return max.count > 0 ? max.name : '-';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

export function sanitizeInput(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
