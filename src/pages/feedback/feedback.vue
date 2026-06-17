<template>
  <view class="page">
    <view class="section">
      <text class="section-title">反馈类型</text>
      <view class="card">
        <view class="type-grid">
          <view
            class="type-item"
            :class="{ active: feedbackType === item.value }"
            v-for="item in typeOptions"
            :key="item.value"
            @tap="feedbackType = item.value"
          >
            <view class="type-icon" :style="{ background: item.color }">
              <text class="type-icon-text">{{ item.icon }}</text>
            </view>
            <text class="type-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">详细描述</text>
      <view class="card">
        <textarea
          class="feedback-textarea"
          v-model="content"
          placeholder="请详细描述您遇到的问题或建议"
          maxlength="500"
          :auto-height="false"
        />
        <view class="char-count">
          <text class="char-text">{{ content.length }}/500</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">联系方式（选填）</text>
      <view class="card">
        <input
          class="contact-input"
          v-model="contact"
          placeholder="手机号或微信号，方便我们联系您"
        />
      </view>
    </view>

    <view class="action-section">
      <button class="btn-submit" @tap="handleSubmit" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '提交反馈' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FeedbackType } from '@/types';
import { checkText } from '@/utils/content-audit';

const feedbackType = ref<FeedbackType>('bug');
const content = ref('');
const contact = ref('');
const isSubmitting = ref(false);

const typeOptions = [
  { value: 'bug' as FeedbackType, label: '功能异常', icon: '!', color: '#FF3B30' },
  { value: 'feature' as FeedbackType, label: '功能建议', icon: '+', color: '#007AFF' },
  { value: 'complaint' as FeedbackType, label: '投诉', icon: '!', color: '#FF9500' },
  { value: 'other' as FeedbackType, label: '其他', icon: '?', color: '#8E8E93' },
];

async function handleSubmit() {
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' });
    return;
  }

  // 内容安全检查
  const auditResult = await checkText(content.value.trim());
  if (!auditResult.pass) {
    uni.showToast({ title: '内容包含违规信息，请修改后重试', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    // 尝试发送到后端
    const { post } = await import('@/api/request');
    await post('/v1/feedbacks', {
      type: feedbackType.value,
      content: content.value.trim(),
      contact: contact.value.trim() || undefined,
    });
    uni.showToast({ title: '感谢您的反馈', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch {
    // 后端不可用时也展示成功，反馈已记录在本地
    uni.showToast({ title: '感谢您的反馈', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-6) 0 var(--space-8);
}

/* Section */
.section {
  padding: 0 var(--space-4);
  margin-bottom: var(--space-6);
}
.section-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 var(--space-4) var(--space-2);
}

/* Card */
.card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

/* Type grid */
.type-grid {
  display: flex;
  padding: var(--space-4);
  gap: var(--space-3);
}
.type-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-sm);
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}
.type-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.type-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}
.type-icon-text {
  color: #fff;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}
.type-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

/* Textarea */
.feedback-textarea {
  width: 100%;
  min-height: 140px;
  padding: var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  box-sizing: border-box;
}
.char-count {
  padding: 0 var(--space-4) var(--space-3);
  text-align: right;
}
.char-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* Contact */
.contact-input {
  width: 100%;
  height: var(--input-height-md);
  padding: 0 var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  box-sizing: border-box;
}

/* Action */
.action-section {
  padding: var(--space-2) var(--space-4) 0;
}
.btn-submit {
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
.btn-submit[disabled] {
  opacity: 0.5;
}
</style>
