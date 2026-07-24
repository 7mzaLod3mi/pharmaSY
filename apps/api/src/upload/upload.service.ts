import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private bucketName: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    this.bucketName = this.config.get<string>('R2_BUCKET_NAME', 'pharmasyn-files');
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL', '');

    this.s3 = new AWS.S3({
      endpoint: `https://${this.config.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      accessKeyId: this.config.get('R2_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('R2_SECRET_ACCESS_KEY'),
      signatureVersion: 'v4',
      region: 'auto',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<{ key: string; url: string }> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;

    await this.s3
      .putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    return {
      key,
      url: `${this.publicUrl}/${key}`,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .promise();
  }

  async uploadPrivateBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    fileName: string,
  ): Promise<{ key: string }> {
    await this.s3
      .putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: `attachment; filename="${this.safeFileName(fileName)}"`,
        CacheControl: 'private, no-store',
      })
      .promise();
    return { key };
  }

  async getPrivateDownloadUrl(
    key: string,
    fileName: string,
    expiresSeconds = 900,
  ): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: Math.min(Math.max(expiresSeconds, 60), 3600),
      ResponseContentDisposition: `attachment; filename="${this.safeFileName(fileName)}"`,
    });
  }

  private safeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
  }
}
