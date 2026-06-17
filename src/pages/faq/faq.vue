<template>
  <view class="page">
    <view class="faq-list">
      <view class="faq-item" v-for="(item, idx) in faqs" :key="idx">
        <view class="faq-question" @tap="toggle(idx)">
          <text class="q-text">{{ item.q }}</text>
          <text class="q-arrow" :class="{ open: expanded.has(idx) }">›</text>
        </view>
        <view class="faq-answer" v-if="expanded.has(idx)">
          <text class="a-text">{{ item.a }}</text>
        </view>
      </view>
    </view>

    <view class="contact-section">
      <text class="contact-title">没有找到答案？</text>
      <button class="btn-contact" @tap="goFeedback">提交反馈</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const expanded = reactive(new Set<number>());

const faqs = [
  { q: '每次处理消耗多少积分？', a: '每次视频处理消耗 10 积分。新用户注册赠送积分可免费体验。处理失败不扣除积分。' },
  { q: '支持哪些视频格式？', a: '支持 MP4、MOV、AVI 等主流视频格式。最大文件大小 100MB，建议视频时长不超过 10 分钟以获得最佳处理效果。' },
  { q: '处理需要多长时间？', a: '处理时间取决于视频大小和时长，通常 30 秒至 5 分钟不等。处理完成后会通过小程序消息通知您。' },
  { q: '处理后的视频画质会降低吗？', a: '不会。我们使用先进的 AI 算法，在去除字幕/水印的同时保持原始视频画质。输出分辨率与原视频一致。' },
  { q: '如何获取更多积分？', a: '您可以在"充值中心"购买积分套餐，也可关注我们的活动获取赠送积分。' },
  { q: '视频上传失败怎么办？', a: '请检查网络连接是否正常，视频文件大小是否超过 100MB 限制。如问题持续，请通过反馈功能联系我们。' },
  { q: '可以去除哪些平台的水印？', a: '支持去除视频中常见的字幕、台标、水印图标等。粘贴视频链接可解析抖音、快手、小红书等 150+ 主流平台。' },
  { q: '我的视频数据安全吗？', a: '非常安全。您的视频仅用于处理，处理完成后会自动删除。我们不会将您的视频分享给任何第三方。详见《隐私政策》。' },
];

function toggle(idx: number) {
  if (expanded.has(idx)) {
    expanded.delete(idx);
  } else {
    expanded.add(idx);
  }
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-4);
}
.faq-list {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}
.faq-item {
  border-bottom: 0.5px solid var(--color-separator);
}
.faq-item:last-child {
  border-bottom: none;
}
.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
}
.q-text {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}
.q-arrow {
  font-size: var(--font-size-xl);
  color: var(--color-text-quaternary);
  line-height: 1;
  transition: transform var(--transition-fast);
  margin-left: var(--space-3);
}
.q-arrow.open {
  transform: rotate(90deg);
}
.faq-answer {
  padding: 0 var(--space-4) var(--space-4);
}
.a-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
.contact-section {
  text-align: center;
  padding: var(--space-8) 0;
}
.contact-title {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}
.btn-contact {
  width: 180px;
  height: var(--btn-height-md);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
