import {
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
  DatingMatchPreferencesEntity,
  // Gender,
} from "../types/user";
import { videoRecordsToEntities } from "./mapper-video";

export const userEntityToRecord = (params: UserEntity): UserRecord => {
  if (!params) throw new Error("user entity cannot be null");

  const res: UserRecord = {};
  if (params.uuid) res.uuid = params.uuid;
  if (params.mobile) res.mobile = params.mobile;
  if (params.email) res.email = params.email;
  if (params.verified) res.verified = params.verified;
  if (params.lastSeenAtUtc) res.last_seen_at_utc = params.lastSeenAtUtc;
  if (params.datingPreference)
    res.dating_preference = datingMatchPreferencesEntityToRecord(
      params.datingPreference
    );

  return res;
};

export const datingMatchPreferencesEntityToRecord = (
  params: DatingMatchPreferencesEntity
): DatingMatchPreferencesRecord => {
  const res: DatingMatchPreferencesRecord = {};

  if (params.age) res.age = params.age;
  if (params.ageMaxPreference) res.age_max_preference = params.ageMaxPreference;
  if (params.ageMinPreference) res.age_min_preference = params.ageMinPreference;
  if (params.gender) res.gender = params.gender;
  if (params.genderPreference) res.gender_preference = params.genderPreference;
  if (params.zipcode) res.zipcode = params.zipcode;
  if (params.zipcodePreference)
    res.zipcode_preference = params.zipcodePreference;
  if (params.userUuid) res.user_uuid = params.userUuid;
  if (params.uuid) res.uuid = params.uuid;

  return res;
};

export const userRecordToEntity = (params: UserRecord): UserEntity => {
  if (!params) throw new Error("user record cannot be null");
  let dmp;
  let videos;

  if (params.dating_preference) {
    dmp = datingMatchPrefRecordToEntity(params.dating_preference);
  }

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
    genderPreference: params.gender_preference,
    gender: params.gender,
    ageMinPreference: params.age_min_preference,
    ageMaxPreference: params.age_max_preference,
    zipcode: params.zipcode,
    zipcodePreference: params.zipcode_preference,
    age: params.age,
  };

  return datingPrefEntity;
};
