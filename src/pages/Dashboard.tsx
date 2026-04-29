import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CalendarRange,
  Camera,
  Clock,
  TrendingUp,
  Plus,
  Printer,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import WeeklyChart from '../components/charts/WeeklyChart';
import MonthlyChart from '../components/charts/MonthlyChart';
import ActivityPieChart from '../components/charts/ActivityPieChart';
import { useReportStore } from '../store/reportStore';
import { useSettingsStore } from '../store/settingsStore';
import {
  getWeeklyStats,
  getMonthlyStats,
  getActivityTypeStats,
  getMostActiveMonth,
  formatDate,
} from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const reports = useReportStore((s) => s.reports);
  const profile = useSettingsStore((s) => s.profile);
  const printSettings = useSettingsStore((s) => s.printSettings);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    const thisMonth = reports.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const thisYear = reports.filter((r) => new Date(r.date).getFullYear() === currentYear);
    const totalPhotos = reports.reduce((sum, r) => sum + r.photoIds.length, 0);
    const lastReport = reports.length > 0 ? reports[0] : null;
    const mostActive = getMostActiveMonth(reports, currentYear);

    // Check if any activity this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const hasActivityThisWeek = reports.some((r) => new Date(r.date) >= weekStart);

    return {
      monthCount: thisMonth.length,
      yearCount: thisYear.length,
      totalPhotos,
      lastReport,
      mostActive,
      hasActivityThisWeek,
    };
  }, [reports, currentMonth, currentYear]);

  const weeklyData = useMemo(
    () => getWeeklyStats(reports, currentMonth, currentYear),
    [reports, currentMonth, currentYear]
  );

  const monthlyData = useMemo(
    () => getMonthlyStats(reports, currentYear),
    [reports, currentYear]
  );

  const pieData = useMemo(
    () => getActivityTypeStats(reports),
    [reports]
  );

  const recentReports = useMemo(() => reports.slice(0, 5), [reports]);

  const statCards = [
    {
      label: 'Kegiatan Bulan Ini',
      value: stats.monthCount,
      icon: <CalendarDays size={22} />,
      gradient: 'from-gold to-gold-light',
    },
    {
      label: 'Kegiatan Tahun Ini',
      value: stats.yearCount,
      icon: <CalendarRange size={22} />,
      gradient: 'from-maroon to-maroon-light',
    },
    {
      label: 'Total Foto',
      value: stats.totalPhotos,
      icon: <Camera size={22} />,
      gradient: 'from-blue-500 to-blue-400',
    },
    {
      label: 'Bulan Paling Aktif',
      value: stats.mostActive,
      icon: <TrendingUp size={22} />,
      gradient: 'from-emerald-500 to-emerald-400',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={`Selamat datang, ${profile.name}`}
        onMenuClick={openSidebar}
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl gradient-hero p-6 text-white"
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gold/10 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/2 w-32 h-32 rounded-full bg-white/5 translate-y-1/2" />
          <div className="relative flex items-center gap-5">
            {printSettings.logo ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/95 flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
                <img src={printSettings.logo} alt="Logo Instansi" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                <CalendarDays size={28} className="text-gold-light" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{profile.name}</h2>
              <p className="text-sm text-white/70 truncate">{profile.jabatan}</p>
              <p className="text-xs text-white/50 truncate mt-0.5">{profile.instansi}</p>
            </div>
          </div>
        </motion.div>
        {/* Notification Banner */}
        {!stats.hasActivityThisWeek && reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          >
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Anda belum mencatat kegiatan minggu ini. Jangan lupa input kegiatan Anda!
            </p>
          </motion.div>
        )}

        {/* Stat Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((card, i) => (
            <motion.div key={i} variants={item}>
              <div className="bg-surface dark:bg-dark-surface-secondary rounded-2xl border border-border dark:border-dark-border p-5 hover:shadow-lg transition-shadow duration-300">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-3 shadow-md`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary animate-count">
                  {card.value}
                </p>
                <p className="text-xs text-text-muted dark:text-dark-text-muted mt-1">{card.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyChart data={weeklyData} />
          <MonthlyChart data={monthlyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <ActivityPieChart data={pieData} />

          {/* Recent Reports */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                Aktivitas Terbaru
              </h3>
              <button
                onClick={() => navigate('/reports')}
                className="text-xs text-gold hover:text-gold-dark font-medium"
              >
                Lihat Semua →
              </button>
            </div>
            {recentReports.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-dark-text-muted text-center py-8">
                Belum ada laporan. Mulai tambahkan kegiatan Anda!
              </p>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-tertiary dark:hover:bg-dark-surface-tertiary cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary truncate">
                        {report.title}
                      </p>
                      <p className="text-xs text-text-muted dark:text-dark-text-muted">
                        {report.day}, {formatDate(report.date)} · {report.photoIds.length} foto
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">
            Aksi Cepat
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="gold"
              icon={<Plus size={16} />}
              onClick={() => navigate('/reports/new')}
            >
              Tambah Laporan
            </Button>
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => navigate('/print')}
            >
              Cetak Laporan Bulan Ini
            </Button>
            <Button
              variant="ghost"
              icon={<Settings size={16} />}
              onClick={() => navigate('/settings')}
            >
              Pengaturan
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
