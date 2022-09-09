require("reflect-metadata");
const { UserController } = require("../user-controller");
const expect = require("chai").expect;
const chai = require("chai");
chai.use(require("chai-as-promised"));
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
    await userController.createUser({});
  });

  it("test createVideoAndTrackedVideo", async () => {
    tests = [
      {
        name: "found video, just create tracked video",
        mockRepo: {
          createTrackedVideoRecord: sinon.stub().returns(null),
          createVideoAndTrackedVideoInTx: sinon.stub().returns(null),
          getVideoByVideoId: sinon.stub().returns({}),
        },
        params: {
          mediaId: "media-id",
          userUuid: "user-uuid",
        },
        createTrackedVideoRecordCallCount: 1,
        getVideoByVideoIdCallCount: 1,
        createVideoAndTrackedVideoInTxCallCount: 0,
        getYoutubeDetailsByVideoIdCallCount: 0,
      },
      {
        name: "no video found, create video, tracked video",
        mockRepo: {
          createTrackedVideoRecord: sinon.stub().returns(null),
          createVideoAndTrackedVideoInTx: sinon.stub().returns(null),
          getVideoByVideoId: sinon.stub().returns(null),
        },
        mockYoutubeGateway: {
          getYoutubeDetailsByVideoId: sinon.stub().returns({}),
        },
        params: {
          mediaId: "media-id",
          userUuid: "user-uuid",
        },
        createTrackedVideoRecordCallCount: 0,
        getVideoByVideoIdCallCount: 1,
        createVideoAndTrackedVideoInTxCallCount: 1,
        getYoutubeDetailsByVideoIdCallCount: 1,
      },
    ];

    tests.forEach(async (test) => {
      try {
        const userController = new UserController();
        userController.repo = test.mockRepo;
        userController.youtubeGateway = test.mockYoutubeGateway;

        await userController.createVideoAndTrackedVideo(test.params);

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
      } catch (e) {
        expect(false).to.be.true;
        console.log(e);
        throw e;
      }
    });
  });

  it("test likeUser", async () => {
    let test = {
      name: "no match found, no previous like found; just make a like",
      initiatorUuid: "init-uuid",
      likedProfileUuid: "liked-profile-uuid",
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
      userController.likeUser("some-uuid", "some-uuid")
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

    test = {
      name: "block found, throw an error",
      initiatorUuid: "init-uuid",
      likedProfileUuid: "liked-profile-uuid",
      mockRepo: {
        getMatchRecordByUuids: sinon.stub().returns(null),
        getBlockedByUserUuids: sinon.stub().returns({}),
      },
      getMatchRecordByUuidsCount: 1,
      getBlockedByUserUuidsCount: 1,
      getLikeRecordCount: 0,
      createLikeRecordCount: 0,
      createLikeAndMatchRecordInTxCount: 0,
    };

    userController = new UserController();
    userController.repo = test.mockRepo;

    await expect(
      userController.likeUser("some-uuid", "some-uuid")
    ).to.be.rejectedWith(Error);
  });
});
