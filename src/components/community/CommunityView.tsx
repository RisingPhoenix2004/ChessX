import React, { useState, useEffect } from 'react';
import {
  CommunityUser,
  PublicProfile,
  LeaderboardItem,
  LeaderboardPeriod,
  LeaderboardFilter,
  UserProfile,
  UserStats
} from '../../types/chess';
import {
  searchUsers,
  getPublicProfile,
  followUser,
  unfollowUser,
  getLeaderboard,
  getSuggestedLearners
} from '../../services/communityApi';
import { ActivityHeatmap } from '../common/ActivityHeatmap';
import {
  Users,
  Search,
  Trophy,
  Flame,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  X,
  ExternalLink,
  Shield,
  Clock,
  Target
} from 'lucide-react';

interface CommunityViewProps {
  currentUser: UserProfile;
  currentUserStats: UserStats;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ currentUser, currentUserStats }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'discover'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Leaderboard state
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly');
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilter>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardItem | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  // Suggested learners
  const [suggestedLearners, setSuggestedLearners] = useState<CommunityUser[]>([]);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);

  // Public Profile Modal
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Load Leaderboard
  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      setIsLeaderboardLoading(true);
      try {
        const data = await getLeaderboard(leaderboardPeriod, leaderboardFilter);
        if (isMounted) {
          setLeaderboard(data.leaderboard);
          setCurrentUserRank(data.currentUserRank);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard:', err);
      } finally {
        if (isMounted) setIsLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [leaderboardPeriod, leaderboardFilter]);

  // Load Discover Learners
  useEffect(() => {
    let isMounted = true;
    const fetchSuggested = async () => {
      setIsDiscoverLoading(true);
      try {
        const list = await getSuggestedLearners();
        if (isMounted) setSuggestedLearners(list);
      } catch (err) {
        console.warn('Failed to load suggested learners:', err);
      } finally {
        if (isMounted) setIsDiscoverLoading(false);
      }
    };

    fetchSuggested();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced User Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleToggleFollow = async (user: CommunityUser) => {
    const isCurrentlyFollowing = user.isFollowing;
    // Optimistic UI update
    const updateFollowStatus = (targetId: string, following: boolean) => {
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isFollowing: following } : u))
      );
      setSuggestedLearners((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isFollowing: following } : u))
      );
      if (selectedUser && selectedUser.id === targetId) {
        setSelectedUser({
          ...selectedUser,
          isFollowing: following,
          followersCount: selectedUser.followersCount + (following ? 1 : -1),
        });
      }
    };

    updateFollowStatus(user.id, !isCurrentlyFollowing);

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
    } catch (err) {
      console.warn('Follow/unfollow failed, rolling back:', err);
      updateFollowStatus(user.id, isCurrentlyFollowing);
    }
  };

  const handleOpenProfile = async (username: string) => {
    setIsLoadingProfile(true);
    try {
      const prof = await getPublicProfile(username);
      if (prof) setSelectedUser(prof);
    } catch (err) {
      console.warn('Failed to open user profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs shadow-md">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 font-black text-xs shadow-md border border-slate-300">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-amber-100 font-black text-xs shadow-md">
          3
        </span>
      );
    }
    return <span className="font-mono font-black text-slate-400 dark:text-slate-500 text-sm">#{rank}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-500" />
            <span>Community</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect with chess learners, discover training partners, and track consistency.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#121827] rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs tracking-tight transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs tracking-tight transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Discover Players
          </button>
        </div>
      </div>

      {/* User Search Bar */}
      <div className="bg-white dark:bg-[#0f1523] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by username or name (e.g. Magnus, Ghandeevam)..."
            className="w-full bg-slate-50 dark:bg-[#151c2e] border border-slate-200 dark:border-slate-700/70 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Results */}
        {searchQuery.trim() && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Search Results {isSearching ? '(Searching...)' : `(${searchResults.length})`}
            </div>

            {searchResults.length === 0 && !isSearching ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 px-1">
                No players found matching "{searchQuery}".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                  >
                    <div
                      onClick={() => handleOpenProfile(user.username)}
                      className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                    >
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          <Flame className="w-3 h-3 fill-amber-500" />
                          <span>{user.currentStreak}d streak</span>
                        </div>
                      </div>
                    </div>

                    {!user.isSelf && (
                      <button
                        onClick={() => handleToggleFollow(user)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          user.isFollowing
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {user.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Leaderboard Header & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-[#201912] border border-amber-200 dark:border-amber-900/50 text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Training Activity Leaderboard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Healthy competition based on consistency, tactical solves, and active streaks.
                </p>
              </div>
            </div>

            {/* Period & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Period Selector */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#161f32] rounded-2xl border border-slate-200 dark:border-slate-800">
                {(['weekly', 'daily', 'monthly', 'streak'] as LeaderboardPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                      leaderboardPeriod === period
                        ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Friends / Global Selector */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#161f32] rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setLeaderboardFilter('global')}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    leaderboardFilter === 'global'
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setLeaderboardFilter('friends')}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    leaderboardFilter === 'friends'
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Friends
                </button>
              </div>
            </div>
          </div>

          {/* Current User Fixed Status Bar if not Top 3 */}
          {currentUserRank && (
            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-3xl flex items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  #{currentUserRank.rank}
                </div>
                <img
                  src={currentUser.avatar || currentUserRank.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">You ({currentUser.name})</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase">
                      Your Rank
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">@{currentUser.username}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base">
                  {currentUserRank.score} {leaderboardPeriod === 'streak' ? 'days' : 'positions'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-end gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{currentUserStats.currentStreak}-day streak</span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table List */}
          <div className="bg-white dark:bg-[#0f1523] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {isLeaderboardLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Loading ranking table...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No players found for this period.
                </p>
                <p className="text-xs text-slate-400">
                  Solve puzzles or invite friends to build up the board!
                </p>
              </div>
            ) : (
              leaderboard.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                    player.isSelf
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-[#141b2b]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 text-center shrink-0">
                      {getRankBadge(player.rank)}
                    </div>

                    <div
                      onClick={() => handleOpenProfile(player.username)}
                      className="flex items-center gap-3 cursor-pointer min-w-0"
                    >
                      <img
                        src={player.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {player.name}
                          </span>
                          {player.isSelf && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          @{player.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white font-mono text-sm sm:text-base">
                      {player.score} {leaderboardPeriod === 'streak' ? 'days' : 'solves'}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3 fill-amber-500" />
                      <span>{player.currentStreak}d</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Discover Players Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>Recommended Chess Learners</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active tactical solvers with consistent training habits.
            </p>
          </div>

          {isDiscoverLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading players...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedLearners.map((user) => (
                <div
                  key={user.id}
                  className="bg-white dark:bg-[#0f1523] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4 hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => handleOpenProfile(user.username)}
                      className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                    >
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/60 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{user.name}</h4>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                    "{user.bio || 'Tactix calculation & chess training enthusiast.'}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#141b2b] text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Streak</div>
                      <div className="font-black text-amber-500 font-mono flex items-center justify-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{user.currentStreak}d</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#141b2b] text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Solved</div>
                      <div className="font-black text-emerald-500 font-mono">{user.totalSolved}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(user)}
                    className={`w-full py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      user.isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    {user.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Player</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Public Profile Popup Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <img
                src={selectedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={selectedUser.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-xl"
              />

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedUser.name}</h2>
                  <span className="text-xs font-mono text-slate-400">@{selectedUser.username}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  "{selectedUser.bio || 'Tactix calculation & chess training enthusiast.'}"
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-black text-slate-900 dark:text-white font-mono">{selectedUser.followersCount}</span> Followers
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white font-mono">{selectedUser.followingCount}</span> Following
                  </div>
                </div>
              </div>

              {!selectedUser.isSelf && (
                <button
                  onClick={() => handleToggleFollow(selectedUser)}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                    selectedUser.isFollowing
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {selectedUser.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{selectedUser.isFollowing ? 'Following' : 'Follow'}</span>
                </button>
              )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Current Streak</span>
                <div className="text-xl font-black text-amber-500 font-mono flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  <span>{selectedUser.currentStreak}d</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Best Streak</span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{selectedUser.bestStreak}d</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Solved</span>
                <div className="text-xl font-black text-emerald-500 font-mono">{selectedUser.totalSolved}</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Accuracy</span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{selectedUser.accuracy}%</div>
              </div>
            </div>

            {/* Public Activity Heatmap */}
            <div className="pt-2">
              <ActivityHeatmap
                heatmapData={selectedUser.heatmapData || {}}
                title={`${selectedUser.name}'s Training Activity`}
                subtitle="Public contribution activity and daily calculation workout."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
