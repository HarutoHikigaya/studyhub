import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "DÁN_API_KEY_VÀO_ĐÂY",
  authDomain: "DÁN_AUTH_DOMAIN",
  projectId: "DÁN_PROJECT_ID",
  storageBucket: "DÁN_STORAGE_BUCKET",
  messagingSenderId: "DÁN_MESSAGING_SENDER_ID",
  appId: "DÁN_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
