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
exports.AWSGateway = void 0;
const uuid_1 = require("uuid");
const tsyringe_1 = require("tsyringe");
let AWSGateway = class AWSGateway {
    constructor() {
        this.buildS3ImageUploadObject = (params) => {
            const { userUuid, bufferBase64 } = params;
            const uuid = uuid_1.v4();
            const key = `public/users/${userUuid}/profile_pictures/${uuid}`;
            const data = {
                key,
                Body: bufferBase64,
                ContentEncoding: "base64",
                ContentType: "image/jpeg",
            };
            return data;
        };
        this.uploadPictureToAWS = async (params) => {
            const uploadObject = this.buildS3ImageUploadObject(params);
            await this.s3.putObject(uploadObject).Promise();
        };
    }
};
AWSGateway = __decorate([
    tsyringe_1.injectable(),
    __metadata("design:paramtypes", [])
], AWSGateway);
exports.AWSGateway = AWSGateway;
/*
verify auth
https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js
*/
//# sourceMappingURL=aws.js.map