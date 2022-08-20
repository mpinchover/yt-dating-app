const axios = require("axios");

// exports.getDetailsByVideoID = functions.https.onRequest(
//   async (request, response) => {
//     try {
//       const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics%2CtopicDetails&id=KRvv0QdruMQ&key=${process.env.YOUTUBE_API_KEY}`;
//       const youtubeResponse = await axios.get(url);
//       response.send({ data: youtubeResponse.data });
//       return;
//     } catch (e) {
//       functions.logger.info(e);
//       response.status(501).send(e);
//     }
//     return;
//   }
// );

exports.getYoutubeDetailsByVideoID = async (id) => {
  try {
    const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics%2CtopicDetails&id=KRvv0QdruMQ&key=${process.env.YOUTUBE_API_KEY}`;
    const youtubeResponse = await axios.get(url);
    return youtubeResponse.data;
  } catch (e) {
    throw e;
  }
};
