<template>
  <view class="container">
    <view class="header">
      <view class="logo">🎬</view>
      <view class="title">登录</view>
      <view class="subtitle">登录后享受更多功能</view>
    </view>

    <view class="content">
      <!-- #ifdef MP-WEIXIN -->
      <button class="btn-wechat" @tap="loginWechat" :disabled="isLoading">
        <text class="btn-icon">微</text>
        <text>微信登录</text>
      </button>
      <!-- #endif -->

      <!-- #ifdef MP-ALIPAY -->
      <button class="btn-alipay" @tap="loginAlipay" :disabled="isLoading">
        <text class="btn-icon">支</text>
        <text>支付宝登录</text>
      </button>
      <!-- #endif -->

      <!-- #ifdef H5 -->
      <view class="h5-login-form">
        <input class="input-field" type="text" placeholder="手机号" v-model="phone" />
        <button class="btn-primary" @tap="loginPhone" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '手机号登录' }}
        </button>
      </view>
      <!-- #endif -->

      <view class="agreement">
        <text class="agreement-text">登录即同意</text>
        <text class="agreement-link" @tap="showAgreement">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @tap="showPrivacy">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const isLoading = ref(false);
const phone = ref('');

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
  if (!phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return;
  }
  uni.showToast({ title: '手机号登录开发中', icon: 'none' });
}

function showAgreement() {
  uni.showToast({ title: '用户协议开发中', icon: 'none' });
}

function showPrivacy() {
  uni.showToast({ title: '隐私政策开发中', icon: 'none' });
}
</script>

<style scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  text-align: center;
  padding: 60px 0 40px;
  color: #fff;
}
.logo {
  font-size: 60px;
  margin-bottom: 15px;
}
.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}
.subtitle {
  font-size: 14px;
  opacity: 0.8;
}
.content {
  width: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px;
}
.btn-wechat {
  width: 100%;
  height: 50px;
  background: #07c160;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}
.btn-alipay {
  width: 100%;
  height: 50px;
  background: #1677ff;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}
.btn-icon {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.h5-login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.input-field {
  height: 50px;
  border: 2px solid #e5e5e5;
  border-radius: 25px;
  padding: 0 20px;
  font-size: 16px;
}
.btn-primary {
  width: 100%;
  height: 50px;
  background: #007AFF;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
}
.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}
.agreement-text {
  font-size: 12px;
  color: #999;
}
.agreement-link {
  font-size: 12px;
  color: #007AFF;
}
</style>
