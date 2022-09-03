/*
user {
    id: String
}

*/

import { VideoEntity } from "./video";

export enum Gender {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_X,
  GENDER_MALE_FEMALE,
  GENDER_MALE_X,
  GENDER_FEMALE_X,
  GENDER_MALE_FEMALE_X,
}

export interface DatingMatchPreferencesRecord {
  uuid?: string;
  userUuid?: string;
  genderPreference?: Gender;
  gender?: Gender;
  ageMinPreference: number;
  ageMaxPreference: number;
  zipcode?: string;
  zipcodePreference?: string;
  age?: number;
}

export interface DatingMatchPreferencesEntity {
  uuid?: string;
  userUuid?: string;
  genderPreference: Gender;
  gender?: Gender;
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
  lastSeenAtUtc?: Date;

  // repo layer stuff
  deletedAtUtc?: Date;
}

export interface UserEntity {
  uuid?: string;
  mobile?: string;
  email?: string;
  verified?: boolean;
  lastSeenAtUtc?: Date;

  // hydrate
  userDatingPreference?: DatingMatchPreferencesEntity;
  videoEntities?: VideoEntity[];
}
