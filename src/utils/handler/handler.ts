import * as handler from "../../types/params/handler";
import * as entity from "../../types/params/entity";
// TODO – move mapper to it's own file and map everything, don't be lazy
export const UpdateUserRequestToEntity = (
  params: handler.UpdateUserParams
): entity.UpdateUserParams => {
  const res: entity.UpdateUserParams = {
    userUuid: params.userUuid,
    updates: updateUserParamsHandlerToEntity(params.updates),
  };
  return res;
};

const updateUserParamsHandlerToEntity = (
  params: handler.UpdateUserParam[]
): entity.UpdateUserParam[] => {
  const updates: entity.UpdateUserParam[] = [];
  params.forEach((update) => {
    const updateEntity = updateUserParamHandlerToEntity(update);
    updates.push(updateEntity);
  });
  return updates;
};

const updateUserParamHandlerToEntity = (
  update: handler.UpdateUserParam
): entity.UpdateUserParam => {
  const res: entity.UpdateUserParam = {
    updateType: update.updateType,
    stringValue: update.stringValue,
    numberValue: update.numberValue,
    passwordValue: update.passwordValue,
    uploadImageParams: update.uploadImageParams,
  };
  return res;
};
