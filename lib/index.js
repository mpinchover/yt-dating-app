"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const functions = require("firebase-functions");
require("reflect-metadata");
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
exports.rpc = require("./rpc");
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!!!!");
});
//# sourceMappingURL=index.js.map