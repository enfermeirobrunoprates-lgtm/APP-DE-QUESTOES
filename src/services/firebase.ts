import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Read configuration from environment variables or local firebase-applet-config.json if available
let appletConfig: Record<string, string> = {};
try {
  // @ts-ignore
  const glob = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  const key = Object.keys(glob)[0];
  if (key) {
    appletConfig = (glob[key] as any)?.default || glob[key] || {};
  }
} catch {
  appletConfig = {};
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
};

const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || undefined;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed-precondition: múltiplas abas abertas.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence não é suportada por este navegador.');
  }
});

