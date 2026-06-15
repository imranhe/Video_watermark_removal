/**
 * 平台工具函数
 * 用于检测和处理多端平台差异
 */

export type Platform = 'h5' | 'mp-weixin' | 'mp-alipay' | 'app';

/**
 * 获取当前平台
 */
export function getPlatform(): Platform {
  // #ifdef H5
  return 'h5';
  // #endif

  // #ifdef MP-WEIXIN
  return 'mp-weixin';
  // #endif

  // #ifdef MP-ALIPAY
  return 'mp-alipay';
  // #endif

  // #ifdef APP-PLUS
  return 'app';
  // #endif

  return 'h5'; // 默认
}

/**
 * 是否是微信小程序
 */
export function isWeixin(): boolean {
  return getPlatform() === 'mp-weixin';
}

/**
 * 是否是支付宝小程序
 */
export function isAlipay(): boolean {
  return getPlatform() === 'mp-alipay';
}

/**
 * 是否是 H5
 */
export function isH5(): boolean {
  return getPlatform() === 'h5';
}

/**
 * 是否是 App
 */
export function isApp(): boolean {
  return getPlatform() === 'app';
}

/**
 * 获取平台名称（中文）
 */
export function getPlatformName(): string {
  const platformMap: Record<Platform, string> = {
    'h5': 'H5',
    'mp-weixin': '微信小程序',
    'mp-alipay': '支付宝小程序',
    'app': 'App',
  };
  return platformMap[getPlatform()];
}

export default {
  getPlatform,
  isWeixin,
  isAlipay,
  isH5,
  isApp,
  getPlatformName,
};
