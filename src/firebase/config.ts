import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
// CRITICAL: Custom firestoreDatabaseId is required by AI Studio environment
export const db = getFirestore(app, (firebaseConfig as { firestoreDatabaseId: string }).firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up...');
    }
  }
}
