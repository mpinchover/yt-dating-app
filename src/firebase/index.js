// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCY5Pgws1EACe2Ot2F52zvttOSXb48_vhU",
  authDomain: "dating-app-622c1.firebaseapp.com",
  projectId: "dating-app-622c1",
  storageBucket: "dating-app-622c1.appspot.com",
  messagingSenderId: "182580052504",
  appId: "1:182580052504:web:1316fdbe7d030e2358b96d",
};

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === ""
) {
  //connectAuthEmulator(getAuth(), "http://localhost", 9099);
  connectFunctionsEmulator(getFunctions(), "localhost", 5001);
  // connectStorageEmulator(storage, "localhost", 9199);
  connectFirestoreEmulator(getFirestore(), "localhost", 8080);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;
