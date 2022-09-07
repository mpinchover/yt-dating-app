import { VideoRecord } from "../types/video";

export const videoGatewayToRecord = (params: any): VideoRecord => {
  const videoRecord: VideoRecord = {
    video_id: params.videoId,
    channel_id: params.channelId,
    video_title: params.videoTitle,
    video_description: params.description,
    category_id: params.categoryId,
    topic_categories: params.topicCategories,
  };
  return videoRecord;
};
