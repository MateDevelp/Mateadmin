import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configurazione Firebase (stesso di lib/firebase.ts)
const firebaseConfig = {
    apiKey: "AIzaSyDa5zQYgulei54CzpttcnsoPJzixkWrOBg",
    authDomain: "mate-website-cd962.firebaseapp.com",
    projectId: "mate-website-cd962",
    storageBucket: "mate-website-cd962.appspot.com",
    messagingSenderId: "277583539223",
    appId: "1:277583539223:web:3db5a2c19fb0cabb688052",
    measurementId: "G-RWNZCF691D"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupAdminUser() {
    try {
        console.log('🔧 Setup Admin User Script');

        // Chiedi email e password
        const email = prompt('Inserisci email admin:');
        const password = prompt('Inserisci password:');

        if (!email || !password) {
            console.error('❌ Email e password richieste');
            return;
        }

        console.log(`🔑 Tentativo login con: ${email}`);

        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log(`✅ Login successful: ${user.uid}`);

        // Check existing document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            console.log('📄 Documento utente esistente:', userDoc.data());
        } else {
            console.log('📝 Creazione nuovo documento utente...');
        }

        // Set admin role
        await setDoc(userDocRef, {
            email: user.email,
            role: 'admin',
            isAdmin: true,
            firstName: 'Admin',
            lastName: 'User',
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });

        console.log('🎉 Utente configurato come admin!');
        console.log('✅ Puoi ora accedere al pannello admin');

        // Verify
        const updatedDoc = await getDoc(userDocRef);
        console.log('🔍 Documento finale:', updatedDoc.data());

    } catch (error) {
        console.error('❌ Errore:', error.message);
    }
}

// Per browser usage
if (typeof window !== 'undefined') {
    window.setupAdminUser = setupAdminUser;
    console.log('🚀 Apri la console e digita: setupAdminUser()');
}

export { setupAdminUser };
