import {
  DatingMatchPreferencesEntity,
  UserEntity,
  DatingMatchPreferencesRecord,
} from "../types/user";
import {
  // DatingPreferencesFilterEntity,
  UserProfileSearchFilterRecord,
} from "../types/match";
import { VideoEntity } from "../types/video";
import { stringify } from "querystring";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const Firestore = require("@google-cloud/firestore");
// Use your project ID here
const PROJECTID = "dating-app-622c1";

export interface UserRepoParams {
  db: any;
}

export class UserRepo {
  db: any;

  constructor(p: UserRepoParams) {
    this.db = p.db;
  }

  getDatingPreferencesByUuid = async (
    uuid: string
  ): Promise<DatingMatchPreferencesEntity> => {
    const datingMatchPreferencesSnapshot = await this.db
      .collection("dating_match_preferences")
      .where("userUUID", "==", uuid)
      .get();

    const prefs: DatingMatchPreferencesEntity = {};
    if (datingMatchPreferencesSnapshot.length > 0) {
      const d = datingMatchPreferencesSnapshot[0];
      const data = d.data();
      prefs.UUID = data.UUID;
      prefs.userUUID = data.userUUID;
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
    prefs.UUID = data.UUID;
    prefs.userUUID = data.userUUID;
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

export const getUserUUIDsMatchedToUUID = async (
  uuid: string
): Promise<string[]> => {
  const ids = new Set<string>();
  var db = admin.firestore();
  let usersSnapshot = await db
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

export const getUserUUIDsBlockedByUserUUID = async (
  uuid: string
): Promise<string[]> => {
  const ids = new Set<string>();
  var db = admin.firestore();
  let usersSnapshot = await db
    .collection("blocked_users")
    .where("blockedUserUUIDs", "array-contains", uuid)
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

// break up this fn
export const getUserProfileEntities = async (
  filters: UserProfileSearchFilterRecord
): Promise<UserEntity[]> => {
  const users: UserEntity[] = [];

  const userUUIDToDatingPref = new Map<string, DatingMatchPreferencesEntity>();
  const userUUIDToVideos = new Map<string, VideoEntity[]>();

  var db = admin.firestore();
  const datingMatchPreferencesSnapshot = await db
    .collection("dating_match_preferences")
    .where("gender", "array-contains", filters.genderPreference)
    .where("genderPreference", "==", filters.gender)
    .where("age", "<=", filters.ageMaxPreference)
    .where("age", ">=", filters.ageMinPreference)
    .where("ageMinPreference", "<=", filters.age)
    .where("ageMaxPreference", ">=", filters.age)
    .where("userUUID", "not-in", filters.userUUIDsToFilterOut)
    .get();

  datingMatchPreferencesSnapshot.forEach((doc) => {
    const datingPrefEntity: DatingMatchPreferencesEntity = {
      UUID: doc.data().UUID,
      userUUID: doc.data().userUUID,
      genderPreference: doc.data().genderPreference,
      gender: doc.data().gender,
      ageMinPreference: doc.data().ageMinPreference,
      ageMaxPreference: doc.data().ageMaxPreference,
      zipcode: doc.data().zipcode,
      zipcodePreference: doc.data().zipcodePreference,
      age: doc.data().age,
    };
    userUUIDToDatingPref.set(doc.data().userUUID, datingPrefEntity);
  });

  // now get video entities
  const videosSnapshot = await db
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

  const usersSnapshot = await db
    .collection("users")
    .where("uuid", "in", Array.from(userUUIDToDatingPref.keys()));

  usersSnapshot.forEach((doc) => {
    const userEntity: UserEntity = {
      UUID: doc.data().UUID,
      userDatingPreference: userUUIDToDatingPref.get(doc.data().UUID),
      videoEntities: userUUIDToVideos.get(doc.data().UUID),
    };
    users.push(userEntity);
  });
  return users;
};

export const testAdd = (a: number, b: number): number => {
  return a + b;
};
