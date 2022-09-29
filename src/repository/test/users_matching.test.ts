require("reflect-metadata");
import {
  // DatingMatchPreferencesEntity,
  // UserEntity,
  // UserRecord,
  // DatingMatchPreferencesRecord,
  // UserSearchFilter,
  Gender,
} from "../../types/user";
import { v4 as uuidv4 } from "uuid";

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
    const kelly = getUser("WOMAN", "MAN", 30);
    const jake = getUser("MAN", "WOMAN", 30);
    const marissa = getUser("WOMAN", "MAN", 30);
    const olderWomanOutsideOfRange = getUser("WOMAN", "MAN", 65);
    const youngerWomanOutsideOfRange = getUser("WOMAN", "MAN", 20);
    const biWoman = getUser("WOMAN", "BOTH", 30);

    await createUserInDB(r, kelly);
    await createUserInDB(r, jake);
    await createUserInDB(r, marissa);
    await createUserInDB(r, olderWomanOutsideOfRange);
    await createUserInDB(r, youngerWomanOutsideOfRange);
    await createUserInDB(r, biWoman);

    const filter = {
      gender: Gender.WOMAN, // should be their gender
      genderPreference: Gender.MAN, // lloking for a woman
      ageMin: 22, // what their age min should be
      ageMax: 60, // what their age max should be
      age: 43, // my age, so you can make sure their min and max ages prefs are in this range.
    };
    const matchingUsers = await r.getUsersForMatching(filter);

    expect(matchingUsers).to.not.be.null;
    expect(matchingUsers.length).to.equal(3);
    expect(matchingUsers[0].videos.length).to.equal(1);
  });
});

const createUserInDB = async (r, item) => {
  await r.createUser(item.user);
  await r.createVideo(item.videos[0]); // todo create a batch create videos

  const trackedVid = {
    uuid: `${item.user.uuid}-vid`,
    user_uuid: item.user.uuid,
    video_uuid: item.videos[0].uuid,
  };
  await r.createTrackedVideoRecord(trackedVid);
  await r.createDatingPreferencesRecord(item.datingMatchPreferences);
};

const getUser = (gender, genderPref, age) => {
  const userUuid = uuidv4();
  const videoUuid = uuidv4();
  const dmpUuid = uuidv4();

  return {
    user: {
      uuid: userUuid,
      mobile: "8607664545",
      email: "test@gmail.com",
      verified: true,
    },
    videos: [
      {
        uuid: videoUuid,
        video_id: "video-id-1",
        channel_id: "channel-id-1",
        video_title: "video-title-1",
        video_description: "video-description-1",
        category_id: "category-id-1",
        topic_categories: "topic-categories-1",
      },
    ],
    datingMatchPreferences: {
      uuid: dmpUuid,
      user_uuid: userUuid,
      gender: gender,
      gender_preference: genderPref,
      age_min_preference: 20,
      age_max_preference: 50,
      zipcode: "06117",
      zipcode_preference: "11217",
      age: age,
    },
  };
};
