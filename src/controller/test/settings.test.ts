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

  // TODO - see if there's a way to test the key value as well as the media link
  it("create image, image doesn't exist yet", async () => {
    const expectedMediaStorageKey = "media-storage-key";
    const expectedUserUuid = "user-uuid";
    const expectedPositionIndex = 0;
    const expectedBufferBase64 = "buffer-base-64";

    const mockAwsGateway = {
      uploadImageToAWS: sinon.stub().returns(null),
    };

    const mockRepo = {
      getImageByIndexAndUserUuid: sinon.stub().returns(null),
      updateImage: sinon.stub().returns(null),
      createImage: sinon.stub().returns(null),
    };

    settingsController.awsGateway = mockAwsGateway;
    settingsController.repo = mockRepo;

    const uploadImageParams = {
      userUuid: expectedUserUuid,
      positionIndex: expectedPositionIndex,
      bufferBase64: expectedBufferBase64,
    };

    await settingsController.uploadImage(uploadImageParams);

    const [uploadParamsArgs] = mockAwsGateway.uploadImageToAWS.firstCall.args;
    expect(uploadParamsArgs.bufferBase64).equal(expectedBufferBase64);
    expect(uploadParamsArgs.userUuid).equal(expectedUserUuid);

    const [posIndex_1, userUuid_1] =
      mockRepo.getImageByIndexAndUserUuid.firstCall.args;
    expect(posIndex_1).equal(expectedPositionIndex);
    expect(userUuid_1).equal(expectedUserUuid);

    const [imageRecord] = mockRepo.createImage.firstCall.args;
    expect(imageRecord.user_uuid).equal(expectedUserUuid);

    const expectedMediaStorageLink = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${imageRecord.media_storage_key}`;
    expect(imageRecord.media_storage_link).equal(expectedMediaStorageLink);
    expect(imageRecord.position_index).equal(expectedPositionIndex);

    expect(mockRepo.createImage.callCount).equal(1);
    expect(mockRepo.updateImage.callCount).equal(0);
    expect(mockRepo.getImageByIndexAndUserUuid.callCount).equal(1);
    expect(mockAwsGateway.uploadImageToAWS.callCount).equal(1);
  });

  it("create image, image already exists", async () => {
    const expectedMediaStorageKey = "media-storage-key";

    const expectedUserUuid = "user-uuid";
    const expectedPositionIndex = 0;
    const expectedBufferBase64 = "buffer-base-64";

    const mockAwsGateway = {
      uploadImageToAWS: sinon.stub().returns(null),
    };

    const existingImage: ImageRecord = {
      uuid: "some-image-uuid",
      user_uuid: expectedUserUuid,
      media_storage_link: "some-media-storage-link",
      media_storage_key: expectedMediaStorageKey,
      position_index: expectedPositionIndex,
    };

    const mockRepo = {
      getImageByIndexAndUserUuid: sinon.stub().returns(existingImage),
      updateImage: sinon.stub().returns(null),
      createImage: sinon.stub().returns(null),
    };

    settingsController.awsGateway = mockAwsGateway;
    settingsController.repo = mockRepo;

    const uploadImageParams = {
      userUuid: expectedUserUuid,
      positionIndex: expectedPositionIndex,
      bufferBase64: expectedBufferBase64,
    };

    await settingsController.uploadImage(uploadImageParams);

    const [uploadParamsArgs] = mockAwsGateway.uploadImageToAWS.firstCall.args;
    expect(uploadParamsArgs.bufferBase64).equal(expectedBufferBase64);
    expect(uploadParamsArgs.userUuid).equal(expectedUserUuid);

    const [posIndex_1, userUuid_1] =
      mockRepo.getImageByIndexAndUserUuid.firstCall.args;
    expect(posIndex_1).equal(expectedPositionIndex);
    expect(userUuid_1).equal(expectedUserUuid);

    const [imageRecord] = mockRepo.updateImage.firstCall.args;
    expect(imageRecord.user_uuid).equal(expectedUserUuid);

    const expectedMediaStorageLink = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${imageRecord.media_storage_key}`;
    expect(imageRecord.media_storage_link).equal(expectedMediaStorageLink);
    expect(imageRecord.position_index).equal(expectedPositionIndex);

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
