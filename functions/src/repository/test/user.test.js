require("reflect-metadata");

const { container } = require("tsyringe");
const { Repo } = require("../repo");
const { clearTables } = require("./utils");
const MongoClient = require("mongodb").MongoClient;
const expect = require("chai").expect;
// var sinonChai = require("sinon-chai");
// const sinon = require("sinon");

describe("user test suite", () => {
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

  beforeEach(async () => {});

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
      const lastSeen = new Date().getTime();
      const deletedAt = new Date().getTime();

      const user = {
        _id: "some-id",
        uuid: "some-uuid",
        email: "some-email",
        verified: false,
        lastSeenAtUtc: lastSeen,

        deletedAtUtc: null,
      };
      await r.createUser(user); // create the user
      let insertedUser = await r.getUserByUUID(user.uuid);
      expect(user).to.eql(insertedUser);
      await r.deleteUserByUuid(user.uuid); // delete user
      insertedUser = await r.getUserByUUID(user.uuid); // test deleted user
      expect(null).to.eql(insertedUser);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});

describe("dating prefs testing suite", () => {
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

  it("create dating preferences", async () => {
    const params = {
      _id: 0,
      uuid: "some-uuid",
      userUuid: "some-user-uuid",
      genderPreference: "MALE",
      gender: "FEMALE",
      ageMinPreference: 10,
      ageMaxPreference: 12,
      zipcode: "0203",
      zipcodePreference: "0293",
    };

    await r.createDatingPreferencesRecord(params);
    const insertedRecord = await r.getDatingPreferencesByUserUuid(
      params.userUuid
    );
    expect(params).to.eql(insertedRecord);
  });
});
