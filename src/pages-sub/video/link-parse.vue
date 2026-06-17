<template>
  <view class="page">
    <view class="section">
      <text class="section-title">粘贴链接</text>
      <view class="card">
        <textarea
          class="link-input"
          v-model="linkUrl"
          placeholder="粘贴视频链接，支持抖音、快手、小红书等 150+ 平台"
          :auto-height="false"
          maxlength="1000"
        />
        <view class="link-actions">
          <view class="paste-btn" @tap="pasteFromClipboard">
            <text class="paste-text">粘贴</text>
          </view>
          <view class="clear-btn" v-if="linkUrl" @tap="linkUrl = ''">
            <text class="clear-text">清除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">支持平台</text>
      <view class="platform-grid">
        <view class="platform-tag" v-for="p in platforms" :key="p">
          <text class="platform-text">{{ p }}</text>
        </view>
      </view>
    </view>

    <view class="action-section">
      <button class="btn-primary" @tap="handleParse" :disabled="!linkUrl.trim() || isParsing">
        {{ isParsing ? '解析中...' : '开始解析' }}
      </button>
    </view>

    <view class="tips-section" v-if="parsedResult">
      <text class="section-title">解析结果</text>
      <view class="card">
        <view class="result-row">
          <text class="result-label">平台</text>
          <text class="result-value">{{ parsedResult.platform }}</text>
        </view>
        <view class="result-divider"></view>
        <view class="result-row">
          <text class="result-label">标题</text>
          <text class="result-value">{{ parsedResult.title || '无标题' }}</text>
        </view>
        <view class="result-divider"></view>
        <view class="result-row">
          <text class="result-label">状态</text>
          <text class="result-value success">解析成功</text>
        </view>
      </view>
      <button class="btn-primary" style="margin-top:16px" @tap="handleDownload">
        下载无水印视频
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { checkText } from '@/utils/content-audit';

const linkUrl = ref('');
const isParsing = ref(false);
const parsedResult = ref<{ platform: string; title: string } | null>(null);

const platforms = ['抖音', '快手', '小红书', 'B站', '微博', '微信视频号', '西瓜视频', '微视', '美拍', '秒拍', '皮皮虾', '最右', 'TikTok', 'YouTube', 'Instagram', '更多...'];

function pasteFromClipboard() {
  uni.getClipboardData({
    success: (res) => {
      if (res.data) {
        linkUrl.value = res.data;
      }
    },
  });
}

async function handleParse() {
  if (!linkUrl.value.trim()) return;

  // 内容安全检查
  const auditResult = await checkText(linkUrl.value.trim());
  if (!auditResult.pass) {
    uni.showToast({ title: '链接包含违规信息，请检查后重试', icon: 'none' });
    return;
  }

  isParsing.value = true;
  parsedResult.value = null;

  try {
    const { post } = await import('@/api/request');
    const result = await post<any>('/v1/tasks/parse-link', {
      url: linkUrl.value.trim(),
    });
    parsedResult.value = {
      platform: result.data.platform || '未知平台',
      title: result.data.title || '',
    };
  } catch (err: any) {
    uni.showToast({ title: err.message || '链接解析失败，请检查链接是否正确', icon: 'none' });
  } finally {
    isParsing.value = false;
  }
}

async function handleDownload() {
  if (!parsedResult.value) return;
  try {
    const { post } = await import('@/api/request');
    const result = await post<any>('/v1/tasks/create-from-link', {
      url: linkUrl.value.trim(),
    });
    uni.navigateTo({
      url: `/pages-sub/video/processing?taskId=${result.data.id}`,
    });
  } catch (err: any) {
    uni.showToast({ title: err.message || '创建任务失败', icon: 'none' });
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-4);
}
.section {
  margin-bottom: var(--space-5);
}
.section-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 var(--space-4) var(--space-2);
}
.card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}
.link-input {
  width: 100%;
  min-height: 100px;
  padding: var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  box-sizing: border-box;
}
.link-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-3);
}
.paste-btn {
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-light);
  border-radius: var(--radius-xs);
}
.paste-text {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
.clear-btn {
  padding: var(--space-1) var(--space-3);
}
.clear-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
.platform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-1) 0;
}
.platform-tag {
  padding: var(--space-1) var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-xs);
}
.platform-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.action-section {
  margin-bottom: var(--space-5);
}
.btn-primary {
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
.btn-primary[disabled] {
  opacity: 0.5;
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
}
.result-label {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}
.result-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
.result-value.success {
  color: var(--color-success);
}
.result-divider {
  height: 0.5px;
  background: var(--color-separator);
  margin-left: var(--space-4);
}
</style>
