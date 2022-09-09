import "reflect-metadata";

import { Repo } from "../repository/repo";
import { injectable, container } from "tsyringe";
import { YoutubeGateway } from "../gateway/youtube";
import { v4 as uuidv4 } from "uuid";
import { videoGatewayToRecord } from "../utils/mapper-video";

@injectable()
export class SettingsController {
  repo: Repo;
  youtubeGateway: YoutubeGateway;
  name: string;

  constructor() {
    this.name = "hello";
    this.repo = container.resolve(Repo);
    this.youtubeGateway = container.resolve(YoutubeGateway);
  }

  // always have at least 5 media links
  swapVideos = async (params: swapVideosParams) => {
    // first check to see if the video exists
    let newVideo = await this.repo.getVideoByVideoId(params.incomingVideoId);
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

    const newTrackedVideoRecordUuid = uuidv4();
    await this.repo.swapVideos(
      newTrackedVideoRecordUuid,
      params.userUuid,
      newVideo.uuid,
      params.videoToBeReplacedUuid
    );
  };

  verifyUser = async () => {};

  createUserPassword = async () => {};

  updateUserSettings = async (params: updateUserParams) => {
    const user = await this.repo.getUserByUUID(params.userUuid);
    if (!user) throw new Error("user does not exist");

    params.updates.forEach(async (update) => {
      // firebase
      if (update.updateType === userUpdateType.UPDATE_EMAIL) {
        const updateParams = {
          userUuid: params.userUuid,
          email: update.email,
        };

        await this.updateEmail(updateParams);
      }
      if (update.updateType === userUpdateType.UPDATE_MOBILE) {
        const updateParams = {
          userUuid: params.userUuid,
          mobile: update.mobile,
        };

        await this.updateMobile(updateParams);
      }
      if (update.updateType === userUpdateType.UPDATE_PASSWORD) {
        const updateParams = {
          userUuid: params.userUuid,
          password: update.newPassword,
          confirmPassword: update.newPasswordConfirm,
        };

        await this.updatePassword(updateParams);
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

  updatePassword = async (params: updatePasswordParams) => {
    const { userUuid, password, confirmPassword } = params;
    // validation check
    return null;
  };

  updateEmail = async (params: updateEmailParams) => {
    const { userUuid, email } = params;
    return null;
  };

  updateMobile = async (params: updateMobileParams) => {
    const { userUuid, mobile } = params;
    return null;
  };
}

export interface updatePasswordParams {
  userUuid: string;
  password: string;
  confirmPassword: string;
}

export interface updateEmailParams {
  userUuid: string;
  email: string;
}

export interface updateMobileParams {
  userUuid: string;
  mobile: string;
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
  ADD_PICTURES, // min 6 pics required
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
}

interface updateUserParams {
  userUuid: string;
  updates: updateUserParam[];
}

interface swapVideosParams {
  userUuid: string;
  incomingVideoId: string; // the youtube ID
  videoToBeReplacedUuid: string;
}
