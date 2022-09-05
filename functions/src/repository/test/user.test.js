require("reflect-metadata");
const { Repo } = require("../repo");
var mysql = require("mysql2/promise");

const expect = require("chai").expect;

// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");

describe("user test suite", async () => {
  const r = new Repo();
  let conn;

  // https://stackoverflow.com/questions/38576337/how-to-execute-a-bash-command-only-if-a-docker-container-with-a-given-name-does
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
    export interface UserRecord {
      uuid?: string;
      mobile?: string;
      email?: string;
      verified?: boolean;
      lastSeenAtUtc?: Date;
      deletedAtUtc?: Date;
    }
  */
  it("create a user succesfully", async () => {
    try {
      const user = {
        uuid: "some-uuid",
        email: "some-email",
        verified: false,
      };
      await r.createUser(user); // create the user
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("test rollback tx", async () => {
    try {
      const user = {
        uuid: "some-uuid",
        email: "some-email",
        verified: false,
      };
      await r.createUser(user); // create the user
      let insertedUser = await r.getUserByUUID(user.uuid);
      expect(user.uuid).to.equal(insertedUser.uuid);
      expect(user.email).to.equal(insertedUser.email);
      expect(user.verified).to.equal(!!insertedUser.verified);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});

describe("dating prefs testing suite", () => {
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

  it("create dating preferences", async () => {
    const params = {
      uuid: "some-uuid",
      user_uuid: "some-user-uuid",
      gender_preference_man: false,
      gender_preference_woman: true,
      gender_man: true,
      gender_woman: false,
      age_min_preference: 10,
      age_max_preference: 12,
      zipcode: "0203",
      zipcode_preference: "0293",
    };

    await r.createDatingPreferencesRecord(params);
    const insertedRecord = await r.getDatingPreferencesByUserUuid(
      params.user_uuid
    );
    expect(params.uuid).to.equal(insertedRecord.uuid);
    expect(params.user_uuid).to.equal(insertedRecord.user_uuid);
    expect(params.gender_preference_man).to.equal(
      !!insertedRecord.gender_preference_man
    );
    expect(params.gender_preference_woman).to.equal(
      !!insertedRecord.gender_preference_woman
    );
    expect(params.gender_man).to.equal(!!insertedRecord.gender_man);
    expect(params.gender_woman).to.equal(!!insertedRecord.gender_woman);
    expect(params.age_min_preference).to.equal(
      insertedRecord.age_min_preference
    );
    expect(params.age_max_preference).to.equal(
      insertedRecord.age_max_preference
    );
    expect(params.zipcode).to.equal(insertedRecord.zipcode);
    expect(params.zipcode_preference).to.equal(
      insertedRecord.zipcode_preference
    );
  });
  it("get users for matching", async () => {
    const userOne = {};
  });
});
