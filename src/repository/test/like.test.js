require("reflect-metadata");

var mysql = require("mysql2/promise");
const { Repo } = require("../repo");
const expect = require("chai").expect;
// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");

describe("like test suite", () => {
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

  it("create a like succesfully", async () => {
    try {
      let like = {
        uuid: "some-uuid",
        initiator_uuid: "init-some-uuid",
        receiver_uuid: "rec-some-uuid",
      };
      await r.createLikeRecord(like); // create the like
      let insertedLike = await r.getLikeRecord(
        like.initiator_uuid,
        like.receiver_uuid
      );
      expect(like.initiator_uuid).to.equal(insertedLike.initiator_uuid);
      expect(like.receiver_uuid).to.equal(insertedLike.receiver_uuid);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it("create like and match records", async () => {
    try {
      const receiverUuid = "rec-some-uuid";
      const initiatorUuid = "init-some-uuid";
      let like = {
        uuid: "some-uuid-1",
        initiator_uuid: initiatorUuid,
        receiver_uuid: receiverUuid,
      };

      let match = {
        uuid: "some-uuid-2",
        initiator_uuid: initiatorUuid,
        responder_uuid: receiverUuid,
      };

      await r.createLikeAndMatchRecords(like, match);

      const insertedLike = await r.getLikeRecord(
        like.initiator_uuid,
        like.receiver_uuid
      );
      expect(like.initiator_uuid).to.equal(insertedLike.initiator_uuid);
      expect(like.receiver_uuid).to.equal(insertedLike.receiver_uuid);

      const insertedMatch = await r.getMatchRecordByUuid(match.uuid);
      expect(match.initiator_uuid).to.equal(insertedMatch.initiator_uuid);
      expect(match.responder_uuid).to.equal(insertedMatch.responder_uuid);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
