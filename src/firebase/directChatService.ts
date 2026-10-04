import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { DirectChat, DirectMessage, UserProfile } from '../types';
import { createNotification } from './notificationsService';

export function getDirectChatId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
}

export async function getOrCreateDirectChat(
  currentUser: UserProfile,
  friend: UserProfile
): Promise<DirectChat> {
  const chatId = getDirectChatId(currentUser.id, friend.id);
  const chatRef = doc(db, 'directChats', chatId);

  try {
    const snap = await getDoc(chatRef);
    if (snap.exists()) {
      return snap.data() as DirectChat;
    }

    const newChat: DirectChat = {
      id: chatId,
      participants: [currentUser.id, friend.id],
      participantIds: `${currentUser.id},${friend.id}`,
      participantDetails: {
        [currentUser.id]: {
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          department: currentUser.department,
          level: currentUser.level,
        },
        [friend.id]: {
          displayName: friend.displayName,
          photoURL: friend.photoURL,
          department: friend.department,
          level: friend.level,
        },
      },
      lastMessageText: '',
      lastMessageSenderId: '',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(chatRef, newChat);
    return newChat;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `directChats/${chatId}`);
  }
}

export function subscribeToDirectMessages(
  chatId: string,
  messageLimit: number,
  onMessages: (messages: DirectMessage[]) => void
) {
  const messagesRef = collection(db, 'directChats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: DirectMessage[] = [];
      snapshot.forEach((d) => {
        msgs.push(d.data() as DirectMessage);
      });
      onMessages(msgs.reverse());
    },
    (error) => {
      console.error(`Error in direct messages for chat ${chatId}:`, error);
      handleFirestoreError(error, OperationType.GET, `directChats/${chatId}/messages`);
    }
  );
}

export async function sendDirectMessage(
  chatId: string,
  sender: UserProfile,
  recipientId: string,
  text: string,
  replyTo?: { id: string; text: string; authorName: string }
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const messageId = `dmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const messageRef = doc(db, 'directChats', chatId, 'messages', messageId);

  const payload: DirectMessage = {
    id: messageId,
    chatId,
    senderId: sender.id,
    senderName: sender.displayName,
    senderPhotoURL: sender.photoURL || '',
    text: trimmed.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };

  if (replyTo) {
    payload.replyToId = replyTo.id;
    payload.replyToText = replyTo.text.slice(0, 200);
    payload.replyToAuthor = replyTo.authorName.slice(0, 60);
  }

  try {
    await setDoc(messageRef, payload);

    // Update parent directChat metadata
    await updateDoc(doc(db, 'directChats', chatId), {
      lastMessageText: trimmed.slice(0, 100),
      lastMessageSenderId: sender.id,
      lastMessageAt: new Date().toISOString(),
    });

    // Notify recipient
    await createNotification({
      recipientId,
      senderId: sender.id,
      senderName: sender.displayName,
      type: 'new_message',
      title: `New message from ${sender.displayName}`,
      body: trimmed.length > 50 ? `${trimmed.slice(0, 50)}...` : trimmed,
      linkId: chatId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `directChats/${chatId}/messages/${messageId}`);
  }
}

export function subscribeToUserDirectChats(
  userId: string,
  onChats: (chats: DirectChat[]) => void
) {
  const chatsRef = collection(db, 'directChats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: DirectChat[] = [];
      snapshot.forEach((d) => {
        chats.push(d.data() as DirectChat);
      });
      onChats(chats);
    },
    (error) => {
      console.warn('Error fetching user direct chats:', error);
    }
  );
}
