<template>
  <view class="page">
    <view class="content-card">
      <text class="doc-title">用户服务协议</text>
      <text class="doc-date">最后更新：2026 年 6 月</text>

      <view class="section">
        <text class="section-heading">一、服务说明</text>
        <text class="body-text">本小程序提供基于人工智能的视频字幕去除服务。用户上传视频后，系统将自动识别并去除视频中的字幕内容。</text>
      </view>

      <view class="section">
        <text class="section-heading">二、用户权利与义务</text>
        <text class="body-text">1. 用户应保证上传的视频内容合法合规</text>
        <text class="body-text">2. 用户不得上传涉及侵权、色情、暴力等违规内容</text>
        <text class="body-text">3. 用户应妥善保管自己的账户信息</text>
      </view>

      <view class="section">
        <text class="section-heading">三、服务费用</text>
        <text class="body-text">1. 本小程序提供免费试用额度</text>
        <text class="body-text">2. 超出免费额度后需付费使用</text>
        <text class="body-text">3. 具体收费标准以页面显示为准</text>
      </view>

      <view class="section">
        <text class="section-heading">四、免责声明</text>
        <text class="body-text">1. 因不可抗力导致的服务中断，本小程序不承担责任</text>
        <text class="body-text">2. 因用户违规操作导致的损失，由用户自行承担</text>
      </view>

      <view class="section">
        <text class="section-heading">五、协议变更</text>
        <text class="body-text">本小程序有权根据业务需要修改本协议，修改后的协议将在小程序内公布。</text>
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
