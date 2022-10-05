import "reflect-metadata";
import { UserHandler } from "../src/rpc/user-handler";
import { SettingsHandler } from "../src/rpc/settings-handler";
import { UserEntity } from "../src/types/user";
import { container } from "tsyringe";
import { getUser } from "./utils";

const expect = require("chai").expect;
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
const sinon = require("sinon");

describe("create videos", () => {
  let userHandler: UserHandler;
  let settingsHandler: SettingsHandler;

  before(async () => {});

  after(() => {
    userHandler.userController.repo.db.end();
  });

  beforeEach(async () => {
    userHandler = container.resolve(UserHandler);
    settingsHandler = container.resolve(SettingsHandler);
    // await conn.beginTransaction();
  });

  afterEach(async () => {
    // await conn.rollback();
  });

  it("test createVideoAndTrackedVideo", async () => {
    const newVideoId = "new-video-id";

    const mockVideoResponse = {
      videoId: newVideoId,
      channelId: "channel-id",
      videoTitle: "title",
      videoDescription: "description",
      categoryId: 29,
      topicCategories: ["category-1", "category-2"],
    };
    const mockYoutubeGateway = {
      getYoutubeDetailsByVideoId: sinon.stub().returns(mockVideoResponse),
    };
    settingsHandler.settingsController.youtubeGateway = mockYoutubeGateway;

    // create a user
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);

    // create a new video never seen before
    let addMediaLinkParams = {
      userUuid: mark.user.uuid,
      mediaId: newVideoId,
    };

    await settingsHandler.createVideo(addMediaLinkParams);

    // verify the video and tracked id both exist
    const userWithVideos: UserEntity = await userHandler.getUserByUUID(
      mark.user.uuid
    );

    expect(userWithVideos.videos.length).equal(1);
    expect(userWithVideos.videos[0].videoId).equal(newVideoId);

    // create another video and mock a new video

    // now create a video for a different user. video already exists so just create the tracked video
    const kelly = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(kelly.user);

    addMediaLinkParams = {
      userUuid: kelly.user.uuid,
      mediaId: newVideoId, // same videoID
    };
    await settingsHandler.createVideo(addMediaLinkParams);

    // ensure the youtube gateway was called only once.
    expect(mockYoutubeGateway.getYoutubeDetailsByVideoId.callCount).equal(1);
  });
});
