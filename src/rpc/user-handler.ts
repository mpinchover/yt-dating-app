import "reflect-metadata";
// const functions = require("firebase-functions");
const youtubeController = require("../controller/youtube-controller");
import { UserController } from "../controller/user-controller";
import { MatchController } from "../controller/match-controller";
import { injectable } from "tsyringe";
import { container } from "tsyringe";

@injectable()
export class UserHandler {
  userController: UserController;
  matchController: MatchController;

  constructor() {
    this.userController = container.resolve(UserController);
    this.matchController = container.resolve(MatchController);
  }

  blockUser = async (params: any) => {
    await this.userController.blockUserByUuid(params);
  };

  getUserByUUID = async (uuid: string) => {
    return await this.userController.getUserByUUID(uuid);
  };

  createUser = async (params: any) => {
    return await this.userController.createUser(params);
  };

  likeUser = async (params: any) => {
    return await this.userController.likeUser(params);
  };

  getLike = async (params: any) => {
    const like = await this.matchController.getLike(
      params.initiatorUuid,
      params.receiverUuid
    );
    return like;
  };

  createVideo = async (params: any) => {
    await this.userController.createVideo(params);
  };
}
// https://github.com/microsoft/tsyringe

// exports.getDetailsByVideoID = functions.https.onRequest(
//   async (request, response) => {
//     try {
//       const data = await youtubeController.getYoutubeVideoByID();
//       response.send({ data: data });
//     } catch (e) {
//       functions.logger.info(e);
//       response.status(501).send(e);
//     }
//   }
// );

// exports.testUserRepoFn = functions.https.onRequest(
//   async (request, response) => {
//     try {
//       const h = container.resolve(UserHandler);
//       const data = await h.userController.testUserRepoFn();
//       response.send({ data });
//     } catch (e) {
//       functions.logger.info(e);
//       response.status(501).send(e);
//     }
//   }
// );
