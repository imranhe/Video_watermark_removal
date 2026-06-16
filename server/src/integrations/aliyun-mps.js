const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Aliyun MPS (Media Processing Service) Client
 *
 * Handles video processing jobs for subtitle/watermark/logo removal.
 * Uses Aliyun REST API with signature authentication.
 */
class AliyunMPSClient {
  constructor() {
    this.config = {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      regionId: process.env.ALIYUN_REGION || 'cn-hangzhou',
      pipelineId: process.env.ALIYUN_MPS_PIPELINE_ID,
    };

    this.baseUrl = `https://mts.${this.config.regionId}.aliyuncs.com`;

    if (!this.config.accessKeyId || !this.config.accessKeySecret) {
      logger.warn('Aliyun MPS credentials not configured. Video processing will fail.');
    }
  }

  /**
   * Generate Aliyun API signature
   */
  _generateSignature(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`;

    const hmac = crypto.createHmac('sha1', `${this.config.accessKeySecret}&`);
    hmac.update(stringToSign);
    return hmac.digest('base64');
  }

  /**
   * Make authenticated request to Aliyun MPS API
   */
  async _request(action, params = {}) {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    const commonParams = {
      Format: 'JSON',
      Version: '2014-06-18',
      AccessKeyId: this.config.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: timestamp,
      SignatureVersion: '1.0',
      SignatureNonce: crypto.randomUUID(),
    };

    const allParams = { ...commonParams, ...params, Action: action };
    allParams.Signature = this._generateSignature(allParams);

    try {
      const response = await axios.get(this.baseUrl, {
        params: allParams,
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        logger.error(`Aliyun MPS API error: ${errorData.Code}`, {
          action,
          code: errorData.Code,
          message: errorData.Message,
          requestId: errorData.RequestId,
        });

        const err = new Error(errorData.Message || 'Aliyun MPS request failed');
        err.code = errorData.Code;
        err.requestId = errorData.RequestId;
        throw err;
      }

      logger.error('Aliyun MPS network error', { action, error: error.message });
      throw error;
    }
  }

  /**
   * Submit video processing job
   *
   * @param {string} inputUrl - Video URL in OSS
   * @param {string} outputUrl - Output URL in OSS
   * @param {string} taskType - 'subtitle', 'watermark', or 'logo'
   * @param {object} options - Additional options (region coordinates, etc.)
   * @returns {Promise<{jobId: string}>}
   */
  async submitJob(inputUrl, outputUrl, taskType, options = {}) {
    const params = {
      Input: JSON.stringify({
        Bucket: this._extractBucket(inputUrl),
        Location: this._extractLocation(inputUrl),
        Object: this._extractObject(inputUrl),
      }),
      Output: JSON.stringify({
        Bucket: this._extractBucket(outputUrl),
        Location: this._extractLocation(outputUrl),
        Object: this._extractObject(outputUrl),
      }),
      PipelineId: this.config.pipelineId,
    };

    // Configure processing based on task type
    const processConfig = this._getProcessConfig(taskType, options);
    params.ProcessConfig = JSON.stringify(processConfig);

    try {
      const result = await this._request('SubmitJobs', params);
      logger.info('Aliyun MPS job submitted', {
        jobId: result.JobResultList?.JobResult?.[0]?.Job?.JobId,
        taskType,
        inputUrl,
      });

      return {
        jobId: result.JobResultList?.JobResult?.[0]?.Job?.JobId,
        success: result.JobResultList?.JobResult?.[0]?.Success,
      };
    } catch (error) {
      logger.error('Failed to submit Aliyun MPS job', { taskType, error: error.message });
      throw error;
    }
  }

  /**
   * Query job status
   *
   * @param {string} jobId - MPS job ID
   * @returns {Promise<{status: string, progress: number, outputUrl: string|null}>}
   */
  async queryJob(jobId) {
    try {
      const result = await this._request('QueryJob', { JobId: jobId });
      const job = result.Job;

      return {
        jobId: job.JobId,
        status: this._mapStatus(job.State),
        progress: this._calculateProgress(job),
        outputUrl: job.Output?.OutputFile?.Object
          ? `https://${job.Output.OutputFile.Bucket}.oss-${this.config.regionId}.aliyuncs.com/${job.Output.OutputFile.Object}`
          : null,
        errorMessage: job.State === 'Fail' ? (job.Message || 'Processing failed') : null,
      };
    } catch (error) {
      logger.error('Failed to query Aliyun MPS job', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Query multiple jobs (batch)
   *
   * @param {string[]} jobIds - Array of MPS job IDs
   * @returns {Promise<Array>}
   */
  async queryJobs(jobIds) {
    try {
      const result = await this._request('QueryJobList', {
        JobIds: jobIds.join(','),
      });

      return (result.JobList?.Job || []).map((job) => ({
        jobId: job.JobId,
        status: this._mapStatus(job.State),
        progress: this._calculateProgress(job),
        outputUrl: job.Output?.OutputFile?.Object
          ? `https://${job.Output.OutputFile.Bucket}.oss-${this.config.regionId}.aliyuncs.com/${job.Output.OutputFile.Object}`
          : null,
        errorMessage: job.State === 'Fail' ? (job.Message || 'Processing failed') : null,
      }));
    } catch (error) {
      logger.error('Failed to query Aliyun MPS jobs', { jobIds, error: error.message });
      throw error;
    }
  }

  /**
   * Get processing configuration based on task type
   */
  _getProcessConfig(taskType, options) {
    const baseConfig = {
      OutputBucket: this.config.outputBucket || process.env.OSS_BUCKET,
      OutputLocation: this.config.regionId,
    };

    switch (taskType) {
      case 'subtitle':
        return {
          ...baseConfig,
          SubtitleConfig: {
            RemoveSubtitle: true,
            Region: options.region || null,
          },
        };

      case 'watermark':
        return {
          ...baseConfig,
          WatermarkConfig: {
            RemoveWatermark: true,
            Region: options.region || null,
          },
        };

      case 'logo':
        return {
          ...baseConfig,
          LogoConfig: {
            RemoveLogo: true,
            Region: options.region || null,
          },
        };

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  /**
   * Map Aliyun job state to our status
   */
  _mapStatus(state) {
    const statusMap = {
      Submitted: 'pending',
      Parsing: 'processing',
      Transcoding: 'processing',
      TranscodeSuccess: 'completed',
      Success: 'completed',
      Fail: 'failed',
      Cancelled: 'cancelled',
    };

    return statusMap[state] || 'processing';
  }

  /**
   * Calculate progress percentage
   */
  _calculateProgress(job) {
    if (job.State === 'Success' || job.State === 'TranscodeSuccess') return 100;
    if (job.State === 'Fail' || job.State === 'Cancelled') return 0;
    if (job.State === 'Submitted') return 5;

    // For processing states, estimate from pipeline
    if (job.PipelineId) {
      // Rough estimate based on typical processing stages
      return 50;
    }

    return 0;
  }

  /**
   * Extract bucket name from OSS URL
   */
  _extractBucket(url) {
    const match = url.match(/https?:\/\/([^.]+)\.oss/);
    return match ? match[1] : process.env.OSS_BUCKET;
  }

  /**
   * Extract region from OSS URL
   */
  _extractLocation(url) {
    const match = url.match(/oss-([^.]+)\.aliyuncs/);
    return match ? match[1] : this.config.regionId;
  }

  /**
   * Extract object key from OSS URL
   */
  _extractObject(url) {
    const match = url.match(/aliyuncs\.com\/(.+)$/);
    return match ? match[1] : url;
  }
}

module.exports = new AliyunMPSClient();
