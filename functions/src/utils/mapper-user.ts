import { UserEntity, UserRecord } from "../types/user";

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

export const userRecordToEntity = (params: UserRecord): UserEntity  => {
    const userEntity: UserEntity = {
      uuid: params.uuid,
      mobile: params.mobile,
      email: params.email,
      verified: params.verified,
      lastSeenAtUtc: params.lastSeenAtUtc,
    };
    return userEntity;
  };
  