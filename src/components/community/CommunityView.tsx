import React, { useState, useEffect } from 'react';
import {
  CommunityUser,
  LeaderboardItem,
  LeaderboardPeriod,
  LeaderboardFilter,
  UserProfile,
  UserStats,
  ActiveTab
} from '../../types/chess';
import {
  searchUsers,
  followUser,
  unfollowUser,
  getLeaderboard,
  getSuggestedLearners
} from '../../services/communityApi';
import {
  Search,
  Flame,
  X,
  Users,
  Trophy,
} from 'lucide-react';

interface CommunityViewProps {
  currentUser: UserProfile;
  currentUserStats: UserStats;
  onNavigate?: (path: string, tab?: ActiveTab) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ currentUser, onNavigate }) => {
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
    const updateFollowStatus = (targetId: string, following: boolean) => {
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isFollowing: following } : u))
      );
      setSuggestedLearners((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isFollowing: following } : u))
      );
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

  const handleOpenPublicProfile = (username: string) => {
    if (onNavigate) {
      onNavigate(`/profile/${username}`, 'profile');
    } else {
      window.location.href = `/profile/${username}`;
    }
  };

  // Check if current user is already present in the visible leaderboard table
  const isUserInVisibleLeaderboard = leaderboard.some(
    (player) => player.isSelf || player.id === currentUser.id || player.username === currentUser.username
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
          Community
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Connect with chess learners, view leaderboards, and search players.
        </p>
      </div>

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players by username or name (e.g. Magnus, Ghandeevam)..."
          className="w-full bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
        />

        {searchQuery.trim() && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Search Results Dropdown/Section */}
      {searchQuery.trim() && (
        <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold text-neutral-500">
            {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
          </div>

          {searchResults.length === 0 && !isSearching ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No players found matching "{searchQuery}".</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => handleOpenPublicProfile(user.username)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {!user.isSelf && currentUser?.isLoggedIn && (
                    <button
                      onClick={() => handleToggleFollow(user)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                        user.isFollowing
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                          : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard View */}
      <div className="space-y-4">
          {/* Leaderboard Controls Toolbar */}
          <div className="p-4 bg-white dark:bg-[#111520] rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                Training Activity Leaderboard
              </h2>
              <p className="text-xs text-neutral-500">
                Healthy competition based on consistency, tactical solves, and active streaks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Selector */}
              <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                {(['daily', 'weekly', 'monthly', 'streak'] as LeaderboardPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      leaderboardPeriod === period
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Filter Selector */}
              <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <button
                  onClick={() => setLeaderboardFilter('global')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    leaderboardFilter === 'global'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Trophy className="w-3 h-3" />
                  <span>Global</span>
                </button>
                <button
                  onClick={() => setLeaderboardFilter('friends')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    leaderboardFilter === 'friends'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Friends</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current User Rank Card (Only if NOT visible in the table) */}
          {currentUserRank && !isUserInVisibleLeaderboard && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold font-mono text-xs flex items-center justify-center shadow-xs">
                  #{currentUserRank.rank}
                </div>
                <img
                  src={currentUserRank.avatar}
                  alt={currentUserRank.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">Your Current Standing</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    {currentUserRank.score} {leaderboardPeriod === 'streak' ? 'days' : 'solves'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {currentUserRank.currentStreak}d streak
                </span>
              </div>
            </div>
          )}

          {/* Leaderboard Table List */}
          <div className="bg-white dark:bg-[#111520] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden">
            {isLeaderboardLoading ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading leaderboard standings...</div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">No players found for this filter.</div>
            ) : (
              leaderboard.map((player) => (
                <div
                  key={player.id}
                  className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                    player.isSelf ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                        player.rank === 1
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : player.rank === 2
                          ? 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                          : player.rank === 3
                          ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'text-neutral-400'
                      }`}
                    >
                      {player.rank}
                    </div>

                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer shrink-0"
                      onClick={() => handleOpenPublicProfile(player.username)}
                    />

                    <div
                      onClick={() => handleOpenPublicProfile(player.username)}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {player.name || player.username}
                        </span>
                        {player.isSelf && (
                          <span className="px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[10px] font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500">@{player.username}</span>
                    </div>
                  </div>

                  {/* Score & Metric */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-neutral-900 dark:text-white font-mono text-xs sm:text-sm">
                      {player.score} {leaderboardPeriod === 'streak' ? 'days' : 'solves'}
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{player.currentStreak}d</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
};
