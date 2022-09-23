require("reflect-metadata");
import {
  // DatingMatchPreferencesEntity,
  // UserEntity,
  // UserRecord,
  // DatingMatchPreferencesRecord,
  // UserSearchFilter,
  Gender,
} from "../../types/user";

const { Repo } = require("../repo");
var mysql = require("mysql2/promise");

const expect = require("chai").expect;

describe("get matching users test suite", () => {
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

  it("get the matching users", async () => {
    const kelly = getUser();

    await r.createUser(kelly.user);
    await r.createVideo(kelly.videos[0]); // todo create a batch create videos

    const trackedVid = {
      uuid: "kelly-tracked-vid-1",
      user_uuid: kelly.user.uuid,
      video_uuid: kelly.videos[0].uuid,
    };
    await r.createTrackedVideoRecord(trackedVid);
    await r.createDatingPreferencesRecord(kelly.datingMatchPreferences);

    const filter = {
      gender: Gender.MAN, // I am a man
      genderPreference: Gender.WOMAN, // lloking for a woman
      age: 32, // my age
      ageMinPreference: 20, // their age min pref
      ageMaxPreference: 60, // their age max pref
    };
    const matchingUsers = await r.getUsersForMatching(filter);

    expect(matchingUsers).to.not.be.null;
    expect(matchingUsers.length).to.equal(1);
    expect(matchingUsers[0].videos.length).to.equal(1);
  });
});

const getUser = () => {
  return {
    user: {
      uuid: "user-uuid",
      mobile: "8607664545",
      email: "test@gmail.com",
      verified: true,
    },
    videos: [
      {
        uuid: "video-uuid-1",
        video_id: "video-id-1",
        channel_id: "channel-id-1",
        video_title: "video-title-1",
        video_description: "video-description-1",
        category_id: "category-id-1",
        topic_categories: "topic-categories-1",
      },
    ],
    datingMatchPreferences: {
      uuid: "dmp-uuid",
      user_uuid: "user-uuid",
      gender: "WOMAN",
      gender_preference: "MAN",
      age_min_preference: 20,
      age_max_preference: 50,
      zipcode: "06117",
      zipcode_preference: "11217",
      age: 40,
    },
  };
};
