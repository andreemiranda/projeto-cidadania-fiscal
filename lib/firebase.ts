import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isConfigured = false;

// Check if valid Firebase configuration is present
if (
  typeof window !== 'undefined' ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY
) {
  const hasRequiredConfig = Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY' &&
      firebaseConfig.projectId
  );

  if (hasRequiredConfig) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      
      // Enable robust offline persistence for instant form submissions
      if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(db).catch((err) => {
          if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence disabled in this tab.');
          } else if (err.code == 'unimplemented') {
            console.warn('Browser does not support Firestore persistence.');
          }
        });
      }

      isConfigured = true;

      // Initialize Firebase Analytics safely on the browser client if measurementId is provided
      if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
        import('firebase/analytics')
          .then(({ getAnalytics, isSupported }) => {
            isSupported().then((supported) => {
              if (supported && app) {
                getAnalytics(app);
              }
            }).catch(() => {});
          })
          .catch(() => {});
      }
    } catch (err) {
      console.warn('Firebase initialization error, fallback mode will be used:', err);
      app = null;
      auth = null;
      db = null;
      isConfigured = false;
    }
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { app, auth, db, isConfigured };

/**
 * Checks whether an email belongs to an authorized administrator.
 * Reads from NEXT_PUBLIC_ADMIN_EMAILS (comma-separated),
 * and automatically authorizes the configured support/academic email.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // Default designated administrator accounts for the project
  const defaultAdmins = ['suporte.camarapa@gmail.com'];
  if (defaultAdmins.includes(normalized)) {
    return true;
  }

  // Check NEXT_PUBLIC_ADMIN_EMAILS
  const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const adminList = envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminList.includes(normalized);
}

/**
 * Returns the configured base URL of the app
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}
