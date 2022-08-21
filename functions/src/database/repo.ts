import {
  DatingMatchPreferencesEntity,
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
} from "../types/user";
import {
  MatchRecord,
  BlockRecord,
  // DatingPreferencesFilterEntity,
  UserProfileSearchFilterRecord,
  LikeRecord,
} from "../types/match";
import { VideoEntity } from "../types/video";
import { stringify } from "querystring";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const Firestore = require("@google-cloud/firestore");
// Use your project ID here
const PROJECTID = "dating-app-622c1";

export interface RepoParams {
  db: any;
}

// interface RepoFunctions {
//   getLikeRecord: (initiator: string, receiver: string) => Promise<LikeRecord>;
// }

export class Repo {
  db: any;

  constructor(p: RepoParams) {
    this.db = p.db;
  }

  createMatchRecord = async (params: MatchRecord) => {
    this.db.collection("matches").add(params);
  };

  getUserUuidsMatchedToUuid = async (uuid: string): Promise<string[]> => {
    const ids = new Set<string>();
    var db = admin.firestore();
    let usersSnapshot = await this.db
      .collection("match")
      .where("matchedUsersUUIDs", "array-contains", uuid)
      .get();

    const results = new Set<string>();
    usersSnapshot.forEach((doc) => {
      // console.log(doc.id, '=>', doc.data());
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
        responderUuid: data.responderUuid,
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
      // console.log(doc.id, '=>', doc.data());
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

  getUserProfileEntities = async (
    filters: UserProfileSearchFilterRecord
  ): Promise<UserEntity[]> => {
    const users: UserEntity[] = [];

    const userUUIDToDatingPref = new Map<
      string,
      DatingMatchPreferencesEntity
    >();
    const userUUIDToVideos = new Map<string, VideoEntity[]>();

    var db = admin.firestore();
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
      const datingPrefEntity: DatingMatchPreferencesEntity = {
        uuid: doc.data().uuid,
        userUuid: doc.data().userUuid,
        genderPreference: doc.data().genderPreference,
        gender: doc.data().gender,
        ageMinPreference: doc.data().ageMinPreference,
        ageMaxPreference: doc.data().ageMaxPreference,
        zipcode: doc.data().zipcode,
        zipcodePreference: doc.data().zipcodePreference,
        age: doc.data().age,
      };
      userUUIDToDatingPref.set(doc.data().userUuid, datingPrefEntity);
    });

    // now get video entities
    const videosSnapshot = await this.db
      .collections("videos")
      .where("userUUID", "in", Array.from(userUUIDToDatingPref.keys()));

    videosSnapshot.forEach((doc) => {
      const video: VideoEntity = {
        uuid: doc.data().uuid,
        userUUID: doc.data().userUUID,
        videoId: doc.data().videoId,
        channelId: doc.data().channelId,
        videoTitle: doc.data().videoTitle,
        description: doc.data().description,
        categoryId: doc.data().categoryId,
        topicCategories: doc.data().topicCategories,
      };

      if (!userUUIDToVideos.has(video.userUUID))
        userUUIDToVideos.set(video.userUUID, []);
      userUUIDToVideos.get(video.userUUID).push(video);
    });

    const usersSnapshot = await this.db
      .collection("users")
      .where("uuid", "in", Array.from(userUUIDToDatingPref.keys()));

    usersSnapshot.forEach((doc) => {
      const userEntity: UserEntity = {
        uuid: doc.data().uuid,
        userDatingPreference: userUUIDToDatingPref.get(doc.data().UUID),
        videoEntities: userUUIDToVideos.get(doc.data().UUID),
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

export const getDatingPreferencesByUuid = async (
  uuid: string
): Promise<DatingMatchPreferencesEntity> => {
  var db = admin.firestore();
  const datingMatchPreferencesSnapshot = await db
    .collection("dating_match_preferences")
    .where("userUUID", "==", uuid)
    .get();

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

// // https://firebase.google.com/docs/firestore/query-data/get-data#node.js
// export const getDatingPreferencesByDatingMatchPreferences = async (
//   filter: DatingPreferencesFilterEntity
// ): Promise<DatingMatchPreferencesEntity[]> => {
//   var db = admin.firestore();

//   // avoid these ppl
//   // now get everything that was recently matched, currently matched
//   // or blocked and filter it out.
//   const datingMatchesSnapshot = await db
//     .collection("dating_matches")
//     .where("initiator_uuid", "==", filter.initatorUuid)
//     .where("responder_uuid", "==", filter.responderUuid)
//     .where("status", "!=", [["active", "blocked"]])
//     .select("user_uuid")
//     .get();

//   const uuidsToFilterOut = [];
//   datingMatchesSnapshot.forEach((dm) => {
//     uuidsToFilterOut.push(dm);
//   });

//   const datingPrefSnapshot = await db
//     .collection("dating_preferences")
//     .where("gender", "==", filter.genderPreference)
//     .where("gender_preference", "==", filter.gender)
//     .where("age", ">=", filter.minAge)
//     .where("age", "<=", filter.maxAge)
//     .where("user_uuid", "not-in", [uuidsToFilterOut])
//     .get();

//   const candidateDatingPreferences = [];
//   datingPrefSnapshot.forEach((item) => {});
//   return datingPrefSnapshot;
// };

export const getUsersByUuids = async (userUuids: string[]) => {
  var db = admin.firestore();
  const usersSnapshot = await db
    .collection("users")
    .where("user_uuid", "in", [userUuids])
    .get();
  return usersSnapshot;
};

// export const getUserUuidsMatchedToUuid = async (
//   uuid: string
// ): Promise<string[]> => {
//   const ids = new Set<string>();
//   var db = admin.firestore();
//   let usersSnapshot = await db
//     .collection("match")
//     .where("matchedUsersUUIDs", "array-contains", uuid)
//     .get();

//   const results = new Set<string>();
//   usersSnapshot.forEach((doc) => {
//     // console.log(doc.id, '=>', doc.data());
//     const matchedUserUUIDs = doc
//       .data()
//       .matchedUsersUUIDs.filter((matchedUserUUID) => matchedUserUUID != uuid);
//     matchedUserUUIDs.forEach((item) => results.add(item));
//   });
//   return Array.from(results);
// };

//

export const testAdd = (a: number, b: number): number => {
  return a + b;
};

// export interface createUserParams {
//   uuid?: string;
//   mobile?: string;
//   email?: string;
//   verified?: boolean;
// }

// export interface createLikeParams {
//   initiatorUuid?: string;
//   receiverUuid?: string;
// }

// export interface createMatchParams {
//   initiatorUuid?: string;
//   responderUuid?: string;
//   matchedUsersUuids?: string[];
// }
