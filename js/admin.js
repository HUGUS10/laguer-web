// js/admin.js (fragmento)
import { auth, db } from '../firebase/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists() && userDoc.data().role === 'admin') {
    // Cargar dashboard...
    loadDashboardData();
  } else {
    window.location.href = 'login.html';
  }
});