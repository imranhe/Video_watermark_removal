<template>
  <view class="container">
    <view class="header">
      <view class="title">充值中心</view>
      <view class="balance-card">
        <text class="balance-label">当前积分</text>
        <text class="balance-value">{{ balance }}</text>
      </view>
    </view>

    <view class="content">
      <!-- 套餐列表 -->
      <view class="section-title">选择套餐</view>
      <view class="package-list">
        <view
          class="package-card"
          :class="{ active: selectedPackage === index }"
          v-for="(pkg, index) in packages"
          :key="index"
          @tap="selectPackage(index)"
        >
          <view class="package-credits">{{ pkg.credits }} 积分</view>
          <view class="package-price">¥{{ pkg.price }}</view>
          <view class="package-desc" v-if="pkg.bonus">赠 {{ pkg.bonus }} 积分</view>
          <view class="package-tag" v-if="pkg.tag">{{ pkg.tag }}</view>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="section-title">支付方式</view>
      <view class="pay-methods">
        <!-- #ifdef MP-WEIXIN -->
        <view
          class="pay-item"
          :class="{ active: payMethod === 'wechat' }"
          @tap="payMethod = 'wechat'"
        >
          <text class="pay-icon">微</text>
          <text class="pay-name">微信支付</text>
        </view>
        <!-- #endif -->

        <!-- #ifdef MP-ALIPAY -->
        <view
          class="pay-item"
          :class="{ active: payMethod === 'alipay' }"
          @tap="payMethod = 'alipay'"
        >
          <text class="pay-icon">支</text>
          <text class="pay-name">支付宝</text>
        </view>
        <!-- #endif -->

        <!-- #ifdef H5 -->
        <view
          class="pay-item"
          :class="{ active: payMethod === 'wechat' }"
          @tap="payMethod = 'wechat'"
        >
          <text class="pay-icon">微</text>
          <text class="pay-name">微信支付</text>
        </view>
        <view
          class="pay-item"
          :class="{ active: payMethod === 'alipay' }"
          @tap="payMethod = 'alipay'"
        >
          <text class="pay-icon">支</text>
          <text class="pay-name">支付宝</text>
        </view>
        <!-- #endif -->
      </view>

      <!-- 支付按钮 -->
      <button class="btn-pay" @tap="handlePay" :disabled="!isLoggedIn || selectedPackage < 0">
        {{ isLoggedIn ? `支付 ¥${selectedPrice}` : '请先登录' }}
      </button>

      <!-- 使用说明 -->
      <view class="notice">
        <view class="notice-title">使用说明</view>
        <view class="notice-item">- 每次处理消耗 10 积分</view>
        <view class="notice-item">- 积分永久有效，不会过期</view>
        <view class="notice-item">- 处理失败不扣除积分</view>
        <view class="notice-item">- 充值后立即到账</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { useOrderStore } from '@/store/order';

const userStore = useUserStore();
const orderStore = useOrderStore();

const isLoggedIn = computed(() => userStore.isLoggedIn);
const balance = computed(() => userStore.balance);

const selectedPackage = ref(0);
const payMethod = ref<'wechat' | 'alipay'>('wechat');

const packages = [
  { credits: 100, price: 9.9, bonus: 0, tag: '' },
  { credits: 300, price: 25.9, bonus: 30, tag: '推荐' },
  { credits: 500, price: 39.9, bonus: 80, tag: '热门' },
  { credits: 1000, price: 69.9, bonus: 200, tag: '超值' },
];

const selectedPrice = computed(() => packages[selectedPackage.value]?.price || 0);

function selectPackage(index: number) {
  selectedPackage.value = index;
}

async function handlePay() {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  if (selectedPackage.value < 0) return;

  const pkg = packages[selectedPackage.value];
  uni.showLoading({ title: '创建订单中...' });

  try {
    const order = await orderStore.createOrder(
      pkg.price,
      pkg.credits + (pkg.bonus || 0),
      payMethod.value
    );
    uni.hideLoading();
    // TODO: 调用微信/支付宝支付SDK
    uni.showToast({ title: '支付功能开发中', icon: 'none' });
    // Mock payment success
    // await orderStore.payOrder(order.id);
    // uni.showToast({ title: '充值成功', icon: 'success' });
  } catch (err: any) {
    uni.hideLoading();
    uni.showToast({ title: err.message || '创建订单失败', icon: 'none' });
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
}
.title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20px;
}
.balance-card {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}
.balance-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: 8px;
}
.balance-value {
  font-size: 36px;
  color: #fff;
  font-weight: bold;
}
.content {
  padding: 20px;
}
.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}
.package-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 25px;
}
.package-card {
  width: calc(50% - 6px);
  background: #fff;
  border-radius: 12px;
  padding: 20px 15px;
  text-align: center;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}
.package-card.active {
  border-color: #007AFF;
  background: #f0f7ff;
}
.package-credits {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.package-price {
  font-size: 24px;
  font-weight: bold;
  color: #007AFF;
  margin-bottom: 5px;
}
.package-desc {
  font-size: 12px;
  color: #ff9500;
}
.package-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 0 12px 0 8px;
}
.pay-methods {
  display: flex;
  gap: 12px;
  margin-bottom: 25px;
}
.pay-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
}
.pay-item.active {
  border-color: #007AFF;
  background: #f0f7ff;
}
.pay-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #07c160;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.pay-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}
.btn-pay {
  width: 100%;
  height: 50px;
  background: #007AFF;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 25px;
}
.notice {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.notice-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}
.notice-item {
  font-size: 13px;
  color: #666;
  line-height: 2;
}
</style>
