/*
user {
    id: String
}

*/

import { VideoEntity, VideoRecord } from "./video";

export interface DatingMatchPreferencesRecord {
  deleted_at_utc?: Date;
  created_at_utc?: Date; // can default in DB
  updated_at_utc?: Date;

  uuid?: string;
  user_uuid?: string;
  gender_preference_man: boolean;
  gender_preference_woman: boolean;
  gender_man: boolean;
  gender_woman: boolean;
  age_min_preference: number;
  age_max_preference: number;
  zipcode?: string;
  zipcode_preference?: string;
  age?: number;
}

export interface DatingMatchPreferencesEntity {
  uuid?: string;
  userUuid?: string;
  genderPreferenceMan: boolean;
  genderPreferenceWoman: boolean;
  genderMan: boolean;
  genderWoman: boolean;
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
  last_seen_at_utc?: Date;

  // repo layer stuff
  deleted_at_utc?: Date;
  created_at_utc?: Date; // can default in DB

  // hydrate
  dating_preference?: DatingMatchPreferencesRecord;
  videos?: VideoRecord[];
}

export interface UserEntity {
  uuid?: string;
  mobile?: string;
  email?: string;
  verified?: boolean;
  lastSeenAtUtc?: Date;

  // hydrate
  datingPreference?: DatingMatchPreferencesEntity;
  videos?: VideoEntity[];
}
