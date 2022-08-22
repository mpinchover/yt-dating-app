import { VideoEntity } from "./video";

export interface MatchRecord {
  initiatorUuid?: string;
  responderUuid?: string;
  createdAtUtc?: Date;
  deletedAtUtc?: Date;
  updatedAtUtc?: Date;
  matchedUsersUuids: string[]; // just for now until better db, bc query depends on it
}

export interface UserMatchingItemEntity {
  userUuid: string;
  videoEntities: VideoEntity[];
}

export interface UserProfileSearchFilterRecord {
  gender: string;
  genderPreference: string;
  age: number;
  ageMinPreference: number;
  ageMaxPreference: number;
  userUuidsToFilterOut: string[];
}

export interface LikeRecord {
  createdAtUtc?: Date;
  updatedAtUtc?: Date;
  deletedAtUtc?: Date;
  initiatorUuid?: string;
  receiverUuid?: string;
}

export interface BlockRecord {
  initatorUuid?: string;
  receiverUuid?: string;
  createdAtUtc?: Date;
  updatedAtUtc?: Date;
  deletedAtUtc?: Date;
  blockedUserUuids: string[]; // just for now until better db, bc query depends on it
}
