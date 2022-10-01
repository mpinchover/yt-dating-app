require("reflect-metadata");
import { SettingsController } from "../settings-controller";
import { ImageRecord } from "../../types/image";

const expect = require("chai").expect;
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
const sinon = require("sinon");

describe("settings testing suite", () => {
  let settingsController;

  before(() => {});
  beforeEach(() => {
    settingsController = new SettingsController();
  });

  it("create image, image doesn't exist yet", async () => {
    const mediaStorageLink = "media-storage-link";

    const mockAwsGateway = {
      uploadImageToAWS: sinon.stub().returns(mediaStorageLink),
    };

    const mockRepo = {
      getImageByIndexAndUserUuid: sinon.stub().returns(null),
      updateImage: sinon.stub().returns(null),
      createImage: sinon.stub().returns(null),
    };

    settingsController.awsGateway = mockAwsGateway;
    settingsController.repo = mockRepo;

    const userUuid = "user-uuid";
    const positionIndex = 0;
    const uploadImageParams = {
      userUuid,
      positionIndex,
      bufferBase64: "buffer-base-64",
    };

    await settingsController.uploadImage(uploadImageParams);

    const [uploadParamsArgs] = mockAwsGateway.uploadImageToAWS.firstCall.args;
    expect(uploadParamsArgs.bufferBase64).equal(uploadImageParams.bufferBase64);
    expect(uploadParamsArgs.userUuid).equal(uploadImageParams.userUuid);

    const [posIndex_1, userUuid_1] =
      mockRepo.getImageByIndexAndUserUuid.firstCall.args;
    expect(posIndex_1).equal(positionIndex);
    expect(userUuid_1).equal(userUuid);

    const [imageRecord] = mockRepo.createImage.firstCall.args;
    expect(imageRecord.user_uuid).equal(userUuid);
    expect(imageRecord.media_storage_link).equal(mediaStorageLink);
    expect(imageRecord.position_index).equal(positionIndex);

    expect(mockRepo.createImage.callCount).equal(1);
    expect(mockRepo.updateImage.callCount).equal(0);
    expect(mockRepo.getImageByIndexAndUserUuid.callCount).equal(1);
    expect(mockAwsGateway.uploadImageToAWS.callCount).equal(1);
  });

  it("create image, image already exists", async () => {
    const mediaStorageLink = "media-storage-link";
    const userUuid = "user-uuid";
    const positionIndex = 0;

    const mockAwsGateway = {
      uploadImageToAWS: sinon.stub().returns(mediaStorageLink),
    };

    const existingImage: ImageRecord = {
      uuid: "some-image-uuid",
      user_uuid: userUuid,
      media_storage_link: mediaStorageLink,
      position_index: 0,
    };

    const mockRepo = {
      getImageByIndexAndUserUuid: sinon.stub().returns(existingImage),
      updateImage: sinon.stub().returns(null),
      createImage: sinon.stub().returns(null),
    };

    settingsController.awsGateway = mockAwsGateway;
    settingsController.repo = mockRepo;

    const uploadImageParams = {
      userUuid,
      positionIndex,
      bufferBase64: "buffer-base-64",
    };

    await settingsController.uploadImage(uploadImageParams);

    const [uploadParamsArgs] = mockAwsGateway.uploadImageToAWS.firstCall.args;
    expect(uploadParamsArgs.bufferBase64).equal(uploadImageParams.bufferBase64);
    expect(uploadParamsArgs.userUuid).equal(uploadImageParams.userUuid);

    const [posIndex_1, userUuid_1] =
      mockRepo.getImageByIndexAndUserUuid.firstCall.args;
    expect(posIndex_1).equal(positionIndex);
    expect(userUuid_1).equal(userUuid);

    const [imageRecord] = mockRepo.updateImage.firstCall.args;
    expect(imageRecord.user_uuid).equal(userUuid);
    expect(imageRecord.media_storage_link).equal(mediaStorageLink);
    expect(imageRecord.position_index).equal(positionIndex);

    expect(mockRepo.createImage.callCount).equal(0);
    expect(mockRepo.updateImage.callCount).equal(1);
    expect(mockRepo.getImageByIndexAndUserUuid.callCount).equal(1);
    expect(mockAwsGateway.uploadImageToAWS.callCount).equal(1);
  });

  it("create image, s3 throws error", async () => {
    const mockAwsGateway = {
      uploadImageToAWS: sinon.stub().returns(new Error("some-error")),
    };
    settingsController.awsGateway = mockAwsGateway;
    await expect(settingsController.uploadImage()).to.be.rejectedWith(Error);
  });
});
