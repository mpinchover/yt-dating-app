"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoFirestoreToRecord = exports.videoGatewayToRecord = void 0;
const videoGatewayToRecord = (params) => {
    const videoRecord = {
        videoId: params.videoId,
        channelId: params.channelId,
        videoTitle: params.videoTitle,
        description: params.description,
        categoryId: params.categoryId,
        topicCategories: params.topicCategories,
    };
    return videoRecord;
};
exports.videoGatewayToRecord = videoGatewayToRecord;
const videoFirestoreToRecord = (params) => {
    const videoRecord = {
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
exports.videoFirestoreToRecord = videoFirestoreToRecord;
//# sourceMappingURL=mapper-video.js.map