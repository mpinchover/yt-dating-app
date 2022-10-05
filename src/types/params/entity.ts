import { UserEntity, DatingMatchPreferencesEntity } from "../user";

export interface UploadImageParams {
  userUuid?: string;
  positionIndex?: number;
  bufferBase64?: string;
}

// TODO – add in way to differentiate youtube link from something else
export interface UpdateMediaParams {
  mediaId?: string;
}

export interface UpdatePasswordParams {
  userUuid: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateEmailParams {
  userUuid: string;
  email: string;
}

export interface UpdateMobileParams {
  userUuid: string;
  mobile: string;
}
export interface AddMediaLinkParams {
  userUuid: string;
  mediaId: string;
}

export enum UserUpdateType {
  UPDATE_PASSWORD,
  UPDATE_EMAIL,
  UPDATE_MOBILE,
  UPDATE_MAX_AGE,
  UPDATE_MIN_AGE,
  UPDATE_GENDER_PREFERENCE,
  UPLOAD_YOUTUBE_LINKS,
  SWAP_YOUTUBE_LINKS,
  UPLOAD_IMAGE, // min 4 pics required
  SWAP_PICTURES, // don't need this anoymore since client will send over the image position
  UPDATE_PICTURE_ORDER,
}

export interface UpdatesToMake {
  userUpdates?: UserEntity;
  datingPreferencesUpdates?: DatingMatchPreferencesEntity;
  imageUpdates?: UploadImageParams;
}

export interface UpdateUserPasswordValue {
  password: string;
  confirmPassword: string;
}

export interface UpdateUserParam {
  updateType: string;
  stringValue: string;
  numberValue: number;
  passwordValue: UpdateUserPasswordValue;
  uploadImageParams: UploadImageParams;
}

export interface UpdateUserParams {
  userUuid: string;
  updates: UpdateUserParam[];
}

export interface SwapVideosParams {
  userUuid: string;
  incomingVideoId: string; // the youtube ID
  videoToBeReplacedUuid: string;
}
