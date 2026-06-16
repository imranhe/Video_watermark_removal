const OSS = require('ali-oss');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Aliyun OSS Client
 *
 * Handles file uploads, downloads, and pre-signed URL generation
 * for video storage.
 */
class AliyunOSSClient {
  constructor() {
    this.client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      endpoint: process.env.OSS_ENDPOINT || null,
      secure: true, // Use HTTPS
    });

    this.config = {
      videoPath: process.env.OSS_VIDEO_PATH || 'videos/original',
      resultPath: process.env.OSS_RESULT_PATH || 'videos/processed',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    };

    if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
      logger.warn('Aliyun OSS credentials not configured. File storage will fail.');
    }
  }

  /**
   * Upload video to OSS
   *
   * @param {string} localFilePath - Path to local file
   * @param {string} userId - User ID (for organizing files)
   * @param {string} filename - Original filename
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadVideo(localFilePath, userId, filename) {
    const ext = path.extname(filename);
    const key = `${this.config.videoPath}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    try {
      const result = await this.client.put(key, localFilePath, {
        headers: {
          'Content-Type': this._getContentType(ext),
          'x-oss-storage-class': 'Standard',
          'x-oss-forbid-overwrite': 'false',
        },
      });

      logger.info('Video uploaded to OSS', {
        userId,
        key,
        size: result.res?.headers?.['content-length'],
      });

      return {
        url: result.url,
        key: key,
      };
    } catch (error) {
      logger.error('Failed to upload video to OSS', { userId, key, error: error.message });
      throw error;
    }
  }

  /**
   * Upload processed video result
   *
   * @param {string} localFilePath - Path to processed file
   * @param {string} taskId - Task ID
   * @param {string} ext - File extension
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadResult(localFilePath, taskId, ext = '.mp4') {
    const key = `${this.config.resultPath}/${taskId}${ext}`;

    try {
      const result = await this.client.put(key, localFilePath, {
        headers: {
          'Content-Type': this._getContentType(ext),
          'x-oss-storage-class': 'Standard',
        },
      });

      logger.info('Result uploaded to OSS', { taskId, key });

      return {
        url: result.url,
        key: key,
      };
    } catch (error) {
      logger.error('Failed to upload result to OSS', { taskId, key, error: error.message });
      throw error;
    }
  }

  /**
   * Generate pre-signed URL for download
   *
   * @param {string} key - Object key in OSS
   * @param {number} expires - URL expiration in seconds (default: 1 hour)
   * @returns {Promise<string>}
   */
  async getSignedUrl(key, expires = 3600) {
    try {
      const url = this.client.signatureUrl(key, {
        expires: expires,
        method: 'GET',
      });

      logger.debug('Generated pre-signed URL', { key, expires });
      return url;
    } catch (error) {
      logger.error('Failed to generate pre-signed URL', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Check if object exists
   *
   * @param {string} key - Object key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      await this.client.head(key);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') return false;
      throw error;
    }
  }

  /**
   * Delete object from OSS
   *
   * @param {string} key - Object key
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      await this.client.delete(key);
      logger.info('Deleted object from OSS', { key });
    } catch (error) {
      logger.error('Failed to delete object from OSS', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get object metadata
   *
   * @param {string} key - Object key
   * @returns {Promise<object>}
   */
  async getMetadata(key) {
    try {
      const result = await this.client.head(key);
      return {
        size: parseInt(result.res.headers['content-length'], 10),
        contentType: result.res.headers['content-type'],
        lastModified: result.res.headers['last-modified'],
        etag: result.res.headers['etag'],
      };
    } catch (error) {
      logger.error('Failed to get object metadata', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Generate upload signature for frontend direct upload
   *
   * @param {string} key - Object key
   * @param {string} contentType - MIME type
   * @param {number} expires - Expiration in seconds
   * @returns {object} - {url, host, key, policy, signature}
   */
  generateUploadSignature(key, contentType, expires = 300) {
    const expiration = new Date(Date.now() + expires * 1000).toISOString();

    const policy = {
      expiration,
      conditions: [
        { bucket: process.env.OSS_BUCKET },
        ['content-length-range', 0, this.config.maxFileSize],
        ['starts-with', '$key', key],
        ['eq', '$Content-Type', contentType],
      ],
    };

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = this._generateSignature(policyBase64);

    return {
      url: `https://${process.env.OSS_BUCKET}.oss-${process.env.OSS_REGION || 'oss-cn-hangzhou'}.aliyuncs.com`,
      host: `${process.env.OSS_BUCKET}.oss-${process.env.OSS_REGION || 'oss-cn-hangzhou'}.aliyuncs.com`,
      key: key,
      policy: policyBase64,
      signature: signature,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    };
  }

  /**
   * Generate HMAC-SHA1 signature
   */
  _generateSignature(policy) {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha1', process.env.OSS_ACCESS_KEY_SECRET)
      .update(policy)
      .digest('base64');
  }

  /**
   * Get content type from extension
   */
  _getContentType(ext) {
    const types = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
    };

    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Extract key from URL
   */
  extractKey(url) {
    const match = url.match(/aliyuncs\.com\/(.+)$/);
    return match ? match[1] : url;
  }

  /**
   * Get public URL for a key
   */
  getPublicUrl(key) {
    return `https://${process.env.OSS_BUCKET}.oss-${process.env.OSS_REGION || 'oss-cn-hangzhou'}.aliyuncs.com/${key}`;
  }
}

module.exports = new AliyunOSSClient();
