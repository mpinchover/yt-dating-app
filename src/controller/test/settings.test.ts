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
  it("test createVideoAndTrackedVideo, create video and tracked video", async () => {
    const videoId = "video-id";
    const userUuid = "user-uuid";

    const test = {
      name: "no video found, create video, tracked video",
      mockRepo: {
        createTrackedVideoRecord: sinon.stub().returns(null),
        createVideoAndTrackedVideoInTx: sinon.stub().returns(null),
        getVideoByVideoId: sinon.stub().returns(null),
      },
      mockYoutubeGateway: {
        getYoutubeDetailsByVideoId: sinon.stub().returns({
          videoId,
        }),
      },
      params: {
        mediaId: videoId,
        userUuid,
      },
      createTrackedVideoRecordCallCount: 0,
      getVideoByVideoIdCallCount: 1,
      createVideoAndTrackedVideoInTxCallCount: 1,
      getYoutubeDetailsByVideoIdCallCount: 1,
    };

    settingsController.repo = test.mockRepo;
    settingsController.youtubeGateway = test.mockYoutubeGateway;

    await expect(
      settingsController.createVideo(test.params)
    ).to.not.be.rejectedWith();

    expect(settingsController.repo.createTrackedVideoRecord.callCount).to.equal(
      test.createTrackedVideoRecordCallCount
    );
    expect(settingsController.repo.getVideoByVideoId.callCount).to.equal(
      test.getVideoByVideoIdCallCount
    );
    expect(
      settingsController.repo.createVideoAndTrackedVideoInTx.callCount
    ).to.equal(test.createVideoAndTrackedVideoInTxCallCount);
    expect(
      settingsController.youtubeGateway.getYoutubeDetailsByVideoId.callCount
    ).to.equal(test.getYoutubeDetailsByVideoIdCallCount);

    const [videoInput, trackedVideoInput] =
      test.mockRepo.createVideoAndTrackedVideoInTx.firstCall.args;

    expect(videoInput.video_id).to.equal(videoId);
    expect(trackedVideoInput.user_uuid).to.equal(userUuid);
  });

  it("test createVideoAndTrackedVideo, create tracked video", async () => {
    const videoUuid = "video-uuid";
    const videoId = "video-id";
    const userUuid = "user-uuid";
    const test = {
      name: "found video, just create tracked video",
      mockRepo: {
        createTrackedVideoRecord: sinon.stub().returns(null),
        createVideoAndTrackedVideoInTx: sinon.stub().returns(null),
        getVideoByVideoId: sinon.stub().returns({
          uuid: videoUuid,
          video_id: videoId,
        }),
      },
      mockYoutubeGateway: {
        getYoutubeDetailsByVideoId: sinon.stub().returns({}),
      },
      params: {
        mediaId: videoId,
        userUuid,
      },
      createTrackedVideoRecordCallCount: 1,
      getVideoByVideoIdCallCount: 1,
      createVideoAndTrackedVideoInTxCallCount: 0,
      getYoutubeDetailsByVideoIdCallCount: 0,
    };

    settingsController.repo = test.mockRepo;
    settingsController.youtubeGateway = test.mockYoutubeGateway;

    await expect(
      settingsController.createVideo(test.params)
    ).to.not.be.rejectedWith();

    expect(settingsController.repo.createTrackedVideoRecord.callCount).to.equal(
      test.createTrackedVideoRecordCallCount
    );
    expect(settingsController.repo.getVideoByVideoId.callCount).to.equal(
      test.getVideoByVideoIdCallCount
    );
    expect(
      settingsController.repo.createVideoAndTrackedVideoInTx.callCount
    ).to.equal(test.createVideoAndTrackedVideoInTxCallCount);
    expect(
      settingsController.youtubeGateway.getYoutubeDetailsByVideoId.callCount
    ).to.equal(test.getYoutubeDetailsByVideoIdCallCount);

    // const createTrackedVideoRecordArgs =
    //   test.mockRepo.createTrackedVideoRecord.args[0][0];
    // expect(createTrackedVideoRecordArgs.video_uuid).equal(videoUuid);
    // expect(createTrackedVideoRecordArgs.user_uuid).equal(userUuid);

    const [trackedVideoInput] =
      test.mockRepo.createTrackedVideoRecord.firstCall.args;

    expect(trackedVideoInput.user_uuid).to.equal(userUuid);
    expect(trackedVideoInput.video_uuid).to.equal(videoUuid);
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
