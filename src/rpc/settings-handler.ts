import "reflect-metadata";

import { SettingsController } from "../controller/settings-controller";
import { injectable } from "tsyringe";
import { container } from "tsyringe";
import { UpdateUserRequestToEntity } from "../utils/handler/handler";

@injectable()
export class SettingsHandler {
  settingsController: SettingsController;

  constructor() {
    this.settingsController = container.resolve(SettingsController);
  }

  updateUser = async (params: any) => {
    const paramsEntity = UpdateUserRequestToEntity(params);
    await this.settingsController.updateUserSettings(paramsEntity);
  };
}
