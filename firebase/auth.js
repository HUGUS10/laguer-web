// firebase/auth.js
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

// Registrar usuario
export const registerUser = (email, password, displayName) => {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return updateProfile(user, { displayName });
    });
};

// Iniciar sesión
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Cerrar sesión
export const logoutUser = () => {
  return signOut(auth);
};

// Observador de estado de autenticación
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Restablecer contraseña
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export { auth };