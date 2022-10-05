export interface UpdateUserParams {
  userUuid: string;
  updates: UpdateUserParam[];
}

export interface UpdateUserParam {
  updateType: string;
  stringValue?: string;
  numberValue?: number;
  passwordValue?: UpdateUserPasswordValue;
  uploadImageParams?: UploadImageParams;
}

export interface UpdateUserPasswordValue {
  password: string;
  confirmPassword: string;
}

export interface UploadImageParams {
  userUuid?: string;
  positionIndex?: number;
  bufferBase64?: string;
}

