require("reflect-metadata");
const { UserController } = require("../user-controller");
const expect = require("chai").expect;
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
// var sinonChai = require("sinon-chai");
const sinon = require("sinon");

describe("user testing suite", () => {
  before(() => {});
  beforeEach(() => {});

  it("create a user", async () => {
    const repo = {
      createUser: sinon.stub().returns(null),
    };
    const userController = new UserController();
    userController.repo = repo;
    await expect(userController.createUser({})).to.not.be.rejectedWith();
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

    const userController = new UserController();
    userController.repo = test.mockRepo;
    userController.youtubeGateway = test.mockYoutubeGateway;

    await expect(
      userController.createVideoAndTrackedVideo(test.params)
    ).to.not.be.rejectedWith();

    expect(userController.repo.createTrackedVideoRecord.callCount).to.equal(
      test.createTrackedVideoRecordCallCount
    );
    expect(userController.repo.getVideoByVideoId.callCount).to.equal(
      test.getVideoByVideoIdCallCount
    );
    expect(
      userController.repo.createVideoAndTrackedVideoInTx.callCount
    ).to.equal(test.createVideoAndTrackedVideoInTxCallCount);
    expect(
      userController.youtubeGateway.getYoutubeDetailsByVideoId.callCount
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

    const userController = new UserController();
    userController.repo = test.mockRepo;
    userController.youtubeGateway = test.mockYoutubeGateway;

    await expect(
      userController.createVideoAndTrackedVideo(test.params)
    ).to.not.be.rejectedWith();

    expect(userController.repo.createTrackedVideoRecord.callCount).to.equal(
      test.createTrackedVideoRecordCallCount
    );
    expect(userController.repo.getVideoByVideoId.callCount).to.equal(
      test.getVideoByVideoIdCallCount
    );
    expect(
      userController.repo.createVideoAndTrackedVideoInTx.callCount
    ).to.equal(test.createVideoAndTrackedVideoInTxCallCount);
    expect(
      userController.youtubeGateway.getYoutubeDetailsByVideoId.callCount
    ).to.equal(test.getYoutubeDetailsByVideoIdCallCount);

    const newTrackedVideoParams = {
      video_uuid: videoUuid,
      user_uuid: test.params.userUuid,
    };
    expect(test.mockRepo.createTrackedVideoRecord).to.have.been.calledWith(
      newTrackedVideoParams
    );

    const [trackedVideoInput] =
      test.mockRepo.createTrackedVideoRecord.firstCall.args;

    expect(trackedVideoInput.user_uuid).to.equal(userUuid);
    expect(trackedVideoInput.video_uuid).to.equal(videoUuid);
  });

  it("test likeUser, create a like", async () => {
    const initiatorUuid = "init-uuid";
    const likedProfileUuid = "liked-profile-uuid";

    let test = {
      name: "no previous like found; just make a like",
      initiatorUuid,
      likedProfileUuid,
      mockRepo: {
        getMatchRecordByUuids: sinon.stub().returns(null),
        getBlockedByUserUuids: sinon.stub().returns(null),
        getLikeRecord: sinon.stub().returns(null),
        createLikeRecord: sinon.stub().returns(null),
        createLikeAndMatchRecordInTx: sinon.stub().returns(null),
      },
      getMatchRecordByUuidsCount: 1,
      getBlockedByUserUuidsCount: 1,
      getLikeRecordCount: 1,
      createLikeRecordCount: 1,
      createLikeAndMatchRecordInTxCount: 0,
    };
    let userController = new UserController();
    userController.repo = test.mockRepo;

    await expect(
      userController.likeUser({
        initiatorUuid,
        likedProfileUuid,
      })
    ).to.not.be.rejectedWith();

    expect(test.mockRepo.getMatchRecordByUuids.callCount).to.equal(
      test.getMatchRecordByUuidsCount
    );

    expect(test.mockRepo.getBlockedByUserUuids.callCount).to.equal(
      test.getBlockedByUserUuidsCount,
      test.name
    );

    expect(test.mockRepo.getLikeRecord.callCount).to.equal(
      test.getLikeRecordCount,
      test.name
    );

    expect(test.mockRepo.createLikeRecord.callCount).to.equal(
      test.createLikeRecordCount,
      test.name
    );

    expect(test.mockRepo.createLikeAndMatchRecordInTx.callCount).to.equal(
      test.createLikeAndMatchRecordInTxCount,
      test.name
    );
  });

  it("test likeUser, create like and match (createLikeAndMatchRecordInTx)", async () => {
    const initiatorUuid = "init-uuid";
    const likedProfileUuid = "liked-profile-uuid";

    let test = {
      name: "previous like found; create like and match",
      initiatorUuid,
      likedProfileUuid,
      mockRepo: {
        getMatchRecordByUuids: sinon.stub().returns(null),
        getBlockedByUserUuids: sinon.stub().returns(null),
        getLikeRecord: sinon.stub().returns({
          initiator_uuid: likedProfileUuid,
          receiver_uuid: initiatorUuid,
        }),
        createLikeRecord: sinon.stub().returns(null),
        createLikeAndMatchRecordInTx: sinon.stub().returns(null),
      },
      getMatchRecordByUuidsCount: 1,
      getBlockedByUserUuidsCount: 1,
      getLikeRecordCount: 1,
      createLikeRecordCount: 0,
      createLikeAndMatchRecordInTxCount: 1,
    };
    let userController = new UserController();
    userController.repo = test.mockRepo;

    await expect(
      userController.likeUser({
        initiatorUuid,
        likedProfileUuid,
      })
    ).to.not.be.rejectedWith();

    expect(test.mockRepo.getMatchRecordByUuids.callCount).to.equal(
      test.getMatchRecordByUuidsCount
    );

    expect(test.mockRepo.getBlockedByUserUuids.callCount).to.equal(
      test.getBlockedByUserUuidsCount,
      test.name
    );

    expect(test.mockRepo.getLikeRecord.callCount).to.equal(
      test.getLikeRecordCount,
      test.name
    );

    expect(test.mockRepo.createLikeRecord.callCount).to.equal(
      test.createLikeRecordCount,
      test.name
    );

    const newLikeParams = {
      receiver_uuid: test.likedProfileUuid,
      initiator_uuid: test.initiatorUuid,
    };

    const newMatchParams = {
      initiator_uuid: test.likedProfileUuid,
      responder_uuid: test.initiatorUuid,
    };

    expect(test.mockRepo.createLikeAndMatchRecordInTx).to.have.been.calledWith(
      newLikeParams,
      newMatchParams
    );

    expect(test.mockRepo.createLikeAndMatchRecordInTx.callCount).to.equal(
      test.createLikeAndMatchRecordInTxCount,
      test.name
    );
  });

  it("test likeUser error: user already matched", async () => {
    const test = {
      name: "match found, throw an error",
      initiatorUuid: "init-uuid",
      likedProfileUuid: "liked-profile-uuid",
      mockRepo: {
        getMatchRecordByUuids: sinon.stub().returns({}),
      },
    };

    userController = new UserController();
    userController.repo = test.mockRepo;

    await expect(userController.likeUser({})).to.be.rejectedWith(Error);
  });

  it("test likeUser error: found blocked user", async () => {
    const test = {
      name: "block found, throw an error",
      initiatorUuid: "init-uuid",
      likedProfileUuid: "liked-profile-uuid",
      mockRepo: {
        getMatchRecordByUuids: sinon.stub().returns(null),
        getBlockedByUserUuids: sinon.stub().returns({}),
      },
    };

    userController = new UserController();
    userController.repo = test.mockRepo;

    await expect(userController.likeUser({})).to.be.rejectedWith(Error);
  });
});
