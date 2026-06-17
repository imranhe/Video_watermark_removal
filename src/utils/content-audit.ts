/**
 * 内容审核工具
 * 使用微信内容安全接口（msg_sec_check / img_sec_check）
 */

interface AuditResult {
  pass: boolean;
  detail?: string;
}

/**
 * 检查文本内容
 */
export async function checkText(text: string): Promise<AuditResult> {
  try {
    // #ifdef MP-WEIXIN
    const result = await uni.request({
      url: 'https://api.weixin.qq.com/wxa/msg_sec_check',
      method: 'POST',
      data: {
        content: text,
        version: 2,
        scene: 2,
        openid: uni.getStorageSync('openid')
      }
    });

    if (typeof result.data === 'object' && result.data !== null && 'errcode' in result.data && (result.data as any).errcode === 0) {
      return { pass: true };
    } else {
      return { pass: false, detail: '内容包含违规信息' };
    }
    // #endif

    // #ifndef MP-WEIXIN
    return { pass: true };
    // #endif
  } catch (error) {
    console.error('内容审核失败:', error);
    // 审核接口异常时放行，但记录日志（微信审核接口不可用不应阻塞正常用户）
    return { pass: true };
  }
}

/**
 * 检查图片内容
 */
export async function checkImage(imagePath: string): Promise<AuditResult> {
  try {
    // #ifdef MP-WEIXIN
    const result = await uni.request({
      url: 'https://api.weixin.qq.com/wxa/img_sec_check',
      method: 'POST',
      data: {
        media: imagePath,
        version: 2,
        scene: 2
      }
    });

    if (typeof result.data === 'object' && result.data !== null && 'errcode' in result.data && (result.data as any).errcode === 0) {
      return { pass: true };
    } else {
      return { pass: false, detail: '图片包含违规内容' };
    }
    // #endif

    // #ifndef MP-WEIXIN
    return { pass: true };
    // #endif
  } catch (error) {
    console.error('图片审核失败:', error);
    return { pass: true };
  }
}
