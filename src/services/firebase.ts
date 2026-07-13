import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCCAS8t5wyOQeUkP9VL8641VbShvQsuYm8",
  authDomain: "plus-4daaa.firebaseapp.com",
  projectId: "plus-4daaa",
  appId: "1:205927407583:web:41f103a218f60007076e6a",
};

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  "sortify-db",
);

export const auth = getAuth(app);
