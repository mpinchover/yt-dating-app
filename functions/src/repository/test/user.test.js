require("reflect-metadata");

const { container } = require("tsyringe");
const { Repo } = require("../repo");
const { clearTables } = require("./utils");
const MongoClient = require("mongodb").MongoClient;
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
      await conn.beginTransaction();
      const user = {
        uuid: "some-uuid",
        email: "some-email",
        verified: false,
      };
      await r.createUser(user); // create the user
      await r.db.rollback();
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("test rollback tx", async () => {
    try {
      await conn.beginTransaction();
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

      await r.db.rollback();
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});

// describe("dating prefs testing suite", () => {
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

//   beforeEach(async () => {
//     await clearTables(db);
//   });

//   afterEach(async () => {
//     await clearTables(db);
//   });

//   after(() => {
//     client.close();
//   });

//   it("create dating preferences", async () => {
//     const params = {
//       _id: 0,
//       uuid: "some-uuid",
//       userUuid: "some-user-uuid",
//       genderPreference: "MALE",
//       gender: "FEMALE",
//       ageMinPreference: 10,
//       ageMaxPreference: 12,
//       zipcode: "0203",
//       zipcodePreference: "0293",
//     };

//     await r.createDatingPreferencesRecord(params);
//     const insertedRecord = await r.getDatingPreferencesByUserUuid(
//       params.userUuid
//     );
//     expect(params).to.eql(insertedRecord);
//   });
//   it("get users for matching", async () => {
//     const userOne = {};
//   });
// });
