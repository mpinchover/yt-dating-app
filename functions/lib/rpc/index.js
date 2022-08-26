"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const functions = require("firebase-functions");
const youtubeController = require("../controller/youtube-controller");
const user_controller_1 = require("../controller/user-controller");
const tsyringe_1 = require("tsyringe");
const tsyringe_2 = require("tsyringe");
let Handler = class Handler {
    constructor() {
        this.userController = tsyringe_2.container.resolve(user_controller_1.UserController);
    }
};
Handler = __decorate([
    tsyringe_1.injectable(),
    __metadata("design:paramtypes", [])
], Handler);
// https://github.com/microsoft/tsyringe
// just use this
exports.getDetailsByVideoID = functions.https.onRequest(async (request, response) => {
    try {
        const data = await youtubeController.getYoutubeVideoByID();
        response.send({ data: data });
    }
    catch (e) {
        functions.logger.info(e);
        response.status(501).send(e);
    }
});
exports.testUserRepoFn = functions.https.onRequest(async (request, response) => {
    try {
        const h = tsyringe_2.container.resolve(Handler);
        const data = await h.userController.testUserRepoFn();
        response.send({ data });
    }
    catch (e) {
        functions.logger.info(e);
        response.status(501).send(e);
    }
});
//# sourceMappingURL=index.js.map