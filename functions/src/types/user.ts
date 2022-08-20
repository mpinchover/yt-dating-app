/*
user {
    id: String
}

*/

import { VideoEntity } from "./video";

export interface DatingMatchPreferencesRecord {
  UUID?: string;
  userUUID?: string;
  genderPreference?: string;
  gender?: string;
  ageMinPreference: number;
  ageMaxPreference: number;
}

export interface DatingMatchPreferencesEntity {
  UUID?: string;
  userUUID?: string;
  genderPreference?: string;
  gender?: string;
  ageMinPreference?: number;
  ageMaxPreference?: number;
  zipcode?: string;
  zipcodePreference?: string;
  age?: number;
}

export interface UserRecord {
  UUID?: string;
  mobile?: string;
}

export interface BlockedUserRecord {
  initatorUUID?: string;
  responderUUID?: string;
  createdAtUtc?: string;
  deletedAtUtc?: string;
  blockedUserUUIDs: string[]; // just for now until better db, bc query depends on it
}

export interface UserEntity {
  UUID?: string;
  mobile?: string;
  userDatingPreference?: DatingMatchPreferencesEntity;
  videoEntities?: VideoEntity[];
}
