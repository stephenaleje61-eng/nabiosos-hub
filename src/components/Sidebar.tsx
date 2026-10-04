import React, { useState } from 'react';
import {
  Microscope,
  FlaskConical,
  Leaf,
  Dna,
  Megaphone,
  ShoppingBag,
  Trophy,
  Users,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { DEPARTMENTS, LEVELS, SPECIAL_SPACES } from '../constants/spaces';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { OFFICIAL_APP_ICON } from '../constants/appIcon';

interface SidebarProps {
  currentSpaceId: string;
  onSelectSpace: (spaceId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenFriends: () => void;
  onOpenDirectChatWithUser?: (friend: UserProfile) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSpaceId,
  onSelectSpace,
  isOpenMobile,
  onCloseMobile,
  onOpenFriends,
}) => {
  const { profile } = useAuth();
  // Expanded departments state (default to user's department expanded)
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    microbiology: true,
    biochemistry: true,
    'biological-sciences': true,
    'molecular-biology': true,
  });

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const getDeptIcon = (id: string) => {
    switch (id) {
      case 'microbiology':
        return <Microscope className="w-4 h-4 text-emerald-400" />;
      case 'biochemistry':
        return <FlaskConical className="w-4 h-4 text-cyan-400" />;
      case 'biological-sciences':
        return <Leaf className="w-4 h-4 text-green-400" />;
      case 'molecular-biology':
        return <Dna className="w-4 h-4 text-indigo-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSpecialIcon = (id: string) => {
    switch (id) {
      case 'announcements':
        return <Megaphone className="w-4 h-4 text-amber-400" />;
      case 'market-update':
        return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      case 'sport-space':
        return <Trophy className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleSpaceClick = (spaceId: string) => {
    onSelectSpace(spaceId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
          {/* Official Emblem Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/40 shadow-md flex items-center gap-3">
            <img
              src={OFFICIAL_APP_ICON}
              alt="NABIOSOS Emblem"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/50 shadow-inner bg-slate-900 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block truncate">
                Federal Univ. Wukari
              </span>
              <h2 className="text-xs font-black text-white tracking-wide truncate">
                NABIOSOS HUB
              </h2>
              <span className="text-[10px] text-slate-400 truncate block">
                Biological Sciences
              </span>
            </div>
          </div>

          {/* Section: Special Featured Spaces */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                General Spaces
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                Official
              </span>
            </div>

            <div className="space-y-1">
              {SPECIAL_SPACES.map((space) => {
                const isActive = currentSpaceId === space.id;
                return (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceClick(space.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition group text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-900/60 to-slate-900 text-white border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                        {getSpecialIcon(space.id)}
                      </div>
                      <span className="truncate">{space.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Department Live Spaces (100L - 400L) */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Department Spaces
              </span>
              <span className="text-[10px] text-slate-400">100L – 400L</span>
            </div>

            <div className="space-y-2">
              {DEPARTMENTS.map((dept) => {
                const isExpanded = expandedDepts[dept.id] ?? true;
                const isDeptSelected = currentSpaceId.startsWith(dept.id);

                return (
                  <div
                    key={dept.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden"
                  >
                    {/* Department Header */}
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className={`w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold transition text-left ${
                        isDeptSelected ? 'bg-slate-850 text-white' : 'text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getDeptIcon(dept.id)}
                        <span>{dept.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {/* Department Sub-Levels */}
                    {isExpanded && (
                      <div className="p-1.5 bg-slate-950/60 border-t border-slate-800/60 space-y-0.5">
                        {LEVELS.map((lvl) => {
                          const spaceId = `${dept.id}-${lvl.id}`;
                          const isSpaceActive = currentSpaceId === spaceId;

                          return (
                            <button
                              key={lvl.id}
                              onClick={() => handleSpaceClick(spaceId)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                                isSpaceActive
                                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-400/80">#</span>
                                <span>{lvl.label}</span>
                              </span>
                              {lvl.id !== 'all' && (
                                <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                                  {dept.shortName}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Connect & Find Coursemates */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-900/40">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <Users className="w-4 h-4" />
              <span>Connect with Coursemates</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
              Add fellow biology scholars to your friend list to unlock private direct chat.
            </p>
            <button
              onClick={() => {
                onOpenFriends();
                onCloseMobile();
              }}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Find Students</span>
            </button>
          </div>
        </div>

        {/* Bottom Current User Card */}
        {profile && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2.5">
            <img
              src={profile.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + profile.displayName}
              alt={profile.displayName}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-500/50 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{profile.displayName}</p>
              <p className="text-[10px] text-emerald-400 truncate">
                {profile.department} • {profile.level}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
