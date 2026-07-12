// firebase/database.js
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";

// Obtener todos los documentos de una colección
export const getCollection = async (collectionName) => {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Obtener un documento por ID
export const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

// Agregar un documento
export const addDocument = async (collectionName, data) => {
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
};

// Actualizar un documento
export const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
  return true;
};

// Eliminar un documento
export const deleteDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
  return true;
};

// Consulta con filtros
export const queryCollection = async (collectionName, filters = [], orderByField = null, limitTo = null) => {
  let q = collection(db, collectionName);
  filters.forEach(({ field, operator, value }) => {
    q = query(q, where(field, operator, value));
  });
  if (orderByField) {
    q = query(q, orderBy(orderByField));
  }
  if (limitTo) {
    q = query(q, limit(limitTo));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};