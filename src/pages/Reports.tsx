import { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Edit3, Eye, Calendar } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { ConfirmModal } from '../components/ui/Modal';
import { useReportStore } from '../store/reportStore';
import { formatDate, getMonthName } from '../utils/helpers';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: '', label: 'Semua Bulan' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: getMonthName(i),
  })),
];

const PER_PAGE = 10;

export default function Reports() {
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const { reports, deleteReport, getFilteredReports } = useReportStore();

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const month = selectedMonth !== '' ? parseInt(selectedMonth) : null;
    return getFilteredReports(search, month, selectedYear);
  }, [reports, search, selectedMonth, selectedYear, getFilteredReports]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteReport(deleteId);
    toast.success('Laporan berhasil dihapus');
    setDeleteId(null);
    setDeleting(false);
  };

  return (
    <>
      <TopBar
        title="Laporan Kegiatan"
        subtitle={`${reports.length} total laporan`}
        onMenuClick={openSidebar}
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
        {/* Filters and Add Action */}
        <Card>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Cari kegiatan, lokasi, deskripsi..."
                icon={<Search size={16} />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={MONTHS}
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Button
              variant="gold"
              icon={<Plus size={16} />}
              onClick={() => navigate('/reports/new')}
              className="w-full md:w-auto h-10 px-5 shrink-0"
            >
              Tambah Laporan
            </Button>
          </div>
        </Card>

        {/* Table */}
        {paginated.length === 0 ? (
          <EmptyState
            icon={search ? 'search' : 'file'}
            title={search ? 'Tidak ditemukan' : 'Belum ada laporan'}
            description={
              search
                ? `Tidak ada laporan yang cocok dengan "${search}"`
                : 'Mulai tambahkan kegiatan Anda untuk melihat laporan di sini.'
            }
            action={
              !search ? (
                <Button
                  variant="gold"
                  icon={<Plus size={16} />}
                  onClick={() => navigate('/reports/new')}
                >
                  Tambah Laporan Pertama
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card padding={false}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border dark:border-dark-border">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">No</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">Tanggal</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">Kegiatan</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">Lokasi</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">Foto</th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((report, i) => (
                        <motion.tr
                          key={report.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/50 dark:border-dark-border/50 hover:bg-surface-tertiary/50 dark:hover:bg-dark-surface-tertiary/50 transition-colors"
                        >
                          <td className="px-5 py-4 text-sm text-text-muted">
                            {(currentPage - 1) * PER_PAGE + i + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                              {report.day}
                            </div>
                            <div className="text-xs text-text-muted dark:text-dark-text-muted">
                              {formatDate(report.date)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary max-w-[250px] truncate">
                              {report.title}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                            {report.location || '-'}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold">
                              📷 {report.photoIds.length}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/reports/${report.id}`)}
                                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                                title="Lihat"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => navigate(`/reports/edit/${report.id}`)}
                                className="p-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 text-gold transition-colors"
                                title="Edit"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteId(report.id)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {paginated.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="bg-surface dark:bg-dark-surface-secondary rounded-xl border border-border dark:border-dark-border p-4 active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary flex-1 mr-2">
                      {report.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold-50 dark:bg-gold-900/20 text-gold shrink-0">
                      📷 {report.photoIds.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                    <Calendar size={12} />
                    <span>{report.day}, {formatDate(report.date)}</span>
                  </div>
                  {report.location && (
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
                      📍 {report.location}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/50 dark:border-dark-border/50">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/reports/edit/${report.id}`); }}
                      className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-gold-50 dark:bg-gold-900/20 text-gold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(report.id); }}
                      className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Laporan"
        message="Apakah Anda yakin ingin menghapus laporan ini? Semua foto yang terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
        loading={deleting}
      />
    </>
  );
}
