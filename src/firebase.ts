import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "next-ball-oracle",
  appId: "1:414361924616:web:40177ed60c08295f210dbd",
  apiKey: "AIzaSyA_5A2llB-tjr1N2VL12NvkzIjk4F5gY2A",
  authDomain: "next-ball-oracle.firebaseapp.com",
  storageBucket: "next-ball-oracle.firebasestorage.app",
  messagingSenderId: "414361924616"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-1497b373-174f-45a8-b189-bbc83b4d6082");
