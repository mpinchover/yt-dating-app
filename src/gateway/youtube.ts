const axios = require("axios");
import { injectable } from "tsyringe";

@injectable()
export class YoutubeGateway {
  constructor() {}

  getYoutubeDetailsByVideoId = async (id) => {
    try {
      const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics%2CtopicDetails&id=KRvv0QdruMQ&key=${process.env.YOUTUBE_API_KEY}`;
      const youtubeResponse = await axios.get(url);
      return youtubeResponse.data;
    } catch (e) {
      throw e;
    }
  };
}
