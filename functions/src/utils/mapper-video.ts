import { VideoRecord } from "../types/video";

export const videoGatewayToRecord = (params: any): VideoRecord => {
  const videoRecord: VideoRecord = {
    videoId: params.videoId,
    channelId: params.channelId,
    videoTitle: params.videoTitle,
    description: params.description,
    categoryId: params.categoryId,
    topicCategories: params.topicCategories,
  };
  return videoRecord;
};

export const videoFirestoreToRecord = (params: any): VideoRecord => {
  const videoRecord: VideoRecord = {
    id: params.id,
    uuid: params.data().uuid,
    videoId: params.data().videoId,
    channelId: params.data().channelId,
    videoTitle: params.data().videoTitle,
    description: params.data().description,
    categoryId: params.data().categoryId,
    topicCategories: params.data().topicCategories,
  };
  return videoRecord;
};
