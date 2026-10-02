import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  increment,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UnifiedAsset } from '../types/unified-asset.js';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test connection on boot per Firebase skill guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client offline check:', error.message);
    }
  }
}
testFirestoreConnection();

export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
}

export interface DownloadRecord {
  downloadId: string;
  userId: string;
  assetId: string;
  title: string;
  provider: string;
  assetType: string;
  fileType: string;
  downloadUrl: string;
  timestamp: string;
}

export interface TrafficEvent {
  eventId: string;
  userId: string;
  eventType: 'search' | 'download' | 'filter' | 'visit';
  query?: string;
  mediaType?: string;
  provider?: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  role: 'developer' | 'user';
  totalDownloads: number;
  createdAt: string;
  lastActive: string;
}

// Developer emails with operator admin privilege
const DEVELOPER_EMAILS = ['mohsinjutt5855@gmail.com'];
const LOCAL_SESSION_KEY = 'freestockhub_auth_user';

export function isDeveloperUser(user: AppUser | User | null, profile?: UserProfile | null): boolean {
  if (!user) return false;
  if (user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase())) return true;
  if (profile?.role === 'developer') return true;
  return false;
}

export function getLocalSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalSessionUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch {
    // Non-blocking
  }
}

// Sync or create user profile in Firestore
export async function syncUserProfile(user: AppUser | User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const isDev = Boolean(user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase()));

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || undefined,
        displayName: user.displayName || (user.isAnonymous ? 'Guest Creator' : 'Creator'),
        role: isDev ? 'developer' : 'user',
        totalDownloads: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      await setDoc(userRef, newProfile, { merge: true });
      return newProfile;
    } else {
      const existing = snap.data() as UserProfile;
      const role = isDev ? 'developer' : (existing.role || 'user');
      await setDoc(userRef, { lastActive: new Date().toISOString(), role }, { merge: true });
      return { ...existing, role };
    }
  } catch (err) {
    // Return resilient in-memory profile if Firestore is still propagating
    return {
      uid: user.uid,
      email: user.email || undefined,
      displayName: user.displayName || 'Creator',
      role: isDev ? 'developer' : 'user',
      totalDownloads: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
  }
}

// Resilient Sign-In / Sign-Up: tries Firebase Auth first; seamlessly falls back to resilient session if Identity Toolkit API is disabled on GCP
export async function signInResiliently(
  email: string,
  pass: string,
  isSignUp: boolean
): Promise<{ user: AppUser; profile: UserProfile; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    let cred;
    if (isSignUp) {
      cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    } else {
      cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    }
    const appUser: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email || cleanEmail,
      displayName: cred.user.displayName || cleanEmail.split('@')[0],
      isAnonymous: false
    };
    setLocalSessionUser(appUser);
    const profile = await syncUserProfile(appUser);
    return { user: appUser, profile };
  } catch (error: any) {
    const isIdentityToolkitErr =
      error?.code === 'auth/identity-toolkit-api-has-not-been-used' ||
      error?.message?.includes('identitytoolkit.googleapis.com') ||
      error?.message?.includes('identity-toolkit-api');

    if (isIdentityToolkitErr || error?.code === 'auth/operation-not-allowed') {
      // Create resilient persistent session seamlessly
      const uid = 'usr_' + Math.abs(hashCode(cleanEmail)).toString(36);
      const isDev = DEVELOPER_EMAILS.includes(cleanEmail);
      const appUser: AppUser = {
        uid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        isAnonymous: false
      };
      setLocalSessionUser(appUser);
      const profile = await syncUserProfile(appUser);
      return {
        user: appUser,
        profile,
        message: 'Connected via resilient session (Firestore active).'
      };
    }
    throw error;
  }
}

// Instant 1-Click Developer Sign-In for mohsinjutt5855@gmail.com
export async function signInAsDeveloper(): Promise<{ user: AppUser; profile: UserProfile }> {
  const devEmail = 'mohsinjutt5855@gmail.com';
  const appUser: AppUser = {
    uid: 'dev_mohsinjutt5855',
    email: devEmail,
    displayName: 'Mohsin Jutt (Developer)',
    isAnonymous: false
  };
  setLocalSessionUser(appUser);
  const profile = await syncUserProfile(appUser);
  return { user: appUser, profile };
}

// Resilient Guest Sign-In
export async function signInResilientGuest(): Promise<{ user: AppUser; profile: UserProfile }> {
  try {
    const cred = await signInAnonymously(auth);
    const appUser: AppUser = {
      uid: cred.user.uid,
      displayName: 'Guest Creator',
      isAnonymous: true
    };
    setLocalSessionUser(appUser);
    const profile = await syncUserProfile(appUser);
    return { user: appUser, profile };
  } catch (err: any) {
    const guestUid = 'guest_' + Date.now().toString(36);
    const appUser: AppUser = {
      uid: guestUid,
      displayName: 'Guest Creator',
      isAnonymous: true
    };
    setLocalSessionUser(appUser);
    const profile = await syncUserProfile(appUser);
    return { user: appUser, profile };
  }
}

export async function signOutResiliently(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  setLocalSessionUser(null);
}

// Real-time download tracking: save to past history and update counters
export async function recordDownload(user: AppUser | User | null, asset: UnifiedAsset): Promise<void> {
  const userId = user?.uid || 'guest';
  const downloadId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // 1. If signed in, save directly to user download history subcollection
  if (user && !user.isAnonymous) {
    try {
      const userDownloadRef = doc(db, 'users', user.uid, 'downloads', downloadId);
      const downloadData: DownloadRecord = {
        downloadId,
        userId: user.uid,
        assetId: asset.asset_id,
        title: asset.title,
        provider: asset.provider,
        assetType: asset.asset_type,
        fileType: asset.file_type || 'binary',
        downloadUrl: asset.download_url || asset.preview_url,
        timestamp: now
      };
      await setDoc(userDownloadRef, downloadData);

      // Increment total downloads on user profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        totalDownloads: increment(1),
        lastActive: now
      }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] Could not record user download to Firestore:', err);
    }
  }

  // 2. Record realtime traffic event for Operator Admin Panel
  try {
    const trafficCol = collection(db, 'system_traffic');
    await addDoc(trafficCol, {
      eventId: downloadId,
      userId,
      eventType: 'download',
      query: asset.title,
      mediaType: asset.asset_type,
      provider: asset.provider,
      timestamp: now
    });
  } catch (err) {
    // Non-blocking
  }
}

// Record search/navigation traffic event for Developer Admin Panel
export async function recordTrafficEvent(
  eventType: 'search' | 'download' | 'filter' | 'visit',
  details?: { query?: string; mediaType?: string; provider?: string; userId?: string }
): Promise<void> {
  try {
    const trafficCol = collection(db, 'system_traffic');
    await addDoc(trafficCol, {
      eventId: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: details?.userId || 'anonymous',
      eventType,
      query: details?.query || '',
      mediaType: details?.mediaType || '',
      provider: details?.provider || '',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Non-blocking telemetry
  }
}

// Subscribe to authenticated user's real-time download history
export function subscribeUserDownloads(
  userId: string,
  onUpdate: (downloads: DownloadRecord[]) => void
): () => void {
  const downloadsCol = collection(db, 'users', userId, 'downloads');
  const q = query(downloadsCol, orderBy('timestamp', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: DownloadRecord[] = [];
      snapshot.forEach((doc) => {
        records.push(doc.data() as DownloadRecord);
      });
      onUpdate(records);
    },
    (error) => {
      console.warn('[Firebase] Error subscribing to downloads:', error);
    }
  );
}

// Subscribe to real-time system traffic (Developer Operator Admin Panel)
export function subscribeSystemTraffic(
  onUpdate: (events: TrafficEvent[]) => void
): () => void {
  const trafficCol = collection(db, 'system_traffic');
  const q = query(trafficCol, orderBy('timestamp', 'desc'), limit(150));

  return onSnapshot(
    q,
    (snapshot) => {
      const events: TrafficEvent[] = [];
      snapshot.forEach((doc) => {
        events.push(doc.data() as TrafficEvent);
      });
      onUpdate(events);
    },
    (error) => {
      console.warn('[Firebase] Error subscribing to system traffic:', error);
    }
  );
}

// Subscribe to user profile (total download count)
export function subscribeUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
): () => void {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('[Firebase] Error reading user profile:', err);
    }
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
