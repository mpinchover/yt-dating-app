import { UserEntity, DatingMatchPreferencesEntity } from "../types/user";
import { VideoRecord } from "../types/video";
import { BlockRecord } from "../types/match";
import { Repo } from "../database/repo";
import { AWSGateway } from "../gateway/aws";
import { YoutubeGateway } from "../gateway/youtube";
import { FirebaseController } from "../controller/firebase-controller";
import { userEntityToRecord } from "../utils/mapper-user";
import { videoGatewayToRecord } from "../utils/mapper-video";
import { v4 as uuidv4 } from "uuid";
import { LikeRecord, MatchRecord } from "../types/match";
import { TrackedVideoRecord } from "../types/video";

export interface UserControllerParams {
  // db: any;
  repo: Repo;
  awsGateway: AWSGateway;
  youtubeGateway: YoutubeGateway;
  firebaseController: FirebaseController;
}

export class UserController {
  repo: Repo;
  awsGateway: AWSGateway;
  youtubeGateway: YoutubeGateway;
  firebaseController: FirebaseController;

  constructor(p: UserControllerParams) {
    this.repo = p.repo;
    this.awsGateway = p.awsGateway;
    this.youtubeGateway = p.youtubeGateway;
    this.firebaseController = p.firebaseController;
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

  verifyUser = async () => {};

  createUserPassword = async () => {};

  deleteUser = async (params: deleteUserParams) => {
    await this.repo.deleteUser(params.uuid);
  };

  updateUser = async (params: updateUserParams) => {
    params.updates.forEach(async (update) => {
      // firebase
      if (update.updateType === userUpdateType.UPDATE_EMAIL) {
        const id = await this.repo.getUserIdByUuid(params.userUuid);
        const updateParams = {
          userId: id,
          email: update.email,
        };

        await this.firebaseController.updateEmail(updateParams);
      }
      if (update.updateType === userUpdateType.UPDATE_MOBILE) {
        const id = await this.repo.getUserIdByUuid(params.userUuid);
        const updateParams = {
          userId: id,
          mobile: update.mobile,
        };

        await this.firebaseController.updateMobile(updateParams);
      }
      if (update.updateType === userUpdateType.UPDATE_PASSWORD) {
        const id = await this.repo.getUserIdByUuid(params.userUuid);
        const updateParams = {
          userId: id,
          password: update.newPassword,
          confirmPassowrd: update.newPasswordConfirm,
        };

        await this.firebaseController.updatePassword(updateParams);
      }

      // dating pref
      if (update.updateType === userUpdateType.UPDATE_MAX_AGE) {
      }

      if (update.updateType === userUpdateType.UPDATE_MIN_AGE) {
      }

      if (update.updateType === userUpdateType.UPDATE_GENDER_PREFERENCE) {
      }

      // youtube
      if (update.updateType === userUpdateType.ADD_YOUTUBE_LINKS) {
      }

      if (update.updateType === userUpdateType.SWAP_YOUTUBE_LINKS) {
      }

      // pictures
      if (update.updateType === userUpdateType.ADD_PICTURES) {
      }

      if (update.updateType === userUpdateType.UPDATE_PICTURE_ORDER) {
      }
    });
  };

  createVideoAndTrackedVideo = async (params: addMediaLinkParams) => {
    let videoRecord: VideoRecord = await this.repo.getVideoById(params.mediaId);
    // if the video record exists, just create the treacked video record
    if (videoRecord) {
      const trackedVideoRecord: TrackedVideoRecord = {
        videoUuid: videoRecord.uuid,
        userUuid: params.userUuid,
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
      videoUuid: videoRecord.uuid,
      userUuid: params.userUuid,
    };
    // create video record and tracked video record in tx
    await this.repo.createVideoAndTrackedVideoRecords(
      videoRecord,
      trackedVideoRecord
    );
  };

  // always have at least 5 media links
  swapVideos = async (params: swapVideosParams) => {
    // first check to see if the video exists
    let newVideo = await this.repo.getVideoById(params.incomingVideoId);
    if (!newVideo) {
      // if the video doesnt exist, create the uuid for it
      // create the video
      const videoDetails = await this.youtubeGateway.getYoutubeDetailsByVideoId(
        params.incomingVideoId
      );
      newVideo = videoGatewayToRecord(videoDetails);
      newVideo.uuid = uuidv4();

      await this.repo.createVideo(newVideo);
    }

    await this.repo.swapVideos(
      params.userUuid,
      newVideo.uuid,
      params.videoToBeReplacedUuid
    );
  };

  likeProfile = async (params: likeProfileParams) => {
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
    if (blockedRecord) throw new Error("this profile has been blocked");
    // check to see if the other party has already liked this profile
    // if so, create a match
    const likeRecord = await this.repo.getLikeRecord(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    const likeParams: LikeRecord = {
      initiatorUuid: params.initiatorUuid,
      receiverUuid: params.likedProfileUuid,
    };
    if (likeRecord) {
      // create like and match in tx

      // if we see there is a like already made
      // then that person is the initiator
      const matchParams: MatchRecord = {
        initiatorUuid: params.likedProfileUuid, // they already liked the initiator
        responderUuid: params.initiatorUuid,
        matchedUsersUuids: [params.initiatorUuid, params.likedProfileUuid],
      };
      await this.repo.createLikeAndMatchRecords(likeParams, matchParams);
      return;
    }
    await this.repo.createLikeRecord(likeParams);
    // then either let the other client poll or let them create a websocket
  };

  getProfileByUUID = async (params: getProfileByUUIDParams) => {
    return await this.repo.getProfileByUserUUID(params.uuid);
  };

  blockProfileByUuid = async (params: blockProfileByUuidParams) => {
    const block: BlockRecord = {
      initatorUuid: params.userBlockingUuid,
      receiverUuid: params.userBeingBlockedUuid,
      blockedUserUuids: [params.userBeingBlockedUuid, params.userBlockingUuid],
    };
    await this.repo.createBlockRecord(block);
  };

  //   getDatingPreferencesByUuid = async (
  //     uuid: string
  //   ): Promise<DatingMatchPreferencesEntity> => {
  //     const datingMatchPreferencesSnapshot = await this.db
  //       .collection("dating_match_preferences")
  //       .where("userUUID", "==", uuid)
  //       .get();

  //     const prefs: DatingMatchPreferencesEntity = {};
  //     if (datingMatchPreferencesSnapshot.length > 0) {
  //       const data = datingMatchPreferencesSnapshot[0].data();
  //       prefs.uuid = data.uuid;
  //       prefs.userUuid = data.userUuid;
  //       prefs.genderPreference = data.genderPreference;
  //       prefs.gender = data.gender;
  //       prefs.age = data.age;
  //       prefs.ageMinPreference = data.ageMinPreference;
  //       prefs.ageMaxPreference = data.ageMaxPreference;
  //       prefs.zipcode = data.zipcode;
  //       prefs.zipcodePreference = data.zipcodePreference;
  //     }
  //     return prefs;
  //   };
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

enum userUpdateType {
  UPDATE_PASSWORD,
  UPDATE_EMAIL,
  UPDATE_MOBILE,
  UPDATE_MAX_AGE,
  UPDATE_MIN_AGE,
  UPDATE_GENDER_PREFERENCE,
  ADD_YOUTUBE_LINKS,
  SWAP_YOUTUBE_LINKS,
  ADD_PICTURES, // requireq 6 pics min or something
  UPDATE_PICTURE_ORDER,
}

interface updateUserParam {
  updateType: userUpdateType;
  mobile?: string;
  email?: string;
  newPassword: string;
  newPasswordConfirm: string;
  newEmail: string;
  newMobile: string; // need new confirmation
  //  newPics:
}

interface updateUserParams {
  userUuid: string;
  updates: updateUserParam[];
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

interface swapVideosParams {
  userUuid: string;
  incomingVideoId: string; // the youtube ID
  videoToBeReplacedUuid: string;
}
