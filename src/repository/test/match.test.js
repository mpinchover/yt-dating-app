require("reflect-metadata");
var mysql = require("mysql2/promise");
const { Repo } = require("../repo");
const expect = require("chai").expect;
// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");

describe("match test suite", () => {
  const r = new Repo();
  let client;

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

  /*
    export interface MatchRecord {
        initiatorUuid?: string;
        responderUuid?: string;
        createdAtUtc?: Date;
        deletedAtUtc?: Date;
        updatedAtUtc?: Date;
    }
  */
  it("create a match succesfully", async () => {
    const match = {
      uuid: "some-uuid",
      initiator_uuid: "in-some-uuid",
      receiver_uuid: "re-some-uuid",
    };
    await r.createMatchRecord(match); // create the match

    let insertedMatch = await r.getMatchRecordByUuid(match.uuid);
    expect(match.initiator_uuid).to.equal(insertedMatch.initiator_uuid);
    expect(match.receiver_uuid).to.equal(insertedMatch.receiver_uuid);

    insertedMatch = await r.getMatchRecordByUuids(
      match.initiator_uuid,
      match.receiver_uuid
    );
    expect(match.initiator_uuid).to.equal(insertedMatch.initiator_uuid);
    expect(match.receiver_uuid).to.equal(insertedMatch.receiver_uuid);

    insertedMatch = await r.getMatchRecordByUuids(
      match.initiator_uuid,
      match.initiator_uuid
    );
    expect(null).to.eql(insertedMatch);
    insertedMatch = await r.getMatchRecordByUuid("new-uuid");
    expect(null).to.eql(insertedMatch);
    await r.deleteMatchRecord(match.uuid);
    insertedMatch = await r.getMatchRecordByUuid(match.uuid);
    expect(null).to.eql(insertedMatch);
    insertedMatch = await r.getMatchRecordByUuids(
      match.initiator_uuid,
      match.receiver_uuid
    );
    expect(null).to.eql(insertedMatch);
  });

  it("get matched users to a uuid", async () => {
    const userUuid = "some-uuid-1";
    let match = {
      uuid: "some-uuid-1",
      initiator_uuid: userUuid,
      receiver_uuid: "re-uuid-",
    };
    await r.createMatchRecord(match); // create the match
    let insertedMatchedRecord = await r.getMatchRecordByUuid(match.uuid);
    expect(match.uuid).to.equal(insertedMatchedRecord.uuid);

    match = {
      uuid: "some-uuid-2",
      receiver_uuid: userUuid,
      initiator_uuid: "receiver-uuid-3",
    };
    await r.createMatchRecord(match); // create the match
    insertedMatchedRecord = await r.getMatchRecordByUuid(match.uuid);
    expect(match.uuid).to.equal(insertedMatchedRecord.uuid);

    match = {
      uuid: "some-uuid-3",
      receiver_uuid: "in-some-uuid-4",
      initiator_uuid: "res-some-uuid-5",
    };

    await r.createMatchRecord(match); // create the match
    insertedMatchedRecord = await r.getMatchRecordByUuid(match.uuid);
    expect(match.uuid).to.equal(insertedMatchedRecord.uuid);

    const userUuids = await r.getUserUuidsMatchedToUuid(userUuid);
    expect(2).to.equal(userUuids.length);
  });
});
