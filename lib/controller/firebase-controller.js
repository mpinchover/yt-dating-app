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
exports.updateMobileParams = exports.updateEmailParams = exports.updatePasswordParams = exports.FirebaseController = void 0;
const tsyringe_1 = require("tsyringe");
let FirebaseController = class FirebaseController {
    constructor() {
        this.updatePassword = async (params) => {
            const { userId, password, confirmPassword } = params;
            exports.updatePasswordParams(params);
            await this.auth.updateUser(userId, {
                password,
            });
        };
        this.updateEmail = async (params) => {
            const { userId, email } = params;
            exports.updateEmailParams(params);
            await this.auth.updateUser(userId, {
                email,
            });
        };
        this.updateMobile = async (params) => {
            const { userId, mobile } = params;
            exports.updateMobileParams(params);
            await this.auth.updateUser(userId, {
                mobile,
            });
        };
    }
};
FirebaseController = __decorate([
    tsyringe_1.injectable(),
    __metadata("design:paramtypes", [])
], FirebaseController);
exports.FirebaseController = FirebaseController;
const updatePasswordParams = (params) => {
    const { userId, password, confirmPassword } = params;
    if (!userId)
        throw new Error("user id cannot be null for update password");
    if (!password)
        throw new Error("password cannot be null for update password");
    if (!confirmPassword)
        throw new Error("confirm password cannot be null for update password");
    if (password !== confirmPassword)
        throw new Error("passwords don't match");
};
exports.updatePasswordParams = updatePasswordParams;
const updateEmailParams = (params) => {
    const { userId, email } = params;
    if (!userId)
        throw new Error("user id cannot be null for update email");
    if (!email)
        throw new Error("email cannot be null for update email");
};
exports.updateEmailParams = updateEmailParams;
const updateMobileParams = (params) => {
    const { userId, mobile } = params;
    if (!userId)
        throw new Error("user id cannot be null for update email");
    if (!mobile)
        throw new Error("email cannot be null for update email");
};
exports.updateMobileParams = updateMobileParams;
//# sourceMappingURL=firebase-controller.js.map