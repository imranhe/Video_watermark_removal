<template>
  <view class="page">
    <view class="content-card">
      <text class="doc-title">隐私政策</text>
      <text class="doc-date">最后更新：2026 年 6 月</text>

      <view class="section">
        <text class="section-heading">一、信息收集</text>
        <text class="body-text">我们可能收集以下信息：</text>
        <text class="body-text">1. 您上传的视频文件</text>
        <text class="body-text">2. 设备信息（设备型号、操作系统版本）</text>
        <text class="body-text">3. 网络状态信息</text>
      </view>

      <view class="section">
        <text class="section-heading">二、信息使用</text>
        <text class="body-text">我们使用收集的信息用于：</text>
        <text class="body-text">1. 提供视频处理服务</text>
        <text class="body-text">2. 改善服务质量</text>
        <text class="body-text">3. 保障服务安全</text>
      </view>

      <view class="section">
        <text class="section-heading">三、信息保护</text>
        <text class="body-text">我们采取严格的安全措施保护您的个人信息安全，包括数据加密传输、访问控制、安全审计等。</text>
      </view>

      <view class="section">
        <text class="section-heading">四、信息共享</text>
        <text class="body-text">我们不会将您的个人信息共享给第三方，除非获得您的明确同意或法律法规要求。</text>
      </view>

      <view class="section">
        <text class="section-heading">五、儿童隐私</text>
        <text class="body-text">本小程序不面向未满 14 周岁的未成年人提供服务。如您是未满 18 周岁的未成年人，请在法定监护人的陪同下阅读本隐私政策。</text>
      </view>

      <view class="section">
        <text class="section-heading">六、联系我们</text>
        <text class="body-text">如有任何疑问，请通过小程序内的反馈功能联系我们。</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-4);
}
.content-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-6) var(--space-5);
  box-shadow: var(--shadow-xs);
}
.doc-title {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}
.doc-date {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-6);
}
.section {
  margin-bottom: var(--space-5);
}
.section-heading {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}
.body-text {
  display: block;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-1);
}
</style>
