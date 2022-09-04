/*
video

*/

export interface VideoRecord {
  deleted_at_utc?: Date;
  created_at_utc?: Date; // can default in DB
  updated_at_utc?: Date;

  uuid?: string;
  video_id?: string; // the youtube id of the video
  channel_id?: string;
  video_title?: string;
  video_description?: string;
  category_id?: number;
  topic_categories?: string; // convervt to array
}

export interface VideoEntity {
  uuid?: string;
  videoId?: string;
  channelId?: string;
  videoTitle?: string;
  description?: string;
  categoryId?: number;
  topicCategories?: string[];
}

export interface TrackedVideoRecord {
  deleted_at_utc?: Date;
  created_at_utc?: Date; // can default in DB

  uuid?: string;
  video_uuid?: string;
  user_uuid?: string;
  order?: number; // would be good to display content in an order as well
}

export interface TrackedVideoEntity {
  uuid?: string;
  videoUuid?: string;
  userUuid?: string;
}
