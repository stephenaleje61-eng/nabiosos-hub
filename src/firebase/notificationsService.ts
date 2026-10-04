import {
  collection,
  deleteDoc,
  doc,
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
import { AppNotification } from '../types';

export async function createNotification(params: {
  recipientId: string;
  senderId?: string;
  senderName?: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message' | 'announcement';
  title: string;
  body: string;
  linkId?: string;
}): Promise<void> {
  // Prevent sending notification to self
  if (params.senderId && params.recipientId === params.senderId) return;

  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notifRef = doc(db, 'notifications', notifId);

  const payload: AppNotification = {
    id: notifId,
    recipientId: params.recipientId,
    senderId: params.senderId || '',
    senderName: params.senderName || '',
    type: params.type,
    title: params.title.slice(0, 100),
    body: params.body.slice(0, 300),
    linkId: params.linkId || '',
    read: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(notifRef, payload);
  } catch (error) {
    console.warn('Could not dispatch notification:', error);
  }
}

export function subscribeToNotifications(
  userId: string,
  onNotifications: (notifications: AppNotification[]) => void
) {
  const notifRef = collection(db, 'notifications');
  const q = query(
    notifRef,
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((d) => {
        notifs.push(d.data() as AppNotification);
      });
      onNotifications(notifs);
    },
    (error) => {
      console.warn('Error subscribing to notifications:', error);
    }
  );
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      read: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notifId}`);
  }
}

export async function deleteNotification(notifId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notifId}`);
  }
}
