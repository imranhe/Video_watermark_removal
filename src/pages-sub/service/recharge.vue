<template>
  <view class="page">
    <!-- Balance header -->
    <view class="balance-card">
      <text class="balance-label">当前积分</text>
      <text class="balance-value">{{ balance }}</text>
    </view>

    <!-- Package list -->
    <view class="section">
      <text class="section-title">选择套餐</text>
      <view class="package-grid">
        <view
          class="package-item"
          :class="{ active: selectedPackage === index }"
          v-for="(pkg, index) in packages"
          :key="index"
          @tap="selectPackage(index)"
        >
          <text class="package-credits">{{ pkg.credits }}</text>
          <text class="package-unit">积分</text>
          <text class="package-price">¥{{ pkg.price }}</text>
          <text class="package-bonus" v-if="pkg.bonus">赠 {{ pkg.bonus }}</text>
          <view class="package-tag" v-if="pkg.tag">
            <text class="tag-text">{{ pkg.tag }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Pay method -->
    <view class="section">
      <text class="section-title">支付方式</text>
      <!-- #ifdef MP-WEIXIN -->
      <view class="ios-notice" v-if="isIOS">
        <view class="notice-card">
          <text class="notice-title">iOS 用户充值说明</text>
          <text class="notice-desc">因 Apple 政策限制，iOS 端暂不支持直接充值。请使用以下方式：</text>
          <view class="notice-options">
            <text class="notice-option">1. 使用安卓设备打开小程序充值</text>
            <text class="notice-option">2. 访问网页版进行充值</text>
            <text class="notice-option">3. 联系客服协助充值</text>
          </view>
        </view>
      </view>
      <!-- #endif -->
      <view class="card" v-if="!isIOS || !isWeixinPlatform">
        <!-- #ifdef MP-WEIXIN -->
        <view class="pay-item" :class="{ active: payMethod === 'wechat' }" @tap="payMethod = 'wechat'">
          <view class="pay-icon-wrap" style="background:#07c160">
            <text class="pay-icon-char">微</text>
          </view>
          <text class="pay-name">微信支付</text>
          <view class="check-circle" :class="{ checked: payMethod === 'wechat' }">
            <text class="check-char" v-if="payMethod === 'wechat'">✓</text>
          </view>
        </view>
        <!-- #endif -->

        <!-- #ifdef MP-ALIPAY -->
        <view class="pay-item" :class="{ active: payMethod === 'alipay' }" @tap="payMethod = 'alipay'">
          <view class="pay-icon-wrap" style="background:#1677ff">
            <text class="pay-icon-char">支</text>
          </view>
          <text class="pay-name">支付宝</text>
          <view class="check-circle" :class="{ checked: payMethod === 'alipay' }">
            <text class="check-char" v-if="payMethod === 'alipay'">✓</text>
          </view>
        </view>
        <!-- #endif -->

        <!-- #ifdef H5 -->
        <view class="pay-item" :class="{ active: payMethod === 'wechat' }" @tap="payMethod = 'wechat'">
          <view class="pay-icon-wrap" style="background:#07c160">
            <text class="pay-icon-char">微</text>
          </view>
          <text class="pay-name">微信支付</text>
          <view class="check-circle" :class="{ checked: payMethod === 'wechat' }">
            <text class="check-char" v-if="payMethod === 'wechat'">✓</text>
          </view>
        </view>
        <view class="pay-divider"></view>
        <view class="pay-item" :class="{ active: payMethod === 'alipay' }" @tap="payMethod = 'alipay'">
          <view class="pay-icon-wrap" style="background:#1677ff">
            <text class="pay-icon-char">支</text>
          </view>
          <text class="pay-name">支付宝</text>
          <view class="check-circle" :class="{ checked: payMethod === 'alipay' }">
            <text class="check-char" v-if="payMethod === 'alipay'">✓</text>
          </view>
        </view>
        <!-- #endif -->
      </view>
    </view>

    <!-- Pay button (iOS 隐藏) -->
    <view class="pay-action" v-if="!isIOS || !isWeixinPlatform">
      <button class="btn-pay" @tap="handlePay" :disabled="!isLoggedIn || selectedPackage < 0">
        {{ isLoggedIn ? `支付 ¥${selectedPrice}` : '请先登录' }}
      </button>
    </view>

    <!-- Notice -->
    <view class="section">
      <text class="section-title">使用说明</text>
      <view class="card">
        <view class="notice-row">
          <text class="notice-dot">-</text>
          <text class="notice-text">每次处理消耗 10 积分</text>
        </view>
        <view class="notice-divider"></view>
        <view class="notice-row">
          <text class="notice-dot">-</text>
          <text class="notice-text">积分永久有效，不会过期</text>
        </view>
        <view class="notice-divider"></view>
        <view class="notice-row">
          <text class="notice-dot">-</text>
          <text class="notice-text">处理失败不扣除积分</text>
        </view>
        <view class="notice-divider"></view>
        <view class="notice-row">
          <text class="notice-dot">-</text>
          <text class="notice-text">充值后立即到账</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useOrderStore } from '@/store/order';

const userStore = useUserStore();
const orderStore = useOrderStore();

const isLoggedIn = computed(() => userStore.isLoggedIn);
const balance = computed(() => userStore.balance);

const selectedPackage = ref(0);
const payMethod = ref<'wechat' | 'alipay'>('wechat');
const isIOS = ref(false);
const isWeixinPlatform = ref(false);

// 检测 iOS 平台（微信小程序内 iOS 禁止虚拟支付）
onMounted(() => {
  // #ifdef MP-WEIXIN
  isWeixinPlatform.value = true;
  uni.getSystemInfo({
    success: (res) => {
      isIOS.value = res.platform === 'ios';
    }
  });
  // #endif
});

const packages = [
  { id: 'pkg-100', credits: 100, price: 9.9, bonus: 0, tag: '' },
  { id: 'pkg-300', credits: 300, price: 25.9, bonus: 30, tag: '推荐' },
  { id: 'pkg-500', credits: 500, price: 39.9, bonus: 80, tag: '热门' },
  { id: 'pkg-1000', credits: 1000, price: 69.9, bonus: 200, tag: '超值' },
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
    const order = await orderStore.createOrder(pkg.id, payMethod.value);
    uni.hideLoading();
    try {
      await orderStore.payOrder(order.id);
      uni.showToast({ title: '充值成功', icon: 'success' });
    } catch {
      uni.showToast({ title: '支付已取消', icon: 'none' });
    }
  } catch (err: any) {
    uni.hideLoading();
    uni.showToast({ title: err.message || '创建订单失败', icon: 'none' });
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 0 0 var(--space-8);
}

/* Balance card */
.balance-card {
  background: var(--color-primary);
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.balance-label {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: var(--space-2);
}
.balance-value {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: #fff;
}

/* Section */
.section {
  padding: var(--space-5) var(--space-4) 0;
}
.section-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 var(--space-4) var(--space-2);
}

/* Package grid */
.package-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.package-item {
  width: calc(50% - 6px);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-3);
  text-align: center;
  border: 2px solid transparent;
  box-shadow: var(--shadow-xs);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-fast);
}
.package-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.package-credits {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.package-unit {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}
.package-price {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--space-1);
}
.package-bonus {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  font-weight: var(--font-weight-medium);
}
.package-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-error);
  padding: 2px 8px;
  border-radius: 0 0 0 var(--radius-sm);
}
.tag-text {
  font-size: 10px;
  color: #fff;
  font-weight: var(--font-weight-medium);
}

/* Card */
.card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

/* Pay items */
.pay-item {
  display: flex;
  align-items: center;
  padding: var(--space-4);
  gap: var(--space-3);
}
.pay-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pay-icon-char {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: #fff;
}
.pay-name {
  flex: 1;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.check-circle {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-separator);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.check-circle.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.check-char {
  font-size: 12px;
  color: #fff;
  font-weight: var(--font-weight-bold);
}
.pay-divider {
  height: 0.5px;
  background: var(--color-separator);
  margin-left: calc(var(--space-4) + 32px + var(--space-3));
}

/* Pay action */
.pay-action {
  padding: var(--space-6) var(--space-4) 0;
}
.btn-pay {
  width: 100%;
  height: var(--btn-height-lg);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-pay[disabled] {
  opacity: 0.5;
}

/* Notice */
.notice-row {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  gap: var(--space-2);
}
.notice-dot {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
}
.notice-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.notice-divider {
  height: 0.5px;
  background: var(--color-separator);
  margin-left: var(--space-4);
}

/* iOS 充值提示 */
.ios-notice {
  margin-top: var(--space-2);
}
.notice-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
}
.notice-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  display: block;
}
.notice-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
  display: block;
  line-height: var(--line-height-relaxed);
}
.notice-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.notice-option {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  line-height: var(--line-height-relaxed);
}
</style>
