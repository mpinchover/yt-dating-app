exports.fromGatewayToRecordYoutubeVideo = (data) => {
    try {
        if (data.length < 1) {
            throw new Error("items cannot be length 0");
        }
        const resp = {};
        const youtubeVideoResponse = data.items[0];
        resp.videoId = youtubeVideoResponse.id;
        if (youtubeVideoResponse.snippet) {
            resp.channelId = youtubeVideoResponse.snippet.channelId;
            resp.videoTitle = youtubeVideoResponse.snippet.title;
            resp.description = youtubeVideoResponse.snippet.description;
            resp.categoryId = youtubeVideoResponse.snippet.categoryId;
        }
        const topicCategories = [];
        if (youtubeVideoResponse.topicDetails &&
            youtubeVideoResponse.topicDetails.topicCategories) {
            youtubeVideoResponse.topicDetails.topicCategories.forEach((c) => {
                const n = c.lastIndexOf("/");
                const category = c.substring(n + 1);
                if (category.length > 0) {
                    topicCategories.push(category);
                }
            });
        }
        resp.topicCategories = topicCategories;
        return resp;
    }
    catch (e) {
        throw e;
    }
};
//# sourceMappingURL=video.js.map