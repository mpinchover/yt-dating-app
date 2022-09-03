/*
video

*/

export interface VideoRecord {
  uuid?: string;
  videoId?: string; // the youtube id of the video
  channelId?: string;
  videoTitle?: string;
  description?: string;
  categoryId?: number;
  topicCategories?: string[];

  id?: string;
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
  uuid?: string;
  videoUuid?: string;
  userUuid?: string;
  id?: string;
  order?: number; // would be good to display content in an order as well
}

export interface TrackedVideoEntity {
  uuid?: string;
  videoUuid?: string;
  userUuid?: string;
}
