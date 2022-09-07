require("reflect-metadata");
var mysql = require("mysql2/promise");
const { Repo } = require("../repo");
const expect = require("chai").expect;
// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");
//
describe("block test suite", () => {
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

  it("create a block succesfully", async () => {
    try {
      let block = {
        uuid: "some-uuid",
        initiator_uuid: "initiator-some-uuid",
        receiver_uuid: "receiver-some-uuid",
      };
      await r.createBlockRecord(block); // create the match
      let insertedBlocks = await r.getBlockedByUserUuids(
        block.initiator_uuid,
        block.receiver_uuid
      );

      insertedBlocks.forEach((b) => {
        expect(block.receiver_uuid).to.equal(b.receiver_uuid);
        expect(block.initiator_uuid).to.equal(b.initiator_uuid);
      });

      insertedBlocks = await r.getBlockedByUserUuids(
        block.receiver_uuid,
        block.initiator_uuid
      );

      insertedBlocks.forEach((b) => {
        expect(block.receiver_uuid).to.equal(b.receiver_uuid);
        expect(block.initiator_uuid).to.equal(b.initiator_uuid);
      });
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
        uuid: "some-uuid-1",
        initiator_uuid: userBlockingB,
        receiver_uuid: userGettingBlockedA,
      };
      await r.createBlockRecord(block); // create the match

      block = {
        uuid: "some-uuid-2",
        initiator_uuid: userBlockingA,
        receiver_uuid: userGettingBlockedA,
      };
      await r.createBlockRecord(block); // create the match

      let uuids = await r.getUsersWhoBlockedThisUuid(userGettingBlockedA);
      expect(2).to.equal(uuids.length);

      block = {
        uuid: "some-uuid-3",
        initiator_uuid: userBlockingA,
        receiver_uuid: userGettingBlockedB,
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
