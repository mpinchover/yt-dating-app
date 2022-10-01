import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { injectable, singleton } from "tsyringe";
export interface AWSGatewayParams {
  s3: any;
}

@singleton()
export class AWSGateway {
  s3: any;
  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.BUCKET_REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
    });
  }

  buildS3ImageUploadObject = (params: uploadImageToAWSParams) => {
    const { bufferBase64, key } = params;
    const uuid = params.newImageUuid;
    const data = {
      key,
      Body: bufferBase64,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
      Bucket: process.env.BUCKET_NAME,
    };
    return data;
  };

  // need to formate the key to return correct link
  uploadImageToAWS = async (
    params: uploadImageToAWSParams
  ): Promise<string> => {
    const uploadObject = this.buildS3ImageUploadObject(params);
    await this.s3.putObject(uploadObject).Promise();
    const { key } = uploadObject;
    return key;
  };
}

export interface uploadImageToAWSParams {
  userUuid: string;
  bufferBase64: string;
  newImageUuid: string;
  key: string;
}

/*
verify auth
https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js
*/
