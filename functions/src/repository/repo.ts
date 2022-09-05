import {
  DatingMatchPreferencesEntity,
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
} from "../types/user";
import {
  MatchRecord,
  BlockRecord,
  UserSearchFilter,
  LikeRecord,
} from "../types/match";
import { datingMatchPrefRecordToEntity } from "../utils/mapper-user";
import { videoFirestoreToRecord } from "../utils/mapper-video";
import { VideoEntity, VideoRecord, TrackedVideoRecord } from "../types/video";
import { injectable, singleton } from "tsyringe";
import { container } from "tsyringe";
const MongoClient = require("mongodb").MongoClient;
import "reflect-metadata";

export interface RepoParams {
  db: any;
}

@singleton()
export class Repo {
  public db: any;
  public client: any;

  constructor() {
    // this.setupMongoConnection();
  }

  setupMongoConnection = async () => {
    try {
      const uri = "mongodb://127.0.0.1:27020/youtube-dating-app";
      const client = await MongoClient.connect(uri);
      this.client = client;
      this.db = this.client.db;
      console.log("sucesfully connected to db");
    } catch (e) {
      console.log("failed to connect to db");
      console.log(e);
      throw e;
    }
  };

  testAdd = (a, b) => {
    return a + b;
  };

  // http://mongodb.github.io/node-mongodb-native/3.6/api/Cursor.html
  createMatchRecord = async (params: MatchRecord) => {
    try {
      await this.db.query("INSERT INTO matches SET ?", params);
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  /*
    get a match for both of these uuids if any exists
  */
  // make sure to check by status and not deleted
  getMatchRecordByUuids = async (
    uuid1: string,
    uuid2: string
  ): Promise<MatchRecord> => {
    try {
      const query = `
        SELECT * FROM matches 
        where 
          (initiator_uuid = ? and responder_uuid = ? or responder_uuid = ? and initiator_uuid = ?) and deleted_at_utc is null `;
      const [rows, fields] = await this.db.query(query, [
        uuid1,
        uuid2,
        uuid1,
        uuid2,
      ]);
      if (rows.length == 0) return null;
      return rows[0];
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  getMatchRecordByUuid = async (uuid: string): Promise<MatchRecord> => {
    const query = `select * from matches where uuid = ? and deleted_at_utc is null`;
    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  deleteMatchRecord = async (uuid: string) => {
    const curTime = new Date();
    const query = "update matches set deleted_at_utc = ? where uuid = ?";
    await this.db.query(query, [curTime, uuid]);
  };

  /*
    get users matched to this uuid
  */
  getUserUuidsMatchedToUuid = async (uuid: string): Promise<string[]> => {
    const query = `select initiator_uuid, responder_uuid from matches
    where (initiator_uuid = ? or responder_uuid = ?) and deleted_at_utc is null group by initiator_uuid, responder_uuid;
      `;
    const [rows, fields] = await this.db.query(query, [uuid, uuid]);
    if (rows.length == 0) return null;

    const results: string[] = [];
    rows.forEach((doc) => {
      if (doc.initiator_uuid != uuid) results.push(doc.initiator_uuid);
      else results.push(doc.responder_uuid);
    });
    return results;
  };

  createBlockRecord = async (blockRecord: BlockRecord) => {
    const query = `insert into blocks set ?`;
    await this.db.query(query, [blockRecord]);
  };

  /*
    get all the blocked records where uuid1 blocked uuid2 or other way around
  */
  // make sure to set delted_at = null
  getBlockedByUserUuids = async (
    uuid1: string,
    uuid2: string
  ): Promise<BlockRecord> => {
    const query = `
    SELECT * FROM blocks 
    where 
      (initiator_uuid = ? and receiver_uuid = ? or receiver_uuid = ? and initiator_uuid = ? ) and deleted_at_utc is null `;
    const [rows, fields] = await this.db.query(query, [
      uuid1,
      uuid2,
      uuid1,
      uuid2,
    ]);
    if (rows.length == 0) return null;
    return rows;
  };

  getUsersWhoBlockedThisUuid = async (uuid: string): Promise<string[]> => {
    const query = `SELECT * from blocks where receiver_uuid = ? and deleted_at_utc is null`;
    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows;
  };

  createLikeRecord = async (params: LikeRecord) => {
    await this.db.query("insert into likes set ? ", [params]);
  };

  createLikeAndMatchRecordInTx = async (
    likeParams: LikeRecord,
    matchParams: MatchRecord
  ) => {
    await this.db.beginTransaction();
    await this.db.createLikeAndMatchRecords(likeParams, matchParams);
    await this.db.commit();
  };

  createLikeAndMatchRecords = async (
    likeParams: LikeRecord,
    matchParams: MatchRecord
  ) => {
    await this.createLikeRecord(likeParams);
    await this.createMatchRecord(matchParams);
  };

  createTrackedVideoRecord = async (trackedVideoRecord: TrackedVideoRecord) => {
    await this.db.query("insert into tracked_videos set ?", [
      trackedVideoRecord,
    ]);
  };

  getVideoByVideoId = async (videoId: string): Promise<VideoRecord> => {
    const query = `select * from videos where video_id = ? and deleted_at_utc is null`;
    const [rows, fields] = await this.db.query(query, [videoId]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  createVideoAndTrackedVideoInTx = async (
    videoRecord: VideoRecord,
    trackedVideoRecord: TrackedVideoRecord
  ) => {
    await this.db.beginTransaction();
    await this.createVideoAndTrackedVideoRecords(
      videoRecord,
      trackedVideoRecord
    );
    await this.db.commit();
  };

  createVideoAndTrackedVideoRecords = async (
    videoRecord: VideoRecord,
    trackedVideoRecord: TrackedVideoRecord
  ) => {
    await this.createVideo(videoRecord);
    await this.createTrackedVideoRecord(trackedVideoRecord);
  };

  removeVideo = async (videoUuid: string) => {
    const curTime = new Date();

    const queryVideos = `update videos set deleted_at_utc = ? where uuid = ?`;
    await this.db.query(queryVideos, [curTime, videoUuid]);

    const queryTrackedVideos = `update tracked_videos set deleted_at_utc = ? where video_uuid = ?`;
    await this.db.query(queryTrackedVideos, [curTime, videoUuid]);
  };

  removeVideoInTx = async (videoUuid: string) => {
    await this.db.beginTransaction();
    await this.removeVideo(videoUuid);
    await this.db.commit();
  };

  createVideo = async (videoRecord: VideoRecord) => {
    const query = "INSERT INTO videos set ?";
    await this.db.query(query, [videoRecord]);
  };

  swapVideosInTx = async (
    newTrackedVideoRecordUuid: string,
    userUuid: string,
    incomingVideoUuid: string,
    videoToReplaceUuid: string
  ) => {
    await this.db.beginTransaction();
    await this.swapVideos(
      newTrackedVideoRecordUuid,
      userUuid,
      incomingVideoUuid,
      videoToReplaceUuid
    );
    await this.db.commit();
  };
  // run in transaction to update the trackedRecord
  // so remove will be when we are in the beginning and want to take something back
  // swap will be once we have 5 youtueb videos, a user must swap videos if
  // they want to rchange one. Can't just delete
  swapVideos = async (
    newTrackedVideoRecordUuid: string,
    userUuid: string,
    incomingVideoUuid: string,
    videoToReplaceUuid: string
  ) => {
    // get the ids of the videos you want to replace
    // at this point video should already be created
    const existingTrackedRecord = await this.getTrackedVideoByVideoUuid(
      videoToReplaceUuid
    );
    if (!existingTrackedRecord)
      throw new Error("existing tracked video not found");
    const deletedAtUtc = new Date();

    let query = `update tracked_videos set deleted_at_utc = ? where uuid = ?`;
    await this.db.query(query, [deletedAtUtc, existingTrackedRecord.uuid]);

    const newTrackedRecord: TrackedVideoRecord = {
      user_uuid: userUuid,
      video_uuid: incomingVideoUuid,
      uuid: newTrackedVideoRecordUuid,
    };
    query = `insert into tracked_videos SET ?`;
    await this.db.query(query, [newTrackedRecord]);
  };

  getLikeRecord = async (
    initiatorUuid: string,
    receiverUuid: string
  ): Promise<LikeRecord> => {
    const query = `select * from likes where initiator_uuid = ? and receiver_uuid = ?`;
    const [rows, fields] = await this.db.query(query, [
      initiatorUuid,
      receiverUuid,
    ]);
    if (rows.legnth == 0) return null;
    return rows[0];
  };

  createUser = async (params: UserRecord) => {
    // await this.db.collection("users").insertOne(params);
    try {
      await this.db.query("INSERT INTO users SET ?", params);
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  deleteUserByUuid = async (uuid: string) => {
    const user: UserRecord = await this.getUserByUUID(uuid);
    if (!user) throw new Error("user does not exist");
    const curTime = new Date();

    if (!user) throw new Error("user does not exist");
    await this.db.query("UPDATE users SET deleted_at_utc = ? where uuid = ?", [
      curTime,
      uuid,
    ]);
  };

  getUserByUUID = async (uuid: string): Promise<UserRecord> => {
    try {
      const [rows, fields] = await this.db.query(
        "SELECT * FROM users where uuid = ? and deleted_at_utc is null",
        [uuid]
      );
      if (rows.length == 0) return null;
      return rows[0];
    } catch (e) {
      console.log("ERROR: " + e);
      throw e;
    }
  };

  /*
  get all tracked videos for a user uuid
  */
  getTrackedVideosByUserUuids = async (
    userUuids: string[]
  ): Promise<TrackedVideoRecord[]> => {
    const records: TrackedVideoRecord[] = [];

    const query =
      "select * from tracked_videos where user_uuid in (?) and deleted_at_utc is null";
    const [rows, fields] = await this.db.query(query, [userUuids]);
    if (rows.length == 0) return null;
    return rows;
  };

  getTrackedVideoByVideoUuid = async (
    videoUuid: string
  ): Promise<TrackedVideoRecord> => {
    const query =
      "select * from tracked_videos where video_uuid = ? and deleted_at_utc is null";
    const [rows, fields] = await this.db.query(query, [videoUuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  getVideoByUuid = async (uuid: string): Promise<VideoRecord> => {
    const query = "select * from videos where uuid = ?";
    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  getVideosByUuids = async (uuids: string[]): Promise<VideoRecord[]> => {
    const query = "select * from videos where uuid in (?)";
    const [rows, fields] = await this.db.query(query, [uuids]);
    if (rows.length == 0) return null;
    return rows;
  };

  // make sure to include joins to not get people
  // who are already matched to this user
  // who are blocked (can then drop the user_uuid not in)
  //
  getUsersForMatching = async (
    filters: UserSearchFilter
  ): Promise<UserRecord[]> => {
    const {
      genderMan,
      genderWoman,
      genderPreferenceMan,
      genderPreferenceWoman,
      ageMaxPreference,
      ageMinPreference,
      age,
      userUuidsToFilterOut,
    } = filters;

    let query = `
      select * from dating_match_preferences where 
        dmp.gender_man = ? and
        dmp.gender_woman = ? and 
        dmp.gender_preference_man = ? and
        dmp.gender_preference_woman = ? and
        dmp.age <=  ? and 
        dmp.age >= ? and 
        dmp.age_max_preference >= ? and
        dmp.age_min_preference <= ? and 
        user_uuid not in (?)
    `;

    // need to do some processing on the gender
    let [rows, fields] = await this.db.query(query, [
      genderPreferenceMan,
      genderPreferenceWoman,
      genderMan,
      genderWoman,
      ageMaxPreference,
      ageMinPreference,
      age,
      age,
    ]);
    if (rows.length == 0) return null;

    const dmps: DatingMatchPreferencesRecord[] = rows;
    const userUuidToDatingPref = new Map<
      string,
      DatingMatchPreferencesRecord
    >();
    const userUuidToVideos = new Map<string, VideoEntity[]>();

    dmps.forEach((datingPrefEntity: DatingMatchPreferencesRecord) => {
      userUuidToDatingPref.set(datingPrefEntity.user_uuid, datingPrefEntity);
    });

    // now get their associated videos
    const videoUuidToUserUuid = new Map<string, string>();
    const trackedVideoRecords = await this.getTrackedVideosByUserUuids(
      Array.from(userUuidToDatingPref.keys())
    );

    trackedVideoRecords.forEach((trackedVideo) => {
      videoUuidToUserUuid.set(trackedVideo.video_uuid, trackedVideo.user_uuid);
    });

    const videos = await this.getVideosByUuids(
      Array.from(videoUuidToUserUuid.keys())
    );

    videos.forEach((video) => {
      const userUuid = videoUuidToUserUuid.get(video.uuid);
      userUuidToVideos.get(userUuid).push(video);
    });

    query = "select * from users where uuid in (?)";
    [rows, fields] = await this.db.query(query, [
      Array.from(userUuidToVideos.keys()),
    ]);
    if (rows.length == 0) return null;

    const users: UserRecord[] = rows;
    users.forEach((doc) => {
      const { uuid } = doc;
      const user: UserRecord = {
        uuid,
        dating_preference: userUuidToDatingPref.get(uuid),
        videos: userUuidToVideos.get(uuid),
      };
      users.push(user);
    });
    return users;
  };

  getDatingPreferencesByUserUuid = async (
    userUuid: string
  ): Promise<DatingMatchPreferencesEntity> => {
    const query = "select * from dating_match_preferences where user_uuid = ?";
    const [rows, fields] = await this.db.query(query, [userUuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  createDatingPreferencesRecord = async (
    params: DatingMatchPreferencesRecord
  ) => {
    const query = "insert into dating_match_preferences set ?";
    await this.db.query(query, [params]);
  };
}

/*
https://levelup.gitconnected.com/dependency-injection-in-typescript-2f66912d143c
*/
