import "reflect-metadata";
import { UserHandler } from "../src/rpc/user-handler";
import { MatchHandler } from "../src/rpc/match-handler";
import { UserEntity } from "../src/types/user";
import { container } from "tsyringe";
import { getUser } from "./utils";

const expect = require("chai").expect;
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
const sinon = require("sinon");

describe("create users and perform likes", () => {
  let userHandler: UserHandler;
  let matchHandler: MatchHandler;

  before(async () => {});

  after(() => {
    userHandler.userController.repo.db.end();
  });

  beforeEach(async () => {
    userHandler = container.resolve(UserHandler);
    matchHandler = container.resolve(MatchHandler);
    // await conn.beginTransaction();
  });

  afterEach(async () => {
    // await conn.rollback();
  });

  it("create users, create likes and create a match", async () => {
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);
    const kelly = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(kelly.user);
    const marissa = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(marissa.user);

    const createdMark = await userHandler.getUserByUUID(mark.user.uuid);
    const createdKelly = await userHandler.getUserByUUID(kelly.user.uuid);
    const createdMarissa = await userHandler.getUserByUUID(marissa.user.uuid);
    expect(createdMark).to.not.be.null;
    expect(createdKelly).to.not.be.null;
    expect(createdMarissa).to.not.be.null;

    // now do a like
    const markLikesKellyParams = {
      initiatorUuid: mark.user.uuid,
      receiverUuid: kelly.user.uuid,
    };

    await userHandler.likeUser(markLikesKellyParams);

    // verify the likes has been made
    let existingLikeRecord = await userHandler.getLike({
      initiatorUuid: mark.user.uuid,
      receiverUuid: kelly.user.uuid,
    });
    expect(existingLikeRecord).to.not.be.null;

    // verify reverse like has not been made
    const nonexistingLikeRecord = await userHandler.getLike({
      initiatorUuid: kelly.user.uuid,
      receeiverUuid: mark.user.uuid,
    });
    expect(nonexistingLikeRecord).to.be.null;

    // then do the like int he reverse direction
    const kellyLikesMarkParams = {
      initiatorUuid: kelly.user.uuid,
      receiverUuid: mark.user.uuid,
    };
    await userHandler.likeUser(kellyLikesMarkParams);
    // verify the likes has been made
    existingLikeRecord = await userHandler.getLike({
      initiatorUuid: kelly.user.uuid,
      receiverUuid: mark.user.uuid,
    });
    expect(existingLikeRecord).to.not.be.null;

    // make sure the match has been made
    let existingMatch = await matchHandler.getMatchByUuids({
      uuid1: mark.user.uuid,
      uuid2: kelly.user.uuid,
    });
    expect(existingMatch).to.not.be.null;

    existingMatch = await matchHandler.getMatchByUuids({
      uuid2: mark.user.uuid,
      uuid1: kelly.user.uuid,
    });
    expect(existingMatch).to.not.be.null;
  });

  it("create users, make likes with blocks, don't create a match", async () => {
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);
    const kelly = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(kelly.user);
    const marissa = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(marissa.user);

    // mark blocks kelly // TODO – if there's a match you need to delete the match as well
    await userHandler.blockUser({
      userBlockingUuid: mark.user.uuid,
      userBeingBlockedUuid: kelly.user.uuid,
    });

    const kellyLikesMarkParams = {
      initiatorUuid: kelly.user.uuid,
      receiverUuid: mark.user.uuid,
    };
    await expect(userHandler.likeUser(kellyLikesMarkParams)).to.be.rejectedWith(
      Error
    );
  });
  it("make a like with a user that has already been matched should throw error", async () => {
    const mark = getUser("MAN", "WOMAN", 30);
    await userHandler.createUser(mark.user);
    const kelly = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(kelly.user);
    const marissa = getUser("WOMAN", "MAN", 25);
    await userHandler.createUser(marissa.user);

    const kellyLikesMarkParams = {
      initiatorUuid: kelly.user.uuid,
      receiverUuid: mark.user.uuid,
    };

    await userHandler.likeUser(kellyLikesMarkParams);

    const markLikesKellyParams = {
      initiatorUuid: mark.user.uuid,
      receiverUuid: kelly.user.uuid,
    };
    await userHandler.likeUser(markLikesKellyParams);

    const existingMatch = await matchHandler.getMatchByUuids({
      uuid1: mark.user.uuid,
      uuid2: kelly.user.uuid,
    });
    expect(existingMatch).to.not.be.null;

    await expect(userHandler.likeUser(kellyLikesMarkParams)).to.be.rejectedWith(
      Error
    );
  });
});
