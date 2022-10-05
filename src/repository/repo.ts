import {
  DatingMatchPreferencesEntity,
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
  UserSearchFilter,
  // Gender,
} from "../types/user";
import { ImageRecord } from "../types/image";
import { MatchRecord, BlockRecord, LikeRecord } from "../types/match";
import { datingMatchPrefRecordToEntity } from "../utils/mapper-user";
import { VideoEntity, VideoRecord, TrackedVideoRecord } from "../types/video";
import { injectable, singleton } from "tsyringe";
import { container } from "tsyringe";
var mysql = require("mysql2/promise");
import "reflect-metadata";

export interface RepoParams {
  db: any;
}

@singleton()
export class Repo {
  public db: any;
  public client: any;

  constructor() {}

  getMySQLConnection = async () => {
    if (this.db) return;
    try {
      const db = await mysql.createConnection({
        host: process.env.HOST, // "localhost",
        port: process.env.PORT, // "3308",
        user: "test",
        password: "test",
        database: "test",
      });
      this.db = db;
    } catch (e) {
      console.log(e);
      throw e;
      // todo, fail the entire server code.
    }
  };

  testAdd = (a, b) => {
    return a + b;
  };

  // http://mongodb.github.io/node-mongodb-native/3.6/api/Cursor.html
  createMatchRecord = async (params: MatchRecord) => {
    try {
      await this.getMySQLConnection();

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
      await this.getMySQLConnection();

      const query = `
        SELECT * FROM matches 
        where 
          (initiator_uuid = ? and receiver_uuid = ? or receiver_uuid = ? and initiator_uuid = ?) and deleted_at_utc is null `;
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
    await this.getMySQLConnection();

    const query = `select * from matches where uuid = ? and deleted_at_utc is null`;
    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  deleteMatchRecord = async (uuid: string) => {
    await this.getMySQLConnection();

    const curTime = new Date();
    const query = "update matches set deleted_at_utc = ? where uuid = ?";
    await this.db.query(query, [curTime, uuid]);
  };

  /*
    get users matched to this uuid
  */
  getUserUuidsMatchedToUuid = async (uuid: string): Promise<string[]> => {
    await this.getMySQLConnection();

    const query = `select initiator_uuid, receiver_uuid from matches
    where (initiator_uuid = ? or receiver_uuid = ?) and deleted_at_utc is null group by initiator_uuid, receiver_uuid;
      `;
    const [rows, fields] = await this.db.query(query, [uuid, uuid]);
    if (rows.length == 0) return null;

    const results: string[] = [];
    rows.forEach((doc) => {
      if (doc.initiator_uuid != uuid) results.push(doc.initiator_uuid);
      else results.push(doc.receiver_uuid);
    });
    return results;
  };

  createBlockRecord = async (blockRecord: BlockRecord) => {
    await this.getMySQLConnection();

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
    await this.getMySQLConnection();

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
    await this.getMySQLConnection();

    const query = `SELECT * from blocks where receiver_uuid = ? and deleted_at_utc is null`;
    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows;
  };

  createLikeRecord = async (params: LikeRecord) => {
    await this.getMySQLConnection();
    await this.db.query("insert into likes set ? ", [params]);
  };

  createLikeAndMatchRecordInTx = async (
    likeParams: LikeRecord,
    matchParams: MatchRecord
  ) => {
    try {
      await this.getMySQLConnection();

      await this.db.beginTransaction();
      await this.createLikeAndMatchRecords(likeParams, matchParams);
      await this.db.commit();
    } catch (e) {
      this.db.rollback();
      throw e;
    }
  };

  createLikeAndMatchRecords = async (
    likeParams: LikeRecord,
    matchParams: MatchRecord
  ) => {
    await this.getMySQLConnection();

    await this.createLikeRecord(likeParams);
    await this.createMatchRecord(matchParams);
  };

  createTrackedVideoRecord = async (trackedVideoRecord: TrackedVideoRecord) => {
    await this.getMySQLConnection();

    await this.db.query("insert into tracked_videos set ?", [
      trackedVideoRecord,
    ]);
  };

  getVideoByVideoId = async (videoId: string): Promise<VideoRecord> => {
    await this.getMySQLConnection();

    const query = `select * from videos where video_id = ? and deleted_at_utc is null`;
    const [rows, fields] = await this.db.query(query, [videoId]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  createVideoAndTrackedVideoInTx = async (
    videoRecord: VideoRecord,
    trackedVideoRecord: TrackedVideoRecord
  ) => {
    try {
      await this.getMySQLConnection();

      await this.db.beginTransaction();
      await this.createVideoAndTrackedVideoRecords(
        videoRecord,
        trackedVideoRecord
      );
      await this.db.commit();
    } catch (e) {
      this.db.rollback();
      throw e;
    }
  };

  createVideoAndTrackedVideoRecords = async (
    videoRecord: VideoRecord,
    trackedVideoRecord: TrackedVideoRecord
  ) => {
    await this.getMySQLConnection();

    await this.createVideo(videoRecord);
    await this.createTrackedVideoRecord(trackedVideoRecord);
  };

  removeVideo = async (videoUuid: string) => {
    await this.getMySQLConnection();

    const curTime = new Date();

    const queryVideos = `update videos set deleted_at_utc = ? where uuid = ?`;
    await this.db.query(queryVideos, [curTime, videoUuid]);

    const queryTrackedVideos = `update tracked_videos set deleted_at_utc = ? where video_uuid = ?`;
    await this.db.query(queryTrackedVideos, [curTime, videoUuid]);
  };

  removeVideoInTx = async (videoUuid: string) => {
    try {
      await this.getMySQLConnection();

      await this.db.beginTransaction();
      await this.removeVideo(videoUuid);
      await this.db.commit();
    } catch (e) {
      this.db.rollback();
      throw e;
    }
  };

  createVideo = async (videoRecord: VideoRecord) => {
    await this.getMySQLConnection();

    const query = "INSERT INTO videos set ?";
    await this.db.query(query, [videoRecord]);
  };

  swapVideosInTx = async (
    newTrackedVideoRecordUuid: string,
    userUuid: string,
    incomingVideoUuid: string,
    videoToReplaceUuid: string
  ) => {
    try {
      await this.getMySQLConnection();

      await this.db.beginTransaction();
      await this.swapVideos(
        newTrackedVideoRecordUuid,
        userUuid,
        incomingVideoUuid,
        videoToReplaceUuid
      );
      await this.db.commit();
    } catch (e) {
      this.db.rollback();
      throw e;
    }
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
    await this.getMySQLConnection();

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
  ): Promise<LikeRecord> | null => {
    await this.getMySQLConnection();

    const query = `select * from likes where initiator_uuid = ? and receiver_uuid = ?`;
    const [rows, fields] = await this.db.query(query, [
      initiatorUuid,
      receiverUuid,
    ]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  createUser = async (params: UserRecord) => {
    try {
      await this.getMySQLConnection();

      await this.db.query("INSERT INTO users SET ?", params);
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  createUserInTx = async (params: UserRecord) => {
    try {
      await this.getMySQLConnection();
      await this.db.beginTransaction();

      await this.createUser(params);
      if (params.dating_preference)
        await this.createDatingPreferencesRecord(params.dating_preference);

      await this.db.commit();
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  deleteUserByUuid = async (uuid: string) => {
    await this.getMySQLConnection();

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
      await this.getMySQLConnection();
      const [rows, fields] = await this.db.query(
        "SELECT * FROM users where uuid = ? ",
        [uuid]
      );
      if (rows.length == 0) return null;
      const videos = await this.getVideosByUserUuid(uuid);
      const dmp = await this.getDatingPreferencesByUserUuid(uuid);
      rows[0].videos = videos;
      rows[0].dating_preference = dmp;

      return rows[0];
    } catch (e) {
      throw e;
    }
  };

  getVideosByUserUuid = async (
    userUuid: string
  ): Promise<VideoRecord[] | null> => {
    await this.getMySQLConnection();

    const [rows, fields] = await this.db.query(
      `SELECT v.* FROM videos v
      join tracked_videos tv on v.uuid = tv.video_uuid
      join users u on u.uuid = tv.user_uuid and u.uuid = ?
       `,
      [userUuid]
    );
    if (rows.length == 0) return null;
    return rows;
  };

  /*
  get all tracked videos for a user uuid
  */
  getTrackedVideosByUserUuids = async (
    userUuids: string[]
  ): Promise<TrackedVideoRecord[]> => {
    await this.getMySQLConnection();

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
    await this.getMySQLConnection();

    const query =
      "select * from tracked_videos where video_uuid = ? and deleted_at_utc is null";
    const [rows, fields] = await this.db.query(query, [videoUuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  getVideoByUuid = async (uuid: string): Promise<VideoRecord> => {
    await this.getMySQLConnection();

    const query = "select * from videos where uuid = ?";
    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  getVideosByUuids = async (uuids: string[]): Promise<VideoRecord[]> => {
    await this.getMySQLConnection();

    const query = "select * from videos where uuid in (?)";
    const [rows, fields] = await this.db.query(query, [uuids]);
    if (rows.length == 0) return null;
    return rows;
  };

  // make sure to include joins to not get people
  // who are already matched to this user
  // who are blocked (can then drop the user_uuid not in)
  getUsersForMatching = async (
    filters: UserSearchFilter
  ): Promise<UserRecord[]> => {
    await this.getMySQLConnection();

    let {
      gender, // what gender the user should be
      genderPreference, // what their gender pference shoudl be
      ageMin, // what their age min should be
      ageMax, // what their age Max should be
      age, // what my age is
      userUuidsToFilterOut,
    } = filters;

    // what their gender should be.
    // TODO – add this to valdiation
    if (gender !== "MAN" && gender !== "WOMAN") {
      throw new Error("invalid selection for gender search query");
    }

    // what their gender pref should be
    // TODO – add this to validation
    let userGenderPrefShouldBe;
    if (genderPreference === "MAN") {
      userGenderPrefShouldBe = ["MAN", "BOTH"];
    } else if (genderPreference === "WOMAN") {
      userGenderPrefShouldBe = ["WOMAN", "BOTH"];
    } else {
      throw new Error("invalid selection for gender preference");
    }

    if (!userUuidsToFilterOut) userUuidsToFilterOut = ["garbage"];
    let query = `
    select u.* from users u 
    join dating_match_preferences dmp on
      dmp.gender = ? and 
      dmp.gender_preference in (?) and
      dmp.age >= ? and
      dmp.age <= ? and
      dmp.age_max_preference >= ? and
      dmp.age_min_preference <= ? and
      dmp.user_uuid = u.uuid
    where u.uuid not in (?) and
    u.verified = true and u.deleted_at_utc is null
    `;

    // need to do some processing on the gender
    let [rows, fields] = await this.db.query(query, [
      gender, // their gender matches my gender preference
      userGenderPrefShouldBe, // my gender is in their gender preferences
      ageMin,
      ageMax,
      age,
      age,
      userUuidsToFilterOut,
    ]);

    if (rows.length == 0) return null;

    const userUuids = rows.map((user) => user.uuid);
    const usersMap = new Map<String, UserRecord>();
    rows.forEach((row) => {
      // make this a mapper function
      const userRecord: UserRecord = {
        ...row,
        videos: [],
      };
      usersMap.set(row.uuid, userRecord);
    });

    query = `
    select v.*, u.uuid as user_uuid
    from 
      videos v
    join tracked_videos tv on tv.video_uuid = v.uuid
    join users u on tv.user_uuid = u.uuid
    where u.uuid in (?) and v.deleted_at_utc is null
    
  `;

    [rows, fields] = await this.db.query(query, [userUuids]);
    if (rows.length == 0) return null;
    rows.forEach((row) => {
      if (usersMap.has(row.user_uuid)) {
        const userUuid = row.user_uuid;
        delete row.user_uuid;

        usersMap.get(userUuid).videos.push(row);
      }
    });

    return Array.from(usersMap.values());
  };

  getDatingPreferencesByUserUuid = async (
    userUuid: string
  ): Promise<DatingMatchPreferencesEntity> => {
    await this.getMySQLConnection();

    const query = "select * from dating_match_preferences where user_uuid = ?";
    const [rows, fields] = await this.db.query(query, [userUuid]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  createDatingPreferencesRecord = async (
    params: DatingMatchPreferencesRecord
  ) => {
    await this.getMySQLConnection();

    const query = "insert into dating_match_preferences set ?";
    await this.db.query(query, [params]);
  };

  // need a way to flag inapprorpiate images, consider adding a status to the image schema
  // TODO – unit tests for all of these
  createImage = async (params: ImageRecord) => {
    await this.getMySQLConnection();

    const query = "insert into images set ?";
    await this.db.query(query, [params]);
  };

  updateImage = async (params: ImageRecord) => {
    await this.getMySQLConnection();

    const query = "update images set ? where uuid = ?";
    await this.db.query(query, [params, params.uuid]);
  };

  // need to check if the image for this index already exists
  getImageByIndexAndUserUuid = async (
    positionIndex: number,
    userUuid: string
  ): Promise<ImageRecord | null> => {
    await this.getMySQLConnection();

    const query =
      "select * from images where user_uuid = ? and position_index = ? and deleted_at_utc is null";

    const [rows, fields] = await this.db.query(query, [
      userUuid,
      positionIndex,
    ]);
    if (rows.length == 0) return null;
    return rows[0];
  };

  getImagesByUserUuid = async (uuid: string): Promise<ImageRecord[] | null> => {
    await this.getMySQLConnection();
    const query =
      "select * from images where user_uuid = ? and deleted_at_utc is null";

    const [rows, fields] = await this.db.query(query, [uuid]);
    if (rows.length == 0) return null;
    return rows;
  };

  updateUser = async (params: UserRecord) => {
    await this.getMySQLConnection();

    const query = "update users set ? where uuid = ?";
    await this.db.query(query, [params, params.uuid]);
  };

  updateDatingMatchPreferences = async (
    params: DatingMatchPreferencesRecord
  ) => {
    await this.getMySQLConnection();

    const query = "update dating_match_preferences set ? where user_uuid = ?";
    await this.db.query(query, [params, params.user_uuid]);
  };
}
/*
https://levelup.gitconnected.com/dependency-injection-in-typescript-2f66912d143c
*/
