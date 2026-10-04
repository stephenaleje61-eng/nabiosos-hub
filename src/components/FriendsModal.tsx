import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  MessageCircle,
  GraduationCap,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  acceptFriendRequest,
  declineFriendRequest,
  searchStudents,
  sendFriendRequest,
  subscribeToSentFriendRequests,
} from '../firebase/friendsService';
import { FriendRequest, Friendship, UserProfile } from '../types';
import { fetchUserProfile } from '../firebase/authService';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDirectChatWithUser: (friend: UserProfile) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onOpenDirectChatWithUser,
}) => {
  const { profile, pendingFriendRequests, friendships } = useAuth();
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendsProfiles, setFriendsProfiles] = useState<UserProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  // Subscribe to sent friend requests
  useEffect(() => {
    if (!profile || !isOpen) return;
    const unsub = subscribeToSentFriendRequests(profile.id, (reqs) => {
      setSentRequests(reqs);
      setRequestSentIds(new Set(reqs.map((r) => r.toUserId)));
    });
    return () => unsub();
  }, [profile, isOpen]);

  // Load friends profiles when friendships change or modal opens
  useEffect(() => {
    if (!profile || !isOpen) return;

    let isMounted = true;
    async function loadFriends() {
      setLoadingFriends(true);
      const list: UserProfile[] = [];
      for (const f of friendships) {
        const otherUid = f.user1Id === profile?.id ? f.user2Id : f.user1Id;
        try {
          const userP = await fetchUserProfile(otherUid);
          if (userP) list.push(userP);
        } catch (err) {
          console.error(err);
        }
      }
      if (isMounted) {
        setFriendsProfiles(list);
        setLoadingFriends(false);
      }
    }

    loadFriends();
    return () => {
      isMounted = false;
    };
  }, [friendships, profile, isOpen]);

  // Auto-search / initial load in search tab
  useEffect(() => {
    if (tab === 'search' && profile) {
      setSearching(true);
      searchStudents(searchQuery, profile.id)
        .then((res) => {
          setSearchResults(res);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }
  }, [tab, searchQuery, profile]);

  if (!isOpen) return null;

  const handleAccept = async (req: FriendRequest) => {
    if (!profile) return;
    try {
      setActionError(null);
      await acceptFriendRequest(req, profile);
    } catch (err: any) {
      setActionError(err.message || 'Could not accept friend request');
    }
  };

  const handleDecline = async (reqId: string) => {
    try {
      setActionError(null);
      await declineFriendRequest(reqId);
    } catch (err: any) {
      setActionError(err.message || 'Could not decline friend request');
    }
  };

  const handleSendRequest = async (targetUser: UserProfile) => {
    if (!profile) return;
    try {
      setActionError(null);
      await sendFriendRequest(profile, targetUser);
      setRequestSentIds((prev) => new Set(prev).add(targetUser.id));
    } catch (err: any) {
      setActionError(err.message || 'Could not send friend request');
    }
  };

  const friendIds = new Set(
    friendships.map((f) => (f.user1Id === profile?.id ? f.user2Id : f.user1Id))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Coursemates & Friends</h2>
              <p className="text-xs text-slate-400">
                Connect and start private 1-on-1 chats with accepted friends
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'friends'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Friends ({friendsProfiles.length})</span>
          </button>

          <button
            onClick={() => setTab('requests')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 relative ${
              tab === 'requests'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingFriendRequests.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingFriendRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'search'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Students</span>
          </button>
        </div>

        {actionError && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* TAB 1: FRIENDS */}
          {tab === 'friends' && (
            <div>
              {loadingFriends ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading your coursemates...
                </div>
              ) : friendsProfiles.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No accepted friends yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                    Send friend requests to coursemates in Microbiology, Biochemistry, Molecular Biology, and Biological Sciences.
                  </p>
                  <button
                    onClick={() => setTab('search')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Coursemates</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {friendsProfiles.map((friend) => (
                    <div
                      key={friend.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={friend.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + friend.displayName}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {friend.displayName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <span className="text-emerald-400 font-medium">
                              {friend.department}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">{friend.level}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onOpenDirectChatWithUser(friend);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-900/30"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat 1-on-1</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {tab === 'requests' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Incoming Requests ({pendingFriendRequests.length})
                </h4>
                {pendingFriendRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No pending friend requests.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingFriendRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={req.fromUserPhotoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + req.fromUserName}
                            alt={req.fromUserName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {req.fromUserName}
                            </p>
                            <p className="text-[11px] text-emerald-400">
                              {req.fromUserDepartment || 'NABIOSOS'} • {req.fromUserLevel || 'Student'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAccept(req)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 px-2.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {sentRequests.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Sent Requests ({sentRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {sentRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 bg-slate-950/30 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-white font-medium truncate">
                            {req.toUserName}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                            req.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : req.status === 'declined'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-300 flex items-center gap-1'
                          }`}
                        >
                          {req.status === 'pending' && <Clock className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEARCH */}
          {tab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coursemates by name or department..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {searching ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Searching students...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No students found matching "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-2 divide-y divide-slate-800/60">
                  {searchResults.map((stu) => {
                    const isFriend = friendIds.has(stu.id);
                    const isPending = requestSentIds.has(stu.id);

                    return (
                      <div
                        key={stu.id}
                        className="pt-2.5 pb-1 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={stu.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + stu.displayName}
                            alt={stu.displayName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">
                              {stu.displayName}
                            </h5>
                            <p className="text-[11px] text-slate-400 truncate">
                              <span className="text-emerald-400 font-semibold">{stu.department}</span>
                              {' • '}
                              <span>{stu.level}</span>
                            </p>
                          </div>
                        </div>

                        {isFriend ? (
                          <button
                            onClick={() => {
                              onOpenDirectChatWithUser(stu);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        ) : isPending ? (
                          <span className="text-[11px] text-amber-400 font-semibold px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            Request Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(stu)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Friend</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
