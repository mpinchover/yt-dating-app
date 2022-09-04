// require("reflect-metadata");

// const { doesNotMatch } = require("assert");
// const { container } = require("tsyringe");
// const { Repo } = require("../repo");
// const MongoClient = require("mongodb").MongoClient;
// const { clearTables } = require("./utils");
// const expect = require("chai").expect;
// // var sinonChai = require("sinon-chai");
// // const sinon = require("sinon");

// describe("like test suite", () => {
//   let client;
//   let db;
//   const r = new Repo();
//   const test = "like-test-suite";

//   before(async () => {
//     try {
//       const uri = `mongodb://127.0.0.1:27020/${test}`;
//       client = await MongoClient.connect(uri);
//       db = client.db(test);
//       r.client = client;
//       r.db = db;
//     } catch (e) {
//       console.log(e);
//     }
//   });

//   beforeEach(async () => {
//     await clearTables(db);
//   });

//   afterEach(async () => {
//     await clearTables(db);
//   });

//   after(() => {
//     client.close();
//   });

//   beforeEach(async () => {
//     // const collNames = await db.listCollections().toArray();
//     // collNames.forEach(async (col) => {
//     //   await db.collection(col.name).drop();
//     // });
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
//   it("create a like succesfully", async () => {
//     try {
   
//       let like = {
//         _id: "some-id",
//         uuid: "some-uuid",
//         initiatorUuid: "initiator-some-uuid",
//         receiverUuid: "receiver-some-uuid",
//       };
//       await r.createLikeRecord(like); // create the like
//       let insertedLike = await r.getLikeRecord(
//         like.initiatorUuid,
//         like.receiverUuid
//       );
//       expect(like).to.eql(insertedLike);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });
//   it("create like and match records", async () => {
//     try {
    
//       const receiverUuid = "receiver-some-uuid";
//       const initiatorUuid = "initiator-some-uuid";
//       let like = {
//         _id: "some-id-9",
//         uuid: "some-uuid-1",
//         initiatorUuid,
//         receiverUuid,
//       };

//       let match = {
//         _id: "some-id-19",
//         uuid: "some-uuid-2",
//         initiatorUuid,
//         responderUuid: receiverUuid,
//       };

//       await r.createLikeAndMatchRecords(like, match);

//       const insertedLike = await r.getLikeRecord(
//         like.initiatorUuid,
//         like.receiverUuid
//       );
//       expect(like).to.eql(insertedLike);
//       const insertedMatch = await r.getMatchRecordByUuid(match.uuid);
//       expect(match).to.eql(insertedMatch);
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   });
// });
