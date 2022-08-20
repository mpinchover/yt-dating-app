/*
video

*/

export interface VideoRecord {
  uuid?: string;
  userUUID?: string;
  videoId?: string;
  channelId?: string;
  videoTitle?: string;
  description?: string;
  categoryId?: number;
  topicCategories?: string[];
}

export interface VideoEntity {
  uuid?: string;
  userUUID?: string;
  videoId?: string;
  channelId?: string;
  videoTitle?: string;
  description?: string;
  categoryId?: number;
  topicCategories?: string[];
}
