import {
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
  DatingMatchPreferencesEntity,
  Gender,
} from "../types/user";
import { videoRecordsToEntities } from "./mapper-video";

export const userEntityToRecord = (params: UserEntity): UserRecord => {
  if (!params) throw new Error("user entity cannot be null");

  const userRecord: UserRecord = {
    uuid: params.uuid,
    mobile: params.mobile,
    email: params.email,
    verified: params.verified,
    last_seen_at_utc: params.lastSeenAtUtc,
  };
  return userRecord;
};

export const userRecordToEntity = (params: UserRecord): UserEntity => {
  if (!params) throw new Error("user record cannot be null");
  let dmp;
  let videos;

  if (params.dating_preference)
    dmp = datingMatchPrefRecordToEntity(params.dating_preference);

  if (params.videos && params.videos.length > 0)
    videos = videoRecordsToEntities(params.videos);

  const userEntity: UserEntity = {
    uuid: params.uuid,
    mobile: params.mobile,
    email: params.email,
    verified: params.verified,
    lastSeenAtUtc: params.last_seen_at_utc,
    datingPreference: dmp,
    videos: videos,
  };
  return userEntity;
};

export const datingMatchPrefRecordToEntity = (
  params: DatingMatchPreferencesRecord
): DatingMatchPreferencesEntity => {
  if (!params)
    throw new Error("dating match preferences record cannot be null");

  const datingPrefEntity: DatingMatchPreferencesEntity = {
    uuid: params.uuid,
    userUuid: params.user_uuid,
    genderPreference: Gender[params.gender_preference],
    gender: Gender[params.gender],
    ageMinPreference: params.age_min_preference,
    ageMaxPreference: params.age_max_preference,
    zipcode: params.zipcode,
    zipcodePreference: params.zipcode_preference,
    age: params.age,
  };
  return datingPrefEntity;
};
