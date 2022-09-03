import {
  DatingMatchPreferencesEntity,
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
} from "../types/user";
import {
  MatchRecord,
  BlockRecord,
  UserProfileSearchFilterRecord,
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
    await this.db.collection("matches").insertOne(params);
  };

  /*
    get a match for both of these uuids if any exists
  */
  // make sure to check by status and not deleted
  getMatchRecordByUuids = async (
    uuid1: string,
    uuid2: string
  ): Promise<MatchRecord> => {
    const matchRecord: MatchRecord = await this.db
      .collection("matches")
      .findOne({
        deletedAtUtc: null,
        $or: [
          {
            $and: [{ initiatorUuid: uuid1 }, { responderUuid: uuid2 }],
          },
          {
            $and: [{ initiatorUuid: uuid2 }, { responderUuid: uuid1 }],
          },
        ],
      });
    return matchRecord;
  };

  getMatchRecordByUuid = async (uuid: string): Promise<MatchRecord> => {
    return await this.db
      .collection("matches")
      .findOne({ uuid, deletedAtUtc: null });
  };

  deleteMatchRecord = async (uuid: string) => {
    const user: MatchRecord = await this.getMatchRecordByUuid(uuid);

    if (!user) throw new Error("match does not exist");
    await this.db.collection("matches").updateOne(
      {
        uuid,
      },
      { $set: { deletedAtUtc: new Date().getTime() } }
    );
  };

  /*
    get users matched to this uuid
  */
  getUserUuidsMatchedToUuid = async (uuid: string): Promise<string[]> => {
    let results = new Set<string>();
    const cursor = await this.db.collection("matches").find({
      $or: [{ responderUuid: uuid }, { initiatorUuid: uuid }],
    });

    await cursor.forEach((doc) => {
      const { initiatorUuid, responderUuid } = doc;

      if (initiatorUuid !== uuid) results.add(initiatorUuid);
      else results.add(responderUuid);
    });

    return Array.from(results);
  };

  createBlockRecord = async (blockRecord: BlockRecord) => {
    await this.db.collection("blocks").insertOne(blockRecord);
  };

  /*
    get all the blocked records where uuid1 blocked uuid2 or other way around
  */
  // make sure to set delted_at = null
  getBlockedByUserUuids = async (
    uuid1: string,
    uuid2: string
  ): Promise<BlockRecord> => {
    const blockedRecord: BlockRecord = await this.db
      .collection("blocks")
      .findOne({
        deletedAtUtc: null,
        $or: [
          {
            $and: [{ initiatorUuid: uuid1 }, { receiverUuid: uuid2 }],
          },
          {
            $and: [{ initiatorUuid: uuid2 }, { receiverUuid: uuid1 }],
          },
        ],
      });
    return blockedRecord;
  };

  getUsersWhoBlockedThisUuid = async (uuid: string): Promise<string[]> => {
    const results = new Set<string>();
    const cursor = await this.db.collection("blocks").find({
      receiverUuid: uuid,
    });
    await cursor.forEach((doc) => {
      const { initiatorUuid, receiverUuid } = doc;
      if (initiatorUuid !== uuid) results.add(initiatorUuid);
      else results.add(receiverUuid);
    });
    return Array.from(results);
  };

  createLikeRecord = async (params: LikeRecord) => {
    await this.db.collection("likes").insertOne(params);
  };

  // https://hevodata.com/learn/mongodb-transactions-on-nodejs/
  createLikeAndMatchRecords = async (
    likeParams: LikeRecord,
    matchParams: MatchRecord
  ) => {
    const session = this.client.startSession();
    await this.db.collection("likes").insertOne(likeParams, { session });
    await this.db.collection("matches").insertOne(matchParams, { session });

    // await session.withTransaction(async () => {
    //   await this.db.collection("likes").insertOne(likeParams, { session });
    //   await this.db.collection("matches").insertOne(matchParams, { session });
    // });
    // await session.endSession();
  };

  createTrackedVideoRecord = async (trackedVideoRecord: TrackedVideoRecord) => {
    await this.db.collection("tracked_videos").insertOne(trackedVideoRecord);
  };

  getVideoByVideoId = async (videoId: string): Promise<VideoRecord> => {
    const video: VideoRecord = await this.db
      .collection("videos")
      .findOne({ videoId: videoId, deletedAtUtc: null });
    return video;
  };

  createVideoAndTrackedVideoRecords = async (
    videoRecord: VideoRecord,
    trackedVideoRecord: TrackedVideoRecord
  ) => {
    await this.createVideo(videoRecord);
    await this.createTrackedVideoRecord(trackedVideoRecord);

    //  const session = this.client.startSession();
    // await session.withTransaction(async () => {
    //   await this.db.collection("videos").insertOne(videoRecord, { session });
    //   await this.db
    //     .collection("tracked_video_records")
    //     .insertOne(trackedVideoRecord, { session });
    // });
    // await session.endSession();
  };

  // set the tracked video's deleted to now
  removeVideo = async (videoUuid: string) => {
    const curTime = new Date().getTime();
    const video = await this.getVideoByUuid(videoUuid);
    const trackedVideo = await this.getTrackedVideoByVideoUuid(video.uuid);

    // re-enable transactions
    // const session = this.client.startSession();
    // await session.withTransaction(async () => {
    await this.db.collection("videos").updateOne(
      {
        uuid: videoUuid,
      },

      { $set: { deletedAtUtc: curTime } }
      // { session }
    );

    await this.db.collection("tracked_videos").updateOne(
      {
        videoUuid,
      },
      { $set: { deletedAtUtc: curTime } }
      // { session }
    );
    // });

    return null;
  };

  createVideo = async (videoRecord: VideoRecord) => {
    await this.db.collection("videos").insertOne(videoRecord);
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
    const deletedAtUtc = new Date().getTime();
    await this.db.collection("tracked_videos").updateOne(
      {
        uuid: existingTrackedRecord.uuid,
      },
      { $set: { deletedAtUtc } }
    );
    const newTrackedRecord: TrackedVideoRecord = {
      userUuid: userUuid,
      videoUuid: incomingVideoUuid,
      uuid: newTrackedVideoRecordUuid,
    };
    await this.db.collection("tracked_videos").insertOne(newTrackedRecord);
    // re-enable transactions
    // const session = this.client.startSession();
    // await session.withTransaction(async () => {
    //   const deletedAtUtc = new Date().getTime();
    //   await this.db.collection("tracked_videos").updateOne(
    //     {
    //       uuid: existingTrackedRecord.uuid,
    //     },
    //     { $set: { deletedAtUtc } },
    //     { session }
    //   );

    //   const newTrackedRecord: TrackedVideoRecord = {
    //     userUuid: userUuid,
    //     videoUuid: incomingVideoUuid,
    //     uuid: newTrackedVideoRecordUuid,
    //   };
    //   await this.db
    //     .collections("tracked_videos")
    //     .insertOne(newTrackedRecord, { session });
    // });
  };

  getLikeRecord = async (
    initiatorUuid: string,
    receiverUuid: string
  ): Promise<LikeRecord> => {
    return await this.db.collection("likes").findOne({
      initiatorUuid,
      receiverUuid,
    });
  };

  createUser = async (params: UserRecord) => {
    await this.db.collection("users").insertOne(params);
  };

  deleteUserByUuid = async (uuid: string) => {
    const user: UserRecord = await this.getUserByUUID(uuid);

    if (!user) throw new Error("user does not exist");
    await this.db.collection("users").updateOne(
      {
        uuid,
      },
      { $set: { deletedAtUtc: new Date().getTime() } }
    );
  };

  getUserByUUID = async (uuid: string): Promise<UserRecord> => {
    const user: UserRecord = await this.db
      .collection("users")
      .findOne({ uuid, deletedAtUtc: null });
    return user;
  };

  /*
  get all tracked videos for a user uuid
  */
  getTrackedVideosByUserUuids = async (
    userUuids: string[]
  ): Promise<TrackedVideoRecord[]> => {
    const records: TrackedVideoRecord[] = [];
    const cursor = await this.db
      .collection("tracked_videos")
      .find({ userUuid: { $in: userUuids }, deletedAtUtc: null });
    await cursor.forEach((doc) => {
      records.push(doc);
    });
    return records;
  };

  getTrackedVideoByVideoUuid = async (
    videoUuid: string
  ): Promise<TrackedVideoRecord> => {
    const video = await this.db
      .collection("tracked_videos")
      .findOne({ videoUuid: videoUuid, deletedAtUtc: null });

    return video;
  };

  getVideoByUuid = async (uuid: string): Promise<VideoRecord> => {
    return await this.db.collection("videos").findOne({ uuid });
  };

  getVideosByUuids = async (uuids: string[]): Promise<VideoRecord[]> => {
    const records: VideoRecord[] = [];
    const cursor = await this.db
      .collection("videos")
      .find({ uuid: { $in: uuids } });
    cursor.forEach((doc) => records.push(doc));
    return records;
  };

  getUsersForMatching = async (
    filters: UserProfileSearchFilterRecord
  ): Promise<UserEntity[]> => {
    const users: UserEntity[] = [];

    const userUuidToDatingPref = new Map<
      string,
      DatingMatchPreferencesEntity
    >();
    const userUuidToVideos = new Map<string, VideoEntity[]>();
    const {
      gender,
      genderPreference,
      ageMaxPreference,
      ageMinPreference,
      age,
      userUuidsToFilterOut,
    } = filters;

    let cursor = await this.db.collection("dating_match_preferences").find({
      gender: genderPreference,
      genderPreference: gender,
      age: {
        $and: [{ $lte: ageMaxPreference }, { $gte: ageMinPreference }],
      },
      ageMaxPreference: { $gte: age },
      ageMinPreference: { $lte: age },
      userUuid: { $nin: { userUuidsToFilterOut } },
    });

    cursor.forEach((datingPrefEntity: DatingMatchPreferencesEntity) => {
      userUuidToDatingPref.set(datingPrefEntity.userUuid, datingPrefEntity);
    });

    // now get their associated videos
    const videoUuidToUserUuid = new Map<string, string>();
    const trackedVideoRecords = await this.getTrackedVideosByUserUuids(
      Array.from(userUuidToDatingPref.keys())
    );

    trackedVideoRecords.forEach((trackedVideo) => {
      videoUuidToUserUuid.set(trackedVideo.videoUuid, trackedVideo.userUuid);
    });

    const videos = await this.getVideosByUuids(
      Array.from(videoUuidToUserUuid.keys())
    );

    videos.forEach((video) => {
      const userUuid = videoUuidToUserUuid.get(video.uuid);
      userUuidToVideos.get(userUuid).push(video);
    });

    cursor = await this.db
      .collection("users")
      .find({ uuid: { $in: [Array.from(userUuidToVideos.keys())] } });

    cursor.forEach((doc) => {
      const { uuid } = doc;
      const userEntity: UserEntity = {
        uuid,
        userDatingPreference: userUuidToDatingPref.get(uuid),
        videoEntities: userUuidToVideos.get(uuid),
      };
      users.push(userEntity);
    });
    return users;
  };

  getDatingPreferencesByUserUuid = async (
    uuid: string
  ): Promise<DatingMatchPreferencesEntity> => {
    return await this.db
      .collection("dating_match_preferences")
      .findOne({ userUuid: uuid, deletedAtUtc: null });
  };

  createDatingPreferencesRecord = async (
    params: DatingMatchPreferencesRecord
  ) => {
    await this.db.collection("dating_match_preferences").insertOne(params);
  };
}

/*
https://levelup.gitconnected.com/dependency-injection-in-typescript-2f66912d143c
*/
