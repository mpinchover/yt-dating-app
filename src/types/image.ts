export interface ImageRecord {
  deleted_at_utc?: Date;
  created_at_utc?: Date; // can default in DB
  updated_at_utc?: Date;

  uuid: string;
  user_uuid: string;
  media_storage_link: string;
  media_storage_key: string;
  position_index: number;
}

export interface ImageEntity {
  uuid: string;
  userUuid: string;
  mediaStorageLink: string;
  positionIndex: number;
}
