<template>
  <view class="page">
    <!-- Top bar -->
    <view class="top-bar">
      <view class="back-btn" @tap="goBack">
        <view class="back-arrow-css"></view>
      </view>
      <text class="top-title">会员中心</text>
      <view class="top-placeholder"></view>
    </view>

    <!-- Scrollable content -->
    <scroll-view scroll-y class="scroll-content">
      <!-- Quota badge card -->
      <view class="quota-card">
        <!-- Background glow decorations -->
        <view class="glow glow-1"></view>
        <view class="glow glow-2"></view>

        <!-- Top: monthly stats header -->
        <view class="quota-header">
          <view class="gold-badge">
            <text class="gold-badge-char">V</text>
          </view>
          <view class="quota-header-text">
            <text class="subscription-state">Subscription State</text>
            <view class="quota-row">
              <text class="quota-days-label">包月剩余 </text>
              <text class="quota-days-num">{{ monthlyDays }}</text>
              <text class="quota-days-label"> 天</text>
            </view>
          </view>
        </view>

        <!-- Bottom: permanent seconds panel -->
        <view class="seconds-panel">
          <view class="seconds-left">
            <text class="seconds-en">Permanent Access Duration</text>
            <text class="seconds-zh">永久时长剩余</text>
          </view>
          <view class="seconds-right">
            <text class="seconds-num">{{ remainingSeconds }}</text>
            <text class="seconds-unit">秒</text>
          </view>
        </view>
      </view>

      <!-- Section Packages -->
      <view class="packages-section">
        <view class="section-title-row">
          <view class="sparkles-dot"></view>
          <text class="section-title">包月套餐</text>
        </view>

        <view class="plan-list">
          <view
            class="plan-card"
            :class="{ active: selectedPlanId === plan.id }"
            v-for="plan in plans"
            :key="plan.id"
            @tap="selectedPlanId = plan.id"
          >
            <!-- Badge (top-right corner) -->
            <view class="plan-badge" v-if="plan.badge">
              <text class="plan-badge-text">{{ plan.badge }}</text>
            </view>

            <!-- Pricing row -->
            <view class="plan-row">
              <view class="plan-info">
                <view class="plan-title-line">
                  <text class="plan-title">{{ plan.title }}</text>
                  <view class="plan-tag" v-if="plan.tag">
                    <text class="plan-tag-text">{{ plan.tag }}</text>
                  </view>
                </view>
                <text class="plan-desc">{{ plan.description }}</text>
              </view>
              <view class="plan-price-col">
                <text class="price-label">价格</text>
                <text class="price-value">&yen;{{ plan.price }}</text>
              </view>
            </view>

            <!-- Tick check indicator (selected state) -->
            <view class="tick-indicator" v-if="selectedPlanId === plan.id">
              <text class="tick-char">&#x2713;</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Bottom spacer -->
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- Fixed bottom subscribe button (iOS 微信小程序隐藏) -->
    <view class="fixed-bottom" v-if="!isIOS">
      <button
        class="btn-subscribe"
        @tap="handleSubscribe"
        :disabled="!isLoggedIn"
      >
        {{ isLoggedIn ? `立即订阅 ¥${selectedPkg?.price || ''}` : '请先登录' }}
      </button>
    </view>
    <!-- iOS 充值提示 -->
    <view class="fixed-bottom" v-else>
      <view class="ios-pay-notice">
        <text class="ios-notice-text">因 Apple 政策限制，iOS 端暂不支持订阅。请使用安卓设备或网页版。</text>
      </view>
    </view>

    <!-- Payment modal - centered overlay -->
    <view class="pay-mask" v-if="showPayModal" @tap="showPayModal = false">
      <view class="pay-card" @tap.stop>
        <!-- Title -->
        <view class="pay-title-row">
          <text class="pay-qr-icon">&#x25A3;</text>
          <text class="pay-title">扫码签约收银台</text>
        </view>

        <!-- Price display -->
        <view class="pay-price-box">
          <text class="pay-price-label">确认购买</text>
          <text class="pay-price-name">{{ selectedPkg?.title }}</text>
          <text class="pay-price-amount">&yen;{{ selectedPkg?.price }}.00</text>
        </view>

        <!-- Method tabs -->
        <view class="pay-tabs">
          <view
            class="pay-tab"
            :class="{ active: payMethod === 'wechat' }"
            @tap="payMethod = 'wechat'"
          >
            <text class="pay-tab-text" :class="{ 'tab-green': payMethod === 'wechat' }">微信支付</text>
          </view>
          <view
            class="pay-tab"
            :class="{ active: payMethod === 'alipay' }"
            @tap="payMethod = 'alipay'"
          >
            <text class="pay-tab-text" :class="{ 'tab-blue': payMethod === 'alipay' }">支付宝</text>
          </view>
        </view>

        <!-- QR Code area -->
        <view class="qr-area" v-if="!paying">
          <view class="qr-placeholder">
            <text class="qr-icon">&#x25A9;</text>
            <!-- Scanning bar animation -->
            <view class="qr-scan-bar"></view>
          </view>
          <text class="qr-hint">请长按或截图扫码进行测试支付</text>
        </view>
        <view class="qr-area" v-else>
          <view class="paying-spinner">
            <text class="spinner-icon">&#x21BB;</text>
          </view>
          <text class="paying-text">正在与银行接口结算中...</text>
        </view>

        <!-- Bottom buttons -->
        <view class="pay-btns">
          <view class="btn-cancel" @tap="showPayModal = false">
            <text class="btn-cancel-text">取消</text>
          </view>
          <view class="btn-success" @tap="confirmPay" :class="{ disabled: paying }">
            <text class="btn-success-text">确认支付</text>
          </view>
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
const isVip = computed(() => {
  const vipType = userStore.userInfo?.vipType;
  return !!vipType && vipType !== 'none';
});

const selectedPlanId = ref('trial_year');
const showPayModal = ref(false);
const payMethod = ref<'wechat' | 'alipay'>('wechat');
const paying = ref(false);
const isIOS = ref(false);

// 检测 iOS 平台（微信小程序内 iOS 禁止虚拟支付）
onMounted(() => {
  // #ifdef MP-WEIXIN
  uni.getSystemInfo({
    success: (res) => {
      isIOS.value = res.platform === 'ios';
    }
  });
  // #endif
});

const vipLabel = computed(() => {
  const map: Record<string, string> = {
    none: '普通用户',
    monthly: '月度会员',
    quarterly: '季度会员',
    yearly: '年度会员',
    experience: '体验会员',
    basic: '基础会员',
    premium: '高级会员',
  };
  return map[userStore.userInfo?.vipType || 'none'] || '普通用户';
});

const remainingSeconds = computed(() => {
  // Use remainingSeconds from userInfo, fallback 0
  return userStore.userInfo?.remainingSeconds ?? 0;
});

const monthlyDays = computed(() => {
  const expireAt = userStore.userInfo?.vipExpireAt;
  if (!expireAt || !isVip.value) return 0;
  const expireDate = new Date(expireAt);
  const now = new Date();
  const diff = expireDate.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Plans matching React source exactly
const plans = [
  {
    id: 'trial_year',
    title: '体验版 (一年会员)',
    price: 99,
    duration: '1年',
    description: '每天时长300秒',
    dailyQuota: '300s',
    tag: '限时出售',
    badge: '最划算',
  },
  {
    id: 'basic_30',
    title: '基础版 (30天)',
    price: 28,
    duration: '30天',
    description: '每天时长900秒 (15分钟)',
    dailyQuota: '900s',
    tag: '',
    badge: '',
  },
  {
    id: 'premium_30',
    title: '高级版 (30天)',
    price: 48,
    duration: '30天',
    description: '每天时长1800秒 (30分钟)',
    dailyQuota: '1800s',
    tag: '',
    badge: '高频推荐',
  },
];

const selectedPkg = computed(() => {
  return plans.find((p) => p.id === selectedPlanId.value) || plans[0];
});

function goBack() {
  uni.navigateBack();
}

function handleSubscribe() {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  showPayModal.value = true;
}

async function confirmPay() {
  const pkg = selectedPkg.value;
  if (!pkg) return;

  showPayModal.value = false;
  uni.showLoading({ title: '创建订单中...' });

  try {
    const order = await orderStore.createOrder(pkg.id, payMethod.value);
    uni.hideLoading();
    try {
      await orderStore.payOrder(order.id);
      if (userStore.userInfo) {
        userStore.setUserInfo({
          ...userStore.userInfo,
          vipType: pkg.id === 'trial_year' ? 'yearly' : 'monthly',
        });
      }
      uni.showToast({ title: '开通成功', icon: 'success' });
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
/* Page background */
.page {
  min-height: 100vh;
  background: #F3F4F6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 12px 16px;
  height: 44px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.back-btn {
  width: 40px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.back-arrow-css {
  width: 10px;
  height: 10px;
  border-left: 2px solid #1f2937;
  border-bottom: 2px solid #1f2937;
  transform: rotate(45deg);
}
.top-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
.top-placeholder {
  width: 40px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Scroll content */
.scroll-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============================================
   Quota badge card
   ============================================ */
.quota-card {
  background: #8050EF;
  border-radius: 24px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(128, 80, 239, 0.3);
  min-height: 160px;
}

/* Glow decorations */
.glow {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  filter: blur(32px);
  pointer-events: none;
}
.glow-1 {
  top: -20px;
  right: -20px;
  width: 128px;
  height: 128px;
}
.glow-2 {
  bottom: -40px;
  left: -30px;
  width: 100px;
  height: 100px;
}

/* Quota header row */
.quota-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.gold-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FBBF24;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}
.gold-badge-char {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}
.quota-header-text {
  display: flex;
  flex-direction: column;
}
.subscription-state {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.quota-row {
  display: flex;
  align-items: baseline;
  margin-top: 2px;
}
.quota-days-label {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
}
.quota-days-num {
  font-size: 20px;
  font-weight: 800;
  color: #FCD34D;
  line-height: 1.3;
}

/* Seconds panel */
.seconds-panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(128, 80, 239, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.seconds-left {
  display: flex;
  flex-direction: column;
}
.seconds-en {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 500;
}
.seconds-zh {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin-top: 2px;
}
.seconds-right {
  display: flex;
  align-items: baseline;
}
.seconds-num {
  font-size: 20px;
  font-weight: 900;
  color: #2563EB;
  font-family: monospace;
}
.seconds-unit {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-left: 4px;
}

/* ============================================
   Packages section
   ============================================ */
.packages-section {
  padding: 0;
}
.section-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 0 4px;
}
.sparkles-dot {
  width: 6px;
  height: 6px;
  background: #F59E0B;
  border-radius: 50%;
}
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Plan card */
.plan-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.plan-card.active {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: scale(1.01);
}

/* Badge (top-right corner) */
.plan-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #F59E0B;
  padding: 3px 10px;
  border-radius: 0 14px 0 10px;
}
.plan-badge-text {
  font-size: 9px;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Plan row */
.plan-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.plan-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.plan-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.plan-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}
.plan-tag {
  background: #FEF3C7;
  padding: 2px 6px;
  border-radius: 4px;
}
.plan-tag-text {
  font-size: 10px;
  color: #D97706;
  font-weight: 500;
}
.plan-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  display: block;
}
.plan-price-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
.price-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
  font-family: monospace;
}
.price-value {
  font-size: 18px;
  font-weight: 900;
  color: #111827;
  margin-top: 1px;
}

/* Tick indicator (bottom-right) */
.tick-indicator {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}
.tick-char {
  font-size: 12px;
  color: #ffffff;
  font-weight: 800;
  line-height: 1;
}

/* ============================================
   Fixed bottom button
   ============================================ */
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
  z-index: 10;
}
.btn-subscribe {
  width: 100%;
  height: 48px;
  background: #1CB0F6;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 9999px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 2px;
}
.btn-subscribe[disabled] {
  opacity: 0.5;
}

/* ============================================
   Payment modal - centered overlay
   ============================================ */
.pay-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.pay-card {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid #f3f4f6;
}

/* Title */
.pay-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}
.pay-qr-icon {
  font-size: 20px;
  color: #3B82F6;
}
.pay-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

/* Price display */
.pay-price-box {
  background: #f9fafb;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
}
.pay-price-label {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 500;
  display: block;
}
.pay-price-name {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  display: block;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pay-price-amount {
  font-size: 24px;
  font-weight: 900;
  color: #111827;
  display: block;
  margin-top: 6px;
}

/* Method tabs */
.pay-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.pay-tab {
  flex: 1;
  padding: 8px 0;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pay-tab.active {
  border-color: #3B82F6;
  background: #EFF6FF;
}
.pay-tab-text {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}
.tab-green {
  color: #16a34a;
}
.tab-blue {
  color: #2563eb;
}

/* QR Code area */
.qr-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  margin-bottom: 16px;
}
.qr-placeholder {
  width: 128px;
  height: 128px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}
.qr-icon {
  font-size: 48px;
  color: #1f2937;
  opacity: 0.8;
}
.qr-scan-bar {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(59, 130, 246, 0.4);
  animation: scanSlide 2s infinite linear;
}
@keyframes scanSlide {
  0% { top: 0; }
  100% { top: 100%; }
}
.qr-hint {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 8px;
  font-weight: 500;
}

/* Paying spinner */
.paying-spinner {
  margin-bottom: 8px;
}
.spinner-icon {
  font-size: 32px;
  color: #3B82F6;
  animation: spinAnim 1s infinite linear;
}
@keyframes spinAnim {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.paying-text {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* Bottom buttons */
.pay-btns {
  display: flex;
  gap: 8px;
}
.btn-cancel {
  flex: 1;
  padding: 10px 0;
  border-radius: 12px;
  border: 1px solid #e4e4e7;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-cancel-text {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}
.btn-success {
  flex: 1;
  padding: 10px 0;
  border-radius: 12px;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}
.btn-success.disabled {
  opacity: 0.5;
}
.btn-success-icon {
  font-size: 12px;
}
.btn-success-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

/* iOS 充值提示 */
.ios-pay-notice {
  width: 100%;
  padding: 16px 20px;
  background: #fff3cd;
  border-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
}
.ios-notice-text {
  font-size: 13px;
  color: #856404;
  text-align: center;
  line-height: 1.6;
}
</style>
