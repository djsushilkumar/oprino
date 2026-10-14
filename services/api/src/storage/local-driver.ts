import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type {
  StorageDriver,
  StorageObjectMeta,
  PresignedUploadOptions,
  PresignedDownloadOptions,
} from './types.js';

export interface LocalStorageConfig {
  storageDir: string;
  publicBaseUrl: string;
  secret: string;
}

export class LocalStorageDriver implements StorageDriver {
  readonly driverName = 'local' as const;
  private storageDir: string;
  private publicBaseUrl: string;
  private secret: string;

  constructor(config: LocalStorageConfig) {
    this.storageDir = path.resolve(config.storageDir);
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/+$/, '');
    this.secret = config.secret;

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getFilePath(fileKey: string): string {
    // Strictly prevent path traversal
    if (fileKey.includes('..') || fileKey.startsWith('/') || fileKey.startsWith('\\')) {
      throw new Error('Security barrier violation: Path traversal detected in storage key');
    }
    const resolved = path.resolve(this.storageDir, fileKey);
    if (!resolved.startsWith(this.storageDir)) {
      throw new Error('Security barrier violation: Path traversal detected in storage key');
    }
    return resolved;
  }

  private getMetaPath(filePath: string): string {
    return `${filePath}.meta.json`;
  }

  generateHmac(data: string): string {
    return crypto.createHmac('sha256', this.secret).update(data).digest('hex');
  }

  verifyHmac(expected: string, actual: string): boolean {
    if (!actual || typeof actual !== 'string') return false;
    try {
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(actual, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  async getUploadUrl(fileKey: string, options: PresignedUploadOptions): Promise<string> {
    const expiresIn = options.expiresInSeconds ?? 600;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const payload = `UPLOAD:${fileKey}:${options.contentType}:${expires}`;
    const signature = this.generateHmac(payload);

    return `${this.publicBaseUrl}/v1/media/storage/upload/${encodeURIComponent(fileKey)}?expires=${expires}&signature=${signature}&contentType=${encodeURIComponent(options.contentType)}`;
  }

  async getDownloadUrl(fileKey: string, options?: PresignedDownloadOptions): Promise<string> {
    const expiresIn = options?.expiresInSeconds ?? 900;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const payload = `DOWNLOAD:${fileKey}:${expires}`;
    const signature = this.generateHmac(payload);

    return `${this.publicBaseUrl}/v1/media/storage/download/${encodeURIComponent(fileKey)}?expires=${expires}&signature=${signature}`;
  }

  verifyUploadToken(
    fileKey: string,
    expiresStr: string,
    signature: string,
    contentType: string,
  ): boolean {
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
      return false;
    }
    const expected = this.generateHmac(`UPLOAD:${fileKey}:${contentType}:${expires}`);
    return this.verifyHmac(expected, signature);
  }

  verifyDownloadToken(fileKey: string, expiresStr: string, signature: string): boolean {
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
      return false;
    }
    const expected = this.generateHmac(`DOWNLOAD:${fileKey}:${expires}`);
    return this.verifyHmac(expected, signature);
  }

  async headObject(fileKey: string): Promise<StorageObjectMeta | null> {
    try {
      const filePath = this.getFilePath(fileKey);
      const metaPath = this.getMetaPath(filePath);

      if (!fs.existsSync(filePath)) {
        return { exists: false };
      }

      const stat = await fs.promises.stat(filePath);
      let contentType = 'application/octet-stream';

      if (fs.existsSync(metaPath)) {
        try {
          const metaContent = await fs.promises.readFile(metaPath, 'utf-8');
          const meta = JSON.parse(metaContent);
          if (meta.contentType) contentType = meta.contentType;
        } catch {
          // ignore corrupted sidecar
        }
      }

      return {
        exists: true,
        sizeBytes: stat.size,
        contentType,
        lastModified: stat.mtime,
      };
    } catch {
      return { exists: false };
    }
  }

  async deleteObject(fileKey: string): Promise<void> {
    const filePath = this.getFilePath(fileKey);
    const metaPath = this.getMetaPath(filePath);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath);
    }
  }

  async putObject(fileKey: string, data: Buffer | Uint8Array, contentType: string): Promise<void> {
    const filePath = this.getFilePath(fileKey);
    const metaPath = this.getMetaPath(filePath);
    const dir = path.dirname(filePath);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, Buffer.from(data));
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify({
        contentType,
        sizeBytes: data.length,
        lastModified: new Date().toISOString(),
      }),
      'utf-8',
    );
  }

  async getObject(fileKey: string): Promise<{ data: Buffer; contentType: string } | null> {
    const filePath = this.getFilePath(fileKey);
    const metaPath = this.getMetaPath(filePath);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = await fs.promises.readFile(filePath);
    let contentType = 'application/octet-stream';

    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = await fs.promises.readFile(metaPath, 'utf-8');
        const meta = JSON.parse(metaContent);
        if (meta.contentType) contentType = meta.contentType;
      } catch {
        // fallback to default
      }
    }

    return { data, contentType };
  }
}
