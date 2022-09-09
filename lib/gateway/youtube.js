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
exports.YoutubeGateway = void 0;
const axios = require("axios");
const tsyringe_1 = require("tsyringe");
let YoutubeGateway = class YoutubeGateway {
    constructor() {
        this.getYoutubeDetailsByVideoId = async (id) => {
            try {
                const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics%2CtopicDetails&id=KRvv0QdruMQ&key=${process.env.YOUTUBE_API_KEY}`;
                const youtubeResponse = await axios.get(url);
                return youtubeResponse.data;
            }
            catch (e) {
                throw e;
            }
        };
    }
};
YoutubeGateway = __decorate([
    tsyringe_1.injectable(),
    __metadata("design:paramtypes", [])
], YoutubeGateway);
exports.YoutubeGateway = YoutubeGateway;
//# sourceMappingURL=youtube.js.map