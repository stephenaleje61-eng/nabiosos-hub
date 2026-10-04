import React from 'react';
import { Bell, CheckCheck, MessageSquare, UserPlus, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { markNotificationAsRead } from '../firebase/notificationsService';
import { AppNotification } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDirectChat?: (chatId: string) => void;
  onOpenFriends?: () => void;
  onOpenSpace?: (spaceId: string) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onOpenDirectChat,
  onOpenFriends,
  onOpenSpace,
}) => {
  const { notifications } = useAuth();

  if (!isOpen) return null;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
      if (onOpenFriends) onOpenFriends();
    } else if (notif.type === 'new_message' && notif.linkId) {
      if (onOpenDirectChat) onOpenDirectChat(notif.linkId);
    } else if (notif.type === 'announcement') {
      if (onOpenSpace) onOpenSpace('announcements');
    }
    onClose();
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await markNotificationAsRead(n.id);
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px] animate-in fade-in zoom-in-95 duration-150">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Notifications</h3>
          {notifications.some((n) => !n.read) && (
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold">
              {notifications.filter((n) => !n.read).length} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No notifications yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              You will be notified about messages, announcements, and friend requests here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/60 cursor-pointer transition ${
                !notif.read ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                {notif.type === 'friend_request' || notif.type === 'friend_accepted' ? (
                  <UserPlus className="w-4 h-4 text-teal-400" />
                ) : notif.type === 'new_message' ? (
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {formatTimestamp(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function formatTimestamp(isoStr: string) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
