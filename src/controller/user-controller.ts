import { UserEntity, DatingMatchPreferencesEntity } from "../types/user";
import { VideoRecord } from "../types/video";
import { BlockRecord } from "../types/match";
import { Repo } from "../repository/repo";
import { AWSGateway } from "../gateway/aws";
import { YoutubeGateway } from "../gateway/youtube";
import { SettingsController } from "./settings-controller";
import { userEntityToRecord } from "../utils/mapper-user";
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
    const newUuid = uuidv4();
    const userEntity: UserEntity = {
      uuid: newUuid,
      mobile: params.mobile,
      email: params.email,
      verified: false,
    };

    // convert to userRecord
    const userRecord = userEntityToRecord(userEntity);
    await this.repo.createUser(userRecord);
  };

  deleteUser = async (params: deleteUserParams) => {
    await this.repo.deleteUserByUuid(params.uuid);
  };

  createVideoAndTrackedVideo = async (params: addMediaLinkParams) => {
    try {
      let videoRecord: VideoRecord = await this.repo.getVideoByVideoId(
        params.mediaId
      );
      // if the video record exists, just create the treacked video record
      if (videoRecord) {
        const trackedVideoRecord: TrackedVideoRecord = {
          video_uuid: videoRecord.uuid,
          user_uuid: params.userUuid,
        };
        await this.repo.createTrackedVideoRecord(trackedVideoRecord);
        return;
      }

      const videoDetails = await this.youtubeGateway.getYoutubeDetailsByVideoId(
        params.mediaId
      );
      videoRecord = videoGatewayToRecord(videoDetails);
      videoRecord.uuid = uuidv4();

      const trackedVideoRecord: TrackedVideoRecord = {
        video_uuid: videoRecord.uuid,
        user_uuid: params.userUuid,
      };
      // create video record and tracked video record in tx
      await this.repo.createVideoAndTrackedVideoInTx(
        videoRecord,
        trackedVideoRecord
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  likeUser = async (params: likeProfileParams) => {
    // throw new Error("SOME RR");
    // first make sure this profile is not a current match
    const existingMatch = await this.repo.getMatchRecordByUuids(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    if (existingMatch) throw new Error("profile has already been matched");
    // then make sure these two people haven't blocked each other
    const blockedRecord = await this.repo.getBlockedByUserUuids(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    if (blockedRecord) {
      throw new Error("this profile has been blocked");
    }
    // check to see if the other party has already liked this profile
    // if so, create a match
    const likeRecord = await this.repo.getLikeRecord(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    const likeParams: LikeRecord = {
      initator_uuid: params.initiatorUuid,
      receiver_uuid: params.likedProfileUuid,
    };
    if (likeRecord) {
      // create like and match in tx

      // if we see there is a like already made
      // then that person is the initiator
      const matchParams: MatchRecord = {
        initiator_uuid: params.likedProfileUuid, // they already liked the initiator
        responder_uuid: params.initiatorUuid,
      };
      await this.repo.createLikeAndMatchRecordInTx(likeParams, matchParams);
      return;
    }
    await this.repo.createLikeRecord(likeParams);
    // then either let the other client poll or let them create a websocket
  };

  getUserByUUID = async (params: getProfileByUUIDParams) => {
    return await this.repo.getUserByUUID(params.uuid);
  };

  blockProfileByUuid = async (params: blockProfileByUuidParams) => {
    const block: BlockRecord = {
      initator_uuid: params.userBlockingUuid,
      receiver_uuid: params.userBeingBlockedUuid,
    };
    await this.repo.createBlockRecord(block);
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
}

interface getProfileByUUIDParams {
  uuid: string;
}

interface likeProfileParams {
  initiatorUuid: string;
  likedProfileUuid: string;
}

interface addMediaLinkParams {
  userUuid: string;
  mediaId: string;
}

interface blockProfileByUuidParams {
  userBlockingUuid: string;
  userBeingBlockedUuid: string;
}

interface deleteMediaLinkParams {
  userUuid: string;
  incomingMediaId: string;
  mediaToBeReplacedId: string;
}
