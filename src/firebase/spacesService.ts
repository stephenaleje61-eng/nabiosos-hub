import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { SpaceMessage } from '../types';

export function subscribeToSpaceMessages(
  spaceId: string,
  messageLimit: number,
  onMessages: (messages: SpaceMessage[]) => void,
  onError?: (err: Error) => void
) {
  const messagesRef = collection(db, 'spaces', spaceId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: SpaceMessage[] = [];
      snapshot.forEach((d) => {
        msgs.push(d.data() as SpaceMessage);
      });
      // Reverse to chronological order (oldest to newest)
      onMessages(msgs.reverse());
    },
    (error) => {
      console.error(`Error subscribing to space ${spaceId} messages:`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `spaces/${spaceId}/messages`);
    }
  );
}

export async function sendSpaceMessage(
  spaceId: string,
  author: {
    id: string;
    displayName: string;
    photoURL?: string;
    department?: string;
    level?: string;
  },
  text: string,
  replyTo?: {
    id: string;
    text: string;
    authorName: string;
  }
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const messageDocRef = doc(db, 'spaces', spaceId, 'messages', messageId);

  const payload: SpaceMessage = {
    id: messageId,
    spaceId,
    authorId: author.id,
    authorName: author.displayName,
    authorPhotoURL: author.photoURL || '',
    authorDepartment: author.department || 'Biological Sciences',
    authorLevel: author.level || '100 Level',
    text: trimmed.slice(0, 2000),
    likesCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (replyTo) {
    payload.replyToId = replyTo.id;
    payload.replyToText = replyTo.text.slice(0, 200);
    payload.replyToAuthor = replyTo.authorName.slice(0, 60);
  }

  try {
    await setDoc(messageDocRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `spaces/${spaceId}/messages/${messageId}`);
  }
}

export async function toggleMessageLike(
  spaceId: string,
  messageId: string,
  currentLikes: number = 0
): Promise<void> {
  const msgRef = doc(db, 'spaces', spaceId, 'messages', messageId);
  try {
    await updateDoc(msgRef, {
      likesCount: currentLikes + 1,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}/messages/${messageId}`);
  }
}

export async function deleteSpaceMessage(spaceId: string, messageId: string): Promise<void> {
  const msgRef = doc(db, 'spaces', spaceId, 'messages', messageId);
  try {
    await deleteDoc(msgRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `spaces/${spaceId}/messages/${messageId}`);
  }
}
