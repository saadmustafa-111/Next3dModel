// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3kPPbx_hWZRas9mXTAAcgXfXVvUwFMP8",
  authDomain: "jwelix.firebaseapp.com",
  projectId: "jwelix",
  storageBucket: "jwelix.firebasestorage.app",
  messagingSenderId: "212438856525",
  appId: "1:212438856525:web:42924c122c000ee9867d04",
  measurementId: "G-BVWK0M2WHV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services
export { auth, db };
