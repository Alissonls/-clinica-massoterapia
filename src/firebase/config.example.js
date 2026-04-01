/**
 * config.example.js — Exemplo de Configuração do Firebase
 *
 * NOTA: Renomeie este arquivo para `config.js` e preencha as suas chaves
 * do portal do Firebase antes de iniciar o projeto localmente.
 * As chaves reais NÃO DEVEM ser enviadas para o repositório público.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
