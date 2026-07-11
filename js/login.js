// js/login.js
import { auth, db } from '../firebase/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('loginError');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Limpiar mensaje de error
  errorMsg.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Verificando...';

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  try {
    // 1. Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Obtener el documento del usuario en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // El usuario no tiene perfil en Firestore
      errorMsg.textContent = '❌ Usuario no registrado en el sistema. Contacta a soporte.';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
      // Cerrar sesión para evitar acceso
      await signOut(auth);
      return;
    }

    const userData = userDoc.data();

    // 3. Verificar el rol
    if (userData.role === 'admin') {
      // ✅ Es admin → redirigir al dashboard
      window.location.href = 'admin.html';
    } else {
      // ❌ No es admin
      errorMsg.textContent = '⛔ Acceso restringido. Esta área es solo para administradores.';
      // Cerrar sesión
      await signOut(auth);
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
    }

  } catch (error) {
    console.error('Error en login:', error);
    // Manejo de errores comunes de Firebase Auth
    switch (error.code) {
      case 'auth/user-not-found':
        errorMsg.textContent = '❌ Usuario no encontrado. Verifica tu correo.';
        break;
      case 'auth/wrong-password':
        errorMsg.textContent = '❌ Contraseña incorrecta. Intenta nuevamente.';
        break;
      case 'auth/invalid-email':
        errorMsg.textContent = '❌ Formato de correo inválido.';
        break;
      default:
        errorMsg.textContent = '❌ Error al iniciar sesión. Intenta más tarde.';
    }
    loginBtn.disabled = false;
    loginBtn.textContent = 'Iniciar sesión';
  }
});