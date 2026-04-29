import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, ImagePlus } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface PhotoUploadProps {
  photos: string[]; // base64 strings
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressAndConvert = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    const compressed = await imageCompression(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressed);
    });
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = maxPhotos - photos.length;
    const toProcess = fileArray.slice(0, remaining);

    if (toProcess.length === 0) return;

    setCompressing(true);
    try {
      const results = await Promise.all(toProcess.map(compressAndConvert));
      onChange([...photos, ...results]);
    } catch (err) {
      console.error('Error compressing images:', err);
    } finally {
      setCompressing(false);
    }
  }, [photos, onChange, maxPhotos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
        Foto Kegiatan <span className="text-text-muted">({photos.length}/{maxPhotos})</span>
      </label>

      {photos.length < maxPhotos && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
            ${isDragging
              ? 'border-gold bg-gold-50 dark:bg-gold-900/10'
              : 'border-border dark:border-dark-border hover:border-gold/50'
            }
          `}
        >
          {compressing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-3 border-gold border-t-transparent rounded-full" />
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Mengompres gambar...</p>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto mb-3 text-text-muted dark:text-dark-text-muted" />
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-1">
                Drag & drop foto di sini, atau
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gold hover:bg-gold-50 dark:hover:bg-gold-900/10 rounded-xl transition-colors"
                >
                  <ImagePlus size={16} /> Pilih File
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-maroon hover:bg-maroon-50 dark:hover:bg-maroon-900/10 rounded-xl transition-colors md:hidden"
                >
                  <Camera size={16} /> Kamera
                </button>
              </div>
              <p className="text-xs text-text-muted dark:text-dark-text-muted mt-2">
                Maks {maxPhotos} foto, otomatis dikompres
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border dark:border-dark-border"
              >
                <img
                  src={photo}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
