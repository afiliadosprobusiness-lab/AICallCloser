export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const DEFAULT_FIREBASE_WEB_CONFIG: FirebaseWebConfig = {
  apiKey: "AIzaSyBWX157yv9x97iJE4SiWKZg110MElCqo-I",
  authDomain: "ai-call-closer.firebaseapp.com",
  projectId: "ai-call-closer",
  storageBucket: "ai-call-closer.firebasestorage.app",
  messagingSenderId: "637669949144",
  appId: "1:637669949144:web:9b868822c9715596b5e1ad",
};

function normalize(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function getFirebaseWebConfig(): FirebaseWebConfig {
  return {
    apiKey: normalize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, DEFAULT_FIREBASE_WEB_CONFIG.apiKey),
    authDomain: normalize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, DEFAULT_FIREBASE_WEB_CONFIG.authDomain),
    projectId: normalize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, DEFAULT_FIREBASE_WEB_CONFIG.projectId),
    storageBucket: normalize(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      DEFAULT_FIREBASE_WEB_CONFIG.storageBucket,
    ),
    messagingSenderId: normalize(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      DEFAULT_FIREBASE_WEB_CONFIG.messagingSenderId,
    ),
    appId: normalize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, DEFAULT_FIREBASE_WEB_CONFIG.appId),
  };
}

export function getFirebaseApiKeyForServer() {
  const directKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (directKey) {
    return directKey;
  }

  return getFirebaseWebConfig().apiKey;
}

export function isFirebaseWebConfigReady() {
  const config = getFirebaseWebConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}
