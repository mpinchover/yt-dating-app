const functions = require("firebase-functions");
const youtubeController = require("../controller/youtube-controller");

exports.getDetailsByVideoID = functions.https.onRequest(
  async (request, response) => {
    try {
      const data = await youtubeController.getYoutubeVideoByID();
      response.send({ data: data });
    } catch (e) {
      functions.logger.info(e);
      response.status(501).send(e);
    }
  }
);
