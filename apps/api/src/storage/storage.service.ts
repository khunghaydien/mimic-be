import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import {
  getR2AccessKey,
  getR2BucketName,
  getR2Endpoint,
  getR2PublicBaseUrl,
  getR2Region,
  getR2SecretKey,
} from "./r2.config";

@Injectable()
export class StorageService {
  private readonly client = new S3Client({
    region: getR2Region(),
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: getR2AccessKey(),
      secretAccessKey: getR2SecretKey(),
    },
  });

  async upload(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return `${getR2PublicBaseUrl()}/${input.key}`;
  }
}
