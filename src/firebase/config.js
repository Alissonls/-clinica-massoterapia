/**
 * ARQUIVO GERADO AUTOMATICAMENTE PELO VERCEL BUILD SCRIPT
 * NÃO EDITE ESTE ARQUIVO DIRETAMENTE, ALTERE AS VARIÁVEIS NO PAINEL DO VERCEL
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVecdIibTRnwGLx2chWFdca2ntPCI1OWc",
  authDomain: "clinica-sap-alisson.firebaseapp.com",
  projectId: "clinica-sap-alisson",
  storageBucket: "clinica-sap-alisson.firebasestorage.app",
  messagingSenderId: "1014365730704",
  appId: "1:1014365730704:web:6eb62ac1b3a5519a2da515"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };