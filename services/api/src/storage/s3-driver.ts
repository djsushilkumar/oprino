import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageDriver,
  StorageObjectMeta,
  PresignedUploadOptions,
  PresignedDownloadOptions,
} from './types.js';

export interface S3StorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export class S3StorageDriver implements StorageDriver {
  readonly driverName = 's3' as const;
  private s3: S3Client;
  private bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;

    const s3Config: S3ClientConfig = {
      region: config.region || 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    };

    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
    }

    this.s3 = new S3Client(s3Config);
  }

  async getUploadUrl(fileKey: string, options: PresignedUploadOptions): Promise<string> {
    const expiresIn = options.expiresInSeconds ?? 600; // 10 minutes default
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: options.contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getDownloadUrl(fileKey: string, options?: PresignedDownloadOptions): Promise<string> {
    const expiresIn = options?.expiresInSeconds ?? 900; // 15 minutes default
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async headObject(fileKey: string): Promise<StorageObjectMeta | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      const res = await this.s3.send(command);
      return {
        exists: true,
        sizeBytes: res.ContentLength,
        contentType: res.ContentType,
        lastModified: res.LastModified,
        etag: res.ETag,
      };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return { exists: false };
      }
      throw err;
    }
  }

  async deleteObject(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    await this.s3.send(command);
  }

  async putObject(fileKey: string, data: Buffer | Uint8Array, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: data,
      ContentType: contentType,
    });
    await this.s3.send(command);
  }

  async getObject(fileKey: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });
      const res = await this.s3.send(command);
      if (!res.Body) return null;

      const byteArray = await res.Body.transformToByteArray();
      return {
        data: Buffer.from(byteArray),
        contentType: res.ContentType || 'application/octet-stream',
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }
}
