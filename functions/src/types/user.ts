/*
user {
    id: String
}

*/

import { VideoEntity } from "./video";

export interface DatingMatchPreferencesRecord {
  uuid?: string;
  userUuid?: string;
  genderPreference?: string;
  gender?: string;
  ageMinPreference: number;
  ageMaxPreference: number;
}

export interface DatingMatchPreferencesEntity {
  uuid?: string;
  userUuid?: string;
  genderPreference?: string;
  gender?: string;
  ageMinPreference?: number;
  ageMaxPreference?: number;
  zipcode?: string;
  zipcodePreference?: string;
  age?: number;
}

export interface UserRecord {
  uuid?: string;
  mobile?: string;
  email?: string;
  verified?: boolean;
  lastSeenAtUTC?: Date;

  // repo layer stuff
  deletedAtUtc?: Date;
}


export interface UserEntity {
  uuid?: string;
  mobile?: string;
  email?: string;
  verified?: boolean;
  lastSeenAtUTC?: Date;

  // hydrate
  userDatingPreference?: DatingMatchPreferencesEntity;
  videoEntities?: VideoEntity[];
}
