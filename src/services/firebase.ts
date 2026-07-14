import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCyBpGSuOsD-jjgtscUxBQ52EWsm8JYOpk",
  authDomain: "mythoside.firebaseapp.com",
  projectId: "mythoside",
  storageBucket: "mythoside.firebasestorage.app",
  messagingSenderId: "499952548204",
  appId: "1:499952548204:web:cfbd535a9491e27aff9b49",
  measurementId: "G-SLCV5EZMNJ",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
