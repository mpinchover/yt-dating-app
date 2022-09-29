import { VideoRecord, VideoEntity } from "../types/video";

export const videoGatewayToRecord = (params: any): VideoRecord => {
  if (!params) throw new Error("youtube video cannot be null");
  
  const videoRecord: VideoRecord = {
    video_id: params.videoId,
    channel_id: params.channelId,
    video_title: params.videoTitle,
    video_description: params.description,
    category_id: params.categoryId,
    topic_categories: JSON.stringify(params.topicCategories),
  };
  return videoRecord;
};

export const videoRecordsToEntities = (
  params: VideoRecord[]
): VideoEntity[] => {
  const videoEntities: VideoEntity[] = [];
  params.forEach((video) => {
    videoEntities.push(videoRecordToEntity(video));
  });

  return videoEntities;
};

export const videoRecordToEntity = (params: VideoRecord): VideoEntity => {
  if (!params) throw new Error("video record cannot be null");

  const videoEntity = {
    uuid: params.uuid,
    videoId: params.video_id,
    channelId: params.channel_id,
    videoTitle: params.video_title,
    videoDescription: params.video_description,
    categoryId: params.category_id,
    topicCategories: JSON.parse(params.topic_categories),
  };
  return videoEntity;
};

// /*
// convert a youtube video responde to record youtube video
// */
// exports.fromGatewayToRecordYoutubeVideo = (data): VideoRecord => {
//   try {
//     if (data.length < 1) {
//       throw new Error("items cannot be length 0");
//     }

//     const resp: VideoRecord = {};
//     const youtubeVideoResponse = data.items[0];

//     resp.videoId = youtubeVideoResponse.id;
//     if (youtubeVideoResponse.snippet) {
//       resp.channelId = youtubeVideoResponse.snippet.channelId;
//       resp.videoTitle = youtubeVideoResponse.snippet.title;
//       resp.description = youtubeVideoResponse.snippet.description;
//       resp.categoryId = youtubeVideoResponse.snippet.categoryId;
//     }
//     resp.topicCategories = [];

//     if (
//       youtubeVideoResponse.topicDetails &&
//       youtubeVideoResponse.topicDetails.topicCategories
//     ) {
//       youtubeVideoResponse.topicDetails.topicCategories.forEach((c) => {
//         const n = c.lastIndexOf("/");
//         const category = c.substring(n + 1);
//         if (category.length > 0) {
//           resp.topicCategories.push(category);
//         }
//       });
//     }

//     return resp;
//   } catch (e) {
//     throw e;
//   }
// };
