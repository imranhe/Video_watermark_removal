<template>
  <view class="page">
    <view class="header">
      <view class="app-icon">
        <text class="app-icon-char">字</text>
      </view>
      <text class="header-title">登录视频去字幕</text>
      <text class="header-subtitle">登录后享受更多功能</text>
    </view>

    <view class="content">
      <!-- #ifdef MP-WEIXIN -->
      <button class="btn-wechat" @tap="loginWechat" :disabled="isLoading">
        <view class="btn-icon-wrap" style="background:#fff">
          <text class="btn-icon-char" style="color:#07c160">微</text>
        </view>
        <text class="btn-label">{{ isLoading ? '登录中...' : '微信登录' }}</text>
      </button>
      <!-- #endif -->

      <!-- #ifdef MP-ALIPAY -->
      <button class="btn-alipay" @tap="loginAlipay" :disabled="isLoading">
        <view class="btn-icon-wrap" style="background:#fff">
          <text class="btn-icon-char" style="color:#1677ff">支</text>
        </view>
        <text class="btn-label">{{ isLoading ? '登录中...' : '支付宝登录' }}</text>
      </button>
      <!-- #endif -->

      <!-- #ifdef H5 -->
      <view class="h5-form">
        <input
          class="input-field"
          type="number"
          placeholder="请输入手机号"
          v-model="phone"
          maxlength="11"
        />
        <view class="sms-row">
          <input
            class="input-field input-sms"
            type="number"
            placeholder="请输入验证码"
            v-model="smsCode"
            maxlength="6"
          />
          <button
            class="btn-sms"
            :disabled="smsCooldown > 0 || isSendingSms"
            @tap="sendSmsCode"
          >
            {{ smsCooldown > 0 ? smsCooldown + 's 后重试' : '获取验证码' }}
          </button>
        </view>
        <button class="btn-primary" @tap="loginPhone" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '手机号登录' }}
        </button>
      </view>
      <!-- #endif -->

      <view class="agreement">
        <text class="agreement-text">登录即同意</text>
        <text class="agreement-link" @tap="openTerms">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @tap="openPrivacy">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const isLoading = ref(false);
const phone = ref('');
const smsCode = ref('');
const smsCooldown = ref(0);
const isSendingSms = ref(false);

let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const PHONE_REG = /^1[3-9]\d{9}$/;
const CODE_REG = /^\d{6}$/;

function validatePhone(value: string): boolean {
  return PHONE_REG.test(value);
}

function startCooldown() {
  smsCooldown.value = 60;
  cooldownTimer = setInterval(() => {
    smsCooldown.value--;
    if (smsCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

async function sendSmsCode() {
  const trimmed = phone.value.trim();
  if (!trimmed) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return;
  }
  if (!validatePhone(trimmed)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }

  isSendingSms.value = true;
  try {
    const { post } = await import('@/api/request');
    await post('/v1/auth/send-sms', { phone: trimmed });
    uni.showToast({ title: '验证码已发送', icon: 'success' });
    startCooldown();
  } catch (err: any) {
    uni.showToast({ title: err.message || '发送失败，请稍后重试', icon: 'none' });
  } finally {
    isSendingSms.value = false;
  }
}

async function loginWechat() {
  isLoading.value = true;
  try {
    await userStore.login('wechat');
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (err: any) {
    uni.showToast({ title: err.message || '登录失败', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
}

async function loginAlipay() {
  isLoading.value = true;
  try {
    await userStore.login('alipay');
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (err: any) {
    uni.showToast({ title: err.message || '登录失败', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
}

async function loginPhone() {
  const trimmed = phone.value.trim();
  const code = smsCode.value.trim();

  if (!trimmed) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return;
  }
  if (!validatePhone(trimmed)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  if (!code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' });
    return;
  }
  if (!CODE_REG.test(code)) {
    uni.showToast({ title: '验证码为6位数字', icon: 'none' });
    return;
  }

  isLoading.value = true;
  try {
    const { post, setToken } = await import('@/api/request');
    const response = await post<any>('/v1/auth/phone-login', {
      phone: trimmed,
      code,
    });
    const data = response.data;

    // 保存 Token（与微信登录流程一致）
    if (data.token) {
      setToken(data.token.access_token);
    }

    // 保存用户信息（与微信登录流程一致）
    if (data.user) {
      const userInfo = {
        id: data.user.id,
        openid: data.user.openid || '',
        nickname: data.user.nickname || '用户',
        avatarUrl: data.user.avatar_url || '',
        phone: data.user.phone || trimmed,
        balance: data.user.balance || 0,
        vipType: data.user.vip_type || 'none',
        vipExpireAt: data.user.vip_expire_at || null,
        totalTasks: 0,
        totalSpent: 0,
        createdAt: data.user.created_at || new Date().toISOString(),
        updatedAt: data.user.updated_at || new Date().toISOString(),
      };
      userStore.setUserInfo(userInfo as any);
    }

    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (err: any) {
    uni.showToast({ title: err.message || '登录失败，请检查手机号和验证码', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
}

function openTerms() {
  uni.navigateTo({ url: '/pages/terms/terms' });
}

function openPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/privacy' });
}

onBeforeUnmount(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 0 var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-16) 0 var(--space-10);
}
.app-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}
.app-icon-char {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: #fff;
}
.header-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}
.header-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

/* Content */
.content {
  width: 100%;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-5);
  box-shadow: var(--shadow-sm);
}

/* Social buttons */
.btn-wechat {
  width: 100%;
  height: var(--btn-height-lg);
  background: #07c160;
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  margin-bottom: var(--space-3);
}
.btn-alipay {
  width: 100%;
  height: var(--btn-height-lg);
  background: #1677ff;
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  margin-bottom: var(--space-3);
}
.btn-icon-wrap {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon-char {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}
.btn-label {
  font-size: var(--font-size-md);
}

/* H5 form */
.h5-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}
.input-field {
  width: 100%;
  height: var(--btn-height-lg);
  border: 1px solid var(--color-separator);
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  box-sizing: border-box;
}
.sms-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
.input-sms {
  flex: 1;
  min-width: 0;
}
.btn-sms {
  flex-shrink: 0;
  height: var(--btn-height-lg);
  padding: 0 var(--space-4);
  background: var(--color-bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-sms[disabled] {
  color: var(--color-text-tertiary);
  border-color: var(--color-separator);
  background: var(--color-bg-primary);
  opacity: 0.7;
}
.btn-primary {
  width: 100%;
  height: var(--btn-height-lg);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-primary[disabled] {
  opacity: 0.5;
}

/* Agreement */
.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: var(--space-6);
  gap: var(--space-1);
}
.agreement-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
.agreement-link {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}
</style>
