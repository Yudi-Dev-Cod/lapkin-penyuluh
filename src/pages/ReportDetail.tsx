import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit3, Trash2, Printer, Calendar, MapPin, FileText, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import { useReportStore } from '../store/reportStore';
import { useSettingsStore } from '../store/settingsStore';
import { getPhotosByReport } from '../services/storage';
import { generateSinglePDF } from '../components/pdf/generatePDF';
import { formatDate } from '../utils/helpers';
import type { PhotoData } from '../types';
import toast from 'react-hot-toast';

export default function ReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const { getReport, deleteReport } = useReportStore();
  const { profile, printSettings } = useSettingsStore();

  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const report = id ? getReport(id) : undefined;

  useEffect(() => {
    if (id) {
      getPhotosByReport(id).then((data) => {
        setPhotos(data);
      });
    }
  }, [id]);

  if (!report) {
    return (
      <>
        <TopBar title="Detail Laporan" onMenuClick={openSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted dark:text-dark-text-muted mb-4">Laporan tidak ditemukan</p>
            <Button variant="outline" onClick={() => navigate('/reports')}>Kembali</Button>
          </div>
        </div>
      </>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    await deleteReport(report.id);
    toast.success('Laporan berhasil dihapus');
    navigate('/reports');
  };

  const handlePrint = async () => {
    try {
      await generateSinglePDF(report, profile, printSettings);
      toast.success('PDF berhasil di-generate');
    } catch (err) {
      console.error(err);
      toast.error('Gagal generate PDF');
    }
  };

  return (
    <>
      <TopBar
        title="Detail Laporan"
        onMenuClick={openSidebar}
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
            Kembali
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-3">
                  {report.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gold" />
                    {report.day}, {formatDate(report.date)}
                  </span>
                  {report.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-maroon" />
                      {report.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Camera size={14} className="text-blue-500" />
                    {report.photoIds.length} foto
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit3 size={14} />}
                  onClick={() => navigate(`/reports/edit/${report.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Printer size={14} />}
                  onClick={handlePrint}
                >
                  Cetak
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => setShowDelete(true)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </Card>

          {/* Description */}
          {report.description && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-gold" />
                <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                  Deskripsi
                </h3>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </Card>
          )}

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Camera size={16} className="text-gold" />
                <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                  Galeri Foto ({photos.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setLightboxIndex(i)}
                    className="group flex flex-col rounded-xl overflow-hidden border border-border dark:border-dark-border cursor-pointer hover:shadow-lg transition-all duration-300 bg-surface dark:bg-dark-surface"
                  >
                    <div className="aspect-square relative overflow-hidden bg-surface-secondary dark:bg-dark-surface-secondary">
                      <img src={photo.data} alt={photo.name || `Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    {(photo.name && !photo.name.startsWith('photo_')) && (
                      <div className="p-2 border-t border-border dark:border-dark-border bg-surface-tertiary dark:bg-dark-surface-tertiary">
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary line-clamp-1 italic text-center">
                          {photo.name}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
              onClick={() => setLightboxIndex(null)}
            >
              <X size={24} />
            </button>
            {lightboxIndex > 0 && (
              <button
                className="absolute left-4 p-2 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                <ChevronLeft size={32} />
              </button>
            )}
            {lightboxIndex < photos.length - 1 && (
              <button
                className="absolute right-4 p-2 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                <ChevronRight size={32} />
              </button>
            )}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={photos[lightboxIndex].data}
              alt={photos[lightboxIndex].name || ""}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 text-center text-white/80 text-sm max-w-[80vw] flex flex-col gap-1 items-center">
              {(photos[lightboxIndex].name && !photos[lightboxIndex].name.startsWith('photo_')) && (
                <p className="italic text-base mb-1">{photos[lightboxIndex].name}</p>
              )}
              <span className="text-xs opacity-75">{lightboxIndex + 1} / {photos.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Laporan"
        message="Yakin ingin menghapus laporan ini beserta semua fotonya?"
        loading={deleting}
      />
    </>
  );
}
