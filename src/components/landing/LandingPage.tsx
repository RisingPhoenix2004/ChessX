import React, { useState } from 'react';
import {
  Zap,
  BookOpen,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Upload,
  Flame,
  Shield,
  Sparkles,
  Play,
  Video,
  ChevronRight,
  Layers,
  Award,
  Target
} from 'lucide-react';
import { Chessboard } from 'react-chessboard';

interface LandingPageProps {
  onStartTraining: () => void;
  onOpenLoginPage: () => void;
  onOpenRegisterPage: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartTraining,
  onOpenLoginPage,
  onOpenRegisterPage,
}) => {
  const [activeTab, setActiveTab] = useState<'pgn' | 'srs' | 'videos' | 'radar'>('pgn');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-md border-b border-neutral-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={onStartTraining}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1ZM17 16H7a1 1 0 0 1-1-1c0-1.5 1-3 3-4V9a3 3 0 0 1 6 0v2c2 1 3 2.5 3 4a1 1 0 0 1-1 1Zm-5-9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-[0.2em] text-white block leading-none">
                  TACTIX
                </span>
                <span className="text-[10px] text-neutral-400 font-semibold tracking-widest uppercase block mt-1">
                  Chess Calculation Engine
                </span>
              </div>
            </div>

            {/* Desktop Links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-neutral-400">
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('workflow')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('methodology')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Methodology
              </button>
            </nav>

            {/* Auth Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenLoginPage}
                className="px-5 py-2.5 rounded-2xl bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-extrabold text-xs transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onOpenRegisterPage}
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shadow-xl shadow-white/10 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-neutral-900">
        {/* Subtle monochrome ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121212] border border-neutral-800 text-white text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
                <span>SPACED-REPETITION CALCULATION WORKOUTS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08]">
                Transform Static PGNs into{' '}
                <span className="text-neutral-400 underline decoration-neutral-700 decoration-wavy decoration-1 underline-offset-8">
                  Addictive Solves
                </span>
              </h1>

              <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Stop passively reading long algebraic moves. Upload your PGN repertoires, book variations, and tournament games into interactive tactical quizzes with instant audio feedback, streak tracking, and category analytics.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
                <button
                  onClick={onStartTraining}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm shadow-2xl shadow-white/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>START TRAINING NOW</span>
                </button>

                <button
                  onClick={onOpenRegisterPage}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-extrabold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span>Create Free Account</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6 text-xs text-neutral-400 font-semibold border-t border-neutral-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>100% Free PGN Uploads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Spaced Repetition SRS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Distraction-Free Video Hub</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Monochrome Chessboard Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-5 shadow-2xl shadow-black max-w-[420px] w-full space-y-4 relative">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-1">
                  <span className="flex items-center gap-1.5 text-white">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                    TACTICAL CHALLENGE
                  </span>
                  <span className="bg-[#171717] px-2.5 py-1 rounded-xl border border-neutral-800 text-white font-mono text-[11px]">
                    White to Move
                  </span>
                </div>

                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-[#080808]">
                  <Chessboard
                    position="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
                    boardOrientation="white"
                    arePiecesDraggable={false}
                    customDarkSquareStyle={{ backgroundColor: '#222222' }}
                    customLightSquareStyle={{ backgroundColor: '#e5e5e5' }}
                  />
                </div>

                <div className="bg-[#171717] p-3.5 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs font-bold">
                  <div className="space-y-0.5">
                    <span className="text-white block">Fried Liver Attack Motif</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">Italian Game: Knight Attack</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white text-black font-mono font-black text-xs">
                    1450 ELO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Showcase Section */}
      <section id="workflow" className="py-20 bg-[#080808] border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
              HOW TACTIX WORKS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Built for Serious Chess Improvement
            </h2>
            <p className="text-neutral-400 text-sm">
              Explore the four core modules designed to turn theoretical knowledge into instinct.
            </p>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto p-1.5 bg-[#0f0f0f] border border-neutral-800 rounded-2xl">
            <button
              onClick={() => setActiveTab('pgn')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'pgn'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>PGN Studies</span>
            </button>

            <button
              onClick={() => setActiveTab('srs')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'srs'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>SRS Review</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'videos'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'radar'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Spider Analytics</span>
            </button>
          </div>

          {/* Module Tab Content Box */}
          <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto">
            {activeTab === 'pgn' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Custom PGN Parsing & Studies</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Upload your PGN collections from Chessable, Lichess, books, or master games. Tactix extracts positions, parses tactical branches, and organizes them into customized training studies with progress tracking.
                  </p>
                  <ul className="space-y-2 text-xs text-neutral-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Supports multi-game PGNs with variations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Custom category tags (Opening, Pin, Fork, Endgame)</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-[#171717] border border-neutral-800 rounded-2xl p-6 space-y-3 font-mono text-xs text-neutral-400">
                  <div className="flex items-center justify-between text-[11px] text-white font-bold border-b border-neutral-800 pb-2">
                    <span>Tactical Study Preview</span>
                    <span className="text-neutral-400">12 Positions</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0f0f0f] border border-neutral-800 text-white font-semibold flex items-center justify-between">
                    <span>1. e4 c5 2. Nf3 d6 3. d4 cxd4</span>
                    <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded font-black">Active</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0f0f0f] border border-neutral-800/60 text-neutral-400 flex items-center justify-between">
                    <span>Tactical Motifs: Sicilian Defense</span>
                    <span className="text-[10px] text-neutral-500">100% Acc</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'srs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Failed-Only Spaced Repetition</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Miss a puzzle? Tactix automatically tags the position and queues it for spaced repetition review. Master your weaknesses instead of practicing positions you already know.
                  </p>
                  <ul className="space-y-2 text-xs text-neutral-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Dedicated Failed Puzzles Review mode</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Exponential retention intervals based on accuracy</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-[#171717] border border-neutral-800 rounded-2xl p-6 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-white font-bold border-b border-neutral-800 pb-2">
                    <span>SRS Memory Retention</span>
                    <span className="text-amber-400 font-mono">3 Due Today</span>
                  </div>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between p-2.5 rounded-xl bg-[#0f0f0f] border border-neutral-800 text-neutral-300">
                      <span>Greek Gift Sacrifice (d4)</span>
                      <span className="text-rose-400 font-bold">Failed 2x</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-[#0f0f0f] border border-neutral-800 text-neutral-300">
                      <span>Back Rank Mate Pattern #4</span>
                      <span className="text-white font-bold">Review Now</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Distraction-Free Video Hub</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Paste any YouTube chess video URL to build your personal training video library without algorithm distractions, clickbait recommendations, or ads. Add timestamps and study notes right alongside your videos.
                  </p>
                  <ul className="space-y-2 text-xs text-neutral-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Categorize videos by opening, endgame, and calculation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Built-in Markdown notes for key timestamps</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-[#171717] border border-neutral-800 rounded-2xl p-6 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-white font-bold border-b border-neutral-800 pb-2">
                    <span>Curated Video Hub</span>
                    <span className="text-neutral-400">Zero Distractions</span>
                  </div>
                  <div className="p-3 bg-[#0f0f0f] rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="font-bold text-white">Kasparov Calculation Method</div>
                    <div className="text-[11px] text-neutral-400">Notes: Focus on candidate moves at 14:20</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'radar' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Spider Radar Performance</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Visualize your chess calculation strengths and blindspots across tactical themes: Pins, Forks, Discovered Checks, Endgame Technique, and Sacrifices.
                  </p>
                  <ul className="space-y-2 text-xs text-neutral-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Heatmap of daily solving habits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Live calculation accuracy metrics</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-[#171717] border border-neutral-800 rounded-2xl p-6 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-white font-bold border-b border-neutral-800 pb-2">
                    <span>Tactical Radar Index</span>
                    <span className="text-white font-mono">2006 ELO</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-neutral-300 font-mono text-[11px]">
                    <div className="p-2.5 bg-[#0f0f0f] rounded-xl border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px] uppercase">Pins & Skewers</span>
                      <strong className="text-white text-sm">94%</strong>
                    </div>
                    <div className="p-2.5 bg-[#0f0f0f] rounded-xl border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px] uppercase">Forks</span>
                      <strong className="text-white text-sm">88%</strong>
                    </div>
                    <div className="p-2.5 bg-[#0f0f0f] rounded-xl border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px] uppercase">Endgame Tactics</span>
                      <strong className="text-white text-sm">79%</strong>
                    </div>
                    <div className="p-2.5 bg-[#0f0f0f] rounded-xl border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px] uppercase">Sacrifices</span>
                      <strong className="text-white text-sm">86%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white">Engineered for Calculation Mastery</h2>
          <p className="text-neutral-400 text-sm">
            Everything you need to turn dry variations into razor-sharp tactical reflexes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 space-y-3 shadow-xl hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Custom PGN Parsing</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Upload any PGN file. Create custom categories and automatically extract tactical positions.
            </p>
          </div>

          <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 space-y-3 shadow-xl hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Zero-Lag Sound Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Instant Web Audio feedback, level-up celebrations, and combo multipliers on every correct move.
            </p>
          </div>

          <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 space-y-3 shadow-xl hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Targeted SRS Review</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Missed a puzzle? Tactix automatically prioritizes failed positions in dedicated replay sessions.
            </p>
          </div>

          <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 space-y-3 shadow-xl hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Spider Analytics</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Visual spider-web radar chart mapping your exact calculation accuracy across every motif.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-20 bg-[#080808] border-t border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
                THE COGNITIVE PRINCIPLE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Active Recall Beats Passive Reading
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                Reading variations in chess books or course viewers creates the illusion of mastery. When you sit at the board, your brain cannot retrieve what was merely seen. Tactix forces active candidate move generation under time pressure, building deep neural reflexes that last.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Master Calculation?
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base">
            Create an account or start solving immediately. No credit card required.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onOpenRegisterPage}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm shadow-xl shadow-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onStartTraining}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Quick Solve as Guest
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 py-8 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2 font-bold text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>TACTIX Chess Calculation Engine © 2026</span>
          </div>
          <p>Dopamine-Driven Chess Puzzle Learning Platform</p>
        </div>
      </footer>
    </div>
  );
};
