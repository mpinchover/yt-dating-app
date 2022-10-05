import "reflect-metadata";
import { SettingsHandler } from "../src/rpc/settings-handler";
import { container } from "tsyringe";
const expect = require("chai").expect;
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
const sinon = require("sinon");
import { getUser } from "./utils";

import { UpdateUserParams, UpdateUserParam } from "../src/types/params/handler";
import { UserUpdateType, UploadImageParams } from "../src/types/params/entity";
import { UserHandler } from "../src/rpc/user-handler";

describe("settings testing suite", () => {
  let settingsHandler;
  let userHandler: UserHandler;

  beforeEach(async () => {
    userHandler = container.resolve(UserHandler);
    settingsHandler = container.resolve(SettingsHandler);
  });

  after = () => {
    settingsHandler.settingsController.repo.db.end();
  };

  it("update settings for user", async () => {
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);

    const userUuid = mark.user.uuid;
    const newEmailAddress = "new-email-address";
    const newGenderPreference = "BOTH";
    const newMobile = "new-mobile";
    const newMaxAgePref = 21;
    const newMinAgePref = 90;

    const updates: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_EMAIL],
        stringValue: newEmailAddress,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_GENDER_PREFERENCE],
        stringValue: newGenderPreference,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MAX_AGE],
        numberValue: newMaxAgePref,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MIN_AGE],
        numberValue: newMinAgePref,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MOBILE],
        stringValue: newMobile,
      },
    ];
    const paramsUpdates: UpdateUserParams = {
      userUuid,
      updates: updates,
    };
    await expect(
      settingsHandler.updateUser(paramsUpdates)
    ).to.not.be.rejectedWith();

    // TODO - make updates not cancel everything out
    const user = await userHandler.getUserByUUID(userUuid);
    expect(user).to.exist;
    expect(user.email).equal(newEmailAddress);
    expect(user.mobile).equal(newMobile);
    expect(user.datingPreference).to.exist;
    expect(user.datingPreference.ageMaxPreference).equal(newMaxAgePref);
    expect(user.datingPreference.ageMinPreference).equal(newMinAgePref);
    expect(user.datingPreference.genderPreference).equal(newGenderPreference);
  });

  it("update settings for user and check old ones remain the same", async () => {
    const mark = getUser("MAN", "WOMAN", 30);
    mark.user.uuid = "mark-uuid";
    await userHandler.createUser(mark.user);

    const userUuid = mark.user.uuid;
    const newEmailAddress = "new-email-address";
    const newMinAgePref = 90;
    const newMaxAgePref = 100;

    let updates: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_EMAIL],
        stringValue: newEmailAddress,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MIN_AGE],
        numberValue: mark.datingMatchPreferences.age_min_preference,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MAX_AGE],
        numberValue: mark.datingMatchPreferences.age_max_preference,
      },
    ];
    let paramsUpdates: UpdateUserParams = {
      userUuid,
      updates: updates,
    };
    await expect(
      settingsHandler.updateUser(paramsUpdates)
    ).to.not.be.rejectedWith();

    let user = await userHandler.getUserByUUID(userUuid);
    expect(user).to.exist;
    expect(user.email).equal(newEmailAddress);
    expect(user.mobile).equal(mark.user.mobile);
    expect(user.datingPreference).to.exist;
    expect(user.datingPreference.ageMinPreference).equal(
      mark.datingMatchPreferences.age_min_preference
    );
    expect(user.datingPreference.ageMaxPreference).equal(
      mark.datingMatchPreferences.age_max_preference
    );

    updates = [
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MIN_AGE],
        numberValue: newMinAgePref,
      },
      {
        updateType: UserUpdateType[UserUpdateType.UPDATE_MAX_AGE],
        numberValue: newMaxAgePref,
      },
    ];
    paramsUpdates = {
      userUuid,
      updates: updates,
    };
    await expect(
      settingsHandler.updateUser(paramsUpdates)
    ).to.not.be.rejectedWith();

    user = await userHandler.getUserByUUID(userUuid);
    expect(user).to.exist;
    expect(user.datingPreference).to.exist;
    expect(user.datingPreference.ageMinPreference).equal(newMinAgePref);
    expect(user.datingPreference.ageMaxPreference).equal(newMaxAgePref);
  });
  it("update video settings", async () => {
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);

    const userUuid = mark.user.uuid;
    const mediaId = "media-id-1";
    const mediaIdTwo = "media-id-2";

    const mockVideoResponse = {
      videoId: mediaId,
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

    let updates: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_YOUTUBE_LINKS],
        stringValue: mediaId,
      },
    ];
    let paramsUpdates: UpdateUserParams = {
      userUuid,
      updates: updates,
    };
    await expect(
      settingsHandler.updateUser(paramsUpdates)
    ).to.not.be.rejectedWith();

    let user = await userHandler.getUserByUUID(userUuid);
    expect(user).to.exist;
    expect(user.videos).to.exist;
    expect(user.videos.length).equal(1);
    expect(user.videos[0].videoId).equal(mediaId);

    updates = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_YOUTUBE_LINKS],
        stringValue: mediaIdTwo,
      },
    ];
    paramsUpdates = {
      userUuid,
      updates: updates,
    };
    await expect(
      settingsHandler.updateUser(paramsUpdates)
    ).to.not.be.rejectedWith();

    user = await userHandler.getUserByUUID(userUuid);
    expect(user).to.exist;
    expect(user.videos).to.exist;
    expect(user.videos.length).equal(2);

    expect(mockYoutubeGateway.getYoutubeDetailsByVideoId.callCount).equal(2);
  });
});
