import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SpaceChat } from './components/SpaceChat';
import { FriendsModal } from './components/FriendsModal';
import { DirectChatModal } from './components/DirectChatModal';
import { ProfileModal } from './components/ProfileModal';
import { ReportModal } from './components/ReportModal';
import { getSpaceDetails } from './constants/spaces';
import { UserProfile } from './types';
import { OFFICIAL_APP_ICON } from './constants/appIcon';

function MainApp() {
  const { user, profile, loading } = useAuth();

  // Active space state (defaults to announcements or user's department space)
  const [currentSpaceId, setCurrentSpaceId] = useState<string>('announcements');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Modals state
  const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [directChatFriend, setDirectChatFriend] = useState<UserProfile | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    type: 'space_message' | 'message' | 'user';
    id: string;
    reportedUserId: string;
    reportedUserName?: string;
  } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="relative mb-4">
          <img
            src={OFFICIAL_APP_ICON}
            alt="NABIOSOS Hub Official Icon"
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-500/50 animate-pulse bg-slate-900"
          />
        </div>
        <h2 className="text-xl font-black tracking-wider text-emerald-400">NABIOSOS HUB</h2>
        <p className="text-xs text-slate-400 mt-1">Federal University Wukari • Biological Sciences</p>
      </div>
    );
  }

  // If not logged in or profile not ready, show the Welcome Screen
  if (!user || !profile) {
    return <WelcomeScreen />;
  }

  const spaceDetails = getSpaceDetails(currentSpaceId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDirectChatWithUser={(friend) => setDirectChatFriend(friend)}
        onSelectSpace={(spaceId) => setCurrentSpaceId(spaceId)}
        activeSpaceName={spaceDetails.name}
      />

      {/* Main Workspace: Sidebar + Live Space Chat */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentSpaceId={currentSpaceId}
          onSelectSpace={(spaceId) => setCurrentSpaceId(spaceId)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onOpenDirectChatWithUser={(friend) => setDirectChatFriend(friend)}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <SpaceChat
            spaceId={currentSpaceId}
            onSelectSpace={(spaceId) => setCurrentSpaceId(spaceId)}
            onOpenReportModal={(target) => setReportTarget(target)}
            onOpenDirectChatWithUser={(friend) => setDirectChatFriend(friend)}
          />
        </main>
      </div>

      {/* Friends & Coursemates Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onOpenDirectChatWithUser={(friend) => setDirectChatFriend(friend)}
      />

      {/* Direct 1-on-1 Chat Modal */}
      {directChatFriend && (
        <DirectChatModal
          friend={directChatFriend}
          onClose={() => setDirectChatFriend(null)}
          onReportUser={(reportedUser) =>
            setReportTarget({
              type: 'user',
              id: reportedUser.id,
              reportedUserId: reportedUser.id,
              reportedUserName: reportedUser.displayName,
            })
          }
        />
      )}

      {/* Student Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Moderation / Abuse Reporting Modal */}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
