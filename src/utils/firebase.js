import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // TODO: Replace with your actual Firebase project configuration
  // You can find this in your Firebase Console -> Project Settings -> General
  apiKey: "YOUR_API_KEY",
  authDomain: "promt-forge-3369.firebaseapp.com",
  projectId: "promt-forge-3369",
  storageBucket: "promt-forge-3369.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
