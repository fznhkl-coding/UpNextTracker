import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// fireBaseConfig is blanked, for safety purposes. Needs to supply your own Credentials.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth with device local persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Cloud Firestore Database
const db = getFirestore(app);

// Exporting these references so our screens can pull them in
export { app, auth, db };

