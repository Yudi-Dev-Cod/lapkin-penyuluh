import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileDown, Calendar } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { useReportStore } from '../store/reportStore';
import { useSettingsStore } from '../store/settingsStore';
import { generateMonthlyPDF } from '../components/pdf/generatePDF';
import { getMonthName, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: getMonthName(i),
}));

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

export default function PrintMonthly() {
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const { getReportsByMonth } = useReportStore();
  const { profile, printSettings } = useSettingsStore();

  const [month, setMonth] = useState(String(new Date().getMonth()));
  const [year, setYear] = useState(String(currentYear));
  const [generating, setGenerating] = useState(false);

  const reports = useMemo(
    () => getReportsByMonth(parseInt(month), parseInt(year)),
    [month, year, getReportsByMonth]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateMonthlyPDF(reports, parseInt(month), parseInt(year), profile, printSettings);
      toast.success('PDF berhasil di-generate!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <TopBar
        title="Cetak Laporan Bulanan"
        subtitle="Generate laporan PDF resmi"
        onMenuClick={openSidebar}
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Period Selection */}
          <Card>
            <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-4">
              Pilih Periode Laporan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Select
                label="Bulan"
                options={MONTHS}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <Select
                label="Tahun"
                options={YEARS}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-tertiary dark:bg-dark-surface-tertiary">
              <Calendar size={18} className="text-gold shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  {getMonthName(parseInt(month))} {year}
                </p>
                <p className="text-xs text-text-muted dark:text-dark-text-muted">
                  {reports.length} kegiatan ditemukan
                </p>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                Preview Kegiatan
              </h3>
              <Button
                variant="gold"
                icon={<FileDown size={16} />}
                onClick={handleGenerate}
                loading={generating}
                disabled={reports.length === 0}
              >
                Generate PDF
              </Button>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                icon="file"
                title="Tidak ada kegiatan"
                description={`Belum ada kegiatan yang tercatat pada ${getMonthName(parseInt(month))} ${year}`}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-maroon">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-maroon">No</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-maroon">Hari/Tanggal</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-maroon">Kegiatan</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-maroon">Lokasi</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-maroon">Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, i) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 dark:border-dark-border/50"
                      >
                        <td className="px-3 py-3 text-sm text-text-muted">{i + 1}</td>
                        <td className="px-3 py-3 text-sm text-text-primary dark:text-dark-text-primary">
                          <div className="font-medium">{report.day}</div>
                          <div className="text-xs text-text-muted">{formatDate(report.date)}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-text-primary dark:text-dark-text-primary font-medium">
                          {report.title}
                        </td>
                        <td className="px-3 py-3 text-sm text-text-secondary dark:text-dark-text-secondary">
                          {report.location || '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-text-muted">{report.photoIds.length}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Info */}
          <Card>
            <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
              Informasi Cetak
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary">
                <span className="text-text-muted dark:text-dark-text-muted">Penyuluh</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">{profile.name}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary">
                <span className="text-text-muted dark:text-dark-text-muted">NIP</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">{profile.nip}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary">
                <span className="text-text-muted dark:text-dark-text-muted">Atasan</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">{printSettings.atasanName}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary">
                <span className="text-text-muted dark:text-dark-text-muted">Instansi</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">{profile.instansi}</span>
              </div>
            </div>
            <p className="text-xs text-text-muted dark:text-dark-text-muted mt-3">
              💡 Pastikan data profil dan pengaturan cetak sudah benar sebelum generate PDF.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
