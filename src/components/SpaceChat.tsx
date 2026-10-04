import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Heart,
  Reply,
  MoreVertical,
  ShieldAlert,
  UserX,
  Trash2,
  Smile,
  Megaphone,
  ShoppingBag,
  Trophy,
  Dna,
  Users,
  X,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  deleteSpaceMessage,
  sendSpaceMessage,
  subscribeToSpaceMessages,
  toggleMessageLike,
} from '../firebase/spacesService';
import { blockUser } from '../firebase/moderationService';
import { getSpaceDetails, LEVELS } from '../constants/spaces';
import { SpaceMessage, UserProfile } from '../types';

interface SpaceChatProps {
  spaceId: string;
  onSelectSpace: (newSpaceId: string) => void;
  onOpenReportModal: (target: {
    type: 'space_message' | 'message' | 'user';
    id: string;
    reportedUserId: string;
    reportedUserName?: string;
  }) => void;
  onOpenDirectChatWithUser: (user: UserProfile) => void;
}

const QUICK_EMOJIS = ['👍', '🧬', '🔬', '📚', '🔥', '⚽', '👏', '❤️', '💡'];

export const SpaceChat: React.FC<SpaceChatProps> = ({
  spaceId,
  onSelectSpace,
  onOpenReportModal,
  onOpenDirectChatWithUser,
}) => {
  const { profile, blockedUserIds } = useAuth();
  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [messageLimit, setMessageLimit] = useState(35);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState<SpaceMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const spaceInfo = getSpaceDetails(spaceId);

  // Subscribe to real-time messages in current space
  useEffect(() => {
    setActiveMenuMsgId(null);
    setReplyTo(null);

    const unsub = subscribeToSpaceMessages(
      spaceId,
      messageLimit,
      (newMsgs) => {
        setMessages(newMsgs);
        if (newMsgs.length < messageLimit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      },
      (err) => {
        console.error('Chat error:', err);
      }
    );

    return () => unsub();
  }, [spaceId, messageLimit]);

  // Scroll to bottom on initial load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [spaceId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !inputText.trim() || sending) return;

    setSending(true);
    try {
      await sendSpaceMessage(
        spaceId,
        {
          id: profile.id,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          department: profile.department,
          level: profile.level,
        },
        inputText,
        replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text,
              authorName: replyTo.authorName,
            }
          : undefined
      );

      setInputText('');
      setReplyTo(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to post space message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (msg: SpaceMessage) => {
    try {
      await toggleMessageLike(spaceId, msg.id, msg.likesCount || 0);
    } catch (err) {
      console.error('Failed to like message:', err);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (confirm('Delete this message?')) {
      try {
        await deleteSpaceMessage(spaceId, msgId);
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    }
  };

  const handleBlockAuthor = async (authorId: string, authorName: string) => {
    if (!profile) return;
    if (confirm(`Block ${authorName}? Their messages will no longer appear.`)) {
      try {
        await blockUser(profile.id, authorId);
      } catch (err) {
        console.error('Failed to block user:', err);
      }
    }
  };

  const handleLoadEarlier = () => {
    setLoadingEarlier(true);
    setMessageLimit((prev) => prev + 30);
    setTimeout(() => setLoadingEarlier(false), 500);
  };

  // Check if department space and determine base dept ID
  const isDeptSpace = spaceInfo.category === 'department';
  const deptBaseId = isDeptSpace ? spaceId.split('-').slice(0, -1).join('-') : '';
  const currentLvlId = isDeptSpace ? spaceId.split('-').pop() : '';

  // Filter messages from blocked users
  const visibleMessages = messages.filter((m) => !blockedUserIds.includes(m.authorId));

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Space Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              {spaceId === 'announcements' ? (
                <Megaphone className="w-5 h-5 text-amber-400" />
              ) : spaceId === 'market-update' ? (
                <ShoppingBag className="w-5 h-5 text-purple-400" />
              ) : spaceId === 'sport-space' ? (
                <Trophy className="w-5 h-5 text-rose-400" />
              ) : (
                <Dna className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  {spaceInfo.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {spaceInfo.description}
              </p>
            </div>
          </div>

          {/* If Department space, show Level selector pills directly in the header */}
          {isDeptSpace && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden lg:inline">
                Level:
              </span>
              {LEVELS.map((lvl) => {
                const targetSpaceId = `${deptBaseId}-${lvl.id}`;
                const isActive = spaceId === targetSpaceId;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onSelectSpace(targetSpaceId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40"
      >
        {/* Pagination: Load earlier messages */}
        {hasMore && visibleMessages.length >= 35 && (
          <div className="text-center py-2">
            <button
              onClick={handleLoadEarlier}
              disabled={loadingEarlier}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
            >
              {loadingEarlier ? 'Loading earlier records...' : '↑ Load Earlier Messages'}
            </button>
          </div>
        )}

        {/* Space Welcome Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-900/30 mb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Welcome to #{spaceInfo.name}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This is the live discussion space for {spaceInfo.name}. Authenticated students can post
            freely, share academic resources, discuss lectures, and reply to coursemates. Please adhere
            to academic integrity and respect.
          </p>
        </div>

        {visibleMessages.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Dna className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-white">No messages yet in this space</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Be the first coursemate to share an announcement, ask a biology question, or start the conversation!
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe = msg.authorId === profile?.id;

            return (
              <div
                key={msg.id}
                className="group flex items-start gap-3 rounded-2xl p-2 sm:p-2.5 hover:bg-slate-900/50 transition relative"
              >
                {/* Author Avatar */}
                <img
                  src={
                    msg.authorPhotoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      msg.authorName
                    )}`
                  }
                  alt={msg.authorName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0 mt-0.5"
                />

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {msg.authorName}
                    </span>

                    {/* Department & Level Tag */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
                      {msg.authorDepartment} {msg.authorLevel && `• ${msg.authorLevel}`}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {formatChatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Quoted Message Preview if replying */}
                  {msg.replyToText && (
                    <div className="mb-1.5 p-2 rounded-lg bg-slate-900 border-l-2 border-emerald-500 text-xs text-slate-300">
                      <span className="font-bold text-emerald-400 mr-1">
                        Replying to {msg.replyToAuthor}:
                      </span>
                      <span className="truncate inline-block max-w-md align-bottom">
                        "{msg.replyToText}"
                      </span>
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>

                  {/* Message Action Bar (Likes, Reply, Options) */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleLike(msg)}
                      className={`flex items-center gap-1 text-xs px-2 py-0.8 rounded-md transition ${
                        (msg.likesCount || 0) > 0
                          ? 'text-rose-400 bg-rose-950/30 border border-rose-900/50'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/80'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          (msg.likesCount || 0) > 0 ? 'fill-rose-400 text-rose-400' : ''
                        }`}
                      />
                      <span>{msg.likesCount || 0}</span>
                    </button>

                    <button
                      onClick={() => setReplyTo(msg)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-0.8 rounded-md hover:bg-slate-800/80 transition"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>

                    {!isMe && (
                      <button
                        onClick={() =>
                          onOpenDirectChatWithUser({
                            id: msg.authorId,
                            displayName: msg.authorName,
                            photoURL: msg.authorPhotoURL || '',
                            department: msg.authorDepartment || 'Biological Sciences',
                            level: msg.authorLevel || '100 Level',
                            createdAt: '',
                          })
                        }
                        className="text-xs text-slate-400 hover:text-emerald-400 hidden sm:flex items-center gap-1 transition"
                      >
                        <Users className="w-3 h-3" />
                        <span>Direct Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* More Action Menu Trigger */}
                <div className="relative shrink-0">
                  <button
                    onClick={() =>
                      setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)
                    }
                    className="p-1 text-slate-400 hover:text-slate-200 opacity-60 group-hover:opacity-100 rounded-lg hover:bg-slate-800 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuMsgId === msg.id && (
                    <div className="absolute right-0 top-7 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl py-1 z-30 text-xs">
                      <button
                        onClick={() => {
                          setReplyTo(msg);
                          setActiveMenuMsgId(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply in Space</span>
                      </button>

                      {!isMe && (
                        <>
                          <button
                            onClick={() => {
                              setActiveMenuMsgId(null);
                              onOpenReportModal({
                                type: 'space_message',
                                id: msg.id,
                                reportedUserId: msg.authorId,
                                reportedUserName: msg.authorName,
                              });
                            }}
                            className="w-full px-3 py-1.5 text-left text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Report Content</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuMsgId(null);
                              handleBlockAuthor(msg.authorId, msg.authorName);
                            }}
                            className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block User</span>
                          </button>
                        </>
                      )}

                      {isMe && (
                        <button
                          onClick={() => {
                            setActiveMenuMsgId(null);
                            handleDelete(msg.id);
                          }}
                          className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Message</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Reply Banner */}
      {replyTo && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Replying to</span>
            <span className="font-bold text-white truncate">{replyTo.authorName}:</span>
            <span className="text-slate-300 truncate">"{replyTo.text}"</span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setInputText((prev) => prev + e)}
              className="text-base hover:scale-125 transition p-1"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-slate-400 hover:text-emerald-400 transition rounded-xl hover:bg-slate-900"
          title="Emoji Bar"
        >
          <Smile className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={`Post in ${spaceInfo.name}...`}
            maxLength={2000}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none max-h-32"
          />
          {inputText.length > 1500 && (
            <span className="absolute right-3 top-2.5 text-[10px] text-amber-400">
              {2000 - inputText.length}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-2.5 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Send</span>
        </button>
      </form>
    </div>
  );
};

function formatChatTime(isoStr: string) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
