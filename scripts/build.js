const fs = require('fs');
const path = require('path');

console.log('👷 Iniciando Vercel Build Script...');
console.log('🔐 Lendo variáveis de ambiente invisíveis...');

// O Vercel (ou nosso .env local) injeta essas variáveis antes de rodar esse NodeJS
const configContent = `
/**
 * ARQUIVO GERADO AUTOMATICAMENTE PELO VERCEL BUILD SCRIPT
 * NÃO EDITE ESTE ARQUIVO DIRETAMENTE, ALTERE AS VARIÁVEIS NO PAINEL DO VERCEL
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "${process.env.FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${process.env.FIREBASE_SENDER_ID || ''}",
  appId: "${process.env.FIREBASE_APP_ID || ''}"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
`;

// Caminho para criar o arquivo: ./src/firebase/config.js
const targetDir = path.join(__dirname, '..', 'src', 'firebase');
const targetFile = path.join(targetDir, 'config.js');

// Garante que a pasta existe (embora já exista porque deixamos o config.example.js lá)
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Cria fisicamente o arquivo (apenas na memória da máquina de Build do Vercel)
fs.writeFileSync(targetFile, configContent.trim(), 'utf8');

console.log('✅ Arquivo src/firebase/config.js criado com sucesso usando as Variáveis Secretas!');
