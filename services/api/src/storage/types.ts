export interface StorageObjectMeta {
  exists: boolean;
  sizeBytes?: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}

export interface PresignedUploadOptions {
  contentType: string;
  maxSizeBytes?: number;
  expiresInSeconds?: number;
}

export interface PresignedDownloadOptions {
  expiresInSeconds?: number;
}

export interface StorageDriver {
  readonly driverName: 's3' | 'local';

  /**
   * Generates a short-lived presigned direct upload URL (PUT).
   */
  getUploadUrl(fileKey: string, options: PresignedUploadOptions): Promise<string>;

  /**
   * Generates a short-lived presigned download URL (GET) without embedding user session tokens.
   */
  getDownloadUrl(fileKey: string, options?: PresignedDownloadOptions): Promise<string>;

  /**
   * Verifies object existence, content length, and MIME type via HEAD request.
   */
  headObject(fileKey: string): Promise<StorageObjectMeta | null>;

  /**
   * Deletes an object from storage.
   */
  deleteObject(fileKey: string): Promise<void>;

  /**
   * Persists raw bytes directly to storage.
   */
  putObject(fileKey: string, data: Buffer | Uint8Array, contentType: string): Promise<void>;

  /**
   * Reads raw bytes directly from storage.
   */
  getObject(fileKey: string): Promise<{ data: Buffer; contentType: string } | null>;
}
