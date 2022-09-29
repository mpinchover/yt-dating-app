import { VideoEntity } from "./video";

export interface MatchRecord {
  uuid?: string;
  initiator_uuid?: string;
  receiver_uuid?: string;
  created_at_utc?: Date;
  deleted_at_utc?: Date;
}

export interface UserMatchingItemEntity {
  userUuid: string;
  videoEntities: VideoEntity[];
}

export interface LikeRecord {
  created_at_utc?: Date;
  deleted_at_utc?: Date;
  updated_at_utc?: Date;
  initiator_uuid?: string;
  receiver_uuid?: string;
  uuid?: string;
}

export interface BlockRecord {
  uuid: string;
  initiator_uuid?: string;
  receiver_uuid?: string;
  created_at_utc?: Date;
  deleted_at_utc?: Date;
  updated_at_utc?: Date;
}
