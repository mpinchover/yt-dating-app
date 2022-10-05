import { UserEntity, DatingMatchPreferencesEntity } from "../types/user";
import { VideoRecord } from "../types/video";
import { BlockRecord } from "../types/match";
import { Repo } from "../repository/repo";
import { AWSGateway } from "../gateway/aws";
import { YoutubeGateway } from "../gateway/youtube";
import { SettingsController } from "./settings-controller";
import { userEntityToRecord, userRecordToEntity } from "../utils/mapper-user";
import { videoGatewayToRecord } from "../utils/mapper-video";
import { v4 as uuidv4 } from "uuid";
import { LikeRecord, MatchRecord } from "../types/match";
import { TrackedVideoRecord } from "../types/video";
import { injectable, container } from "tsyringe";
import "reflect-metadata";

@injectable()
export class UserController {
  repo: Repo;
  awsGateway: AWSGateway;
  youtubeGateway: YoutubeGateway;
  settingsController: SettingsController;
  name: string;

  constructor() {
    this.name = "hello";
    this.repo = container.resolve(Repo);
    this.awsGateway = container.resolve(AWSGateway);
    this.youtubeGateway = container.resolve(YoutubeGateway);
    this.settingsController = container.resolve(SettingsController);
  }
  /*
  1) create user
  2) get email/text to create a password
  3) run validation in handler
  // firebase may take care of this for you?

  */
  createUser = async (params: createUserParams) => {
    let newUuid;
    if (!params.uuid) {
      newUuid = uuidv4();
    } else {
      newUuid = params.uuid;
    }
    const userEntity: UserEntity = {
      uuid: newUuid,
      mobile: params.mobile,
      email: params.email,
      verified: false,
      datingPreference: params.datingPreferences,
    };

    // convert to userRecord
    const userRecord = userEntityToRecord(userEntity);
    await this.repo.createUserInTx(userRecord);
  };

  deleteUser = async (params: deleteUserParams) => {
    await this.repo.deleteUserByUuid(params.uuid);
  };

  likeUser = async (params: likeProfileParams) => {
    // throw new Error("SOME RR");
    // first make sure this profile is not a current match
    const existingMatch = await this.repo.getMatchRecordByUuids(
      params.initiatorUuid,
      params.receiverUuid
    );
    if (existingMatch) throw new Error("user has already been matched");
    // then make sure these two people haven't blocked each other
    const blockedRecord = await this.repo.getBlockedByUserUuids(
      params.initiatorUuid,
      params.receiverUuid
    );
    if (blockedRecord) {
      throw new Error("this user has been blocked");
    }
    // check to see if the other party has already liked this profile
    // if so, create a match
    const likeRecord = await this.repo.getLikeRecord(
      params.receiverUuid,
      params.initiatorUuid
    );
    const likeParams: LikeRecord = {
      initiator_uuid: params.initiatorUuid,
      receiver_uuid: params.receiverUuid,
      uuid: uuidv4(),
    };
    if (likeRecord) {
      // create like and match in tx
      // if we see there is a like already made
      // then that person is the initiator
      const matchParams: MatchRecord = {
        uuid: uuidv4(),
        initiator_uuid: params.receiverUuid, // they already liked the initiator
        receiver_uuid: params.initiatorUuid,
      };
      await this.repo.createLikeAndMatchRecordInTx(likeParams, matchParams);
      return;
    }
    await this.repo.createLikeRecord(likeParams);
    // then either let the other client poll or let them create a websocket
  };

  getUserByUUID = async (uuid: string): Promise<UserEntity | null> => {
    const userRecord = await this.repo.getUserByUUID(uuid);
    return userRecordToEntity(userRecord);
  };

  // need to check if this user is matched,
  // if yes, delete the match as well in tx
  blockUserByUuid = async (params: blockUserByUuidParams) => {
    const block: BlockRecord = {
      uuid: uuidv4(),
      initiator_uuid: params.userBlockingUuid,
      receiver_uuid: params.userBeingBlockedUuid,
    };
    await this.repo.createBlockRecord(block);
  };

  getImagesByUserUuid = async (uuid: string) => {
    return await this.repo.getImagesByUserUuid(uuid);
  };

  testUserRepoFn = () => {
    return "test-works..";
  };
}

interface deleteUserParams {
  uuid: string;
}

interface createUserParams {
  mobile?: string;
  email?: string;
  uuid?: string;
  datingPreferences: DatingMatchPreferencesEntity;
}

interface getProfileByUUIDParams {
  uuid: string;
}

interface likeProfileParams {
  initiatorUuid: string;
  receiverUuid: string;
}

interface blockUserByUuidParams {
  userBlockingUuid: string;
  userBeingBlockedUuid: string;
}

interface deleteMediaLinkParams {
  userUuid: string;
  incomingMediaId: string;
  mediaToBeReplacedId: string;
}
