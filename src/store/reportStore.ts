import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Report } from '../types';
import { generateId, deletePhotosByReport } from '../services/storage';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return DAYS_ID[date.getDay()];
}

interface ReportStore {
  reports: Report[];
  addReport: (data: Omit<Report, 'id' | 'day' | 'createdAt' | 'updatedAt'>) => string;
  updateReport: (id: string, data: Partial<Omit<Report, 'id' | 'day' | 'createdAt' | 'updatedAt'>>) => void;
  deleteReport: (id: string) => Promise<void>;
  getReport: (id: string) => Report | undefined;
  getReportsByMonth: (month: number, year: number) => Report[];
  getFilteredReports: (search: string, month: number | null, year: number | null) => Report[];
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: [],
      addReport: (data) => {
        const newId = generateId();
        const day = getDayName(data.date);
        const now = new Date().toISOString();
        const newReport: Report = {
          ...data,
          id: newId,
          day,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ reports: [newReport, ...state.reports] }));
        return newId;
      },
      updateReport: (id, data) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== id) return r;
            const updated = { ...r, ...data, updatedAt: new Date().toISOString() };
            if (data.date) {
              updated.day = getDayName(data.date);
            }
            return updated;
          }),
        }));
      },
      deleteReport: async (id) => {
        await deletePhotosByReport(id);
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }));
      },
      getReport: (id) => {
        return get().reports.find((r) => r.id === id);
      },
      getReportsByMonth: (month, year) => {
        return get().reports.filter((r) => {
          const d = new Date(r.date);
          return d.getMonth() === month && d.getFullYear() === year;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },
      getFilteredReports: (search, month, year) => {
        let filtered = [...get().reports];
        if (search) {
          const lower = search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.title.toLowerCase().includes(lower) ||
              r.description.toLowerCase().includes(lower) ||
              r.location.toLowerCase().includes(lower)
          );
        }
        if (month !== null && year !== null) {
          filtered = filtered.filter((r) => {
            const d = new Date(r.date);
            return d.getMonth() === month && d.getFullYear() === year;
          });
        } else if (year !== null) {
          filtered = filtered.filter((r) => {
            const d = new Date(r.date);
            return d.getFullYear() === year;
          });
        }
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
    }),
    {
      name: 'lapkin-reports',
    }
  )
);
