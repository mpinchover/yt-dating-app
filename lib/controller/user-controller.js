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
exports.UserController = void 0;
const repo_1 = require("../repository/repo");
const aws_1 = require("../gateway/aws");
const youtube_1 = require("../gateway/youtube");
const firebase_controller_1 = require("./firebase-controller");
const mapper_user_1 = require("../utils/mapper-user");
const mapper_video_1 = require("../utils/mapper-video");
const uuid_1 = require("uuid");
const tsyringe_1 = require("tsyringe");
require("reflect-metadata");
let UserController = class UserController {
    constructor() {
        /*
        1) create user
        2) get email/text to create a password
        3) run validation in handler
        // firebase may take care of this for you?
      
        */
        this.createUser = async (params) => {
            const newUuid = uuid_1.v4();
            const userEntity = {
                uuid: newUuid,
                mobile: params.mobile,
                email: params.email,
                verified: false,
            };
            // convert to userRecord
            const userRecord = mapper_user_1.userEntityToRecord(userEntity);
            await this.repo.createUser(userRecord);
        };
        this.verifyUser = async () => { };
        this.createUserPassword = async () => { };
        this.deleteUser = async (params) => {
            await this.repo.deleteUser(params.uuid);
        };
        this.updateUser = async (params) => {
            params.updates.forEach(async (update) => {
                // firebase
                if (update.updateType === userUpdateType.UPDATE_EMAIL) {
                    const id = await this.repo.getUserIdByUuid(params.userUuid);
                    const updateParams = {
                        userId: id,
                        email: update.email,
                    };
                    await this.firebaseController.updateEmail(updateParams);
                }
                if (update.updateType === userUpdateType.UPDATE_MOBILE) {
                    const id = await this.repo.getUserIdByUuid(params.userUuid);
                    const updateParams = {
                        userId: id,
                        mobile: update.mobile,
                    };
                    await this.firebaseController.updateMobile(updateParams);
                }
                if (update.updateType === userUpdateType.UPDATE_PASSWORD) {
                    const id = await this.repo.getUserIdByUuid(params.userUuid);
                    const updateParams = {
                        userId: id,
                        password: update.newPassword,
                        confirmPassword: update.newPasswordConfirm,
                    };
                    await this.firebaseController.updatePassword(updateParams);
                }
                // dating pref
                if (update.updateType === userUpdateType.UPDATE_MAX_AGE) {
                }
                if (update.updateType === userUpdateType.UPDATE_MIN_AGE) {
                }
                if (update.updateType === userUpdateType.UPDATE_GENDER_PREFERENCE) {
                }
                // youtube
                if (update.updateType === userUpdateType.ADD_YOUTUBE_LINKS) {
                }
                if (update.updateType === userUpdateType.SWAP_YOUTUBE_LINKS) {
                }
                // pictures
                if (update.updateType === userUpdateType.ADD_PICTURES) {
                }
                if (update.updateType === userUpdateType.UPDATE_PICTURE_ORDER) {
                }
            });
        };
        this.createVideoAndTrackedVideo = async (params) => {
            let videoRecord = await this.repo.getVideoById(params.mediaId);
            // if the video record exists, just create the treacked video record
            if (videoRecord) {
                const trackedVideoRecord = {
                    videoUuid: videoRecord.uuid,
                    userUuid: params.userUuid,
                };
                await this.repo.createTrackedVideoRecord(trackedVideoRecord);
                return;
            }
            const videoDetails = await this.youtubeGateway.getYoutubeDetailsByVideoId(params.mediaId);
            videoRecord = mapper_video_1.videoGatewayToRecord(videoDetails);
            videoRecord.uuid = uuid_1.v4();
            const trackedVideoRecord = {
                videoUuid: videoRecord.uuid,
                userUuid: params.userUuid,
            };
            // create video record and tracked video record in tx
            await this.repo.createVideoAndTrackedVideoRecords(videoRecord, trackedVideoRecord);
        };
        // always have at least 5 media links
        this.swapVideos = async (params) => {
            // first check to see if the video exists
            let newVideo = await this.repo.getVideoById(params.incomingVideoId);
            if (!newVideo) {
                // if the video doesnt exist, create the uuid for it
                // create the video
                const videoDetails = await this.youtubeGateway.getYoutubeDetailsByVideoId(params.incomingVideoId);
                newVideo = mapper_video_1.videoGatewayToRecord(videoDetails);
                newVideo.uuid = uuid_1.v4();
                await this.repo.createVideo(newVideo);
            }
            await this.repo.swapVideos(params.userUuid, newVideo.uuid, params.videoToBeReplacedUuid);
        };
        this.likeProfile = async (params) => {
            // first make sure this profile is not a current match
            const existingMatch = await this.repo.getMatchRecordByUuids(params.initiatorUuid, params.likedProfileUuid);
            if (existingMatch)
                throw new Error("profile has already been matched");
            // then make sure these two people haven't blocked each other
            const blockedRecord = await this.repo.getBlockedByUserUuids(params.initiatorUuid, params.likedProfileUuid);
            if (blockedRecord)
                throw new Error("this profile has been blocked");
            // check to see if the other party has already liked this profile
            // if so, create a match
            const likeRecord = await this.repo.getLikeRecord(params.initiatorUuid, params.likedProfileUuid);
            const likeParams = {
                initiatorUuid: params.initiatorUuid,
                receiverUuid: params.likedProfileUuid,
            };
            if (likeRecord) {
                // create like and match in tx
                // if we see there is a like already made
                // then that person is the initiator
                const matchParams = {
                    initiatorUuid: params.likedProfileUuid,
                    responderUuid: params.initiatorUuid,
                    matchedUsersUuids: [params.initiatorUuid, params.likedProfileUuid],
                };
                await this.repo.createLikeAndMatchRecords(likeParams, matchParams);
                return;
            }
            await this.repo.createLikeRecord(likeParams);
            // then either let the other client poll or let them create a websocket
        };
        this.getProfileByUUID = async (params) => {
            return await this.repo.getProfileByUserUUID(params.uuid);
        };
        this.blockProfileByUuid = async (params) => {
            const block = {
                initatorUuid: params.userBlockingUuid,
                receiverUuid: params.userBeingBlockedUuid,
                blockedUserUuids: [params.userBeingBlockedUuid, params.userBlockingUuid],
            };
            await this.repo.createBlockRecord(block);
        };
        this.testUserRepoFn = () => {
            return "test-works..";
        };
        this.name = "hello";
        this.repo = tsyringe_1.container.resolve(repo_1.Repo);
        this.awsGateway = tsyringe_1.container.resolve(aws_1.AWSGateway);
        this.youtubeGateway = tsyringe_1.container.resolve(youtube_1.YoutubeGateway);
        this.firebaseController = tsyringe_1.container.resolve(firebase_controller_1.FirebaseController);
    }
};
UserController = __decorate([
    tsyringe_1.injectable(),
    __metadata("design:paramtypes", [])
], UserController);
exports.UserController = UserController;
var userUpdateType;
(function (userUpdateType) {
    userUpdateType[userUpdateType["UPDATE_PASSWORD"] = 0] = "UPDATE_PASSWORD";
    userUpdateType[userUpdateType["UPDATE_EMAIL"] = 1] = "UPDATE_EMAIL";
    userUpdateType[userUpdateType["UPDATE_MOBILE"] = 2] = "UPDATE_MOBILE";
    userUpdateType[userUpdateType["UPDATE_MAX_AGE"] = 3] = "UPDATE_MAX_AGE";
    userUpdateType[userUpdateType["UPDATE_MIN_AGE"] = 4] = "UPDATE_MIN_AGE";
    userUpdateType[userUpdateType["UPDATE_GENDER_PREFERENCE"] = 5] = "UPDATE_GENDER_PREFERENCE";
    userUpdateType[userUpdateType["ADD_YOUTUBE_LINKS"] = 6] = "ADD_YOUTUBE_LINKS";
    userUpdateType[userUpdateType["SWAP_YOUTUBE_LINKS"] = 7] = "SWAP_YOUTUBE_LINKS";
    userUpdateType[userUpdateType["ADD_PICTURES"] = 8] = "ADD_PICTURES";
    userUpdateType[userUpdateType["UPDATE_PICTURE_ORDER"] = 9] = "UPDATE_PICTURE_ORDER";
})(userUpdateType || (userUpdateType = {}));
//# sourceMappingURL=user-controller.js.map