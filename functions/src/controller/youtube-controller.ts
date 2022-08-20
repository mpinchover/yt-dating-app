const youtubeGateway = require("../gateway/youtube-gateway");
const videMapper = require("../mappers/records/video");
exports.getYoutubeVideoByID = async (id) => {
  try {
    const videoDetails = await youtubeGateway.getYoutubeDetailsByVideoID(id);
    const videoRecord =
      videMapper.fromGatewayToRecordYoutubeVideo(videoDetails);
    return videoRecord;
  } catch (e) {
    throw e;
  }
};
