import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Users,
  MessageSquare,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationsPopover } from './NotificationsPopover';
import { logoutUser } from '../firebase/authService';
import { UserProfile } from '../types';
import { OFFICIAL_APP_ICON } from '../constants/appIcon';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onOpenDirectChatWithUser: (user: UserProfile) => void;
  onSelectSpace: (spaceId: string) => void;
  activeSpaceName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenFriends,
  onOpenProfile,
  onOpenDirectChatWithUser,
  onSelectSpace,
  activeSpaceName,
}) => {
  const { profile, unreadNotificationsCount, pendingFriendRequests } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 border-b border-emerald-950/60 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-5 flex items-center justify-between">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800 transition lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={OFFICIAL_APP_ICON}
            alt="NABIOSOS Hub Official Icon"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-600/20 ring-1 ring-emerald-500/50 bg-slate-900"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-emerald-400">
                NABIOSOS
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Hub
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
              FUW Biological Sciences
            </p>
          </div>
        </div>

        {/* Current Space Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
          <span className="text-slate-500 font-medium">Space:</span>
          <span className="text-emerald-300 font-bold bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
            {activeSpaceName}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Friends & Coursemates Button */}
        <button
          onClick={onOpenFriends}
          className="relative p-2 sm:px-3 sm:py-1.5 text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          title="Coursemates & Friends"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Coursemates</span>
          {pendingFriendRequests.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full absolute -top-1 -right-1">
              {pendingFriendRequests.length}
            </span>
          )}
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 sm:px-3 sm:py-1.5 text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full absolute -top-1 -right-1 animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <NotificationsPopover
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onOpenFriends={onOpenFriends}
            onOpenSpace={onSelectSpace}
          />
        </div>

        {/* Profile Card / Modal Trigger */}
        {profile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition text-left"
          >
            <img
              src={profile.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + profile.displayName}
              alt={profile.displayName}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-500/40"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white truncate max-w-[100px]">
                {profile.displayName.split(' ')[0]}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium truncate max-w-[100px]">
                {profile.department?.slice(0, 12)}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          </button>
        )}
      </div>
    </header>
  );
};
