import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Printer, Cog, Save, Upload, Download, Moon, Sun,
  Trash2, Image, Plus, X, Lock, Eye, EyeOff, Camera
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useReportStore } from '../store/reportStore';
import { clearAllPhotos, getAllPhotos, savePhoto } from '../services/storage';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const tabs = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'print', label: 'Cetak', icon: Printer },
  { id: 'system', label: 'Sistem', icon: Cog },
];

export default function Settings() {
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const settings = useSettingsStore();
  const authStore = useAuthStore();
  const reportStore = useReportStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [showReset, setShowReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileForm, setProfileForm] = useState(settings.profile);
  const [printForm, setPrintForm] = useState(settings.printSettings);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleAvatarUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 400,
          useWebWorker: true,
        });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setProfileForm((prev) => ({ ...prev, avatar: base64 }));
        };
        reader.readAsDataURL(compressed);
      } catch {
        toast.error('Gagal memproses gambar');
      }
    };
    input.click();
  };

  const handleSaveProfile = () => {
    settings.updateProfile(profileForm);
    toast.success('Profil berhasil disimpan');
  };

  const handleSavePrint = () => {
    settings.updatePrintSettings(printForm);
    toast.success('Pengaturan cetak berhasil disimpan');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setChangingPw(true);
    setTimeout(() => {
      const success = authStore.changePassword(currentPassword, newPassword);
      if (success) {
        toast.success('Password berhasil diubah');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Password saat ini salah');
      }
      setChangingPw(false);
    }, 500);
  };

  const handleImageUpload = (field: 'signAtasan' | 'signPenyuluh' | 'logo') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPrintForm((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleBackup = async () => {
    const photos = await getAllPhotos();
    const data = {
      settings: {
        profile: settings.profile,
        printSettings: settings.printSettings,
        darkMode: settings.darkMode,
      },
      reports: reportStore.reports,
      photos: photos,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lapkin_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup berhasil diunduh');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.settings) {
          settings.importData(JSON.stringify(data.settings));
          setProfileForm(data.settings.profile || settings.profile);
          setPrintForm(data.settings.printSettings || settings.printSettings);
        }
        if (data.photos && Array.isArray(data.photos)) {
          await clearAllPhotos();
          for (const photo of data.photos) {
            await savePhoto(photo);
          }
        }
        if (data.reports && Array.isArray(data.reports)) {
          localStorage.setItem('lapkin-reports', JSON.stringify({ state: { reports: data.reports }, version: 0 }));
          window.location.reload();
        }
        toast.success('Data berhasil dipulihkan');
      } catch {
        toast.error('File backup tidak valid');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    settings.resetSettings();
    localStorage.removeItem('lapkin-reports');
    localStorage.removeItem('lapkin-draft');
    await clearAllPhotos();
    toast.success('Aplikasi berhasil direset');
    setShowReset(false);
    window.location.reload();
  };

  const updateKop = (index: number, value: string) => {
    const kopSurat = [...printForm.kopSurat];
    kopSurat[index] = value;
    setPrintForm((prev) => ({ ...prev, kopSurat }));
  };

  const addKopLine = () => {
    setPrintForm((prev) => ({ ...prev, kopSurat: [...prev.kopSurat, ''] }));
  };

  const removeKopLine = (index: number) => {
    setPrintForm((prev) => ({
      ...prev,
      kopSurat: prev.kopSurat.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      <TopBar
        title="Pengaturan"
        subtitle="Kelola profil dan konfigurasi"
        onMenuClick={openSidebar}
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface-tertiary dark:bg-dark-surface-tertiary rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-surface dark:bg-dark-surface-secondary text-gold shadow-sm'
                    : 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Avatar Upload */}
                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
                    Foto Profil
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      {profileForm.avatar ? (
                        <img
                          src={profileForm.avatar}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover border-4 border-gold/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full gradient-maroon flex items-center justify-center text-white text-3xl font-bold border-4 border-maroon/20">
                          {profileForm.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAvatarUpload}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center shadow-lg hover:bg-gold-dark transition-colors"
                      >
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                        Upload foto profil
                      </p>
                      <p className="text-xs text-text-muted dark:text-dark-text-muted mb-3">
                        JPG, PNG, maks 200KB. Otomatis dikompres.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleAvatarUpload}>
                          Pilih Foto
                        </Button>
                        {profileForm.avatar && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProfileForm((prev) => ({ ...prev, avatar: '' }))}
                            className="text-red-500"
                          >
                            Hapus
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Profile Form */}
                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
                    Profil Penyuluh
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Nama Lengkap"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="NIP"
                        value={profileForm.nip}
                        onChange={(e) => setProfileForm({ ...profileForm, nip: e.target.value })}
                      />
                      <Input
                        label="Jabatan"
                        value={profileForm.jabatan}
                        onChange={(e) => setProfileForm({ ...profileForm, jabatan: e.target.value })}
                      />
                    </div>
                    <Input
                      label="Instansi"
                      value={profileForm.instansi}
                      onChange={(e) => setProfileForm({ ...profileForm, instansi: e.target.value })}
                    />
                    <Input
                      label="Alamat"
                      value={profileForm.alamat}
                      onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                    />
                    <Input
                      label="Nomor HP"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button variant="gold" icon={<Save size={16} />} onClick={handleSaveProfile}>
                      Simpan Profil
                    </Button>
                  </div>
                </Card>

                {/* Change Password */}
                <Card>
                  <div className="flex items-center gap-2 mb-5">
                    <Lock size={18} className="text-maroon" />
                    <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                      Ganti Password
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        label="Password Saat Ini"
                        type={showCurrentPw ? 'text' : 'password'}
                        placeholder="Masukkan password saat ini"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        icon={<Lock size={14} />}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        label="Password Baru"
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        icon={<Lock size={14} />}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Input
                      label="Konfirmasi Password Baru"
                      type="password"
                      placeholder="Ketik ulang password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<Lock size={14} />}
                    />
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button
                      variant="primary"
                      icon={<Lock size={16} />}
                      onClick={handleChangePassword}
                      loading={changingPw}
                    >
                      Ganti Password
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Print Tab */}
            {activeTab === 'print' && (
              <motion.div
                key="print"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
                    Pengaturan Atasan
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Nama Atasan"
                      value={printForm.atasanName}
                      onChange={(e) => setPrintForm({ ...printForm, atasanName: e.target.value })}
                    />
                    <Input
                      label="NIP Atasan"
                      value={printForm.atasanNip}
                      onChange={(e) => setPrintForm({ ...printForm, atasanNip: e.target.value })}
                    />
                  </div>
                </Card>

                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
                    Tanda Tangan & Logo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { key: 'signPenyuluh' as const, label: 'TTD Penyuluh' },
                      { key: 'signAtasan' as const, label: 'TTD Atasan' },
                      { key: 'logo' as const, label: 'Logo Instansi' },
                    ].map(({ key, label }) => (
                      <div key={key} className="text-center space-y-2">
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{label}</p>
                        <div
                          onClick={() => handleImageUpload(key)}
                          className="border-2 border-dashed border-border dark:border-dark-border rounded-xl h-28 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
                        >
                          {printForm[key] ? (
                            <img src={printForm[key]} alt={label} className="max-h-full max-w-full object-contain p-2" />
                          ) : (
                            <div className="text-center">
                              <Image size={24} className="mx-auto mb-1 text-text-muted" />
                              <p className="text-xs text-text-muted">Upload</p>
                            </div>
                          )}
                        </div>
                        {printForm[key] && (
                          <button
                            onClick={() => setPrintForm({ ...printForm, [key]: '' })}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                      KOP Surat
                    </h3>
                    <button
                      onClick={addKopLine}
                      className="text-xs text-gold flex items-center gap-1 hover:text-gold-dark"
                    >
                      <Plus size={14} /> Tambah Baris
                    </button>
                  </div>
                  <div className="space-y-2">
                    {printForm.kopSurat.map((line, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          value={line}
                          onChange={(e) => updateKop(i, e.target.value)}
                          placeholder={`Baris ${i + 1}`}
                          className="flex-1"
                        />
                        {printForm.kopSurat.length > 1 && (
                          <button
                            onClick={() => removeKopLine(i)}
                            className="p-2 text-red-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button variant="gold" icon={<Save size={16} />} onClick={handleSavePrint}>
                    Simpan Pengaturan Cetak
                  </Button>
                </div>
              </motion.div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
                    Tampilan
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-tertiary dark:bg-dark-surface-tertiary">
                    <div className="flex items-center gap-3">
                      {settings.darkMode ? <Moon size={18} className="text-gold" /> : <Sun size={18} className="text-gold" />}
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                          Mode Gelap
                        </p>
                        <p className="text-xs text-text-muted dark:text-dark-text-muted">
                          {settings.darkMode ? 'Aktif' : 'Nonaktif'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={settings.toggleDarkMode}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                        settings.darkMode ? 'bg-gold' : 'bg-gray-300 dark:bg-dark-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                          settings.darkMode ? 'left-[26px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
                    Backup & Restore
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        icon={<Download size={16} />}
                        onClick={handleBackup}
                        className="flex-1"
                      >
                        Backup Data (JSON)
                      </Button>
                      <Button
                        variant="outline"
                        icon={<Upload size={16} />}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        Restore Data
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleRestore}
                      />
                    </div>
                    <p className="text-xs text-text-muted dark:text-dark-text-muted">
                      💡 Backup mencakup semua data laporan, pengaturan, dan foto.
                    </p>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                    Reset Aplikasi
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                    Menghapus semua data laporan, foto, dan pengaturan. Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setShowReset(true)}>
                    Reset Semua Data
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={handleReset}
        title="Reset Aplikasi"
        message="Semua data akan dihapus permanen termasuk laporan, foto, dan pengaturan. Apakah Anda yakin?"
        confirmText="Ya, Reset"
      />
    </>
  );
}
