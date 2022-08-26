import "reflect-metadata";
const functions = require("firebase-functions");
const youtubeController = require("../controller/youtube-controller");
import Container from "typedi";
import { UserController } from "../controller/user-controller";
import { injectable } from "tsyringe";
import { container } from "tsyringe";

@injectable()
class Handler {
  userController;

  constructor() {
    this.userController = container.resolve(UserController);
  }
}
// https://github.com/microsoft/tsyringe

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

exports.testUserRepoFn = functions.https.onRequest(
  async (request, response) => {
    try {
      const h = container.resolve(Handler);
      const data = await h.userController.testUserRepoFn();
      response.send({ data });
    } catch (e) {
      functions.logger.info(e);
      response.status(501).send(e);
    }
  }
);
