export interface ImageRecord {
  deleted_at_utc?: Date;
  created_at_utc?: Date; // can default in DB
  updated_at_utc?: Date;
  
  media_link: string;
  upload_status: string;
}
