import React, { useState } from 'react';
import { ArrowLeft, LogIn, UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginAccount, registerAccount } from '../../services/authApi';
import { UserProfile } from '../../types/chess';

interface AuthPageProps {
  mode: 'login' | 'register';
  userProfile?: UserProfile;
  onAuthSuccess: (profile: UserProfile) => void;
  onLogout: () => Promise<void> | void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  userProfile,
  onAuthSuccess,
  onLogout,
  onBack,
}) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = currentMode === 'register';

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setCurrentMode(newMode);
    setErrorMessage('');
    setStatusMessage('');
    const targetUrl = newMode === 'register' ? '/signup' : '/login';
    window.history.pushState({}, '', targetUrl);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
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
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-neutral-900 bg-[#080808]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Landing</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs uppercase tracking-[0.35em] text-white font-extrabold">TACTIX</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-neutral-400 text-sm">
              {isRegister
                ? 'Join Tactix for distraction-free chess calculation training.'
                : 'Sign in to access your personal training library & stats.'}
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-black/80 space-y-6">
            {/* Mode Switch Tabs */}
            <div className="flex bg-[#171717] p-1 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isRegister ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isRegister ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Email Address
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="gm.player@chess.com"
                    className="w-full bg-[#171717] border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="tactix_master"
                  className="w-full bg-[#171717] border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#171717] border border-neutral-800 rounded-2xl px-4 py-3 pr-12 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#171717] border border-neutral-800 rounded-2xl px-4 py-3 pr-12 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-white hover:bg-neutral-200 text-black py-3.5 font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

            <div className="text-center pt-2">
              <p className="text-xs text-neutral-400">
                {isRegister ? 'Already registered?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode(isRegister ? 'login' : 'register')}
                  className="text-white font-bold underline hover:text-neutral-300 ml-1 cursor-pointer"
                >
                  {isRegister ? 'Sign in here' : 'Create an account'}
                </button>
              </p>
            </div>

            {userProfile?.isLoggedIn && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-2xl border border-neutral-800 bg-[#171717] hover:bg-neutral-800 py-3 font-semibold text-neutral-300 text-xs transition-colors cursor-pointer"
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