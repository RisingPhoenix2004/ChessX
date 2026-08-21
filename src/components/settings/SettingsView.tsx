import React, { useState } from 'react';
import { Settings as UserSettings } from '../../services/storage';
import { Chessboard } from 'react-chessboard';
import {
  Settings,
  Palette,
  Volume2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Sparkles,
  Layers,
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
  emerald: { dark: '#769656', light: '#eeeee8', name: 'Chess.com Green' },
  wood: { dark: '#b58863', light: '#f0d9b5', name: 'Warm Wood' },
  glass: { dark: '#1e293b', light: '#475569', name: 'Slate Glass' },
  cyberpunk: { dark: '#2b1b54', light: '#4f228d', name: 'Cyberpunk Neon' },
  blue: { dark: '#4b7399', light: '#eae9d2', name: 'Lichess Blue' },
  light: { dark: '#8ca2ad', light: '#dee3e6', name: 'Classic Silver' },
  sand: { dark: '#b88b4a', light: '#e3c18f', name: 'Desert Sand' },
  tournament: { dark: '#52697a', light: '#cfd8dc', name: 'Tournament Blue' },
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  // Password Form State
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
      console.warn('Failed to persist preferences to backend:', err);
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

      setPwSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmittingPw(false);
    }
  };

  const currentBoardTheme = BOARD_THEME_COLORS[settings.boardTheme] || BOARD_THEME_COLORS.emerald;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-emerald-500" />
          <span>Preferences & Settings</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your appearance, board aesthetics, calculation sounds, and account security.
        </p>
      </div>

      {/* 1. App Appearance Theme (Light / Dark) */}
      <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <span>Application Theme</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateAndPersist({ ...settings, theme: 'light' })}
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
              settings.theme === 'light'
                ? 'bg-slate-50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-[#141b2b] border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-amber-500 shadow-sm">
              <Sun className="w-5 h-5 fill-amber-500" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white">Light Theme</div>
              <p className="text-[11px] text-slate-500">Crisp high-contrast day palette</p>
            </div>
            {settings.theme === 'light' && (
              <Check className="w-4 h-4 text-emerald-600 ml-auto" />
            )}
          </button>

          <button
            type="button"
            onClick={() => updateAndPersist({ ...settings, theme: 'dark' })}
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
              settings.theme === 'dark'
                ? 'bg-slate-50 dark:bg-[#161f32] border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-[#141b2b] border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 shadow-sm">
              <Moon className="w-5 h-5 fill-cyan-400" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white">Dark Theme</div>
              <p className="text-[11px] text-slate-500">Midnight focused training mode</p>
            </div>
            {settings.theme === 'dark' && (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-auto" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Board Themes & Visual Styling */}
      <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-500" />
          <span>Chessboard Aesthetics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Live Mini Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl bg-slate-900">
              <Chessboard
                position={sampleFen}
                boardOrientation="white"
                showBoardNotation={settings.showCoordinates}
                customDarkSquareStyle={{ backgroundColor: currentBoardTheme.dark }}
                customLightSquareStyle={{ backgroundColor: currentBoardTheme.light }}
                arePiecesDraggable={false}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400 mt-2 font-bold">
              {currentBoardTheme.name}
            </span>
          </div>

          {/* Theme Palette Swatches */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(BOARD_THEME_COLORS).map(([key, value]) => {
              const isSelected = settings.boardTheme === key;

              return (
                <button
                  key={key}
                  onClick={() => updateAndPersist({ ...settings, boardTheme: key as any })}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141b2b] hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-6 rounded-lg overflow-hidden flex border border-slate-300 dark:border-slate-700">
                    <div className="w-1/2 h-full" style={{ backgroundColor: value.light }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: value.dark }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {value.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Board Options */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Coordinates</span>
            <input
              type="checkbox"
              checked={settings.showCoordinates}
              onChange={(e) => updateAndPersist({ ...settings, showCoordinates: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Legal Move Dots</span>
            <input
              type="checkbox"
              checked={settings.showLegalMoves}
              onChange={(e) => updateAndPersist({ ...settings, showLegalMoves: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* 3. Audio & Feedback Settings */}
      <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-500" />
          <span>Audio Effects & Sound Engine</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Enable Master Sound</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateAndPersist({ ...settings, soundEnabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Piece Move Sounds</span>
            <input
              type="checkbox"
              checked={settings.moveSound}
              onChange={(e) => updateAndPersist({ ...settings, moveSound: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* 4. Account Security & Password Form */}
      <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-md">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          <span>Change Account Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {pwError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmittingPw}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
          >
            {isSubmittingPw && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmittingPw ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
