// apps/backend/src/common/services/file.service.ts
import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class FileService {
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    const {
      TEIBI_ENDPOINT,
      TEIBI_ACCESS_KEY,
      TEIBI_SECRET_KEY,
      TEIBI_BUCKET,
    } = process.env;

    if (!TEIBI_ENDPOINT || !TEIBI_ACCESS_KEY || !TEIBI_SECRET_KEY || !TEIBI_BUCKET) {
      throw new InternalServerErrorException('Tebi S3 configuration is missing in .env');
    }

    this.bucket = TEIBI_BUCKET;
    this.endpoint = TEIBI_ENDPOINT;

    this.s3 = new S3Client({
      endpoint: TEIBI_ENDPOINT,
      region: 'us-east-1', // Tebi uses single global endpoint; region is ignored but required
      credentials: {
        accessKeyId: TEIBI_ACCESS_KEY,
        secretAccessKey: TEIBI_SECRET_KEY,
      },
      forcePathStyle: true, // Required for non-AWS S3 services
    });
  }

  /**
   * Uploads a file as PUBLIC (e.g., avatars, listing images)
   * Returns the public URL (CDN-ready)
   */
  async uploadPublic(
    buffer: Buffer,
    originalname: string,
    prefix: string, // e.g., 'avatars/cmht2d65m0000i0ntywphhf6j'
  ): Promise<string> {
    const { ext, name } = path.parse(originalname);
    const safeExt = this.validateAndSanitizeExtension(ext);
    const key = `${prefix}/${randomUUID()}${safeExt}`;

    await this.uploadToS3(buffer, key, { isPublic: true });
    return this.getPublicUrl(key);
  }

  /**
   * Uploads a file as PRIVATE (e.g., user documents)
   * Returns a pre-signed URL (expires in 1 hour)
   */
  async uploadPrivate(
    buffer: Buffer,
    originalname: string,
    prefix: string,
  ): Promise<string> {
    const { ext, name } = path.parse(originalname);
    const safeExt = this.validateAndSanitizeExtension(ext);
    const key = `${prefix}/${randomUUID()}${safeExt}`;

    await this.uploadToS3(buffer, key, { isPublic: false });
    return this.getSignedUrl(key);
  }

  /**
   * Generates a pre-signed URL for an existing private file
   */
  async getPrivateUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Deletes a file (public or private)
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3.send(command);
  }

  // ─── PRIVATE HELPERS ───────────────────────────────────────

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    options: { isPublic: boolean },
  ): Promise<void> {
    const contentType = this.getMimeType(key);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: options.isPublic ? 'public-read' : undefined, // Only set for public
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('File upload failed');
    }
  }

  private getPublicUrl(key: string): string {
    return `https://s3.tebi.io/${this.bucket}/${key}`;
  }

  private getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.getPrivateUrl(key, expiresInSeconds);
  }

  private validateAndSanitizeExtension(ext: string): string {
    const lowerExt = ext.toLowerCase();
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      '.pdf', '.doc', '.docx', '.mp4', '.mov', '.mp3', '.wav'
    ];

    if (!allowedExtensions.includes(lowerExt)) {
      throw new BadRequestException('File type not allowed');
    }

    return lowerExt;
  }

  private getMimeType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}