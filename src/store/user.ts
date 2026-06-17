/**
 * 用户状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/types';

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref<UserInfo | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isLoggedIn = computed(() => !!userInfo.value);
  const balance = computed(() => userInfo.value?.balance || 0);

  // Actions
  async function login(platform: 'wechat' | 'alipay') {
    isLoading.value = true;
    error.value = null;

    try {
      let code = '';

      // #ifdef MP-WEIXIN
      if (platform === 'wechat') {
        const res = await new Promise<any>((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject,
          });
        });
        code = res.code;
      }
      // #endif

      // #ifdef MP-ALIPAY
      if (platform === 'alipay') {
        const res = await new Promise<any>((resolve, reject) => {
          my.getAuthCode({
            scopes: 'auth_user',
            success: resolve,
            fail: reject,
          });
        });
        code = res.authCode;
      }
      // #endif

      if (!code) {
        throw new Error('获取登录凭证失败');
      }

      // 调用后端登录接口（微信用 wechat-login，支付宝用 alipay-login）
      const { post, setToken } = await import('@/api/request');
      const endpoint = platform === 'wechat' ? '/v1/auth/wechat-login' : '/v1/auth/alipay-login';
      const response = await post<any>(endpoint, platform === 'wechat' ? { code } : { authCode: code });
      const data = response.data;

      // 保存 Token（后端返回 data.token 为字符串）
      if (data.token) {
        const tokenStr = typeof data.token === 'string' ? data.token : data.token.access_token;
        setToken(tokenStr);
      }

      // 保存用户信息（后端返回 data.userInfo）
      const userData = data.userInfo || data.user;
      if (userData) {
        userInfo.value = {
          id: userData.id,
          openid: userData.openid,
          nickname: userData.nickname || '用户',
          avatarUrl: userData.avatar_url || '',
          balance: userData.balance || 0,
          vipType: userData.vip_type || 'none',
          vipExpireAt: userData.vip_expire_at || null,
          totalTasks: 0,
          totalSpent: 0,
          createdAt: userData.created_at || new Date().toISOString(),
          updatedAt: userData.updated_at || new Date().toISOString(),
        };
      }
    } catch (err: any) {
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info;
  }

  function clearUser() {
    userInfo.value = null;
  }

  return {
    // State
    userInfo,
    isLoading,
    error,
    // Getters
    isLoggedIn,
    balance,
    // Actions
    login,
    setUserInfo,
    clearUser,
  };
});
