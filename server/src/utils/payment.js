const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/wechat');
const logger = require('./logger');

/**
 * 微信支付 V3 工具类
 */
class WechatPayClient {
  constructor() {
    this.appId = config.appId;
    this.mchId = config.merchantId;
    this.apiKey = config.apiKey;
    this.serialNo = config.serialNo;
    this.notifyUrl = config.notifyUrl || `${process.env.API_BASE_URL}/v1/orders/callback/wechat`;

    // Load private key
    this.privateKey = this._loadPrivateKey();
  }

  /**
   * Load merchant private key
   */
  _loadPrivateKey() {
    const keyPath = process.env.WECHAT_PAY_PRIVATE_KEY_PATH;
    if (keyPath && fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }

    // Fallback to environment variable (base64 encoded)
    const keyBase64 = process.env.WECHAT_PAY_PRIVATE_KEY;
    if (keyBase64) {
      return Buffer.from(keyBase64, 'base64').toString('utf8');
    }

    logger.warn('WeChat Pay private key not configured');
    return null;
  }

  /**
   * Create payment order (JSAPI)
   *
   * @param {string} orderNo - Order number
   * @param {string} openid - User openid
   * @param {number} amount - Amount in cents
   * @param {string} description - Order description
   * @returns {Promise<object>} - Payment parameters for frontend
   */
  async createPayment(orderNo, openid, amount, description) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = crypto.randomBytes(16).toString('hex');

      // Create order on WeChat Pay
      const prepayId = await this._createNativeOrder(
        orderNo,
        amount,
        description,
        openid
      );

      // Generate signature for frontend
      const signData = `${this.appId}\n${timestamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
      const paySign = this._sign(signData);

      logger.info('WeChat payment created', {
        orderNo,
        openid,
        amount,
        prepayId,
      });

      return {
        appId: this.appId,
        timeStamp: timestamp,
        nonceStr,
        package: `prepay_id=${prepayId}`,
        signType: 'RSA',
        paySign,
      };
    } catch (error) {
      logger.error('Failed to create WeChat payment', {
        orderNo,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create native order on WeChat Pay
   */
  async _createNativeOrder(orderNo, amount, description, openid) {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';

    const requestData = {
      appid: this.appId,
      mchid: this.mchId,
      description: description || '积分充值',
      out_trade_no: orderNo,
      notify_url: this.notifyUrl,
      amount: {
        total: amount,
        currency: 'CNY',
      },
      payer: {
        openid: openid,
      },
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const body = JSON.stringify(requestData);

    // Generate signature
    const signData = `POST\n/v3/pay/transactions/jsapi\n${timestamp}\n${nonceStr}\n${body}\n`;
    const signature = this._sign(signData);

    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.serialNo}",signature="${signature}"`;

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
      },
      timeout: 30000,
    });

    return response.data.prepay_id;
  }

  /**
   * Verify payment callback signature
   *
   * @param {string} timestamp - Request timestamp
   * @param {string} nonce - Nonce string
   * @param {string} body - Raw request body
   * @param {string} signature - Signature from header
   * @returns {boolean} - Whether signature is valid
   */
  verifyPaymentCallback(timestamp, nonce, body, signature) {
    try {
      const signData = `${timestamp}\n${nonce}\n${body}\n`;
      const publicKey = this._loadPublicKey();

      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(signData);

      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      logger.error('Payment callback signature verification failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Load WeChat Pay platform public key
   */
  _loadPublicKey() {
    const keyPath = process.env.WECHAT_PAY_PUBLIC_KEY_PATH;
    if (keyPath && fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }

    const keyBase64 = process.env.WECHAT_PAY_PUBLIC_KEY;
    if (keyBase64) {
      return Buffer.from(keyBase64, 'base64').toString('utf8');
    }

    throw new Error('WeChat Pay public key not configured');
  }

  /**
   * Decrypt callback data
   *
   * @param {string} ciphertext - Base64 encoded ciphertext
   * @param {string} nonce - Nonce used for encryption
   * @param {string} associatedData - Associated data
   * @returns {object} - Decrypted data
   */
  decryptCallback(ciphertext, nonce, associatedData) {
    try {
      const apiKey = Buffer.from(this.apiKey, 'utf8');
      const nonceBuffer = Buffer.from(nonce, 'utf8');
      const associatedDataBuffer = associatedData
        ? Buffer.from(associatedData, 'utf8')
        : Buffer.alloc(0);
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      // AES-256-GCM decryption
      const authTag = ciphertextBuffer.slice(-16);
      const encryptedData = ciphertextBuffer.slice(0, -16);

      const decipher = crypto.createDecipheriv('aes-256-gcm', apiKey, nonceBuffer);
      decipher.setAuthTag(authTag);
      decipher.setAAD(associatedDataBuffer);

      let decrypted = decipher.update(encryptedData, null, 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt callback data', { error: error.message });
      throw error;
    }
  }

  /**
   * Process payment callback
   *
   * @param {object} headers - Request headers
   * @param {string} body - Raw request body
   * @returns {Promise<object>} - Parsed callback data
   */
  async processCallback(headers, body) {
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const signature = headers['wechatpay-signature'];
    const serial = headers['wechatpay-serial'];

    // Verify signature
    if (!this.verifyPaymentCallback(timestamp, nonce, body, signature)) {
      throw new Error('Invalid callback signature');
    }

    // Parse callback data
    const callbackData = JSON.parse(body);

    // Decrypt resource data
    const resource = callbackData.resource;
    const decryptedData = this.decryptCallback(
      resource.ciphertext,
      resource.nonce,
      resource.associated_data
    );

    logger.info('Payment callback processed', {
      outTradeNo: decryptedData.out_trade_no,
      transactionId: decryptedData.transaction_id,
      status: decryptedData.trade_state,
    });

    return {
      outTradeNo: decryptedData.out_trade_no,
      transactionId: decryptedData.transaction_id,
      tradeState: decryptedData.trade_state,
      amount: decryptedData.amount?.total,
      payerOpenid: decryptedData.payer?.openid,
      successTime: decryptedData.success_time,
    };
  }

  /**
   * Sign data with private key
   */
  _sign(data) {
    if (!this.privateKey) {
      throw new Error('Private key not configured');
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Query order status
   *
   * @param {string} orderNo - Order number
   * @returns {Promise<object>} - Order status
   */
  async queryOrder(orderNo) {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${this.mchId}`;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');

    const signData = `GET\n/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${this.mchId}\n${timestamp}\n${nonceStr}\n\n`;
    const signature = this._sign(signData);

    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.serialNo}",signature="${signature}"`;

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization,
      },
      timeout: 30000,
    });

    return response.data;
  }

  /**
   * Close order
   *
   * @param {string} orderNo - Order number
   * @returns {Promise<boolean>}
   */
  async closeOrder(orderNo) {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}/close`;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const body = JSON.stringify({ mchid: this.mchId });

    const signData = `POST\n/v3/pay/transactions/out-trade-no/${orderNo}/close\n${timestamp}\n${nonceStr}\n${body}\n`;
    const signature = this._sign(signData);

    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.serialNo}",signature="${signature}"`;

    await axios.post(url, { mchid: this.mchId }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
      },
      timeout: 30000,
    });

    logger.info('Order closed', { orderNo });
    return true;
  }
}

// Export singleton instance
module.exports = new WechatPayClient();
