/**
 * 支付宝小程序 my 对象类型声明
 */

declare const my: {
  /**
   * 获取授权码
   */
  getAuthCode(options: {
    scopes: string;
    success: (res: { authCode: string }) => void;
    fail: (err: any) => void;
  }): void;

  /**
   * 拍摄或选择视频
   */
  chooseVideo(options: {
    sourceType: string[];
    maxDuration: number;
    success: (res: {
      tempFilePath: string;
      size: number;
      duration: number;
      width: number;
      height: number;
    }) => void;
    fail: (err: any) => void;
  }): void;
};
