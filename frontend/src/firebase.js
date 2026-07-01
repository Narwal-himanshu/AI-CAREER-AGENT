import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCbedRwn4rqEZRpSR_aOQmxQ1hLDgTKdPA",
  authDomain: "ai-career-agent-cd5b8.firebaseapp.com",
  projectId: "ai-career-agent-cd5b8",
  storageBucket: "ai-career-agent-cd5b8.firebasestorage.app",
  messagingSenderId: "88378131150",
  appId: "1:88378131150:web:81b3bd2a39e6e00cebc69f",
  measurementId: "G-8K782KJS06"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
