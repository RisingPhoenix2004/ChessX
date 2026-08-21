import React, { useState } from 'react';
import { ActiveTab, UserStats, UserProfile, ThemeMode } from '../../types/chess';
import { soundEngine } from '../../services/soundEngine';
import { ProfileDropdown } from './ProfileDropdown';
import {
  Flame,
  Target,
  Volume2,
  VolumeX,
  Menu,
  X,
  User,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Sun,
  Moon,
  BookOpen,
  LayoutDashboard,
  Video,
  BarChart3,
  Shield
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  activeTab: ActiveTab;
  onNavigate: (path: string, tab?: ActiveTab) => void;
  userStats: UserStats;
  userProfile: UserProfile;
  currentTheme?: ThemeMode;
  onToggleTheme?: (theme: ThemeMode) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  activeTab,
  onNavigate,
  userStats,
  userProfile,
  currentTheme = 'dark',
  onToggleTheme = () => {},
  soundEnabled,
  setSoundEnabled,
  onLogout,
  onOpenLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setMuted(!next);
  };

  const isDark = currentTheme === 'dark';

  const handleToggleClick = () => {
    onToggleTheme(isDark ? 'light' : 'dark');
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = userStats.heatmapData[today];
  const solvesToday = typeof todayEntry === 'number' ? todayEntry : todayEntry?.solved || 0;
  const goalTarget = userStats.dailyGoal || 10;
  const goalPercent = Math.min(100, Math.round((solvesToday / goalTarget) * 100));

  const navItems = [
    { path: '/dashboard', tab: 'dashboard' as ActiveTab, label: 'Dashboard' },
    { path: '/studies', tab: 'studies' as ActiveTab, label: 'Studies' },
    { path: '/videolibrary', tab: 'videolibrary' as ActiveTab, label: 'Video Library' },
    { path: '/stats', tab: 'stats' as ActiveTab, label: 'Stats' },
    { path: '/community', tab: 'community' as ActiveTab, label: 'Community' },
  ];

  const isNavActive = (itemTab: ActiveTab, itemPath: string) => {
    if (activeTab === itemTab) return true;
    if ((itemPath === '/dashboard' || itemPath === '/') && (currentPath === '/' || currentPath === '/dashboard' || activeTab === 'dashboard')) return true;
    if (itemPath === '/studies' && (currentPath.startsWith('/studies') || activeTab === 'studies' || activeTab === 'library' || activeTab === 'study-details')) return true;
    if (itemPath === '/videolibrary' && (currentPath === '/videolibrary' || activeTab === 'videolibrary')) return true;
    if (itemPath === '/stats' && (currentPath === '/stats' || activeTab === 'stats')) return true;
    if (itemPath === '/community' && (currentPath.startsWith('/community') || activeTab === 'community')) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => onNavigate('/', 'dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1ZM17 16H7a1 1 0 0 1-1-1c0-1.5 1-3 3-4V9a3 3 0 0 1 6 0v2c2 1 3 2.5 3 4a1 1 0 0 1-1 1Zm-5-9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                </svg>
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white block leading-none">
                  TACTIX
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase block mt-0.5">
                  Chess Training
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 rounded-xl border border-[var(--border-subtle)]">
            {navItems.map((item) => {
              const active = isNavActive(item.tab, item.path);
              return (
                <button
                  key={item.tab}
                  onClick={() => onNavigate(item.path, item.tab)}
                  className={`px-3.5 py-2 rounded-lg font-bold text-xs tracking-tight transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Theme Toggle Switch, Habit Indicators, Sound Toggle, Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Direct Navbar Light / Dark Switch (Exactly matches user screenshot) */}
            <div
              onClick={handleToggleClick}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-slate-100/90 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-800 cursor-pointer select-none group transition-colors shadow-sm"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {/* Sun Icon */}
              <Sun
                className={`w-4 h-4 transition-colors duration-200 ${
                  !isDark ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400 dark:text-slate-500'
                }`}
              />

              {/* Toggle Slider Track */}
              <div className="relative w-10 h-5 bg-slate-300 dark:bg-slate-700/80 rounded-full p-0.5 transition-colors duration-200">
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isDark ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>

              {/* Moon Icon */}
              <Moon
                className={`w-4 h-4 transition-colors duration-200 ${
                  isDark ? 'text-cyan-400 stroke-[2.5]' : 'text-slate-400'
                }`}
              />
            </div>

            {/* Streak Widget */}
            <div
              title="Daily Calculation Streak"
              onClick={() => onNavigate('/stats', 'stats')}
              className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#1d1610] hover:bg-amber-100/80 dark:hover:bg-[#2a1e12] border border-amber-200 dark:border-amber-900/50 px-3 py-1.5 rounded-xl text-amber-700 dark:text-amber-400 font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce-short" />
              <span className="font-mono">{userStats.currentStreak}</span>
            </div>

            {/* Daily Goal Widget */}
            <div
              title={`Daily Goal: ${solvesToday}/${goalTarget} puzzles solved today (${goalPercent}%)`}
              onClick={() => onNavigate('/', 'dashboard')}
              className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-[#0c1c18] hover:bg-emerald-100/80 dark:hover:bg-[#122822] border border-emerald-200 dark:border-emerald-900/50 px-3 py-1.5 rounded-xl text-emerald-800 dark:text-emerald-400 font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono">
                {solvesToday}/{goalTarget}
              </span>
              <div className="w-12 h-1.5 bg-emerald-200 dark:bg-emerald-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
            </button>

            {/* Desktop User Profile Dropdown */}
            <ProfileDropdown
              userProfile={userProfile}
              currentTheme={currentTheme}
              onToggleTheme={onToggleTheme}
              onNavigate={(path) => onNavigate(path)}
              onLogout={onLogout}
              onOpenLogin={onOpenLogin}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1523] border-b border-slate-200 dark:border-slate-800 p-6 space-y-6 max-w-md mx-auto shadow-2xl">
            {/* Mobile Nav Links */}
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const active = isNavActive(item.tab, item.path);
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(item.path, item.tab);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-sm tracking-tight transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>

            {/* Mobile Stats Counters */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-amber-50 dark:bg-[#1d1610] rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <div className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase">Streak</div>
                  <div className="text-sm font-black text-amber-950 dark:text-amber-200">{userStats.currentStreak} Days</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-[#0c1c18] rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase">Daily Goal</div>
                  <div className="text-sm font-black text-emerald-950 dark:text-emerald-200 font-mono">{solvesToday}/{goalTarget}</div>
                </div>
              </div>
            </div>

            {/* Mobile Theme Switcher */}
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-[#161f32] rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleTheme('light')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    currentTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => onToggleTheme('dark')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    currentTheme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Mobile Profile Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>

              {userProfile?.isLoggedIn && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
