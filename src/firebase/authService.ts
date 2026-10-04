import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { UserProfile } from '../types';

export async function registerWithEmail(
  email: string,
  pass: string,
  profileData: {
    displayName: string;
    department: string;
    level: string;
    photoURL?: string;
    bio?: string;
  }
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  const defaultPhoto =
    profileData.photoURL ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      profileData.displayName
    )}&backgroundColor=059669`;

  await updateAuthProfile(user, {
    displayName: profileData.displayName,
    photoURL: defaultPhoto,
  });

  const nowIso = new Date().toISOString();
  const userProfile: UserProfile = {
    id: user.uid,
    displayName: profileData.displayName,
    photoURL: defaultPhoto,
    department: profileData.department,
    level: profileData.level,
    bio: profileData.bio || 'Proud member of NABIOSOS Hub',
    createdAt: nowIso,
  };

  // 1. Create public profile
  try {
    await setDoc(doc(db, 'users', user.uid), userProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  // 2. Create private info
  try {
    await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
      email: cleanEmail,
      createdAt: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/private/info`);
  }

  return userProfile;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  return cred.user;
}

export async function resetStudentPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
}


export async function loginWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;

  // Check if profile exists
  let profile: UserProfile | null = null;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      profile = snap.data() as UserProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
  }

  if (!profile) {
    const nowIso = new Date().toISOString();
    const defaultPhoto =
      user.photoURL ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        user.displayName || 'Student'
      )}&backgroundColor=059669`;

    profile = {
      id: user.uid,
      displayName: user.displayName || 'NABIOSOS Scholar',
      photoURL: defaultPhoto,
      department: 'Biological Sciences',
      level: '100 Level',
      bio: 'Member of NABIOSOS Hub',
      createdAt: nowIso,
    };

    try {
      await setDoc(userRef, profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }

    try {
      await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
        email: user.email || '',
        createdAt: nowIso,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/private/info`);
    }
  }

  return { user, profile };
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    if (auth.currentUser && (updates.displayName || updates.photoURL)) {
      await updateAuthProfile(auth.currentUser, {
        displayName: updates.displayName || auth.currentUser.displayName,
        photoURL: updates.photoURL || auth.currentUser.photoURL,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
