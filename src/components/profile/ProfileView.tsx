import React, { useState, useEffect } from 'react';
import { UserStats, Achievement, UserProfile, PublicProfile, ActiveTab } from '../../types/chess';
import { Flame, Camera, Edit3, Users, UserPlus, UserCheck, ArrowLeft, Award, CheckCircle2, Shield } from 'lucide-react';
import { AvatarUploadModal } from './AvatarUploadModal';
import { ActivityHeatmap } from '../common/ActivityHeatmap';
import { updateProfile } from '../../services/userApi';
import { getPublicProfile, followUser, unfollowUser } from '../../services/communityApi';

interface ProfileViewProps {
  userProfile: UserProfile;
  userStats: UserStats;
  achievements: Achievement[];
  viewingUsername?: string | null;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onNavigate?: (path: string, tab?: ActiveTab) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  userStats,
  achievements,
  viewingUsername,
  onUpdateProfile,
  onNavigate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [name, setName] = useState(userProfile.name || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  // Other User Profile State
  const [otherUser, setOtherUser] = useState<PublicProfile | null>(null);
  const [isLoadingOtherUser, setIsLoadingOtherUser] = useState(false);
  const [otherUserError, setOtherUserError] = useState<string | null>(null);

  const isSelf =
    !viewingUsername ||
    viewingUsername.toLowerCase() === (userProfile.username || '').toLowerCase() ||
    viewingUsername === 'me';

  useEffect(() => {
    let isMounted = true;
    if (!isSelf && viewingUsername) {
      setIsLoadingOtherUser(true);
      setOtherUserError(null);

      getPublicProfile(viewingUsername)
        .then((data) => {
          if (isMounted) {
            if (data) {
              setOtherUser(data);
            } else {
              setOtherUserError(`User @${viewingUsername} not found.`);
            }
          }
        })
        .catch(() => {
          if (isMounted) setOtherUserError(`Failed to load profile for @${viewingUsername}.`);
        })
        .finally(() => {
          if (isMounted) setIsLoadingOtherUser(false);
        });
    } else {
      setOtherUser(null);
      setOtherUserError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [viewingUsername, isSelf]);

  const handleToggleFollow = async () => {
    if (!otherUser || !userProfile.isLoggedIn) return;
    const isCurrentlyFollowing = otherUser.isFollowing;
    const newFollowing = !isCurrentlyFollowing;
    const newFollowersCount = Math.max(0, (otherUser.followersCount || 0) + (newFollowing ? 1 : -1));
    const newFriendsCount = Math.min(newFollowersCount, otherUser.followingCount || 0);

    setOtherUser({
      ...otherUser,
      isFollowing: newFollowing,
      followersCount: newFollowersCount,
      friendsCount: newFriendsCount,
    });

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(otherUser.id);
      } else {
        await followUser(otherUser.id);
      }
    } catch {
      // rollback
      setOtherUser({
        ...otherUser,
        isFollowing: isCurrentlyFollowing,
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updatedData: Partial<UserProfile> = {
        name: name.trim() || userProfile.name,
        bio: bio.trim(),
      };
      const updated = await updateProfile(updatedData);
      onUpdateProfile({
        ...userProfile,
        ...updated,
      });
      setIsEditing(false);
    } catch {
      onUpdateProfile({
        ...userProfile,
        name: name.trim() || userProfile.name,
        bio: bio.trim(),
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpdated = (newAvatarUrl: string) => {
    onUpdateProfile({
      ...userProfile,
      avatar: newAvatarUrl,
    });
  };

  if (!isSelf) {
    if (isLoadingOtherUser) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-3 font-sans">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-500">Loading @{viewingUsername}'s profile...</p>
        </div>
      );
    }

    if (otherUserError || !otherUser) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
          <p className="text-base text-neutral-600 dark:text-neutral-400 font-bold">{otherUserError || 'User profile not found.'}</p>
          <button
            onClick={() => onNavigate ? onNavigate('/community', 'community') : window.history.back()}
            className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </button>
        </div>
      );
    }

    const friendsCount = otherUser.friendsCount !== undefined
      ? otherUser.friendsCount
      : Math.min(otherUser.followersCount || 0, otherUser.followingCount || 0);

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate ? onNavigate('/community', 'community') : window.history.back()}
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Community</span>
          </button>
        </div>

        {/* Other Player Header Profile Card */}
        <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {otherUser.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={otherUser.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-neutral-300 dark:ring-neutral-700 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-3xl flex items-center justify-center shadow-sm">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{otherUser.currentStreak}-Day Active Streak</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <Users className="w-3.5 h-3.5" />
                    <span>{friendsCount} Friends</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white">{otherUser.name}</h1>
                <p className="text-xs text-neutral-500 font-mono">@{otherUser.username}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
                  {otherUser.bio || 'Chess enthusiast learning calculation and tactics with ChessX.'}
                </p>
              </div>
            </div>

            {userProfile.isLoggedIn && (
              <button
                onClick={handleToggleFollow}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  otherUser.isFollowing
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {otherUser.isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick KPI Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">POSITIONS SOLVED</span>
              <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-0.5">{otherUser.totalSolved}</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">OVERALL ACCURACY</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{otherUser.accuracy}%</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">BEST STREAK</span>
              <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-0.5">{otherUser.bestStreak} Days</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">COMMUNITY FRIENDS</span>
              <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-0.5">{friendsCount}</div>
            </div>
          </div>
        </div>

        {/* Other User Activity Heatmap */}
        <ActivityHeatmap
          heatmapData={otherUser.heatmapData || {}}
          title={`${otherUser.name}'s Training Activity`}
          subtitle="52-week calculation workout log."
        />
      </div>
    );
  }

  // --- SELF PROFILE VIEW ---
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const displayName = userProfile.name || userProfile.username || 'ChessX Player';
  const displayHandle = userProfile.username || 'player';
  const selfFriendsCount = userProfile.friendsCount !== undefined
    ? userProfile.friendsCount
    : Math.min(userProfile.followersCount || 0, userProfile.followingCount || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Player Header Profile Card */}
      <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar with Click-to-Upload Trigger */}
            <div
              onClick={() => setShowAvatarModal(true)}
              className="relative group cursor-pointer"
              title="Change Profile Photo"
            >
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-neutral-300 dark:ring-neutral-700 shadow-sm group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-3xl flex items-center justify-center shadow-sm group-hover:opacity-80 transition-opacity">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{userStats.currentStreak}-Day Active Streak</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Users className="w-3.5 h-3.5" />
                  <span>{selfFriendsCount} Friends</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white">{displayName}</h1>
              <p className="text-xs text-neutral-500 font-mono">@{displayHandle}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
                {userProfile.bio || 'Tactix calculation & chess training enthusiast.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Details Edit Drawer */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="p-5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-4 pt-4"
          >
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Edit Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short chess motto or goal..."
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Quick KPI Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">POSITIONS SOLVED</span>
            <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-0.5">{userStats.totalSolved}</div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">OVERALL ACCURACY</span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{userStats.accuracy}%</div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">BEST STREAK</span>
            <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-0.5">{userStats.bestStreak} Days</div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">ACHIEVEMENTS</span>
            <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-0.5">{unlockedCount} / {achievements.length}</div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap
        heatmapData={userStats.heatmapData}
        title="Training Consistency Heatmap"
        subtitle="52-week activity log representing daily calculation habits."
      />

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <AvatarUploadModal
          onClose={() => setShowAvatarModal(false)}
          currentAvatar={userProfile.avatar}
          onAvatarUpdated={handleAvatarUpdated}
        />
      )}
    </div>
  );
};
