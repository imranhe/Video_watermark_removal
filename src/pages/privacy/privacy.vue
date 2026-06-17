<template>
  <view class="page">
    <view class="content-card">
      <text class="doc-title">隐私政策</text>
      <text class="doc-date">最后更新：2026 年 6 月</text>

      <view class="section">
        <text class="section-heading">一、信息收集</text>
        <text class="body-text">我们可能收集以下信息：</text>
        <text class="body-text">1. 您上传的视频文件（仅用于提供视频处理服务，处理完成后将在 7 天内从服务器自动删除）</text>
        <text class="body-text">2. 设备信息（设备型号、操作系统版本）</text>
        <text class="body-text">3. 网络状态信息</text>
        <text class="body-text">4. 微信账号基本信息（用于用户身份识别和账户管理）</text>
        <text class="body-text">注意：我们不会对您上传的视频文件进行任何形式的备份存储或用于服务以外的其他用途。</text>
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
        <text class="section-heading">四、第三方服务</text>
        <text class="body-text">为提供视频处理服务，我们会使用以下第三方服务：</text>
        <text class="body-text">1. 阿里云 OSS：用于视频文件的临时存储，视频文件仅在处理期间存储于阿里云 OSS，处理完成后将按规定期限删除</text>
        <text class="body-text">2. 阿里云 MPS（媒体处理服务）：用于视频的转码和字幕去除处理</text>
        <text class="body-text">我们要求上述第三方服务提供商严格遵守数据安全标准，仅为完成服务目的而处理您的视频数据。</text>
      </view>

      <view class="section">
        <text class="section-heading">五、数据存储与删除</text>
        <text class="body-text">1. 您上传的原始视频文件将在处理完成后 7 天内自动从服务器删除</text>
        <text class="body-text">2. 处理完成的视频结果文件将在生成后 7 天内自动删除，请及时下载保存</text>
        <text class="body-text">3. 账户信息将在您注销账户后 30 天内完成删除</text>
        <text class="body-text">4. 法律法规另有规定的除外</text>
      </view>

      <view class="section">
        <text class="section-heading">六、信息共享</text>
        <text class="body-text">我们不会将您的个人信息共享给第三方，除非获得您的明确同意或法律法规要求。</text>
      </view>

      <view class="section">
        <text class="section-heading">七、儿童隐私</text>
        <text class="body-text">本小程序不面向未满 14 周岁的未成年人提供服务。如您是未满 18 周岁的未成年人，请在法定监护人的陪同下阅读本隐私政策。</text>
      </view>

      <view class="section">
        <text class="section-heading">八、联系我们</text>
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
