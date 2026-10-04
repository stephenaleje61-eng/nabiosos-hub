import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { UserBlock, UserReport } from '../types';

export async function submitReport(
  reporterId: string,
  reportedUserId: string,
  targetType: 'message' | 'space_message' | 'user',
  targetId: string,
  reason: string,
  details?: string
): Promise<void> {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload: UserReport = {
    id: reportId,
    reporterId,
    reportedUserId,
    targetType,
    targetId,
    reason: reason.slice(0, 200),
    details: details ? details.slice(0, 500) : '',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'reports', reportId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reports/${reportId}`);
  }
}

export async function blockUser(blockerId: string, blockedUserId: string): Promise<void> {
  const blockId = `block_${blockerId}_${blockedUserId}`;
  const payload: UserBlock = {
    id: blockId,
    blockerId,
    blockedUserId,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'blocks', blockId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blocks/${blockId}`);
  }
}

export async function unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
  const blockId = `block_${blockerId}_${blockedUserId}`;
  try {
    await deleteDoc(doc(db, 'blocks', blockId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `blocks/${blockId}`);
  }
}

export function subscribeToBlockedUsers(
  userId: string,
  onBlockedIds: (ids: string[]) => void
) {
  const q = query(collection(db, 'blocks'), where('blockerId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as UserBlock;
        ids.push(data.blockedUserId);
      });
      onBlockedIds(ids);
    },
    (err) => {
      console.warn('Error subscribing to blocked users:', err);
    }
  );
}
