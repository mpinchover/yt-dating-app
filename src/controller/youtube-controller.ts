const youtubeGateway = require("../gateway/youtube");
// const videMapper = require("../mappers/records/video");
import { videoGatewayToRecord } from "../utils/mapper-video";

exports.getYoutubeVideoByID = async (id) => {
  try {
    const videoDetails = await youtubeGateway.getYoutubeDetailsByVideoID(id);
    const videoRecord = videoGatewayToRecord(videoDetails);
    return videoRecord;
  } catch (e) {
    throw e;
  }
};
