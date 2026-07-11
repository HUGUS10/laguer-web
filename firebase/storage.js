// firebase/storage.js
import { storage } from "./firebase.js";
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from "firebase/storage";

// Subir archivo (con progreso opcional)
export const uploadFile = (path, file, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      });
    }
    
    uploadTask.then(() => {
      resolve(getDownloadURL(storageRef));
    }).catch(reject);
  });
};

// Obtener URL de descarga de un archivo existente
export const getFileUrl = async (path) => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

// Eliminar archivo
export const deleteFile = async (path) => {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
};

// Listar archivos en una carpeta
export const listFiles = async (folderPath) => {
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);
  return result.items.map(item => item.name);
};