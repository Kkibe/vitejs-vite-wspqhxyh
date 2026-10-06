import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  /*apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,*/
  apiKey: "AIzaSyDxreIvibzHY-udAkGZaZ4spq8puc1_7FY",
  authDomain: "powerking-new.firebaseapp.com",
  databaseURL: "https://powerking-new-default-rtdb.firebaseio.com",
  projectId: "powerking-new",
  storageBucket: "powerking-new.firebasestorage.app",
  messagingSenderId: "667524424624",
  appId: "1:667524424624:web:3c38a0e12c9340f86fac75",
  measurementId: "G-8BDB2DL0YH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
