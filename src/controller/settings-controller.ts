import "reflect-metadata";

import { Repo } from "../repository/repo";
import { injectable, container } from "tsyringe";
import { YoutubeGateway } from "../gateway/youtube";
import { AWSGateway } from "../gateway/aws";
import { v4 as uuidv4 } from "uuid";
import { videoGatewayToRecord } from "../utils/mapper-video";
import {
  DatingMatchPreferencesEntity,
  // Gender,
  UserEntity,
} from "../types/user";
import { TrackedVideoRecord, VideoRecord } from "../types/video";
import {
  SwapVideosParams,
  UpdateUserParams,
  UpdateUserParam,
  UpdatesToMake,
  UploadImageParams,
  UpdatePasswordParams,
  UpdateEmailParams,
  UpdateMobileParams,
  UpdateMediaParams,
  UserUpdateType,
  AddMediaLinkParams,
} from "../types/params/entity";
import { ImageRecord } from "../types/image";
import {
  userEntityToRecord,
  datingMatchPreferencesEntityToRecord,
} from "../utils/mapper-user";
import { IoTThingsGraph } from "aws-sdk";

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
  swapVideos = async (params: SwapVideosParams) => {
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

  updateUserSettings = async (params: UpdateUserParams) => {
    // run validation

    const user = await this.repo.getUserByUUID(params.userUuid);
    if (!user) throw new Error("user does not exist");

    let dmpUpdates: DatingMatchPreferencesEntity = {}; // assign user uuid at the end
    let userUpdates: UserEntity = {}; // assign user uuid at the end.
    let imageUpdates: UploadImageParams = {};
    let mediaUpdates: UpdateMediaParams = {};

    // let passwordUpdates: Password = {};

    // handle all user updates at the end
    for (let i = 0; i < params.updates.length; i++) {
      const update: UpdateUserParam = params.updates[i];

      // TODO – add this to validation
      if (!UserUpdateType[update.updateType]) throw new Error("invalid update");

      if (update.updateType === UserUpdateType[UserUpdateType.UPDATE_EMAIL]) {
        userUpdates.email = update.stringValue;
      }
      if (update.updateType === UserUpdateType[UserUpdateType.UPDATE_MOBILE]) {
        userUpdates.mobile = update.stringValue;
      }
      // use new auth table for this
      if (
        update.updateType === UserUpdateType[UserUpdateType.UPDATE_PASSWORD]
      ) {
      }

      // dating pref
      // get all the updates to the dating prefs and do them in one query
      if (update.updateType === UserUpdateType[UserUpdateType.UPDATE_MAX_AGE]) {
        dmpUpdates.ageMaxPreference = update.numberValue;
      }

      if (update.updateType === UserUpdateType[UserUpdateType.UPDATE_MIN_AGE]) {
        dmpUpdates.ageMinPreference = update.numberValue;
      }

      if (
        update.updateType ===
        UserUpdateType[UserUpdateType.UPDATE_GENDER_PREFERENCE]
      ) {
        dmpUpdates.genderPreference = update.stringValue;
      }

      // youtube
      // TODO – probably should handle youtube same way you handle pictures
      if (
        update.updateType ===
        UserUpdateType[UserUpdateType.UPLOAD_YOUTUBE_LINKS]
      ) {
        mediaUpdates.mediaId = update.stringValue;
      }

      // pictures
      // TODO – allow multiple updates?
      if (update.updateType === UserUpdateType[UserUpdateType.UPLOAD_IMAGE]) {
        imageUpdates = {
          userUuid: user.uuid,
          ...update.uploadImageParams,
        };
      }
    }

    // if updates were made to the user updates, add in the user uuid and make the u
    if (Object.keys(userUpdates).length > 0) {
      userUpdates.uuid = user.uuid;
      await this.updateUser(userUpdates);
    }

    if (Object.keys(mediaUpdates).length > 0) {
      const mediaUpdate: AddMediaLinkParams = {
        userUuid: user.uuid,
        mediaId: mediaUpdates.mediaId,
      };
      await this.createVideo(mediaUpdate);
    }

    // need to first check to see if it exists, if not, create one. Else update it.
    if (Object.keys(dmpUpdates).length > 0) {
      dmpUpdates.userUuid = user.uuid;
      await this.updateDatingMatchPreferences(dmpUpdates);
    }

    if (Object.keys(imageUpdates).length > 0) {
      try {
        await this.uploadImage(imageUpdates);
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
  };

  updateUser = async (user: UserEntity) => {
    const userUpdateToMakeAsRecord = userEntityToRecord(user);
    await this.repo.updateUser(userUpdateToMakeAsRecord);
  };

  updateDatingMatchPreferences = async (dmp: DatingMatchPreferencesEntity) => {
    const dmpUpdatesToMakeAsRecord = datingMatchPreferencesEntityToRecord(dmp);
    const existingDmp = await this.repo.getDatingPreferencesByUserUuid(
      dmpUpdatesToMakeAsRecord.user_uuid
    );

    if (existingDmp) {
      await this.repo.updateDatingMatchPreferences(dmpUpdatesToMakeAsRecord);
      return;
    }

    dmpUpdatesToMakeAsRecord.uuid = uuidv4();
    await this.repo.createDatingPreferencesRecord(dmpUpdatesToMakeAsRecord);
  };

  createVideo = async (params: AddMediaLinkParams) => {
    try {
      let videoRecord: VideoRecord = await this.repo.getVideoByVideoId(
        params.mediaId
      );
      // if the video record exists, just create the treacked video record
      if (videoRecord) {
        const trackedVideoRecord: TrackedVideoRecord = {
          uuid: uuidv4(),
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
        uuid: uuidv4(),
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

  updatePassword = async (params: UpdatePasswordParams) => {
    const { userUuid, password, confirmPassword } = params;
    // validation check
    return null;
  };

  updateEmail = async (params: UpdateEmailParams) => {
    const { userUuid, email } = params;
    return null;
  };

  updateMobile = async (params: UpdateMobileParams) => {
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
    const { userUuid, bufferBase64 } = params;
    const newImageUuid = uuidv4();
    const key = `public/users/${userUuid}/profile_pictures/${newImageUuid}`;

    const uploadImageParams = {
      userUuid,
      newImageUuid,
      bufferBase64,
      key,
    };

    try {
      await this.awsGateway.uploadImageToAWS(uploadImageParams);
    } catch (e) {
      console.log(e);
      throw e;
    }

    const mediaLink = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`;

    try {
      // check if image already exists at this index, if so just replace it
      const existingImage = await this.repo.getImageByIndexAndUserUuid(
        params.positionIndex,
        params.userUuid
      );

      if (existingImage) {
        existingImage.media_storage_key = key;
        existingImage.media_storage_link = mediaLink;
        return await this.repo.updateImage(existingImage);
      }
    } catch (e) {
      console.log(e);
      throw e;
    }

    // no existing image, create a new one
    const imageRecord: ImageRecord = {
      uuid: uuidv4(),
      user_uuid: params.userUuid,
      media_storage_key: key,
      media_storage_link: mediaLink,
      position_index: params.positionIndex,
    };
    try {
      await this.repo.createImage(imageRecord);
    } catch (e) {
      console.log(e);
      throw e;
    }
  };
}
