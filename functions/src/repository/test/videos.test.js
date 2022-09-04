// require("reflect-metadata");

// const { container } = require("tsyringe");
// const { Repo } = require("../repo");
// const { clearTables } = require("./utils");

// const MongoClient = require("mongodb").MongoClient;
// const expect = require("chai").expect;
// // var sinonChai = require("sinon-chai");
// // const sinon = require("sinon");

// describe("videos test suite", () => {
//   let client;
//   let db;
//   const r = new Repo();

//   before(async () => {
//     try {
//       const uri = "mongodb://127.0.0.1:27020/youtube-dating-app";
//       client = await MongoClient.connect(uri);
//       db = client.db("youtube-dating-app");
//       r.client = db;
//       r.db = db;
//     } catch (e) {
//       console.log(e);
//     }
//   });

//   after(() => {
//     client.close();
//   });

//   beforeEach(async () => {
//     await clearTables(db);
//   });

//   afterEach(async () => {
//     await clearTables(db);
//   });

//   /*
//     export interface MatchRecord {
//         initiatorUuid?: string;
//         responderUuid?: string;
//         createdAtUtc?: Date;
//         deletedAtUtc?: Date;
//         updatedAtUtc?: Date;
//     }
//   */
//   it("create a tracked video succesfully", async () => {
//     try {
//       const trackedVideo = {
//         _id: "some-id",
//         uuid: "some-uuid",
//         videoUuid: "some-video-uuid",
//         userUuid: "some-user-uuid",
//       };

//       await r.createTrackedVideoRecord(trackedVideo);
//       const insertedTrackedVideo = await r.getTrackedVideoByVideoUuid(
//         trackedVideo.videoUuid
//       );
//       expect(trackedVideo).to.eql(insertedTrackedVideo);

//       const newTrackedVideo = {
//         _id: "some-id-1",
//         uuid: "some-uuid-1",
//         videoUuid: "some-video-uuid",
//         userUuid: "some-user-uuid-1",
//       };

//       await r.createTrackedVideoRecord(newTrackedVideo);

//       const anotherTrackedVideo = {
//         _id: "some-id-5",
//         uuid: "some-uuid-5",
//         videoUuid: "some-video-uuid-9",
//         userUuid: "some-user-uuid-01",
//       };

//       await r.createTrackedVideoRecord(anotherTrackedVideo);
//       const insertedTrackedVideos = await r.getTrackedVideosByUserUuids([
//         trackedVideo.userUuid,
//         newTrackedVideo.userUuid,
//       ]);
//       expect(2).to.eql(insertedTrackedVideos.length);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });

//   /*
//   uuid?: string;
//   videoId?: string; // the youtube id of the video
//   channelId?: string;
//   videoTitle?: string;
//   description?: string;
//   categoryId?: number;
//   topicCategories?: string[];
//    */
//   it("create a video succesfully", async () => {
//     try {
//       let video = {
//         _id: "some-id-0",
//         videoId: "some-video-id",
//         channelId: "some-channel-id",
//         videoTitle: "some-video-title",
//         dsecription: "some-description",
//         categoryId: "category-id",
//         topicCategories: "topic-categories",
//       };
//       await r.createVideo(video); // create the video
//       const insertedVideo = await r.getVideoByVideoId(video.videoId);
//       expect(video).to.eql(insertedVideo);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });
//   it("create a video & tracked video succesfully", async () => {
//     try {
//       const videoUuid = "some-video-uuid-!";
//       const video = {
//         uuid: videoUuid,
//         _id: "some-id-0",
//         videoId: "some-video-id",
//         channelId: "some-channel-id",
//         videoTitle: "some-video-title",
//         dsecription: "some-description",
//         categoryId: "category-id",
//         topicCategories: "topic-categories",
//       };
//       const trackedVideo = {
//         _id: "some-id-1",
//         uuid: "some-uuid",
//         videoUuid: videoUuid,
//         userUuid: "some-user-uuid",
//       };
//       await r.createVideoAndTrackedVideoRecords(video, trackedVideo); // create the video/tracked video
//       const insertedVideo = await r.getVideoByVideoId(video.videoId);
//       expect(video).to.eql(insertedVideo);
//       const insertedTrackedVideo = await r.getTrackedVideoByVideoUuid(
//         videoUuid
//       );
//       expect(trackedVideo).to.eql(insertedTrackedVideo);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });
//   it("remove a video ", async () => {
//     const videoUuid = "some-video-uuid-!";
//     const video = {
//       uuid: videoUuid,
//       _id: "some-id-0",
//       videoId: "some-video-id",
//       channelId: "some-channel-id",
//       videoTitle: "some-video-title",
//       dsecription: "some-description",
//       categoryId: "category-id",
//       topicCategories: "topic-categories",
//     };
//     const trackedVideo = {
//       _id: "some-id-1",
//       uuid: "some-uuid",
//       videoUuid: videoUuid,
//       userUuid: "some-user-uuid",
//     };
//     await r.createVideoAndTrackedVideoRecords(video, trackedVideo); // create the video/tracked video
//     await r.removeVideo(videoUuid);
//     const removedVideo = await r.getVideoByVideoId(video.videoId);
//     expect(null).to.eql(removedVideo);
//     const removedTrackedVideo = await r.getTrackedVideoByVideoUuid(videoUuid);
//     expect(null).to.eql(removedTrackedVideo);
//   });
//   it("swap tracked video records ", async () => {
//     const newTrackedVideoUuid = "new-tracked-video-uuid";
//     const existingTrackedVideoUuid = "existing-tracked-video-uuid";
//     const videoUuid = "video-uuid";
//     const userUuid = "user-uuid";

//     const trackedVideo = {
//       _id: "some-id",
//       uuid: existingTrackedVideoUuid,
//       videoUuid: videoUuid,
//       userUuid,
//     };
//     await r.createTrackedVideoRecord(trackedVideo);
//     await r.swapVideos(newTrackedVideoUuid, userUuid, videoUuid, videoUuid);
//     const trackedVideos = await r.getTrackedVideosByUserUuids([userUuid]);
//     expect(1).to.eql(trackedVideos.length);
//     expect(trackedVideos[0].uuid).to.equal(newTrackedVideoUuid);
//     expect(trackedVideos[0].videoUuid).to.equal(videoUuid);
//     expect(trackedVideos[0].userUuid).to.equal(userUuid);
//   });
// });
