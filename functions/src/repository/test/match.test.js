// require("reflect-metadata");

// const { container } = require("tsyringe");
// const { Repo } = require("../repo");
// const { clearTables } = require("./utils");
// const MongoClient = require("mongodb").MongoClient;
// const expect = require("chai").expect;
// // var sinonChai = require("sinon-chai");
// // const sinon = require("sinon");

// describe("match test suite", () => {
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
//   it("create a match succesfully", async () => {
//     try {
//       const match = {
//         _id: "some-id",
//         uuid: "some-uuid",
//         initiatorUuid: "initiator-some-uuid",
//         responderUuid: "responder-some-uuid",
//       };
//       await r.createMatchRecord(match); // create the match

//       let insertedMatch = await r.getMatchRecordByUuid(match.uuid);
//       expect(match).to.eql(insertedMatch);
//       insertedMatch = await r.getMatchRecordByUuids(
//         match.initiatorUuid,
//         match.responderUuid
//       );
//       expect(match).to.eql(insertedMatch);
//       insertedMatch = await r.getMatchRecordByUuids(
//         match.initiatorUuid,
//         match.initiatorUuid
//       );
//       expect(null).to.eql(insertedMatch);
//       insertedMatch = await r.getMatchRecordByUuid("new-uuid");
//       expect(null).to.eql(insertedMatch);
//       await r.deleteMatchRecord(match.uuid);
//       insertedMatch = await r.getMatchRecordByUuid(match.uuid);
//       expect(null).to.eql(insertedMatch);
//       insertedMatch = await r.getMatchRecordByUuids(
//         match.initiatorUuid,
//         match.responderUuid
//       );
//       expect(null).to.eql(insertedMatch);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });

//   it("get matched users to a uuid", async () => {
//     try {
//       const userUuid = "some-uuid-1";
//       let match = {
//         _id: "some-id-3",
//         uuid: "some-uuid-1",
//         initiatorUuid: userUuid,
//         responderUuid: "responder-some-uuid-2",
//       };
//       await r.createMatchRecord(match); // create the match
//       match = {
//         _id: "some-id-9",
//         uuid: "some-uuid-2",
//         responderUuid: userUuid,
//         initiatorUuid: "responder-some-uuid-3",
//       };
//       await r.createMatchRecord(match); // create the match
//       match = {
//         _id: "some-id-10",
//         uuid: "some-uuid-3",
//         responderUuid: "initiator-some-uuid-4",
//         initiatorUuid: "responder-some-uuid-5",
//       };
//       await r.createMatchRecord(match); // create the match

//       const userUuids = await r.getUserUuidsMatchedToUuid(userUuid);
//       expect(2).to.equal(userUuids.length);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });
// });
