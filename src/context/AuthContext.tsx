import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection } from '../firebase/config';
import { fetchUserProfile } from '../firebase/authService';
import { subscribeToBlockedUsers } from '../firebase/moderationService';
import { subscribeToNotifications } from '../firebase/notificationsService';
import { subscribeToIncomingFriendRequests, subscribeToFriendships } from '../firebase/friendsService';
import { AppNotification, FriendRequest, Friendship, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  blockedUserIds: string[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  pendingFriendRequests: FriendRequest[];
  friendships: Friendship[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  blockedUserIds: [],
  notifications: [],
  unreadNotificationsCount: 0,
  pendingFriendRequests: [],
  friendships: [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);

  // Test connection on boot
  useEffect(() => {
    testConnection().catch(() => {});
    // Safety fallback: Ensure loading is never permanently true (e.g. network latency)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timeout);
  }, []);

  const loadProfile = async (currentUser: User) => {
    try {
      let p = await fetchUserProfile(currentUser.uid);
      if (!p) {
        // Fallback default profile if document doesn't exist yet
        p = {
          id: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'NABIOSOS Scholar',
          photoURL:
            currentUser.photoURL ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              currentUser.displayName || 'Student'
            )}&backgroundColor=059669`,
          department: 'Biological Sciences',
          level: '100 Level',
          bio: 'Proud member of NABIOSOS Hub',
          createdAt: new Date().toISOString(),
        };
      }
      setProfile(p);
    } catch (err) {
      console.warn('Error loading profile, applying local fallback:', err);
      setProfile({
        id: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'NABIOSOS Scholar',
        photoURL: currentUser.photoURL || '',
        department: 'Biological Sciences',
        level: '100 Level',
        bio: 'Member of NABIOSOS Hub',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
        setBlockedUserIds([]);
        setNotifications([]);
        setPendingFriendRequests([]);
        setFriendships([]);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listeners for active user
  useEffect(() => {
    if (!user) return;

    const unsubBlocks = subscribeToBlockedUsers(user.uid, (ids) => {
      setBlockedUserIds(ids);
    });

    const unsubNotifs = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    const unsubReqs = subscribeToIncomingFriendRequests(user.uid, (reqs) => {
      setPendingFriendRequests(reqs);
    });

    const unsubFriends = subscribeToFriendships(user.uid, (friends) => {
      setFriendships(friends);
    });

    return () => {
      unsubBlocks();
      unsubNotifs();
      unsubReqs();
      unsubFriends();
    };
  }, [user]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
        blockedUserIds,
        notifications,
        unreadNotificationsCount,
        pendingFriendRequests,
        friendships,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
