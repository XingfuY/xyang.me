import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "REDACTED_API_KEY",
  authDomain: "xyang-me.firebaseapp.com",
  projectId: "xyang-me",
  storageBucket: "xyang-me.firebasestorage.app",
  messagingSenderId: "86001245959",
  appId: "1:86001245959:web:63ab76dcb9d3cd9da26fa2",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
