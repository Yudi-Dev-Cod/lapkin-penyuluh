import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flower2, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const printSettings = useSettingsStore((s) => s.printSettings);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
  });

  const onSubmit = (data: LoginForm) => {
    setLoading(true);
    setTimeout(() => {
      const success = login(data.username, data.password, data.rememberMe ?? false);
      if (success) {
        toast.success('Login berhasil!');
        navigate('/');
      } else {
        toast.error('Username atau password salah');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-hero relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gold/20"
              style={{
                width: 100 + i * 60,
                height: 100 + i * 60,
                top: `${10 + i * 12}%`,
                left: `${5 + i * 15}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center text-white px-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden ${
              printSettings.logo ? 'bg-white border-4 border-gold/30' : 'gradient-gold'
            }`}
          >
            {printSettings.logo ? (
              <img src={printSettings.logo} alt="Logo Instansi" className="w-full h-full object-contain p-2" />
            ) : (
              <Flower2 size={48} className="text-white" />
            )}
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">LAPKIN</h1>
          <p className="text-lg text-white/70 mb-2">Laporan Kinerja Penyuluh</p>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            Sistem pencatatan kegiatan dan pelaporan kinerja Penyuluh Agama Buddha
            yang modern, efisien, dan terpercaya.
          </p>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-8 bg-surface dark:bg-dark-surface">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center">
              <Flower2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">LAPKIN</h1>
              <p className="text-xs text-text-muted dark:text-dark-text-muted">Penyuluh Agama Buddha</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              Selamat Datang 👋
            </h2>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Username"
              placeholder="Masukkan username"
              icon={<User size={16} />}
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 rounded border-border text-gold focus:ring-gold accent-gold"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="text-sm text-text-secondary dark:text-dark-text-secondary">
                Ingat saya
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" variant="gold" loading={loading}>
              Masuk
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
