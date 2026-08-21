import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ThemeMode } from '../../types/chess';
import { User, Settings, LogOut, ChevronDown, Sun, Moon, Sparkles } from 'lucide-react';

interface ProfileDropdownProps {
  userProfile: UserProfile;
  currentTheme: ThemeMode;
  onToggleTheme: (theme: ThemeMode) => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  userProfile,
  currentTheme,
  onToggleTheme,
  onNavigate,
  onLogout,
  onOpenLogin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!userProfile?.isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleTheme(currentTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#151c2e] hover:bg-slate-200 dark:hover:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
        <button
          onClick={onOpenLogin}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const displayName = userProfile.name || userProfile.username || 'Tactix Player';
  const displayHandle = userProfile.username || 'player';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-2xl bg-slate-100/90 dark:bg-[#131b2e] hover:bg-slate-200/80 dark:hover:bg-[#1a253d] border border-slate-200 dark:border-slate-700/80 transition-all text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer shadow-sm group"
      >
        {userProfile.avatar ? (
          <img
            src={userProfile.avatar}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="font-extrabold tracking-tight text-slate-900 dark:text-white max-w-[140px] truncate text-left">
          {displayName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 py-3 divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="px-5 py-2.5 space-y-1">
            <div className="flex items-center gap-3">
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">@{displayHandle}</p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="py-2 px-2 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('/profile');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('/settings');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Theme Switcher Toggle (Appearance) */}
          <div className="px-4 py-3 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center justify-between">
              <span>Appearance</span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold capitalize">{currentTheme}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[#161f32] rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onToggleTheme('light')}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentTheme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 ${currentTheme === 'light' ? 'text-amber-500 fill-amber-500' : ''}`} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleTheme('dark')}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentTheme === 'dark'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${currentTheme === 'dark' ? 'text-cyan-400 fill-cyan-400' : ''}`} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="py-2 px-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
