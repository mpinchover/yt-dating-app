import { VideoEntity } from "./video";

export interface MatchRecord {
  uuid?: string;
  initiator_uuid?: string;
  responder_uuid?: string;
  created_at_utc?: Date;
  deleted_at_utc?: Date;
}

export interface UserMatchingItemEntity {
  userUuid: string;
  videoEntities: VideoEntity[];
}

export interface UserSearchFilter {
  genderMan: boolean;
  genderWoman: boolean;
  genderPreferenceMan: boolean;
  genderPreferenceWoman: boolean;
  age: number;
  ageMinPreference: number;
  ageMaxPreference: number;
  userUuidsToFilterOut: string[];
}

export interface LikeRecord {
  created_at_utc?: Date;
  deleted_at_utc?: Date;
  updated_at_utc?: Date;
  initator_uuid?: string;
  receiver_uuid?: string;
}

export interface BlockRecord {
  initator_uuid?: string;
  receiver_uuid?: string;
  created_at_utc?: Date;
  deleted_at_utc?: Date;
  updated_at_utc?: Date;
}
