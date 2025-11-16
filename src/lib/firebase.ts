// Importa le funzioni necessarie dagli SDK di Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configurazione della tua app Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDa5zQYgulei54CzpttcnsoPJzixkWrOBg",
  authDomain: "mate-website-cd962.firebaseapp.com",
  projectId: "mate-website-cd962",
  storageBucket: "mate-website-cd962.firebasestorage.app",
  messagingSenderId: "277583539223",
  appId: "1:277583539223:web:3db5a2c19fb0cabb688052",
  measurementId: "G-RWNZCF691D"
};

// Inizializza Firebase
export const app = initializeApp(firebaseConfig);

// Analytics solo in browser e se supportato (evita errori in build/test)
export const analyticsPromise = isSupported().then((ok) => ok ? getAnalytics(app) : null);
