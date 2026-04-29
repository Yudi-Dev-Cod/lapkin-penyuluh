import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import PhotoUpload from '../components/forms/PhotoUpload';
import { useReportStore } from '../store/reportStore';
import { savePhoto, getPhotosByReport, deletePhotosByReport, generateId } from '../services/storage';
import toast from 'react-hot-toast';

const reportSchema = z.object({
  title: z.string().min(1, 'Nama kegiatan wajib diisi').max(200),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  location: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const { addReport, updateReport, getReport } = useReportStore();
  const isEdit = !!id;

  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      description: '',
    },
  });

  // Load existing report for edit
  useEffect(() => {
    if (isEdit && id) {
      const report = getReport(id);
      if (report) {
        reset({
          title: report.title,
          date: report.date,
          location: report.location,
          description: report.description,
        });
        // Load photos from IndexedDB
        getPhotosByReport(id).then((photoData) => {
          setPhotos(photoData.map((p) => p.data));
          setLoaded(true);
        });
      } else {
        toast.error('Laporan tidak ditemukan');
        navigate('/reports');
      }
    } else {
      setLoaded(true);
    }
  }, [id, isEdit, getReport, reset, navigate]);

  // Auto-save draft
  const watchedValues = watch();
  useEffect(() => {
    if (!isEdit && loaded && (watchedValues.title || watchedValues.description)) {
      const draft = { ...watchedValues, photos };
      localStorage.setItem('lapkin-draft', JSON.stringify(draft));
    }
  }, [watchedValues, photos, isEdit, loaded]);

  // Restore draft
  useEffect(() => {
    if (!isEdit) {
      const draftStr = localStorage.getItem('lapkin-draft');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          reset({
            title: draft.title || '',
            date: draft.date || new Date().toISOString().split('T')[0],
            location: draft.location || '',
            description: draft.description || '',
          });
          if (draft.photos) setPhotos(draft.photos);
        } catch {}
      }
    }
  }, [isEdit, reset]);

  const onSubmit = async (data: ReportFormData) => {
    setSaving(true);
    try {
      const photoIds: string[] = [];

      if (isEdit && id) {
        // Delete old photos, save new
        await deletePhotosByReport(id);
        for (const photoData of photos) {
          const photoId = generateId();
          await savePhoto({
            id: photoId,
            reportId: id,
            data: photoData,
            name: `photo_${photoId}`,
            size: photoData.length,
            createdAt: new Date().toISOString(),
          });
          photoIds.push(photoId);
        }
        updateReport(id, { ...data, location: data.location || '', description: data.description || '', photoIds });
        toast.success('Laporan berhasil diperbarui');
      } else {
        const reportId = addReport({
          ...data,
          location: data.location || '',
          description: data.description || '',
          photoIds: [],
          date: data.date,
        });
        // Save photos
        for (const photoData of photos) {
          const photoId = generateId();
          await savePhoto({
            id: photoId,
            reportId,
            data: photoData,
            name: `photo_${photoId}`,
            size: photoData.length,
            createdAt: new Date().toISOString(),
          });
          photoIds.push(photoId);
        }
        updateReport(reportId, { photoIds });
        localStorage.removeItem('lapkin-draft');
        toast.success('Laporan berhasil disimpan');
      }
      navigate('/reports');
    } catch (err) {
      toast.error('Gagal menyimpan laporan');
    } finally {
      setSaving(false);
    }
  };

  const dateValue = watch('date');
  const dayName = dateValue
    ? ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(dateValue).getDay()]
    : '-';

  if (!loaded) {
    return (
      <>
        <TopBar title={isEdit ? 'Edit Laporan' : 'Tambah Laporan'} onMenuClick={openSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-3 border-gold border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={isEdit ? 'Edit Laporan' : 'Tambah Laporan'}
        onMenuClick={openSidebar}
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
            Kembali
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-5">
              Informasi Kegiatan
            </h3>
            <div className="space-y-4">
              <Input
                label="Nama Kegiatan"
                placeholder="Masukkan nama kegiatan"
                required
                error={errors.title?.message}
                {...register('title')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tanggal"
                  type="date"
                  required
                  error={errors.date?.message}
                  {...register('date')}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    Hari
                  </label>
                  <div className="px-4 py-2.5 rounded-xl border bg-surface-tertiary dark:bg-dark-surface-tertiary border-border dark:border-dark-border text-sm text-text-primary dark:text-dark-text-primary">
                    {dayName}
                  </div>
                </div>
              </div>

              <Input
                label="Lokasi"
                placeholder="Masukkan lokasi kegiatan (opsional)"
                error={errors.location?.message}
                {...register('location')}
              />

              <Textarea
                label="Deskripsi Kegiatan"
                placeholder="Tuliskan deskripsi kegiatan..."
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
          </Card>

          <Card>
            <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={10} />
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Batal
            </Button>
            <Button variant="gold" type="submit" icon={<Save size={16} />} loading={saving}>
              {isEdit ? 'Simpan Perubahan' : 'Simpan Laporan'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
