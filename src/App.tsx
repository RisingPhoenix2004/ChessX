import React, { useState, useEffect } from 'react';
import { ActiveTab, Collection, Puzzle, UserStats, Achievement, UserProfile, ThemeMode } from './types/chess';
import { storage, Settings } from './services/storage';
import { getLibrary, saveLibrary } from './services/libraryApi';
import { clearAuthToken, getCurrentUser, logoutAccount } from './services/authApi';
import { recordPuzzleAttempt, getUserPreferences, getUserStats, saveUserPreferences } from './services/userApi';
import { updatePuzzleSRS } from './services/srsEngine';
import { soundEngine } from './services/soundEngine';
import { Navbar } from './components/common/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { PuzzleSolver } from './components/solver/PuzzleSolver';
import { StudiesView } from './components/library/StudiesView';
import { StudyDetailsView } from './components/library/StudyDetailsView';
import { PGNViewerModal } from './components/library/PGNViewerModal';
import { VideoLibraryView } from './components/video/VideoLibraryView';
import { ReviewView } from './components/review/ReviewView';
import { StatsView } from './components/stats/StatsView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { CommunityView } from './components/community/CommunityView';
import { Target, CheckCircle2, X } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storage.getUserProfile());
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());
  const [theme, setTheme] = useState<ThemeMode>(() => storage.getSettings().theme || 'dark');

  const [isAppStarted, setIsAppStarted] = useState<boolean>(() => {
    const profile = storage.getUserProfile();
    if (profile?.isLoggedIn) return true;
    const path = window.location.pathname;
    if (
      path === '/dashboard' ||
      path === '/studies' ||
      path === '/library' ||
      path === '/videolibrary' ||
      path === '/stats' ||
      path === '/community' ||
      path === '/profile' ||
      path === '/settings'
    ) {
      return true;
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const path = window.location.pathname;
    if (path === '/studies' || path === '/library') return 'studies';
    if (path === '/videolibrary') return 'videolibrary';
    if (path === '/stats') return 'stats';
    if (path === '/community') return 'community';
    if (path === '/profile') return 'profile';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  });

  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [viewingPgnCollection, setViewingPgnCollection] = useState<Collection | null>(null);
  const [userStats, setUserStats] = useState<UserStats>(() => storage.getUserStats());
  const [collections, setCollections] = useState<Collection[]>(() => storage.getCollections());
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => storage.getPuzzles());
  const [achievements, setAchievements] = useState<Achievement[]>(() => storage.getAchievements());

  // Goal Completion Celebration Overlay State
  const [showGoalCelebration, setShowGoalCelebration] = useState<boolean>(false);

  // Training Session State
  const [activeQueue, setActiveQueue] = useState<Puzzle[]>([]);
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState<number>(0);
  const [activeCollectionName, setActiveCollectionName] = useState<string>('Tactical Trainer');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [comboCount, setComboCount] = useState<number>(0);
  const [sessionPuzzleCount, setSessionPuzzleCount] = useState<number>(0);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [libraryHydrated, setLibraryHydrated] = useState<boolean>(false);

  // Synchronize HTML Theme Class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const handleToggleTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setSettings((prev) => {
      const updated = { ...prev, theme: newTheme };
      storage.saveSettings(updated);
      void saveUserPreferences(updated).catch(() => {});
      return updated;
    });
  };

  // Handle SPA URL popstate & route synchronization
  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname;
      if (path === '/library') {
        window.history.replaceState({}, '', '/studies');
        path = '/studies';
      }
      setCurrentPath(path);

      if (path === '/studies') {
        setActiveTab('studies');
        setIsAppStarted(true);
      } else if (path === '/videolibrary') {
        setActiveTab('videolibrary');
        setIsAppStarted(true);
      } else if (path === '/stats') {
        setActiveTab('stats');
        setIsAppStarted(true);
      } else if (path === '/community' || path.startsWith('/community/')) {
        setActiveTab('community');
        setIsAppStarted(true);
      } else if (path === '/profile') {
        setActiveTab('profile');
        setIsAppStarted(true);
      } else if (path === '/settings') {
        setActiveTab('settings');
        setIsAppStarted(true);
      } else if (path === '/dashboard') {
        setActiveTab('dashboard');
        setIsAppStarted(true);
      } else if (path === '/login' || path === '/signup' || path === '/register') {
        // Handled via auth render
      } else if (path === '/') {
        if (!userProfile.isLoggedIn && !isAppStarted) {
          setIsAppStarted(false);
        } else {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [userProfile.isLoggedIn, isAppStarted]);

  useEffect(() => {
    window.history.replaceState(
      { ...(window.history.state || {}), activeTab, isAppStarted },
      '',
      window.location.pathname === '/library' ? '/studies' : window.location.pathname
    );
  }, [activeTab, isAppStarted]);

  const navigateTo = (path: string, tab?: ActiveTab) => {
    let targetPath = path;
    if (path === '/library') targetPath = '/studies';

    let targetTab: ActiveTab = tab || 'dashboard';
    if (!tab) {
      if (targetPath === '/studies') targetTab = 'studies';
      else if (targetPath === '/videolibrary') targetTab = 'videolibrary';
      else if (targetPath === '/stats') targetTab = 'stats';
      else if (targetPath === '/community') targetTab = 'community';
      else if (targetPath === '/profile') targetTab = 'profile';
      else if (targetPath === '/settings') targetTab = 'settings';
      else if (targetPath === '/dashboard' || targetPath === '/') targetTab = 'dashboard';
    }

    const shouldStart = targetPath !== '/' || userProfile.isLoggedIn || isAppStarted;
    if (targetPath !== '/' || userProfile.isLoggedIn) {
      setIsAppStarted(true);
    }

    window.history.pushState(
      { returnTo: { pathname: currentPath, activeTab, isAppStarted: shouldStart }, activeTab: targetTab, isAppStarted: shouldStart },
      '',
      targetPath
    );
    setCurrentPath(targetPath);
    setActiveTab(targetTab);
  };

  const returnToPreviousRoute = () => {
    const state = window.history.state as {
      returnTo?: { pathname: string; activeTab?: ActiveTab; isAppStarted?: boolean };
    } | null;

    const returnTo = state?.returnTo;
    if (returnTo?.pathname && returnTo.pathname !== '/login' && returnTo.pathname !== '/signup') {
      window.history.pushState(
        { activeTab: returnTo.activeTab || 'dashboard', isAppStarted: true },
        '',
        returnTo.pathname
      );
      setCurrentPath(returnTo.pathname);
      if (returnTo.activeTab) setActiveTab(returnTo.activeTab);
      setIsAppStarted(true);
    } else {
      window.history.pushState({ activeTab: 'dashboard', isAppStarted: true }, '', '/dashboard');
      setCurrentPath('/dashboard');
      setActiveTab('dashboard');
      setIsAppStarted(true);
    }
  };

  // Storage persistence
  useEffect(() => {
    storage.saveUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    storage.saveUserStats(userStats);
  }, [userStats]);

  useEffect(() => {
    storage.saveCollections(collections);
  }, [collections]);

  useEffect(() => {
    storage.savePuzzles(puzzles);
  }, [puzzles]);

  useEffect(() => {
    storage.saveAchievements(achievements);
  }, [achievements]);

  useEffect(() => {
    storage.saveSettings(settings);
    soundEngine.setMuted(!settings.soundEnabled);
  }, [settings]);

  useEffect(() => {
    const hydrateAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserProfile(currentUser);
        setIsAppStarted(true);

        // Hydrate backend preferences (including theme)
        try {
          const prefData = await getUserPreferences();
          if (prefData?.theme) {
            setTheme(prefData.theme as ThemeMode);
            setSettings((prev) => ({ ...prev, ...prefData }));
          }
        } catch (e) {
          console.warn('Failed to load user preferences', e);
        }

        try {
          const statsData = await getUserStats();
          if (statsData) {
            setUserStats(statsData);
          }
        } catch (e) {
          console.warn('Failed to load user stats', e);
        }
      }
      setAuthReady(true);
    };

    void hydrateAuth();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    let isMounted = true;
    const hydrateLibrary = async () => {
      try {
        if (!userProfile.isLoggedIn) {
          if (isMounted) setLibraryHydrated(true);
          return;
        }

        const serverLibrary = await getLibrary();
        if (!isMounted) return;

        if (serverLibrary.collections.length > 0 || serverLibrary.puzzles.length > 0) {
          setCollections(serverLibrary.collections);
          setPuzzles(serverLibrary.puzzles);
        } else {
          await saveLibrary({ collections, puzzles });
        }
      } catch (error) {
        console.warn('Library API unavailable, using local cache.', error);
      } finally {
        if (isMounted) setLibraryHydrated(true);
      }
    };

    void hydrateLibrary();

    return () => {
      isMounted = false;
    };
  }, [authReady, userProfile.isLoggedIn]);

  useEffect(() => {
    if (!libraryHydrated || !userProfile.isLoggedIn) return;
    void saveLibrary({ collections, puzzles }).catch((error) => {
      console.warn('Failed to sync library to database.', error);
    });
  }, [collections, puzzles, libraryHydrated, userProfile.isLoggedIn]);

  useEffect(() => {
    if (!userProfile.isLoggedIn) return;

    const authRoutes = ['/login', '/signup', '/register'];
    if (authRoutes.includes(window.location.pathname)) {
      const targetPath = '/';
      window.history.replaceState({ activeTab: 'dashboard', isAppStarted: true }, '', targetPath);
      setCurrentPath(targetPath);
      setActiveTab('dashboard');
      setIsAppStarted(true);
    }
  }, [userProfile.isLoggedIn]);

  const handleStartSession = (collectionId?: string) => {
    setIsAppStarted(true);
    let queue = puzzles;
    let colName = 'All Tactical Puzzles';

    if (collectionId) {
      const col = collections.find((c) => c.id === collectionId);
      if (col) {
        colName = col.name;
        const colPuzzleIds = col.puzzleIds || [];
        queue = puzzles.filter((p) => colPuzzleIds.includes(p.id));
        setActiveCollectionId(col.id);
      }
    }

    if (queue.length === 0) queue = puzzles;

    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    setActiveQueue(shuffled);
    setCurrentPuzzleIdx(0);
    setActiveCollectionName(colName);
    setComboCount(0);
    setSessionPuzzleCount(0);
    setActiveTab('solver');
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsAppStarted(true);
    returnToPreviousRoute();
  };

  const handleLogout = async () => {
    await logoutAccount();
    clearAuthToken();
    setUserProfile({
      id: 'guest',
      username: 'guest',
      name: 'Guest Player',
      email: 'guest@tactix.io',
      avatar: '',
      isLoggedIn: false,
    });
    setIsAppStarted(false);
    setCurrentPath('/');
    window.history.pushState({ activeTab: 'dashboard', isAppStarted: false }, '', '/');
  };

  const handleStartReviewSession = (reviewPuzzles?: Puzzle[]) => {
    setIsAppStarted(true);
    const failedList =
      reviewPuzzles && reviewPuzzles.length > 0
        ? reviewPuzzles
        : puzzles.filter((p) => Boolean(p.hasFailed || (p.failedCount || 0) > 0));

    const finalQueue = failedList.length > 0 ? failedList : puzzles;
    setActiveQueue(finalQueue);
    setCurrentPuzzleIdx(0);
    setActiveCollectionName('Failed Puzzles Replay');
    setActiveCollectionId(null);
    setComboCount(0);
    setSessionPuzzleCount(0);
    setActiveTab('solver');
  };

  const handleUpdateDailyGoal = async (newGoal: number) => {
    setUserStats((prev) => ({ ...prev, dailyGoal: newGoal }));

    if (userProfile.isLoggedIn) {
      try {
        const token = localStorage.getItem('tactix_jwt_token') || localStorage.getItem('tactix_auth_token');
        await fetch('/api/user/daily-goal', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dailyGoal: newGoal }),
        });
      } catch (err) {
        console.warn('Failed to update backend daily goal', err);
      }
    }
  };

  const handlePuzzleCompleted = (
    puzzleId: string,
    solved: boolean,
    solveTimeMs: number,
    mistakes: number,
    _xpGain: number,
    _coinsGain: number
  ) => {
    const targetPuzzle = puzzles.find((p) => p.id === puzzleId);
    if (!targetPuzzle) return;

    setSessionPuzzleCount((prev) => prev + 1);

    const srsUpdates = updatePuzzleSRS(targetPuzzle, solved, mistakes, solveTimeMs);
    
    // CRITICAL: When user solves a replay puzzle, remove it from failed queue (hasFailed: false)!
    const updatedPuzzles = puzzles.map((p) => {
      if (p.id === puzzleId) {
        return {
          ...p,
          ...srsUpdates,
          hasFailed: solved ? false : true,
          failedCount: solved ? p.failedCount : (p.failedCount || 0) + 1,
          solvedCount: solved ? (p.solvedCount || 0) + 1 : p.solvedCount,
          attempts: (p.attempts || 0) + 1,
        };
      }
      return p;
    });
    setPuzzles(updatedPuzzles);

    // Call API to persist attempt in database
    void recordPuzzleAttempt(puzzleId, {
      solved,
      solveTimeMs,
      mistakes,
      xpEarned: 15,
      coinsEarned: 2,
      collectionId: targetPuzzle.collectionId,
    }).catch((err) => {
      console.warn('Failed to record attempt to server', err);
    });

    const today = new Date().toISOString().split('T')[0];
    const newCombo = solved ? comboCount + 1 : 0;
    setComboCount(newCombo);
    if (newCombo > 2 && settings.soundEnabled) soundEngine.playCombo(newCombo);

    const totalAttempts = userStats.totalAttempts + 1;
    const totalSolved = userStats.totalSolved + (solved ? 1 : 0);
    const accuracy = Math.round((totalSolved / totalAttempts) * 100);

    const prevEntry = userStats.heatmapData[today];
    const prevSolved = typeof prevEntry === 'number' ? prevEntry : prevEntry?.solved || 0;
    const prevFailed = typeof prevEntry === 'object' ? prevEntry?.failed || 0 : 0;

    const newSolved = prevSolved + (solved ? 1 : 0);
    const newFailed = prevFailed + (solved ? 0 : 1);
    const targetGoal = userStats.dailyGoal || 10;

    // Trigger Daily Goal Celebration ONLY when reaching exact goal target
    if (solved && prevSolved < targetGoal && newSolved >= targetGoal) {
      setShowGoalCelebration(true);
      if (settings.soundEnabled) soundEngine.playLevelUp();
    }

    // Streak update logic
    let streak = userStats.currentStreak || 1;
    let bestStreak = userStats.bestStreak || 1;
    const lastActive = userStats.lastActiveDate || '';
    if (lastActive !== today && solved) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        streak += 1;
      } else if (lastActive && lastActive < yesterday) {
        streak = 1;
      }
      if (streak > bestStreak) bestStreak = streak;
    }

    setUserStats((prev) => ({
      ...prev,
      totalSolved,
      totalAttempts,
      accuracy,
      currentStreak: streak,
      bestStreak,
      lastActiveDate: today,
      totalThinkingTimeMs: prev.totalThinkingTimeMs + solveTimeMs,
      heatmapData: {
        ...prev.heatmapData,
        [today]: { solved: newSolved, failed: newFailed },
      },
    }));
  };

  const handleNextPuzzle = () => {
    if (currentPuzzleIdx + 1 < activeQueue.length) {
      setCurrentPuzzleIdx(currentPuzzleIdx + 1);
    } else {
      navigateTo('/', 'dashboard');
    }
  };

  const handleImportPuzzles = (newPuzzles: Puzzle[], newCollection: Collection) => {
    setPuzzles((prev) => [...newPuzzles, ...prev]);
    setCollections((prev) => [newCollection, ...prev]);
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    setPuzzles((prev) => prev.filter((p) => p.collectionId !== collectionId));

    if (activeCollectionId === collectionId) {
      setActiveCollectionId(null);
      setActiveQueue([]);
      setCurrentPuzzleIdx(0);
      setActiveCollectionName('Tactical Trainer');
      navigateTo('/', 'dashboard');
    }
  };

  const handleOpenStudyDetails = (studyId: string) => {
    setSelectedStudyId(studyId);
    setActiveTab('study-details');
  };

  const currentPuzzle = activeQueue[currentPuzzleIdx] || puzzles[0];
  const selectedStudy = collections.find((c) => c.id === selectedStudyId) || collections[0];

  // Auth pages route check
  if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/register') {
    return (
      <AuthPage
        mode={currentPath === '/login' ? 'login' : 'register'}
        userProfile={userProfile}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onBack={() => navigateTo('/')}
      />
    );
  }

  // Landing Page for non-authenticated guests before starting app
  if (!isAppStarted && !userProfile.isLoggedIn) {
    return (
      <LandingPage
        onStartTraining={() => {
          setIsAppStarted(true);
          navigateTo('/studies', 'studies');
        }}
        onOpenLoginPage={() => navigateTo('/login')}
        onOpenRegisterPage={() => navigateTo('/signup')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 transition-colors">
      {/* Top Main Navigation Bar */}
      <Navbar
        currentPath={currentPath}
        activeTab={activeTab}
        onNavigate={navigateTo}
        userStats={userStats}
        userProfile={userProfile}
        currentTheme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={settings.soundEnabled}
        setSoundEnabled={(enabled) => setSettings((prev) => ({ ...prev, soundEnabled: enabled }))}
        onLogout={handleLogout}
        onOpenLogin={() => navigateTo('/login')}
      />

      {/* Goal Celebration Popup Modal */}
      {showGoalCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowGoalCelebration(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
              <Target className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Daily Goal Achieved!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You hit your target of <span className="font-bold text-emerald-600 dark:text-emerald-400">{userStats.dailyGoal || 10} puzzles</span> today. Keep up the momentum!
              </p>
            </div>

            <button
              onClick={() => setShowGoalCelebration(false)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
            >
              Continue Training
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            userProfile={userProfile}
            userStats={userStats}
            collections={collections}
            puzzles={puzzles}
            onNavigate={navigateTo}
            onStartSession={handleStartSession}
            onStartReplaySession={handleStartReviewSession}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onOpenStudyDetails={handleOpenStudyDetails}
            onOpenPgnViewer={(col) => setViewingPgnCollection(col)}
          />
        )}

        {(activeTab === 'studies' || activeTab === 'library') && (
          <StudiesView
            collections={collections}
            puzzles={puzzles}
            onStartCollectionSession={handleStartSession}
            onOpenStudyDetails={handleOpenStudyDetails}
            onOpenPgnViewer={(col) => setViewingPgnCollection(col)}
            onSaveCollection={(col) => setCollections(collections.map((c) => (c.id === col.id ? col : c)))}
            onDeleteCollection={handleDeleteCollection}
            onImportPuzzles={handleImportPuzzles}
          />
        )}

        {activeTab === 'study-details' && selectedStudy && (
          <StudyDetailsView
            study={selectedStudy}
            puzzles={puzzles}
            settings={settings}
            onBack={() => navigateTo('/studies', 'studies')}
            onStartTraining={handleStartSession}
          />
        )}

        {activeTab === 'videolibrary' && <VideoLibraryView />}

        {activeTab === 'stats' && (
          <StatsView
            puzzles={puzzles}
            collections={collections}
            userStats={userStats}
          />
        )}

        {activeTab === 'community' && (
          <CommunityView
            currentUser={userProfile}
            currentUserStats={userStats}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            userStats={userStats}
            achievements={achievements}
            onUpdateProfile={setUserProfile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}

        {activeTab === 'solver' && currentPuzzle && (
          <PuzzleSolver
            puzzle={currentPuzzle}
            collectionName={activeCollectionName}
            onPuzzleCompleted={handlePuzzleCompleted}
            onNextPuzzle={handleNextPuzzle}
            onExit={() => navigateTo('/', 'dashboard')}
            userStats={userStats}
            comboCount={comboCount}
            sessionPuzzleCount={sessionPuzzleCount}
            settings={settings}
          />
        )}

        {activeTab === 'review' && (
          <ReviewView
            puzzles={puzzles}
            collections={collections}
            onStartReviewSession={handleStartReviewSession}
          />
        )}

        {/* Global PGN Viewer Modal */}
        {viewingPgnCollection && (
          <PGNViewerModal
            collection={viewingPgnCollection}
            puzzles={puzzles}
            settings={settings}
            onClose={() => setViewingPgnCollection(null)}
            onStartTraining={(colId) => {
              setViewingPgnCollection(null);
              handleStartSession(colId);
            }}
          />
        )}
      </main>
    </div>
  );
}
