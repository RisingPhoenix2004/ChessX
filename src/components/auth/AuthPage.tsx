import React, { useState } from 'react';
import { UserProfile } from '../../types/chess';
import { registerAccount, loginAccount } from '../../services/authApi';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
  onBack: () => void;
  userProfile?: UserProfile;
  onLogout?: () => void;
  mode?: 'login' | 'register' | string;
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onBack,
  userProfile,
  onLogout,
  mode,
  initialMode = 'login',
}) => {
  const [isRegister, setIsRegister] = useState((mode || initialMode) === 'register');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSwitchMode = (mode: 'login' | 'register') => {
    setIsRegister(mode === 'register');
    setErrorMessage('');
    setStatusMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      if (!username.trim() || !password.trim()) {
        throw new Error('Please fill in both username and password.');
      }

      if (isRegister && !email.trim()) {
        throw new Error('Please provide a valid email address.');
      }

      if (isRegister && password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const response = isRegister
        ? await registerAccount({ email, username, password, confirmPassword })
        : await loginAccount({ username, password });

      if (response.user) {
        onAuthSuccess(response.user);
      }

      setStatusMessage(response.message);
      if (isRegister) {
        setEmail('');
        setConfirmPassword('');
      }
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white transition-colors">
      {/* Top Header with ChessX Logo on Left */}
      <header className="border-b border-neutral-200 dark:border-neutral-900 bg-white/90 dark:bg-[#080808]/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo on Left */}
          <div
            onClick={onBack}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-xs transition-transform group-hover:scale-105">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight text-neutral-950 dark:text-white">ChessX</span>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            Tactical Training Platform
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm">
              {isRegister
                ? 'Join ChessX for distraction-free chess calculation training.'
                : 'Sign in to access your personal training studies & stats.'}
            </p>
          </div>

          <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            {/* Mode Switch Tabs */}
            <div className="flex bg-neutral-100 dark:bg-[#18181b] p-1 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Email Address
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="grandmaster@chess.com"
                    className="w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="chess_master"
                  className="w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 py-3 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-1">
              <p className="text-xs text-neutral-500">
                {isRegister ? 'Already registered?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode(isRegister ? 'login' : 'register')}
                  className="text-neutral-900 dark:text-white font-bold underline ml-1 cursor-pointer"
                >
                  {isRegister ? 'Sign in here' : 'Create an account'}
                </button>
              </p>
            </div>

            {userProfile?.isLoggedIn && onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 py-2.5 font-bold text-neutral-700 dark:text-neutral-300 text-xs transition-colors cursor-pointer"
              >
                Log Out Current Session
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};