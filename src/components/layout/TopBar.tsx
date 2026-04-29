import { Menu, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, onMenuClick, actions }: TopBarProps) {
  const { darkMode, toggleDarkMode } = useSettingsStore();

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-maroon to-slate-900 shadow-md">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-white/70">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun size={18} className="text-gold" /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
