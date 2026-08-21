import React, { useState } from 'react';
import { ActiveTab, UserStats, UserProfile, ThemeMode } from '../../types/chess';
import { ProfileDropdown } from './ProfileDropdown';
import {
  Flame,
  Target,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Settings as SettingsIcon,
  LogOut,
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
  onLogout,
  onOpenLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = currentTheme === 'dark';

  const handleToggleClick = () => {
    onToggleTheme(isDark ? 'light' : 'dark');
  };

  const navItems = [
    { path: '/dashboard', tab: 'dashboard' as ActiveTab, label: 'DASHBOARD' },
    { path: '/studies', tab: 'studies' as ActiveTab, label: 'STUDIES' },
    { path: '/videolibrary', tab: 'videolibrary' as ActiveTab, label: 'VIDEOS' },
    { path: '/stats', tab: 'stats' as ActiveTab, label: 'STATS' },
    { path: '/community', tab: 'community' as ActiveTab, label: 'COMMUNITY' },
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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => onNavigate('/', 'dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>

              <span className="font-black text-lg tracking-tight text-neutral-950 dark:text-white">
                Chess<span className="text-neutral-900 dark:text-white">X</span>
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Links (ALL CAPS) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isNavActive(item.tab, item.path);
              return (
                <button
                  key={item.tab}
                  onClick={() => onNavigate(item.path, item.tab)}
                  className={`relative px-3.5 py-1.5 text-xs font-bold tracking-wider transition-all duration-150 rounded-lg cursor-pointer ${
                    active
                      ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800/80 shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Theme Switcher Toggle + Streak + Profile/Login Button (Matching Image 1) */}
          <div className="flex items-center gap-3">
            {/* Direct Navbar Light / Dark Switch (Matching Image 1) */}
            <div
              onClick={handleToggleClick}
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer select-none transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              <Sun
                className={`w-3.5 h-3.5 transition-colors ${
                  !isDark ? 'text-amber-500' : 'text-neutral-400'
                }`}
              />

              <div className="relative w-8 h-4 bg-neutral-300 dark:bg-neutral-600 rounded-full p-0.5 transition-colors">
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                    isDark ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>

              <Moon
                className={`w-3.5 h-3.5 transition-colors ${
                  isDark ? 'text-neutral-100' : 'text-neutral-400'
                }`}
              />
            </div>

            {/* Streak Widget */}
            {userProfile?.isLoggedIn && (
              <div
                onClick={() => onNavigate('/stats', 'stats')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                title={`${userStats.currentStreak} day streak`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-mono">{userStats.currentStreak}d</span>
              </div>
            )}

            {/* Profile Dropdown / Login Button (Image 1 style) */}
            {userProfile?.isLoggedIn ? (
              <ProfileDropdown
                userProfile={userProfile}
                currentTheme={currentTheme}
                onToggleTheme={onToggleTheme}
                onNavigate={(path) => onNavigate(path)}
                onLogout={onLogout}
                onOpenLogin={onOpenLogin}
              />
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#09090b] border-b border-neutral-200 dark:border-neutral-800 p-6 space-y-5 max-w-md mx-auto shadow-2xl">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(item.tab, item.path);
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(item.path, item.tab);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-colors cursor-pointer ${
                      active
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs cursor-pointer"
              >
                <User className="w-4 h-4 text-neutral-400" />
                <span>PROFILE</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-neutral-400" />
                <span>SETTINGS</span>
              </button>

              {userProfile?.isLoggedIn && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
