"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Firebase = void 0;
const fns = require("firebase-functions");
const admin = require("firebase-admin");
class Firebase {
    constructor() {
        this.firestore = admin.firestore();
        admin.initializeApp(fns.config().firebase);
    }
}
exports.Firebase = Firebase;
//# sourceMappingURL=firebase.js.map