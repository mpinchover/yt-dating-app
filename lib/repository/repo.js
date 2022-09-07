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
exports.Repo = void 0;
const mapper_user_1 = require("../utils/mapper-user");
const mapper_video_1 = require("../utils/mapper-video");
const tsyringe_1 = require("tsyringe");
const fns = require("firebase-functions");
const admin = require("firebase-admin");
let Repo = 
// you can just set the db value in the testing code
// not a big deal
class Repo {
    constructor() {
        this.createMatchRecord = async (params) => {
            this.db.collection("matches").add(params);
        };
        this.getUserUuidsMatchedToUuid = async (uuid) => {
            const ids = new Set();
            // var db = admin.firestore();
            let usersSnapshot = await this.db
                .collection("match")
                .where("matchedUsersUUIDs", "array-contains", uuid)
                .get();
            const results = new Set();
            usersSnapshot.forEach((doc) => {
                const matchedUserUUIDs = doc
                    .data()
                    .matchedUsersUUIDs.filter((matchedUserUUID) => matchedUserUUID != uuid);
                matchedUserUUIDs.forEach((item) => results.add(item));
            });
            return Array.from(results);
        };
        // make sure to check by status and not deleted
        this.getMatchRecordByUuids = async (uuid1, uuid2) => {
            const matchSnapshot = this.db
                .collection("matches")
                .where("matchedUsersUuids", "array-contains", [uuid1, uuid2])
                .get();
            return null;
        };
        this.createBlockRecord = async (blockRecord) => {
            await this.db.collection("blocks").add(blockRecord);
        };
        // make sure to set delted_at = null
        this.getBlockedByUserUuids = async (uuid1, uuid2) => {
            let usersSnapshot = await this.db
                .collection("block")
                .where("blockedUserUuids", "array-contains", [uuid1, uuid2])
                .get();
            if (usersSnapshot.length > 0) {
                const data = usersSnapshot[0].data();
                const record = {
                    initatorUuid: data.initatorUuid,
                    receiverUuid: data.receiverUuid,
                    createdAtUtc: data.createdAtUtc,
                    deletedAtUtc: data.deletedAtUtc,
                    blockedUserUuids: data.blockedUserUUIDs,
                };
                return record;
            }
            return null;
        };
        this.getUsersWhoBlockedThisUuid = async (uuid) => {
            const ids = new Set();
            let usersSnapshot = await this.db
                .collection("blocks")
                .where("blockedUserUuids", "array-contains", uuid)
                .get();
            const results = new Set();
            usersSnapshot.forEach((doc) => {
                const blockedUUIDs = doc
                    .data()
                    .blockedUserUUIDs.filter((blockedUUID) => blockedUUID != uuid);
                blockedUUIDs.forEach((item) => results.add(item));
            });
            return Array.from(results);
        };
        this.createLikeRecord = async (params) => {
            const res = await this.db.collection("likes").add(params);
        };
        this.createLikeAndMatchRecords = async (likeParams, matchParams) => {
            await this.db.runTransaction(async (t) => {
                await t.collection("likes").add(likeParams);
                await t.collection("matches").add(matchParams);
            });
        };
        this.createTrackedVideoRecord = async (trackedVideoRecord) => {
            await this.db.collection("tracked_videos").add(trackedVideoRecord);
        };
        this.getVideoById = async (videoId) => {
            let videoSnapshot = await this.db
                .collection("videos")
                .where("videoId", "==", videoId)
                .get();
            if (videoSnapshot.length == 0)
                return null;
            const data = videoSnapshot[0].data();
            const videoRecord = {
                uuid: data.uuid,
                videoId: data.videoId,
                channelId: data.channelId,
                videoTitle: data.videoTitle,
                description: data.description,
                categoryId: data.categoryId,
                topicCategories: data.topicCategories,
            };
            return videoRecord;
        };
        this.createVideoAndTrackedVideoRecords = async (videoRecord, trackedVideoRecord) => {
            await this.db.runTransaction(async (t) => {
                await t.collection("likes").add(videoRecord);
                await t.collection("matches").add(trackedVideoRecord);
            });
        };
        this.getUserIdByUuid = async (uuid) => {
            return await this.db.collection("users").where("uuid", "==", uuid).get();
        };
        // set the tracked video's deleted to now
        this.removeVideo = async (videoUuid) => {
            const curTime = new Date().getTime();
            const video = await this.getVideoByUuid(videoUuid);
            const trackedVideo = await this.getTrackedVideoByVideoUuid(video.uuid);
            await this.db.runTransaction(async (t) => {
                await this.db.collection("videos").doc(video.id).update({
                    deletedAt: curTime,
                });
                await this.db.collection("videos").doc(trackedVideo.id).update({
                    deletedAt: curTime,
                });
            });
            return null;
        };
        this.createVideo = async (videoRecord) => {
            await this.db.collection("videos").add(videoRecord);
        };
        // run in transaction to update the trackedRecord
        // so remove will be when we are in the beginning and want to take something back
        // swap will be once we have 5 youtueb videos, a user must swap videos if
        // they want to rchange one. Can't just delete
        this.swapVideos = async (userUuid, incomingVideoUuid, videoToReplaceUuid) => {
            // get the ids of the videos you want to replace
            // at this point video should already be created
            const existingTrackedRecord = await this.getTrackedVideoByVideoUuid(videoToReplaceUuid);
            await this.db.runTransaction(async (t) => {
                await t
                    .collections("tracked_videos")
                    .doc(existingTrackedRecord.id)
                    .update({
                    deletedAt: new Date().getTime(),
                });
                const newTrackedRecord = {
                    userUuid: userUuid,
                    videoUuid: incomingVideoUuid,
                };
                await t.collections("tracked_videos").add(newTrackedRecord);
            });
        };
        this.getLikeRecord = async (initiator, receiver) => {
            let likeSnapshot = await this.db
                .collection("likes")
                .where("initiator", "==", initiator)
                .where("receiver", "==", receiver)
                .get();
            if (likeSnapshot.length > 0) {
                const data = likeSnapshot[0].data();
                const like = {
                    createdAtUtc: data.createdAtUtc,
                    updatedAtUtc: data.updatedAtUtc,
                    deletedAtUtc: data.updatedAtUtc,
                    initiatorUuid: data.initiatorUuid,
                    receiverUuid: data.receiverUuid,
                };
                return like;
            }
            return null;
        };
        this.createUser = async (params) => {
            await this.db.collection("users").add(params);
        };
        this.deleteUser = async (uuid) => {
            const snapshot = await this.db
                .collection("users")
                .where("uuid", "==", uuid)
                .get();
            const docID = snapshot[0].id;
            await this.db.collection("users").doc(docID).update({
                deletedAt: new Date().getTime(),
            });
        };
        this.getProfileByUserUUID = async (uuid) => {
            const snapshot = await this.db
                .collection("users")
                .where("uuid", "==", uuid)
                .get();
            return snapshot[0].data();
        };
        this.getTrackedVideosByUserUuids = async (userUuids) => {
            const res = await this.db
                .collection("tracked_videos")
                .where("userUuid", "in", userUuids)
                .Get();
            return res;
        };
        this.getTrackedVideoByVideoUuid = async (videoUuid) => {
            const snapshot = await this.db
                .collection("tracked_videos")
                .where("videoUuid", "==", videoUuid)
                .Get();
            if (snapshot.length == 0)
                return null;
            const res = {
                videoUuid: snapshot[0].data().videoUuid,
                userUuid: snapshot[0].data().userUuid,
                id: snapshot[0].data().id,
            };
            return res;
        };
        this.getVideoByUuid = async (uuid) => {
            const snapshot = await this.db
                .collection("videos")
                .where("uuid", "==", uuid)
                .Get();
            if (snapshot.length == 0)
                return null;
            const data = snapshot[0].data();
            data.id = snapshot[0].id;
            const res = mapper_video_1.videoFirestoreToRecord(data);
            return res;
        };
        this.getVideosByUuids = async (uuids) => {
            const videos = [];
            const snapshot = await this.db
                .collection("videos")
                .where("uuid", "in", uuids)
                .Get();
            snapshot.forEach((doc) => {
                const vRecord = mapper_video_1.videoFirestoreToRecord(doc.data());
                videos.push(vRecord);
            });
            return videos;
        };
        this.getUserProfileEntities = async (filters) => {
            const users = [];
            const userUuidToDatingPref = new Map();
            const userUuidToVideos = new Map();
            // var db = admin.firestore();
            // get everyone that matches the dating preferences
            const datingMatchPreferencesSnapshot = await this.db
                .collection("dating_match_preferences")
                .where("gender", "array-contains", filters.genderPreference)
                .where("genderPreference", "==", filters.gender)
                .where("age", "<=", filters.ageMaxPreference)
                .where("age", ">=", filters.ageMinPreference)
                .where("ageMinPreference", "<=", filters.age)
                .where("ageMaxPreference", ">=", filters.age)
                .where("userUUID", "not-in", filters.userUuidsToFilterOut)
                .get();
            datingMatchPreferencesSnapshot.forEach((doc) => {
                const datingPrefEntity = mapper_user_1.datingMatchPrefRecordToEntity(doc.data());
                userUuidToDatingPref.set(datingPrefEntity.userUuid, datingPrefEntity);
            });
            // now get their associated videos
            // const videoUuids: string[] = [];
            const videoUuidToUserUuid = new Map();
            const trackedVideoRecords = await this.getTrackedVideosByUserUuids(Array.from(userUuidToDatingPref.keys()));
            trackedVideoRecords.forEach((trackedVideo) => {
                // videoUuids.push(trackedVideo.videoUuid);
                videoUuidToUserUuid.set(trackedVideo.videoUuid, trackedVideo.userUuid);
            });
            const videos = await this.getVideosByUuids(Array.from(videoUuidToUserUuid.keys()));
            // cycle through every video
            // check what the user uuid is for this video
            // map user uuid -> video
            videos.forEach((video) => {
                const userUuid = videoUuidToUserUuid.get(video.uuid);
                userUuidToVideos.get(userUuid).push(video);
            });
            const usersSnapshot = await this.db
                .collection("users")
                .where("uuid", "in", Array.from(userUuidToVideos.keys()));
            usersSnapshot.forEach((doc) => {
                const userEntity = {
                    uuid: doc.data().uuid,
                    userDatingPreference: userUuidToDatingPref.get(doc.data().uuid),
                    videoEntities: userUuidToVideos.get(doc.data().uuid),
                };
                users.push(userEntity);
            });
            return users;
        };
        this.getDatingPreferencesByUuid = async (uuid) => {
            const datingMatchPreferencesSnapshot = await this.db
                .collection("dating_match_preferences")
                .where("userUUID", "==", uuid)
                .get();
            // handle by mapper
            const prefs = {};
            if (datingMatchPreferencesSnapshot.length > 0) {
                const data = datingMatchPreferencesSnapshot[0].data();
                prefs.uuid = data.UUID;
                prefs.userUuid = data.userUUID;
                prefs.genderPreference = data.genderPreference;
                prefs.gender = data.gender;
                prefs.age = data.age;
                prefs.ageMinPreference = data.ageMinPreference;
                prefs.ageMaxPreference = data.ageMaxPreference;
                prefs.zipcode = data.zipcode;
                prefs.zipcodePreference = data.zipcodePreference;
            }
            return prefs;
        };
    }
};
Repo = __decorate([
    tsyringe_1.injectable()
    // you can just set the db value in the testing code
    // not a big deal
    ,
    __metadata("design:paramtypes", [])
], Repo);
exports.Repo = Repo;
// // https://firebase.google.com/docs/firestore/query-data/get-data#node.js
/*
https://levelup.gitconnected.com/dependency-injection-in-typescript-2f66912d143c

*/
//# sourceMappingURL=repo.js.map