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
import {
  UserUpdateType,
  UploadImageParams,
} from "../src/types/params/controller";
import { UserHandler } from "../src/rpc/user-handler";

describe("settings testing suite", () => {
  let settingsHandler;
  let userHandler: UserHandler;

  beforeEach(async () => {
    userHandler = container.resolve(UserHandler);
    // matchHandler = container.resolve(MatchHandler);
    settingsHandler = container.resolve(SettingsHandler);
    // await conn.beginTransaction();
  });

  after = () => {
    settingsHandler.settingsController.repo.db.end();
  };

  it("upload image for a user", async () => {
    const mockAWsGateway = {
      uploadImageToAWS: sinon.stub().returns(null),
    };

    settingsHandler.settingsController.awsGateway = mockAWsGateway;

    const firstImageBase64 = "buffer-base-64";
    const secondImageBase64 = "buffer-base-64";
    const thirdImageBase64 = "buffer-base-64";
    const fourthImageBase64 = "buffer-base-64";

    // create the user first
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);

    const userUuid = mark.user.uuid;

    // upload 4 images
    // TODO - make sure that when you update a user, rest of the fields are not mutated

    const invalidUpdates: UpdateUserParam[] = [
      {
        updateType: "invalid-update",
        uploadImageParams: {
          bufferBase64: firstImageBase64,
          positionIndex: 0,
        },
      },
    ];
    const paramsInvalidUpdates: UpdateUserParams = {
      userUuid,
      updates: invalidUpdates,
    };
    await expect(
      settingsHandler.updateUser(paramsInvalidUpdates)
    ).to.be.rejectedWith(Error);

    const updatesImageOne: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_IMAGE],
        uploadImageParams: {
          bufferBase64: firstImageBase64,
          positionIndex: 0,
        },
      },
    ];
    const paramsImageOne: UpdateUserParams = {
      userUuid,
      updates: updatesImageOne,
    };
    await expect(
      settingsHandler.updateUser(paramsImageOne)
    ).to.not.be.rejectedWith();

    const updatesImageTwo: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_IMAGE],
        uploadImageParams: {
          bufferBase64: secondImageBase64,
          positionIndex: 1,
        },
      },
    ];
    const paramsImageTwo: UpdateUserParams = {
      userUuid,
      updates: updatesImageTwo,
    };
    await expect(
      settingsHandler.updateUser(paramsImageTwo)
    ).to.not.be.rejectedWith();

    const updatesImageThree: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_IMAGE],
        uploadImageParams: {
          bufferBase64: thirdImageBase64,
          positionIndex: 2,
        },
      },
    ];
    const paramsImageThree: UpdateUserParams = {
      userUuid,
      updates: updatesImageThree,
    };
    await expect(
      settingsHandler.updateUser(paramsImageThree)
    ).to.not.be.rejectedWith();

    const updatesImageFour: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_IMAGE],
        uploadImageParams: {
          bufferBase64: fourthImageBase64,
          positionIndex: 3,
        },
      },
    ];
    const paramsImageFour: UpdateUserParams = {
      userUuid,
      updates: updatesImageFour,
    };
    await expect(
      settingsHandler.updateUser(paramsImageFour)
    ).to.not.be.rejectedWith();

    // TODO – don't use enums, you need to use the string values.
    let images = await userHandler.getImagesByUserUuid(userUuid);
    expect(images).to.not.be.null;
    expect(4).equal(images.length);
    // TODO – test to make sure media link is working correctly.
    expect(0).equal(images[0].position_index);
    expect(1).equal(images[1].position_index);
    expect(2).equal(images[2].position_index);
    expect(3).equal(images[3].position_index);

    // do an update
    const updateToImageFour: UpdateUserParam[] = [
      {
        updateType: UserUpdateType[UserUpdateType.UPLOAD_IMAGE],
        uploadImageParams: {
          bufferBase64: "new-image-base-64",
          positionIndex: 3,
        },
      },
    ];
    const paramsupdateToImageFour: UpdateUserParams = {
      userUuid,
      updates: updateToImageFour,
    };
    await expect(
      settingsHandler.updateUser(paramsupdateToImageFour)
    ).to.not.be.rejectedWith();

    images = await userHandler.getImagesByUserUuid(userUuid);
    expect(images).to.not.be.null;
    expect(4).equal(images.length);

    expect(0).equal(images[0].position_index);
    expect(1).equal(images[1].position_index);
    expect(2).equal(images[2].position_index);
    expect(3).equal(images[3].position_index);
  });
});
