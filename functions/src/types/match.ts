import { VideoEntity } from "./video";

export interface MatchRecord {
  initatorUUID?: string;
  responderUUID?: string;
  createdAtUtc?: string;
  deletedAtUtc?: string;
  matchedUsersUUIDs: string[]; // just for now until better db, bc query depends on it
}

export interface UserMatchingItemEntity {
  userUUID: string;
  videoEntities: VideoEntity[];
}

export interface UserProfileSearchFilterRecord {
  gender: string;
  genderPreference: string;
  age: number;
  ageMinPreference: number;
  ageMaxPreference: number;
  userUUIDsToFilterOut: string[];
}
