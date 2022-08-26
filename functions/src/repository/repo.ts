import {
  DatingMatchPreferencesEntity,
  UserEntity,
  UserRecord,
} from "../types/user";
import {
  MatchRecord,
  BlockRecord,
  // DatingPreferencesFilterEntity,
  UserProfileSearchFilterRecord,
  LikeRecord,
} from "../types/match";
import { datingMatchPrefRecordToEntity } from "../utils/mapper-user";
import { videoFirestoreToRecord } from "../utils/mapper-video";
import { VideoEntity, VideoRecord, TrackedVideoRecord } from "../types/video";
import { injectable } from "tsyringe";
import { container } from "tsyringe";
const fns = require("firebase-functions");
const admin = require("firebase-admin");

export interface RepoParams {
  db: any;
}

@injectable()
// you can just set the db value in the testing code
// not a big deal
export class Repo {
  db: any;

  constructor() {}

  createMatchRecord = async (params: MatchRecord) => {
    this.db.collection("matches").add(params);
  };

  getUserUuidsMatchedToUuid = async (uuid: string): Promise<string[]> => {
    const ids = new Set<string>();
    // var db = admin.firestore();
    let usersSnapshot = await this.db
      .collection("match")
      .where("matchedUsersUUIDs", "array-contains", uuid)
      .get();

    const results = new Set<string>();
    usersSnapshot.forEach((doc) => {
      const matchedUserUUIDs = doc
        .data()
        .matchedUsersUUIDs.filter((matchedUserUUID) => matchedUserUUID != uuid);
      matchedUserUUIDs.forEach((item) => results.add(item));
    });
    return Array.from(results);
  };

  // make sure to check by status and not deleted
  getMatchRecordByUuids = async (
    uuid1: string,
    uuid2: string
  ): Promise<MatchRecord> => {
    const matchSnapshot = this.db
      .collection("matches")
      .where("matchedUsersUuids", "array-contains", [uuid1, uuid2])
      .get();
    return null;
  };

  createBlockRecord = async (blockRecord: BlockRecord) => {
    await this.db.collection("blocks").add(blockRecord);
  };

  // make sure to set delted_at = null
  getBlockedByUserUuids = async (
    uuid1: string,
    uuid2: string
  ): Promise<BlockRecord> => {
    let usersSnapshot = await this.db
      .collection("block")
      .where("blockedUserUuids", "array-contains", [uuid1, uuid2])
      .get();

    if (usersSnapshot.length > 0) {
      const data = usersSnapshot[0].data();
      const record: BlockRecord = {
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

  getUsersWhoBlockedThisUuid = async (uuid: string): Promise<string[]> => {
    const ids = new Set<string>();

    let usersSnapshot = await this.db
      .collection("blocks")
      .where("blockedUserUuids", "array-contains", uuid)
      .get();

    const results = new Set<string>();

    usersSnapshot.forEach((doc) => {
      const blockedUUIDs = doc
        .data()
        .blockedUserUUIDs.filter((blockedUUID) => blockedUUID != uuid);
      blockedUUIDs.forEach((item) => results.add(item));
    });
    return Array.from(results);
  };

  createLikeRecord = async (params: LikeRecord) => {
    const res = await this.db.collection("likes").add(params);
  };

  createLikeAndMatchRecords = async (
    likeParams: LikeRecord,
    matchParams: MatchRecord
  ) => {
    await this.db.runTransaction(async (t) => {
      await t.collection("likes").add(likeParams);
      await t.collection("matches").add(matchParams);
    });
  };

  createTrackedVideoRecord = async (trackedVideoRecord: TrackedVideoRecord) => {
    await this.db.collection("tracked_videos").add(trackedVideoRecord);
  };

  getVideoById = async (videoId: string): Promise<VideoRecord> => {
    let videoSnapshot = await this.db
      .collection("videos")
      .where("videoId", "==", videoId)
      .get();

    if (videoSnapshot.length == 0) return null;

    const data = videoSnapshot[0].data();
    const videoRecord: VideoRecord = {
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

  createVideoAndTrackedVideoRecords = async (
    videoRecord: VideoRecord,
    trackedVideoRecord: TrackedVideoRecord
  ) => {
    await this.db.runTransaction(async (t) => {
      await t.collection("likes").add(videoRecord);
      await t.collection("matches").add(trackedVideoRecord);
    });
  };

  getUserIdByUuid = async (uuid: string): Promise<string> => {
    return await this.db.collection("users").where("uuid", "==", uuid).get();
  };

  // set the tracked video's deleted to now
  removeVideo = async (videoUuid: string) => {
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

  createVideo = async (videoRecord: VideoRecord) => {
    await this.db.collection("videos").add(videoRecord);
  };

  // run in transaction to update the trackedRecord
  // so remove will be when we are in the beginning and want to take something back
  // swap will be once we have 5 youtueb videos, a user must swap videos if
  // they want to rchange one. Can't just delete
  swapVideos = async (
    userUuid: string,
    incomingVideoUuid: string,
    videoToReplaceUuid: string
  ) => {
    // get the ids of the videos you want to replace
    // at this point video should already be created
    const existingTrackedRecord = await this.getTrackedVideoByVideoUuid(
      videoToReplaceUuid
    );
    await this.db.runTransaction(async (t) => {
      await t
        .collections("tracked_videos")
        .doc(existingTrackedRecord.id)
        .update({
          deletedAt: new Date().getTime(),
        });

      const newTrackedRecord: TrackedVideoRecord = {
        userUuid: userUuid,
        videoUuid: incomingVideoUuid,
      };
      await t.collections("tracked_videos").add(newTrackedRecord);
    });
  };

  getLikeRecord = async (
    initiator: string,
    receiver: string
  ): Promise<LikeRecord> => {
    let likeSnapshot = await this.db
      .collection("likes")
      .where("initiator", "==", initiator)
      .where("receiver", "==", receiver)
      .get();

    if (likeSnapshot.length > 0) {
      const data = likeSnapshot[0].data();
      const like: LikeRecord = {
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

  createUser = async (params: UserRecord) => {
    await this.db.collection("users").add(params);
  };

  deleteUser = async (uuid: string) => {
    const snapshot = await this.db
      .collection("users")
      .where("uuid", "==", uuid)
      .get();

    const docID = snapshot[0].id;
    await this.db.collection("users").doc(docID).update({
      deletedAt: new Date().getTime(),
    });
  };

  getProfileByUserUUID = async (uuid: string) => {
    const snapshot = await this.db
      .collection("users")
      .where("uuid", "==", uuid)
      .get();
    return snapshot[0].data();
  };

  getTrackedVideosByUserUuids = async (
    userUuids: string[]
  ): Promise<TrackedVideoRecord[]> => {
    const res = await this.db
      .collection("tracked_videos")
      .where("userUuid", "in", userUuids)
      .Get();

    return res;
  };

  getTrackedVideoByVideoUuid = async (
    videoUuid: string
  ): Promise<TrackedVideoRecord> => {
    const snapshot = await this.db
      .collection("tracked_videos")
      .where("videoUuid", "==", videoUuid)
      .Get();
    if (snapshot.length == 0) return null;

    const res: TrackedVideoRecord = {
      videoUuid: snapshot[0].data().videoUuid,
      userUuid: snapshot[0].data().userUuid,
      id: snapshot[0].data().id,
    };
    return res;
  };

  getVideoByUuid = async (uuid: string): Promise<VideoRecord> => {
    const snapshot = await this.db
      .collection("videos")
      .where("uuid", "==", uuid)
      .Get();
    if (snapshot.length == 0) return null;
    const data = snapshot[0].data();
    data.id = snapshot[0].id;
    const res = videoFirestoreToRecord(data);
    return res;
  };

  getVideosByUuids = async (uuids: string[]): Promise<VideoRecord[]> => {
    const videos: VideoRecord[] = [];
    const snapshot = await this.db
      .collection("videos")
      .where("uuid", "in", uuids)
      .Get();
    snapshot.forEach((doc) => {
      const vRecord = videoFirestoreToRecord(doc.data());
      videos.push(vRecord);
    });
    return videos;
  };

  getUserProfileEntities = async (
    filters: UserProfileSearchFilterRecord
  ): Promise<UserEntity[]> => {
    const users: UserEntity[] = [];

    const userUuidToDatingPref = new Map<
      string,
      DatingMatchPreferencesEntity
    >();
    const userUuidToVideos = new Map<string, VideoEntity[]>();

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
      const datingPrefEntity: DatingMatchPreferencesEntity =
        datingMatchPrefRecordToEntity(doc.data());

      userUuidToDatingPref.set(datingPrefEntity.userUuid, datingPrefEntity);
    });

    // now get their associated videos
    // const videoUuids: string[] = [];
    const videoUuidToUserUuid = new Map<string, string>();

    const trackedVideoRecords = await this.getTrackedVideosByUserUuids(
      Array.from(userUuidToDatingPref.keys())
    );

    trackedVideoRecords.forEach((trackedVideo) => {
      // videoUuids.push(trackedVideo.videoUuid);
      videoUuidToUserUuid.set(trackedVideo.videoUuid, trackedVideo.userUuid);
    });

    const videos = await this.getVideosByUuids(
      Array.from(videoUuidToUserUuid.keys())
    );

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
      const userEntity: UserEntity = {
        uuid: doc.data().uuid,
        userDatingPreference: userUuidToDatingPref.get(doc.data().uuid),
        videoEntities: userUuidToVideos.get(doc.data().uuid),
      };
      users.push(userEntity);
    });
    return users;
  };

  getDatingPreferencesByUuid = async (
    uuid: string
  ): Promise<DatingMatchPreferencesEntity> => {
    const datingMatchPreferencesSnapshot = await this.db
      .collection("dating_match_preferences")
      .where("userUUID", "==", uuid)
      .get();

    // handle by mapper
    const prefs: DatingMatchPreferencesEntity = {};
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

// // https://firebase.google.com/docs/firestore/query-data/get-data#node.js

/*
https://levelup.gitconnected.com/dependency-injection-in-typescript-2f66912d143c

*/
