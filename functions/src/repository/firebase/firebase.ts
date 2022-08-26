const fns = require("firebase-functions");
const admin = require("firebase-admin");

export class Firebase {
  firestore;
  constructor() {
    this.firestore = admin.firestore();
    admin.initializeApp(fns.config().firebase);
  }
}
