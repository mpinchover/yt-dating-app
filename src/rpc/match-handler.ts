import "reflect-metadata";
// const functions = require("firebase-functions");
const youtubeController = require("../controller/youtube-controller");
// import { UserController } from "../controller/user-controller";
import { MatchController } from "../controller/match-controller";
import { injectable } from "tsyringe";
import { container } from "tsyringe";

@injectable()
export class MatchHandler {
  //   userController: UserController;
  matchController: MatchController;

  constructor() {
    // this.userController = container.resolve(UserController);
    this.matchController = container.resolve(MatchController);
  }
  getMatchByUuids = async (params: any) => {
    return await this.matchController.getMatchByUuids({
      uuid1: params.uuid1,
      uuid2: params.uuid2,
    });
  };
}
