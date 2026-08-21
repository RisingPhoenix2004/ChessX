import React, { useState } from 'react';
import { UserStats, Achievement, UserProfile } from '../../types/chess';
import { Trophy, Settings, Flame, CheckCircle2, Edit3, Camera, Save, X, Activity, Award, Shield, Target, Sparkles } from 'lucide-react';
import { AvatarUploadModal } from './AvatarUploadModal';
import { ActivityHeatmap } from '../common/ActivityHeatmap';
import { updateProfile } from '../../services/userApi';

interface ProfileViewProps {
  userProfile: UserProfile;
  userStats: UserStats;
  achievements: Achievement[];
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  userStats,
  achievements,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [name, setName] = useState(userProfile.name || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

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

  const displayName = userProfile.name || userProfile.username || 'Tactix Solver';
  const displayHandle = userProfile.username || 'player';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Player Header Profile Card */}
      <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
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
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-xl group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-600 text-white font-black text-4xl flex items-center justify-center shadow-xl group-hover:opacity-80 transition-opacity">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-[#1d1610] border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{userStats.currentStreak}-Day Active Streak</span>
              </div>

              <h1 className="text-3xl font-black text-slate-900 dark:text-white">{displayName}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{displayHandle}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md italic">
                "{userProfile.bio || 'Tactix calculation & chess training enthusiast.'}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#141b2b] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Change Photo</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Details Edit Drawer */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="p-5 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 pt-4"
          >
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Edit Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Personal Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your calculation goals..."
                  className="w-full bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>
        )}
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0f1523] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span>CURRENT STREAK</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
            <span>{userStats.currentStreak} Days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span>MAXIMUM STREAK</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>{userStats.bestStreak} Days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span>POSITIONS SOLVED</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{userStats.totalSolved} Positions</div>
        </div>
      </div>

      {/* 52-Week Training Activity Heatmap */}
      <ActivityHeatmap
        heatmapData={userStats.heatmapData}
        title="Training Activity Heatmap"
        subtitle="52-week contribution calendar representing your daily calculation workout."
      />

      {/* Achievements / Consistency Badges */}
      <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Achievements & Badges</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Milestones unlocked through tactical solving consistency.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const getAchievementSvg = (id: string) => {
              if (id.includes('streak')) return <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />;
              if (id.includes('goal') || id.includes('first')) return <Target className="w-5 h-5 text-emerald-500" />;
              if (id.includes('flawless')) return <Sparkles className="w-5 h-5 text-blue-500" />;
              return <Award className="w-5 h-5 text-amber-500" />;
            };

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  ach.unlocked
                    ? 'bg-slate-50 dark:bg-[#141b2b] border-emerald-500/30'
                    : 'bg-slate-50/50 dark:bg-[#111624]/60 border-slate-200 dark:border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1a2336] border border-slate-200 dark:border-slate-700 shrink-0">
                    {getAchievementSvg(ach.id)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{ach.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{ach.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <AvatarUploadModal
          currentAvatar={userProfile.avatar}
          onAvatarUpdated={handleAvatarUpdated}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
};
