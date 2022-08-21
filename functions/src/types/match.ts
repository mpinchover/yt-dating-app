import { VideoEntity } from "./video";

export interface MatchRecord {
  initatorUUID?: string;
  responderUUID?: string;
  createdAtUtc?: string;
  deletedAtUtc?: Date;
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

export interface LikeRecord {
  createdAtUtc: Date;
  updatedAtUtc: Date;
  deletedAtUTtc?: Date;
  initiatorUuid?: string;
  receiverUuid?: string;
}

export interface BlockRecord {
  initatorUuid?: string;
  responderUuid?: string;
  createdAtUtc?: string;
  deletedAtUtc?: Date;
  blockedUserUuids: string[]; // just for now until better db, bc query depends on it
}
