import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Substitua pelos dados do seu Console do Firebase
const firebaseConfig = {

  apiKey: "AIzaSyAhiFABFmbmL0kgl7qDja0yuX4Wv8J-b98",
  authDomain: "electrofisio-7e6a7.firebaseapp.com",
  projectId: "electrofisio-7e6a7",
  storageBucket: "electrofisio-7e6a7.firebasestorage.app",
  messagingSenderId: "283465259014",
  appId: "1:283465259014:web:5162e7da0359e7244f4b87",
  measurementId: "G-DZW0MG6Y57"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    app,
    db,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
};