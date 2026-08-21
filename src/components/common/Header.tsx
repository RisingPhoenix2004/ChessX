import React from 'react';
import { ActiveTab, UserStats, UserProfile, ThemeMode } from '../../types/chess';
import { Navbar } from './Navbar';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userStats: UserStats;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  userProfile?: UserProfile;
  currentTheme?: ThemeMode;
  onToggleTheme?: (theme: ThemeMode) => void;
  onOpenLoginPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userStats,
  soundEnabled,
  setSoundEnabled,
  userProfile,
  currentTheme = 'dark',
  onToggleTheme = () => {},
  onOpenLoginPage,
}) => {
  return (
    <Navbar
      currentPath={window.location.pathname}
      activeTab={activeTab}
      onNavigate={(path, tab) => setActiveTab(tab || 'dashboard')}
      userStats={userStats}
      userProfile={userProfile || { id: 'guest', name: 'Guest', email: '', avatar: '', isLoggedIn: false }}
      currentTheme={currentTheme}
      onToggleTheme={onToggleTheme}
      soundEnabled={soundEnabled}
      setSoundEnabled={setSoundEnabled}
      onLogout={() => {}}
      onOpenLogin={onOpenLoginPage || (() => {})}
    />
  );
};
