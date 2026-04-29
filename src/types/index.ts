export interface Report {
  id: string;
  title: string;
  date: string; // ISO date string
  day: string;
  location: string;
  description: string;
  photoIds: string[]; // References to IndexedDB stored photos
  createdAt: string;
  updatedAt: string;
}

export interface PhotoData {
  id: string;
  reportId: string;
  data: string; // base64 data URL
  name: string;
  size: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  nip: string;
  jabatan: string;
  instansi: string;
  alamat: string;
  phone: string;
  avatar: string; // base64 image
}

export interface PrintSettings {
  atasanName: string;
  atasanNip: string;
  signAtasan: string; // base64 image
  signPenyuluh: string; // base64 image
  logo: string; // base64 image
  kopSurat: string[];
}

export interface AppSettings {
  darkMode: boolean;
  profile: UserProfile;
  printSettings: PrintSettings;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
  rememberMe: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface ReportFilter {
  search: string;
  month: number | null; // 0-11
  year: number | null;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}

export interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}
