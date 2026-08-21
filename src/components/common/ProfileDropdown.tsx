import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ThemeMode } from '../../types/chess';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

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
      <button
        onClick={onOpenLogin}
        className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs transition-all cursor-pointer"
      >
        Login
      </button>
    );
  }

  const displayName = userProfile.name || userProfile.username || 'Player';
  const displayHandle = userProfile.username || 'player';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 border border-neutral-200/80 dark:border-neutral-700/60 transition-colors cursor-pointer"
      >
        {userProfile.avatar ? (
          <img
            src={userProfile.avatar}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-[10px] flex items-center justify-center">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="hidden sm:block text-xs font-bold text-neutral-800 dark:text-neutral-200">
          {displayHandle}
        </span>

        <ChevronDown
          className={`w-3 h-3 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-extrabold text-neutral-900 dark:text-white truncate">{displayName}</p>
            <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">@{displayHandle}</p>
          </div>

          {/* Nav Links */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('/profile');
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('/settings');
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="py-1 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
