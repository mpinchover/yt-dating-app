import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { injectable } from "tsyringe";
export interface AWSGatewayParams {
  s3: any;
}

@injectable()
export class AWSGateway {
  s3: any;
  constructor() {}

  buildS3ImageUploadObject = (params: uploadPictureToAWSParams) => {
    const { userUuid, bufferBase64 } = params;
    const uuid = uuidv4();
    const key = `public/users/${userUuid}/profile_pictures/${uuid}`;
    const data = {
      key,
      Body: bufferBase64,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    };
    return data;
  };

  uploadPictureToAWS = async (params: uploadPictureToAWSParams) => {
    const uploadObject = this.buildS3ImageUploadObject(params);
    await this.s3.putObject(uploadObject).Promise();
  };
}

export interface uploadPictureToAWSParams {
  userUuid: string;
  bufferBase64: string;
}

/*
verify auth
https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js
*/
