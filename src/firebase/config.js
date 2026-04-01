// Firebase SDK Core and Feature Imports
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credenciais geradas para o SaaS (Multi-tenant)
const firebaseConfig = {
  apiKey: "AIzaSyAVecdIibTRnwGLx2chWFdca2ntPCI1OWc",
  authDomain: "clinica-sap-alisson.firebaseapp.com",
  projectId: "clinica-sap-alisson",
  storageBucket: "clinica-sap-alisson.firebasestorage.app",
  messagingSenderId: "1014365730704",
  appId: "1:1014365730704:web:6eb62ac1b3a5519a2da515"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
