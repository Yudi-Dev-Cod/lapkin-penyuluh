import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Printer,
  Settings,
  LogOut,
  X,
  Flower2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reports', icon: FileText, label: 'Laporan' },
  { to: '/print', icon: Printer, label: 'Cetak Bulanan' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const profile = useSettingsStore((s) => s.profile);
  const printSettings = useSettingsStore((s) => s.printSettings);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-[272px]
          bg-gradient-to-b from-maroon to-slate-900
          border-r border-white/10
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {printSettings.logo ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gold/20 shadow-md flex items-center justify-center bg-white">
                  <img src={printSettings.logo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-md">
                  <Flower2 size={22} className="text-white" />
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-white">
                  LAPKIN
                </h1>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">
                  Penyuluh Buddha
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-gold/30" />
            ) : (
              <div className="w-9 h-9 rounded-full gradient-maroon flex items-center justify-center text-white text-sm font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.name}
              </p>
              <p className="text-[11px] text-white/60 truncate">
                {profile.jabatan}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
