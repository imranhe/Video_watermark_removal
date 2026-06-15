/**
 * 用户状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface UserInfo {
  id: string;
  openid: string;
  nickname: string;
  avatarUrl: string;
  balance: number;
  createdAt: string;
}

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
      // #ifdef MP-WEIXIN
      if (platform === 'wechat') {
        const { code } = await new Promise<any>((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject,
          });
        });

        // TODO: 调用后端登录接口
        // const response = await post<UserInfo>('/api/auth/wechat-login', { code });
        // userInfo.value = response.data;
      }
      // #endif

      // #ifdef MP-ALIPAY
      if (platform === 'alipay') {
        const { authCode } = await new Promise<any>((resolve, reject) => {
          my.getAuthCode({
            scopes: 'auth_user',
            success: resolve,
            fail: reject,
          });
        });

        // TODO: 调用后端登录接口
        // const response = await post<UserInfo>('/api/auth/alipay-login', { authCode });
        // userInfo.value = response.data;
      }
      // #endif
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
