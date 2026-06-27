import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA1b9og8GWoLaydbhkEudBBxpsvFjDAikY",
  authDomain: "myconnec-canalbox.firebaseapp.com",
  projectId: "myconnec-canalbox",
  storageBucket: "myconnec-canalbox.firebasestorage.app",
  messagingSenderId: "164009090286",
  appId: "1:164009090286:web:8888e673b2a60c5189a7ff",
  measurementId: "G-NXQWLGV521"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
