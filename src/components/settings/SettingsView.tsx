import React, { useState } from 'react';
import { Settings as UserSettings } from '../../services/storage';
import { Chessboard } from 'react-chessboard';
import {
  Settings,
  Eye,
  EyeOff,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { saveUserPreferences } from '../../services/userApi';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

const BOARD_THEME_COLORS: Record<string, { dark: string; light: string; name: string }> = {
  dark: { dark: '#262626', light: '#404040', name: 'Dark Carbon' },
  emerald: { dark: '#769656', light: '#eeeee8', name: 'Emerald' },
  wood: { dark: '#b58863', light: '#f0d9b5', name: 'Warm Wood' },
  glass: { dark: '#1e293b', light: '#475569', name: 'Slate Glass' },
  cyberpunk: { dark: '#2b1b54', light: '#4f228d', name: 'Cyberpunk' },
  blue: { dark: '#4b7399', light: '#eae9d2', name: 'Blue' },
  light: { dark: '#8ca2ad', light: '#dee3e6', name: 'Classic Silver' },
  sand: { dark: '#b88b4a', light: '#e3c18f', name: 'Desert Sand' },
  tournament: { dark: '#52697a', light: '#cfd8dc', name: 'Tournament' },
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const sampleFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

  const updateAndPersist = (newSettings: UserSettings) => {
    onUpdateSettings(newSettings);
    void saveUserPreferences(newSettings).catch((err) => {
      console.warn('Failed to persist preferences:', err);
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setIsSubmittingPw(true);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Please fill in all password fields.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match.');
      }
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
      }

      const token = localStorage.getItem('tactix_auth_token') || localStorage.getItem('tactix_jwt_token');
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password.');
      }

      setPwSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmittingPw(false);
    }
  };

  const currentBoardTheme = BOARD_THEME_COLORS[settings.boardTheme] || BOARD_THEME_COLORS.dark;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Customize your board aesthetics, calculation sounds, and account security.
        </p>
      </div>

      {/* 2. Board Themes & Live Preview */}
      <div className="bg-white dark:bg-[#111520] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          Board Style & Palette
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Palette selector list */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(BOARD_THEME_COLORS).map(([key, col]) => (
              <button
                key={key}
                onClick={() => updateAndPersist({ ...settings, boardTheme: key as any })}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.boardTheme === key
                    ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white bg-neutral-50 dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 bg-white dark:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md flex overflow-hidden border border-neutral-300 dark:border-neutral-600">
                    <div className="w-1/2 h-full" style={{ backgroundColor: col.light }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: col.dark }} />
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{col.name}</span>
                </div>

                {settings.boardTheme === key && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
              </button>
            ))}
          </div>

          {/* Live Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-48 aspect-square rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-xs">
              <Chessboard
                position={sampleFen}
                customDarkSquareStyle={{ backgroundColor: currentBoardTheme.dark }}
                customLightSquareStyle={{ backgroundColor: currentBoardTheme.light }}
                showBoardNotation={false}
              />
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 font-mono">Live Board Preview</span>
          </div>
        </div>
      </div>

      {/* 3. Audio Preferences */}
      <div className="bg-white dark:bg-[#111520] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          Audio & Sound Effects
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'soundEnabled', label: 'Master Sound Effects' },
            { key: 'moveSound', label: 'Move & Slide Sound' },
            { key: 'captureSound', label: 'Piece Capture Sound' },
            { key: 'errorSound', label: 'Incorrect Move Feedback' },
          ].map((item) => {
            const isChecked = (settings as any)[item.key] !== false;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer"
              >
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateAndPersist({ ...settings, [item.key]: e.target.checked })}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-0 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Password Change Security */}
      <div className="bg-white dark:bg-[#111520] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          Change Account Password
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {pwError && <div className="text-xs text-red-500 font-bold">{pwError}</div>}
          {pwSuccess && <div className="text-xs text-emerald-600 font-bold">{pwSuccess}</div>}

          <button
            type="submit"
            disabled={isSubmittingPw}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs cursor-pointer"
          >
            {isSubmittingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
