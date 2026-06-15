/**
 * 用户相关类型定义
 */

export interface UserInfo {
  id: string;
  openid: string;
  nickname: string;
  avatarUrl: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginParams {
  code?: string;      // 微信登录 code
  authCode?: string;  // 支付宝登录 authCode
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}
