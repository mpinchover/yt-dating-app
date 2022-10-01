import "reflect-metadata";

import { Repo } from "../repository/repo";
import { injectable, container } from "tsyringe";
import { YoutubeGateway } from "../gateway/youtube";
import { AWSGateway } from "../gateway/aws";
import { v4 as uuidv4 } from "uuid";
import { videoGatewayToRecord } from "../utils/mapper-video";
import {
  DatingMatchPreferencesEntity,
  DatingMatchPreferencesRecord,
  Gender,
  UserEntity,
} from "../types/user";
import { ImageRecord } from "../types/image";

@injectable()
export class SettingsController {
  repo: Repo;
  youtubeGateway: YoutubeGateway;
  awsGateway: AWSGateway;
  name: string;

  constructor() {
    this.name = "settings-controller";
    this.repo = container.resolve(Repo);
    this.youtubeGateway = container.resolve(YoutubeGateway);
    this.awsGateway = container.resolve(AWSGateway);
  }

  // if not doing youtube history then
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
    // run validation

    const user = await this.repo.getUserByUUID(params.userUuid);
    if (!user) throw new Error("user does not exist");

    const updatesToMake: UpdatesToMake = {};
    let dmpUpdates: DatingMatchPreferencesEntity = {}; // assign user uuid at the end
    let userUpdates: UserEntity = {}; // assign user uuid at the end.

    // handle all user updates at the end
    params.updates.forEach(async (update) => {
      if (update.updateType === userUpdateType.UPDATE_EMAIL) {
        // userUpdates.uuid = user.uuid; assign the user uuid at the end
        userUpdates.email = update.stringValue.value;
      }
      if (update.updateType === userUpdateType.UPDATE_MOBILE) {
        const updateParams = {
          userUuid: params.userUuid,
          mobile: update.stringValue.value,
        };

        await this.updateMobile(updateParams);
      }
      if (update.updateType === userUpdateType.UPDATE_PASSWORD) {
        const updateParams = {
          userUuid: params.userUuid,
          password: update.password.password,
          confirmPassword: update.password.confirmPassword,
        };

        await this.updatePassword(updateParams);
      }

      // dating pref
      // get all the updates to the dating prefs and do them in one query
      if (update.updateType === userUpdateType.UPDATE_MAX_AGE) {
        dmpUpdates.ageMaxPreference = update.numberValue.value;
      }

      if (update.updateType === userUpdateType.UPDATE_MIN_AGE) {
        dmpUpdates.ageMinPreference = update.numberValue.value;
      }

      if (update.updateType === userUpdateType.UPDATE_GENDER_PREFERENCE) {
        dmpUpdates.genderPreference = Gender[update.stringValue.value];
      }

      // youtube
      if (update.updateType === userUpdateType.ADD_YOUTUBE_LINKS) {
      }

      if (update.updateType === userUpdateType.SWAP_YOUTUBE_LINKS) {
      }

      // pictures
      if (update.updateType === userUpdateType.ADD_PICTURES) {
      }

      if (update.updateType === userUpdateType.SWAP_PICTURES) {
      }

      if (update.updateType === userUpdateType.UPDATE_PICTURE_ORDER) {
      }
    });

    // if updates were made to the user updates, add in the user uuid and make the u
    if (Object.keys(userUpdates).length > 0) {
      updatesToMake.userUpdates = userUpdates;
    }

    if (Object.keys(dmpUpdates).length > 0) {
      updatesToMake.datingPreferencesUpdates = dmpUpdates;
    }

    // call the repo function to make the updates in a transaction
    // updateUserSettingsInTx(updatesToMake)
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

  /*
  client will have blank slots
  each slot has an index
  client can choose a blank slot which will pick the index
  so client is sending the index
  
  if the client sends a picture that already has an index in the db,
  simply replace it
  // TODO – look into row level locking for the user_uuid + image index
  */
  uploadImage = async (params: UploadImageParams) => {
    // validation
    // – make sure index of image is within 1 - 4
    // - make sure all params are present
    // upload an image

    let mediaStorageLink;
    try {
      mediaStorageLink = await this.awsGateway.uploadImageToAWS(params);
    } catch (e) {
      throw new Error(`failed to upload image to s3, ${e.message}`);
    }

    // check if image already exists at this index, if so just replace it
    const existingImage = await this.repo.getImageByIndexAndUserUuid(
      params.positionIndex,
      params.userUuid
    );

    if (existingImage) {
      existingImage.media_storage_link = mediaStorageLink;
      return await this.repo.updateImage(existingImage);
    }

    // no existing image, create a new one
    const imageRecord: ImageRecord = {
      uuid: uuidv4(),
      user_uuid: params.userUuid,
      media_storage_link: mediaStorageLink,
      position_index: params.positionIndex,
    };
    await this.repo.createImage(imageRecord);
  };
}

export interface UploadImageParams {
  userUuid: string;
  positionIndex: number;
  bufferBase64: string;
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
  SWAP_PICTURES,
  UPDATE_PICTURE_ORDER,
}

interface UpdatesToMake {
  userUpdates?: UserEntity;
  datingPreferencesUpdates?: DatingMatchPreferencesEntity;
}

interface updateUserStringValue {
  value: string;
}

interface updateUserNumberValue {
  value: number;
}

interface updateUserPasswordValue {
  password: string;
  confirmPassword: string;
}

interface updateUserParam {
  updateType: userUpdateType;
  stringValue: updateUserStringValue;
  numberValue: updateUserNumberValue;
  password: updateUserPasswordValue;
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
