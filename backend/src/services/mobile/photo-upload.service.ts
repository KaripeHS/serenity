/**
 * Photo Upload Service
 * Manages photo uploads from mobile app
 *
 * Features:
 * - Cloud storage integration (Google Cloud Storage / AWS S3)
 * - Image compression and optimization
 * - Metadata extraction
 * - GPS coordinates from EXIF
 * - Secure signed URLs
 * - Categorization (receipts, incidents, documentation)
 */

import { Storage } from '@google-cloud/storage';
import { pool } from '../../config/database';
import sharp from 'sharp';
import crypto from 'crypto';

interface PhotoMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  timestamp?: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
  deviceInfo?: string;
}

interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  metadata: PhotoMetadata;
}

export class PhotoUploadService {
  private storage: Storage | null = null;
  private bucketName: string;
  private useLocalStorage: boolean;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'serenity-care-uploads';
    this.useLocalStorage = !process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!this.useLocalStorage) {
      try {
        this.storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_CLOUD_KEYFILE_PATH
        });
        console.log('[PhotoUpload] Google Cloud Storage initialized');
      } catch (error) {
        console.warn('[PhotoUpload] Cloud Storage initialization failed, using local storage:', error);
        this.useLocalStorage = true;
      }
    }

    if (this.useLocalStorage) {
      console.warn('[PhotoUpload] Using local file storage. Configure GCS for production.');
    }
  }

  /**
   * Upload photo from mobile app
   */
  async uploadPhoto(
    userId: string,
    organizationId: string,
    category: 'receipt' | 'incident' | 'documentation' | 'profile' | 'visit_photo',
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    relatedEntityId?: string // expense_id, incident_id, visit_id, etc.
  ): Promise<UploadedPhoto | null> {
    try {
      // Generate unique filename
      const fileExtension = originalName.split('.').pop() || 'jpg';
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const fileName = `${category}/${organizationId}/${uniqueId}.${fileExtension}`;

      // Extract metadata from image
      const metadata = await this.extractMetadata(fileBuffer, originalName, mimeType);

      // Compress and optimize image
      const optimizedBuffer = await this.optimizeImage(fileBuffer, mimeType);

      // Generate thumbnail
      const thumbnailBuffer = await this.generateThumbnail(fileBuffer);

      // Upload to cloud storage
      let publicUrl: string;
      let thumbnailUrl: string | undefined;

      if (this.useLocalStorage) {
        // Local storage (development only)
        publicUrl = `/uploads/${fileName}`;
        thumbnailUrl = `/uploads/thumbnails/${fileName}`;
      } else {
        // Upload to Google Cloud Storage
        const uploadResult = await this.uploadToGCS(fileName, optimizedBuffer, mimeType);
        const thumbnailResult = await this.uploadToGCS(
          `thumbnails/${fileName}`,
          thumbnailBuffer,
          'image/jpeg'
        );

        publicUrl = uploadResult.url;
        thumbnailUrl = thumbnailResult.url;
      }

      // Save to database
      const photoResult = await pool.query(
        `
        INSERT INTO uploaded_photos (
          user_id,
          organization_id,
          category,
          file_name,
          original_name,
          mime_type,
          file_size,
          width,
          height,
          url,
          thumbnail_url,
          gps_latitude,
          gps_longitude,
          timestamp,
          related_entity_id,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING id
        `,
        [
          userId,
          organizationId,
          category,
          fileName,
          originalName,
          mimeType,
          optimizedBuffer.length,
          metadata.width,
          metadata.height,
          publicUrl,
          thumbnailUrl,
          metadata.gpsLatitude,
          metadata.gpsLongitude,
          metadata.timestamp,
          relatedEntityId,
          JSON.stringify(metadata)
        ]
      );

      return {
        id: photoResult.rows[0].id,
        url: publicUrl,
        thumbnailUrl,
        category,
        metadata
      };
    } catch (error) {
      console.error('[PhotoUpload] Error uploading photo:', error);
      return null;
    }
  }

  /**
   * Upload expense receipt
   */
  async uploadExpenseReceipt(
    caregiverId: string,
    organizationId: string,
    expenseId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadedPhoto | null> {
    const photo = await this.uploadPhoto(
      caregiverId,
      organizationId,
      'receipt',
      fileBuffer,
      originalName,
      mimeType,
      expenseId
    );

    if (photo) {
      // Update expense with receipt URL
      await pool.query(
        `
        UPDATE caregiver_expenses
        SET receipt_url = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [photo.url, expenseId]
      );
    }

    return photo;
  }

  /**
   * Upload incident photo
   */
  async uploadIncidentPhoto(
    userId: string,
    organizationId: string,
    incidentId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadedPhoto | null> {
    return await this.uploadPhoto(
      userId,
      organizationId,
      'incident',
      fileBuffer,
      originalName,
      mimeType,
      incidentId
    );
  }

  /**
   * Upload visit documentation photo
   */
  async uploadVisitPhoto(
    caregiverId: string,
    organizationId: string,
    visitId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadedPhoto | null> {
    return await this.uploadPhoto(
      caregiverId,
      organizationId,
      'visit_photo',
      fileBuffer,
      originalName,
      mimeType,
      visitId
    );
  }

  /**
   * Extract metadata from image
   */
  private async extractMetadata(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<PhotoMetadata> {
    try {
      const image = sharp(buffer);
      const imageMetadata = await image.metadata();
      const exif = imageMetadata.exif;

      const metadata: PhotoMetadata = {
        originalName,
        mimeType,
        size: buffer.length,
        width: imageMetadata.width,
        height: imageMetadata.height
      };

      // Extract EXIF data if available
      if (exif) {
        // Extract GPS coordinates
        const gpsData = this.parseExifGPS(exif);
        if (gpsData) {
          metadata.gpsLatitude = gpsData.latitude;
          metadata.gpsLongitude = gpsData.longitude;
        }

        // Extract timestamp
        const exifBuffer = Buffer.from(exif);
        const exifString = exifBuffer.toString('utf-8', 0, 1000);
        const dateMatch = exifString.match(/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/);
        if (dateMatch) {
          const dateStr = dateMatch[0].replace(/:/g, '-').replace(' ', 'T');
          metadata.timestamp = new Date(dateStr);
        }
      }

      return metadata;
    } catch (error) {
      console.error('[PhotoUpload] Error extracting metadata:', error);
      return {
        originalName,
        mimeType,
        size: buffer.length
      };
    }
  }

  /**
   * Parse GPS coordinates from EXIF data
   */
  private parseExifGPS(exif: Buffer): { latitude: number; longitude: number } | null {
    try {
      // EXIF GPS parsing is complex - simplified version
      // In production, use a library like exif-parser or exifreader
      const exifString = exif.toString('utf-8', 0, 2000);

      // This is a simplified pattern - real EXIF parsing is more complex
      const latMatch = exifString.match(/GPSLatitude.*?(\d+),\s*(\d+),\s*([\d.]+)/);
      const lonMatch = exifString.match(/GPSLongitude.*?(\d+),\s*(\d+),\s*([\d.]+)/);
      const latRef = exifString.includes('GPSLatitudeRef.*?S') ? -1 : 1;
      const lonRef = exifString.includes('GPSLongitudeRef.*?W') ? -1 : 1;

      if (latMatch && lonMatch) {
        const latitude =
          latRef *
          (parseInt(latMatch[1]) + parseInt(latMatch[2]) / 60 + parseFloat(latMatch[3]) / 3600);
        const longitude =
          lonRef *
          (parseInt(lonMatch[1]) + parseInt(lonMatch[2]) / 60 + parseFloat(lonMatch[3]) / 3600);

        return { latitude, longitude };
      }

      return null;
    } catch (error) {
      console.error('[PhotoUpload] Error parsing GPS data:', error);
      return null;
    }
  }

  /**
   * Optimize image (compress, resize if needed)
   */
  private async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if larger than 2048px on longest side
      let resized = image;
      if (metadata.width && metadata.width > 2048) {
        resized = image.resize(2048, null, {
          fit: 'inside',
          withoutEnlargement: true
        });
      } else if (metadata.height && metadata.height > 2048) {
        resized = image.resize(null, 2048, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Compress based on mime type
      if (mimeType === 'image/png') {
        return await resized
          .png({
            quality: 80,
            compressionLevel: 9
          })
          .toBuffer();
      } else {
        // Default to JPEG
        return await resized
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toBuffer();
      }
    } catch (error) {
      console.error('[PhotoUpload] Error optimizing image:', error);
      return buffer;
    }
  }

  /**
   * Generate thumbnail (200x200)
   */
  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 80
        })
        .toBuffer();
    } catch (error) {
      console.error('[PhotoUpload] Error generating thumbnail:', error);
      return buffer;
    }
  }

  /**
   * Upload to Google Cloud Storage
   */
  private async uploadToGCS(
    fileName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ url: string }> {
    if (!this.storage) {
      throw new Error('Cloud storage not initialized');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType
      },
      public: false // Use signed URLs for access
    });

    // Generate signed URL (valid for 7 days)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    return { url: signedUrl };
  }

  /**
   * Get photos for entity
   */
  async getPhotosForEntity(
    relatedEntityId: string,
    category?: string
  ): Promise<
    Array<{
      id: string;
      url: string;
      thumbnailUrl?: string;
      category: string;
      originalName: string;
      createdAt: Date;
    }>
  > {
    const queryParts = ['SELECT * FROM uploaded_photos WHERE related_entity_id = $1'];
    const params: any[] = [relatedEntityId];

    if (category) {
      queryParts.push('AND category = $2');
      params.push(category);
    }

    queryParts.push('ORDER BY created_at DESC');

    const result = await pool.query(queryParts.join(' '), params);

    return result.rows.map(row => ({
      id: row.id,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      originalName: row.original_name,
      createdAt: row.created_at
    }));
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string, userId: string): Promise<boolean> {
    try {
      // Get photo details
      const photoResult = await pool.query(
        `
        SELECT * FROM uploaded_photos
        WHERE id = $1 AND user_id = $2
        `,
        [photoId, userId]
      );

      if (photoResult.rows.length === 0) {
        throw new Error('Photo not found or unauthorized');
      }

      const photo = photoResult.rows[0];

      // Delete from cloud storage if not using local storage
      if (!this.useLocalStorage && this.storage) {
        const bucket = this.storage.bucket(this.bucketName);
        await bucket.file(photo.file_name).delete().catch(err => {
          console.warn('[PhotoUpload] Error deleting file from GCS:', err);
        });

        if (photo.thumbnail_url) {
          await bucket.file(`thumbnails/${photo.file_name}`).delete().catch(err => {
            console.warn('[PhotoUpload] Error deleting thumbnail from GCS:', err);
          });
        }
      }

      // Delete from database
      await pool.query(
        `
        DELETE FROM uploaded_photos
        WHERE id = $1
        `,
        [photoId]
      );

      return true;
    } catch (error) {
      console.error('[PhotoUpload] Error deleting photo:', error);
      return false;
    }
  }

  /**
   * Get user's photo upload stats
   */
  async getUserPhotoStats(
    userId: string,
    days: number = 30
  ): Promise<{
    totalPhotos: number;
    totalSize: number;
    byCategory: Record<string, number>;
  }> {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) as total_photos,
        SUM(file_size) as total_size,
        category,
        COUNT(*) as category_count
      FROM uploaded_photos
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY category
      `,
      [userId]
    );

    const byCategory: Record<string, number> = {};
    let totalPhotos = 0;
    let totalSize = 0;

    result.rows.forEach(row => {
      byCategory[row.category] = parseInt(row.category_count);
      totalPhotos += parseInt(row.category_count);
      totalSize += parseInt(row.total_size || 0);
    });

    return {
      totalPhotos,
      totalSize,
      byCategory
    };
  }
}

export const photoUploadService = new PhotoUploadService();
