import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Reply,
  ShieldAlert,
  UserX,
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getOrCreateDirectChat,
  sendDirectMessage,
  subscribeToDirectMessages,
} from '../firebase/directChatService';
import { blockUser } from '../firebase/moderationService';
import { DirectChat, DirectMessage, UserProfile } from '../types';

interface DirectChatModalProps {
  friend: UserProfile;
  onClose: () => void;
  onReportUser: (user: UserProfile) => void;
}

const EMOJIS = ['👍', '🧬', '🔬', '👋', '🔥', '📚', '🤝', '😂', '🎉'];

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  friend,
  onClose,
  onReportUser,
}) => {
  const { profile, blockedUserIds } = useAuth();
  const [chat, setChat] = useState<DirectChat | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch DirectChat doc
  useEffect(() => {
    if (!profile) return;
    let isMounted = true;

    getOrCreateDirectChat(profile, friend)
      .then((c) => {
        if (isMounted) {
          setChat(c);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error opening direct chat:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profile, friend]);

  // Subscribe to direct messages
  useEffect(() => {
    if (!chat) return;

    const unsub = subscribeToDirectMessages(chat.id, 50, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsub();
  }, [chat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !chat || !inputText.trim() || sending) return;

    setSending(true);
    try {
      await sendDirectMessage(
        chat.id,
        profile,
        friend.id,
        inputText,
        replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text,
              authorName: replyTo.senderName,
            }
          : undefined
      );
      setInputText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to send direct message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!profile) return;
    if (confirm(`Are you sure you want to block ${friend.displayName}?`)) {
      await blockUser(profile.id, friend.id);
      onClose();
    }
  };

  const isBlocked = blockedUserIds.includes(friend.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl h-[90vh] max-h-[700px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={friend.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + friend.displayName}
                alt={friend.displayName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/50 shrink-0"
              />
              <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full absolute bottom-0 right-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {friend.displayName}
              </h3>
              <p className="text-xs text-emerald-400 truncate">
                {friend.department} • {friend.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReportUser(friend);
                  }}
                  className="w-full px-3 py-2 text-left text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Report User</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleBlock();
                  }}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block User</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Connecting private channel...
            </div>
          ) : isBlocked ? (
            <div className="py-12 text-center text-xs text-rose-400">
              You have blocked this student. Messages are hidden.
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Smile className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">Private Chat Started</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Say hello to {friend.displayName}! This chat is end-to-end between you and your accepted friend.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === profile?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  {/* Quoted Message Preview */}
                  {msg.replyToText && (
                    <div
                      className={`text-[11px] px-2.5 py-1 mb-1 rounded-md border-l-2 ${
                        isMe
                          ? 'bg-emerald-950/60 border-emerald-400 text-slate-300'
                          : 'bg-slate-800 border-slate-500 text-slate-400'
                      }`}
                    >
                      <span className="font-semibold text-emerald-400 mr-1">
                        {msg.replyToAuthor}:
                      </span>
                      <span className="truncate inline-block max-w-[200px]">
                        {msg.replyToText}
                      </span>
                    </div>
                  )}

                  <div className="flex items-end gap-1.5 max-w-[85%]">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-slate-800 text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                      </div>
                    </div>

                    <button
                      onClick={() => setReplyTo(msg)}
                      title="Reply"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Bar */}
        {replyTo && (
          <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Replying to</span>
              <span className="font-bold text-white truncate">{replyTo.senderName}:</span>
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

        {/* Emoji Quick Bar */}
        {showEmojiPicker && (
          <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
            {EMOJIS.map((e) => (
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

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-slate-400 hover:text-emerald-400 transition rounded-lg hover:bg-slate-900"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${friend.displayName}...`}
            disabled={isBlocked || sending}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending || isBlocked}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center cursor-pointer shadow-md shadow-emerald-900/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

function formatTime(isoStr: string) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
