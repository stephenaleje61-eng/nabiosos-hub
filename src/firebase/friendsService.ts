import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { FriendRequest, Friendship, UserProfile } from '../types';
import { createNotification } from './notificationsService';

export async function sendFriendRequest(
  fromUser: UserProfile,
  toUser: UserProfile
): Promise<void> {
  if (fromUser.id === toUser.id) {
    throw new Error('Cannot send friend request to yourself');
  }

  const requestId = `freq_${fromUser.id}_${toUser.id}`;
  const requestRef = doc(db, 'friendRequests', requestId);

  const payload: FriendRequest = {
    id: requestId,
    fromUserId: fromUser.id,
    fromUserName: fromUser.displayName,
    fromUserPhotoURL: fromUser.photoURL,
    fromUserDepartment: fromUser.department,
    fromUserLevel: fromUser.level,
    toUserId: toUser.id,
    toUserName: toUser.displayName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(requestRef, payload);
    await createNotification({
      recipientId: toUser.id,
      senderId: fromUser.id,
      senderName: fromUser.displayName,
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${fromUser.displayName} (${fromUser.department || 'NABIOSOS'}) sent you a friend request.`,
      linkId: requestId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `friendRequests/${requestId}`);
  }
}

export async function acceptFriendRequest(
  request: FriendRequest,
  currentUser: UserProfile
): Promise<void> {
  const reqRef = doc(db, 'friendRequests', request.id);
  const nowIso = new Date().toISOString();

  try {
    await updateDoc(reqRef, {
      status: 'accepted',
      updatedAt: nowIso,
    });

    // Create mutual friendship record
    const sorted = [request.fromUserId, request.toUserId].sort();
    const friendshipId = `friendship_${sorted[0]}_${sorted[1]}`;
    const friendshipRef = doc(db, 'friends', friendshipId);

    const friendshipPayload: Friendship = {
      id: friendshipId,
      user1Id: sorted[0],
      user2Id: sorted[1],
      createdAt: nowIso,
    };

    await setDoc(friendshipRef, friendshipPayload);

    // Notify the requester
    await createNotification({
      recipientId: request.fromUserId,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      type: 'friend_accepted',
      title: 'Friend Request Accepted! 🎉',
      body: `${currentUser.displayName} accepted your friend request. You can now chat directly!`,
      linkId: currentUser.id,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `friends/acceptance`);
  }
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  const reqRef = doc(db, 'friendRequests', requestId);
  try {
    await updateDoc(reqRef, {
      status: 'declined',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `friendRequests/${requestId}`);
  }
}

export function subscribeToIncomingFriendRequests(
  userId: string,
  onRequests: (requests: FriendRequest[]) => void
) {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendRequest[] = [];
      snapshot.forEach((d) => list.push(d.data() as FriendRequest));
      onRequests(list);
    },
    (err) => {
      console.warn('Error subscribing to incoming friend requests:', err);
    }
  );
}

export function subscribeToSentFriendRequests(
  userId: string,
  onRequests: (requests: FriendRequest[]) => void
) {
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendRequest[] = [];
      snapshot.forEach((d) => list.push(d.data() as FriendRequest));
      onRequests(list);
    },
    (err) => {
      console.warn('Error subscribing to sent friend requests:', err);
    }
  );
}

export function subscribeToFriendships(
  userId: string,
  onFriendships: (friendships: Friendship[]) => void
) {
  // Query 1: user1Id == userId
  const q1 = query(collection(db, 'friends'), where('user1Id', '==', userId));
  const q2 = query(collection(db, 'friends'), where('user2Id', '==', userId));

  let f1: Friendship[] = [];
  let f2: Friendship[] = [];

  const unsub1 = onSnapshot(q1, (snap) => {
    f1 = [];
    snap.forEach((d) => f1.push(d.data() as Friendship));
    onFriendships([...f1, ...f2]);
  });

  const unsub2 = onSnapshot(q2, (snap) => {
    f2 = [];
    snap.forEach((d) => f2.push(d.data() as Friendship));
    onFriendships([...f1, ...f2]);
  });

  return () => {
    unsub1();
    unsub2();
  };
}

export async function searchStudents(
  searchTerm: string,
  currentUserId: string
): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), limit(50));
    const snap = await getDocs(q);
    const results: UserProfile[] = [];

    const lower = searchTerm.toLowerCase().trim();
    snap.forEach((d) => {
      const user = d.data() as UserProfile;
      if (user.id !== currentUserId) {
        if (!lower) {
          results.push(user);
        } else if (
          user.displayName?.toLowerCase().includes(lower) ||
          user.department?.toLowerCase().includes(lower) ||
          user.level?.toLowerCase().includes(lower)
        ) {
          results.push(user);
        }
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}
