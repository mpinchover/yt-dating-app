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
    lastSeenAtUtc: params.lastSeenAtUtc,
  };
  return userRecord;
};

export const userFirestoreToRecord = (params: any): UserRecord => {
  const userRecord: UserRecord = {
    uuid: params.uuid,
    mobile: params.mobile,
    email: params.email,
    verified: params.verified,
    lastSeenAtUtc: params.lastSeenAtUtc,
    deletedAtUtc: params.deletedAtUtc,
  };
  return userRecord;
};

export const userRecordToEntity = (params: UserRecord): UserEntity => {
  const userEntity: UserEntity = {
    uuid: params.uuid,
    mobile: params.mobile,
    email: params.email,
    verified: params.verified,
    lastSeenAtUtc: params.lastSeenAtUtc,
  };
  return userEntity;
};

export const datingMatchPrefRecordToEntity = (
  params: DatingMatchPreferencesRecord
): DatingMatchPreferencesEntity => {
  const datingPrefEntity: DatingMatchPreferencesEntity = {
    uuid: params.uuid,
    userUuid: params.userUuid,
    genderPreference: params.genderPreference,
    gender: params.gender,
    ageMinPreference: params.ageMinPreference,
    ageMaxPreference: params.ageMaxPreference,
    zipcode: params.zipcode,
    zipcodePreference: params.zipcodePreference,
    age: params.age,
  };
  return datingPrefEntity;
};
