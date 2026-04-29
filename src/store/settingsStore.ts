import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, UserProfile, PrintSettings } from '../types';

const defaultProfile: UserProfile = {
  name: 'Nama Penyuluh',
  nip: '199000001234567890',
  jabatan: 'Penyuluh Agama Buddha',
  instansi: 'Kantor Kementerian Agama',
  alamat: '',
  phone: '',
  avatar: '',
};

const defaultPrintSettings: PrintSettings = {
  atasanName: 'Nama Atasan',
  atasanNip: '196500001234567890',
  signAtasan: '',
  signPenyuluh: '',
  logo: '',
  kopSurat: [
    'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    'KANTOR KEMENTERIAN AGAMA',
    'KABUPATEN/KOTA',
  ],
};

interface SettingsStore extends AppSettings {
  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePrintSettings: (settings: Partial<PrintSettings>) => void;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  resetSettings: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      darkMode: false,
      profile: { ...defaultProfile },
      printSettings: { ...defaultPrintSettings },
      updateProfile: (profile) => {
        set((state) => ({
          profile: { ...state.profile, ...profile },
        }));
      },
      updatePrintSettings: (settings) => {
        set((state) => ({
          printSettings: { ...state.printSettings, ...settings },
        }));
      },
      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.darkMode;
          if (newMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newMode };
        });
      },
      setDarkMode: (value) => {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: value });
      },
      resetSettings: () => {
        set({
          darkMode: false,
          profile: { ...defaultProfile },
          printSettings: { ...defaultPrintSettings },
        });
        document.documentElement.classList.remove('dark');
      },
      exportData: () => {
        const state = get();
        return JSON.stringify({
          profile: state.profile,
          printSettings: state.printSettings,
          darkMode: state.darkMode,
        }, null, 2);
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.profile) set({ profile: data.profile });
          if (data.printSettings) set({ printSettings: data.printSettings });
          if (typeof data.darkMode === 'boolean') {
            set({ darkMode: data.darkMode });
            if (data.darkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'lapkin-settings',
    }
  )
);
