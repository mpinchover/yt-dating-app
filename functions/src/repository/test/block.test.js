require("reflect-metadata");
const { clearTables } = require("./utils");
const { container } = require("tsyringe");
const { Repo } = require("../repo");
const MongoClient = require("mongodb").MongoClient;
const expect = require("chai").expect;
// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");
//
describe("block test suite", () => {
  let client;
  let db;
  const r = new Repo();

  before(async () => {
    try {
      const uri = "mongodb://127.0.0.1:27020/youtube-dating-app";
      client = await MongoClient.connect(uri);
      db = client.db("youtube-dating-app");
      r.client = db;
      r.db = db;
    } catch (e) {
      console.log(e);
    }
  });

  beforeEach(async () => {
    await clearTables(db);
  });

  afterEach(async () => {
    await clearTables(db);
  });

  after(() => {
    client.close();
  });

  /*
    export interface MatchRecord {
        initiatorUuid?: string;
        responderUuid?: string;
        createdAtUtc?: Date;
        deletedAtUtc?: Date;
        updatedAtUtc?: Date;
    }
  */
  it("create a block succesfully", async () => {
    try {
    
      let block = {
        _id: "some-id",
        uuid: "some-uuid",
        initiatorUuid: "initiator-some-uuid",
        receiverUuid: "receiver-some-uuid",
      };
      await r.createBlockRecord(block); // create the match
      let insertedBlock = await r.getBlockedByUserUuids(
        block.initiatorUuid,
        block.receiverUuid
      );
      expect(block).to.eql(insertedBlock);
      insertedBlock = await r.getBlockedByUserUuids(
        block.receiverUuid,
        block.initiatorUuid
      );
      expect(block).to.eql(insertedBlock);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("get users who blocked this uuid", async () => {
    try {

      const userBlockingA = "uuid-1";
      const userGettingBlockedA = "uuid-2";
      const userBlockingB = "uuid-3";
      const userGettingBlockedB = "uuid-4";
      let block = {
        _id: "some-id-1",
        uuid: "some-uuid-1",
        initiatorUuid: userGettingBlockedA,
        receiverUuid: userBlockingA,
      };
      await r.createBlockRecord(block); // create the match

      block = {
        _id: "some-id-2",
        uuid: "some-uuid-2",
        initiatorUuid: userGettingBlockedB,
        receiverUuid: userBlockingA,
      };
      await r.createBlockRecord(block); // create the match

      let uuids = await r.getUsersWhoBlockedThisUuid(userBlockingA);
      expect(2).to.equal(uuids.length);

      block = {
        _id: "some-id-3",
        uuid: "some-uuid-3",
        initiatorUuid: userBlockingA,
        receiverUuid: userGettingBlockedB,
      };
      await r.createBlockRecord(block); // create the match
      uuids = await r.getUsersWhoBlockedThisUuid(userGettingBlockedB);
      expect(1).to.equal(uuids.length);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
