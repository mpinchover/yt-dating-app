require("reflect-metadata");

const { container } = require("tsyringe");
const { Repo } = require("../repo");
const { clearTables } = require("./utils");

var mysql = require("mysql2/promise");
const MongoClient = require("mongodb").MongoClient;
const expect = require("chai").expect;
// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");

describe("videos test suite", () => {
  const r = new Repo();
  let conn;

  before(async () => {
    try {
      conn = await mysql.createConnection({
        host: "localhost",
        port: "3308",
        user: "test",
        password: "test",
        database: "test",
      });
      r.db = conn;
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  after(() => {
    conn.end();
  });

  beforeEach(async () => {
    await conn.beginTransaction();
  });

  afterEach(async () => {
    await conn.rollback();
  });

  it("create a tracked video succesfully", async () => {
    try {
      const trackedVideo = {
        uuid: "some-uuid",
        video_uuid: "some-video-uuid",
        user_uuid: "some-user-uuid",
      };

      await r.createTrackedVideoRecord(trackedVideo);
      const insertedTrackedVideo = await r.getTrackedVideoByVideoUuid(
        trackedVideo.video_uuid
      );
      expect(trackedVideo.video_uuid).to.equal(insertedTrackedVideo.video_uuid);
      expect(trackedVideo.user_uuid).to.equal(insertedTrackedVideo.user_uuid);
      expect(trackedVideo.uuid).to.equal(insertedTrackedVideo.uuid);

      const newTrackedVideo = {
        uuid: "some-uuid-1",
        video_uuid: "some-video-uuid",
        user_uuid: "some-user-uuid-1",
      };

      await r.createTrackedVideoRecord(newTrackedVideo);

      const anotherTrackedVideo = {
        uuid: "some-uuid-5",
        video_uuid: "some-video-uuid-9",
        user_uuid: "some-user-uuid-01",
      };

      await r.createTrackedVideoRecord(anotherTrackedVideo);
      const insertedTrackedVideos = await r.getTrackedVideosByUserUuids([
        trackedVideo.user_uuid,
        newTrackedVideo.user_uuid,
      ]);
      expect(2).to.equal(insertedTrackedVideos.length);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("create a video succesfully", async () => {
    try {
      let video = {
        uuid: "some-uuid",
        video_id: "some-video-id",
        channel_id: "some-channel-id",
        video_title: "some-video-title",
        video_description: "some-description",
        category_id: "category-id",
        topic_categories: "topic-categories",
      };
      await r.createVideo(video); // create the video
      const insertedVideo = await r.getVideoByVideoId(video.video_id);
      expect(video.video_id).to.equal(insertedVideo.video_id);
      expect(video.uuid).to.equal(insertedVideo.uuid);
      expect(video.channel_id).to.equal(insertedVideo.channel_id);
      expect(video.video_title).to.equal(insertedVideo.video_title);
      expect(video.category_id).to.equal(insertedVideo.category_id);
      expect(video.topic_categories).to.equal(insertedVideo.topic_categories);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it("create a video & tracked video succesfully", async () => {
    try {
      const videoUuid = "some-uuid";
      const video = {
        uuid: videoUuid,
        video_id: "some-video-id",
        channel_id: "some-channel-id",
        video_title: "some-video-title",
        video_description: "some-description",
        category_id: "category-id",
        topic_categories: "topic-categories",
      };
      const trackedVideo = {
        uuid: "some-uuid",
        video_uuid: videoUuid,
        user_uuid: "some-user-uuid",
      };
      await r.createVideoAndTrackedVideoRecords(video, trackedVideo); // create the video/tracked video
      const insertedVideo = await r.getVideoByVideoId(video.video_id);
      expect(video.video_id).to.equal(insertedVideo.video_id);
      expect(video.uuid).to.equal(insertedVideo.uuid);
      expect(video.channel_id).to.equal(insertedVideo.channel_id);
      expect(video.video_title).to.equal(insertedVideo.video_title);
      expect(video.category_id).to.equal(insertedVideo.category_id);
      expect(video.topic_categories).to.equal(insertedVideo.topic_categories);

      const insertedTrackedVideo = await r.getTrackedVideoByVideoUuid(
        videoUuid
      );
      expect(trackedVideo.video_uuid).to.equal(insertedTrackedVideo.video_uuid);
      expect(trackedVideo.user_uuid).to.equal(insertedTrackedVideo.user_uuid);
      expect(trackedVideo.uuid).to.equal(insertedTrackedVideo.uuid);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it("test rollback tx", async () => {
    try {
      let video = {
        uuid: "some-uuid",
        video_id: "some-video-id",
        channel_id: "some-channel-id",
        video_title: "some-video-title",
        video_description: "some-description",
        category_id: "category-id",
        topic_categories: "topic-categories",
      };
      await r.createVideo(video); // create the video
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("remove a video ", async () => {
    try {
      const videoUuid = "some-video-uuid-!";
      const video = {
        uuid: videoUuid,
        video_id: "some-video-id",
        channel_id: "some-channel-id",
        video_title: "some-video-title",
        video_description: "some-description",
        category_id: "category-id",
        topic_categories: "topic-categories",
      };
      const trackedVideo = {
        uuid: "some-uuid",
        video_uuid: videoUuid,
        user_uuid: "some-user-uuid",
      };
      await r.createVideoAndTrackedVideoRecords(video, trackedVideo); // create the video/tracked video
      await r.removeVideo(videoUuid);
      const removedVideo = await r.getVideoByVideoId(video.videoId);
      expect(null).to.eql(removedVideo);
      const removedTrackedVideo = await r.getTrackedVideoByVideoUuid(videoUuid);
      expect(null).to.eql(removedTrackedVideo);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("swap tracked video records ", async () => {
    try {
      const newTrackedVideoUuid = "new-tv-uuid";
      const existingTrackedVideoUuid = "exist-tv-uuid";
      const videoUuid = "video-uuid";
      const userUuid = "user-uuid-0999";

      const trackedVideo = {
        uuid: existingTrackedVideoUuid,
        video_uuid: videoUuid,
        user_uuid: userUuid,
      };
      await r.createTrackedVideoRecord(trackedVideo);
      await r.swapVideos(newTrackedVideoUuid, userUuid, videoUuid, videoUuid);
      const trackedVideos = await r.getTrackedVideosByUserUuids([userUuid]);
      expect(1).to.equal(trackedVideos.length);
      expect(trackedVideos[0].uuid).to.equal(newTrackedVideoUuid);
      expect(trackedVideos[0].video_uuid).to.equal(videoUuid);
      expect(trackedVideos[0].user_uuid).to.equal(userUuid);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
