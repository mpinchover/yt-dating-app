import {
  UserEntity,
  UserRecord,
  DatingMatchPreferencesRecord,
  DatingMatchPreferencesEntity,
} from "../types/user";

export const userEntityToRecord = (params: UserEntity): UserRecord => {
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
  const userEntity: UserEntity = {
    uuid: params.uuid,
    mobile: params.mobile,
    email: params.email,
    verified: params.verified,
    lastSeenAtUtc: params.last_seen_at_utc,
  };
  return userEntity;
};

export const datingMatchPrefRecordToEntity = (
  params: DatingMatchPreferencesRecord
): DatingMatchPreferencesEntity => {
  const datingPrefEntity: DatingMatchPreferencesEntity = {
    uuid: params.uuid,
    userUuid: params.user_uuid,
    genderPreferenceMan: params.gender_preference_man,
    genderPreferenceWoman: params.gender_preference_woman,
    genderMan: params.gender_man,
    genderWoman: params.gender_woman,
    ageMinPreference: params.age_min_preference,
    ageMaxPreference: params.age_max_preference,
    zipcode: params.zipcode,
    zipcodePreference: params.zipcode_preference,
    age: params.age,
  };
  return datingPrefEntity;
};
