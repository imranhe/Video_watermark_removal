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
        <text class="section-heading">二、合法用途声明</text>
        <text class="body-text">本小程序仅用于合法用途。用户承诺并保证，使用本工具处理的所有视频文件均为用户本人拥有合法使用权的内容，或已获得原始版权所有者的明确授权。</text>
        <text class="body-text">用户不得利用本工具从事任何违反《中华人民共和国著作权法》《信息网络传播权保护条例》等法律法规的行为。</text>
      </view>

      <view class="section">
        <text class="section-heading">三、用户权利与义务</text>
        <text class="body-text">1. 用户应保证上传的视频内容合法合规，且不侵犯任何第三方的合法权益</text>
        <text class="body-text">2. 用户不得上传涉及侵权、色情、暴力等违规内容</text>
        <text class="body-text">3. 用户应妥善保管自己的账户信息</text>
        <text class="body-text">4. 用户对其上传的所有视频内容承担全部法律责任</text>
        <text class="body-text">5. 用户应确保对所处理的视频拥有合法的使用权或已获得版权所有者的书面授权</text>
      </view>

      <view class="section">
        <text class="section-heading">四、禁止行为</text>
        <text class="body-text">用户严禁将本工具用于以下用途：</text>
        <text class="body-text">1. 去除他人拥有版权保护的视频水印、标识或署名信息</text>
        <text class="body-text">2. 处理盗版、未经授权传播的视频内容</text>
        <text class="body-text">3. 规避数字版权管理（DRM）技术保护措施</text>
        <text class="body-text">4. 协助或便利任何侵犯他人知识产权的行为</text>
        <text class="body-text">5. 处理涉及国家秘密、商业秘密等受法律保护的内容</text>
      </view>

      <view class="section">
        <text class="section-heading">五、知识产权</text>
        <text class="body-text">1. 本小程序及其所有技术、代码、界面设计等知识产权归平台所有</text>
        <text class="body-text">2. 用户上传的原始视频内容的知识产权归属不因使用本服务而发生任何变更</text>
        <text class="body-text">3. 经本工具处理后生成的视频结果，其知识产权仍归属于原始视频的版权所有者</text>
        <text class="body-text">4. 用户使用本服务不代表获得平台任何知识产权的许可或转让</text>
      </view>

      <view class="section">
        <text class="section-heading">六、服务费用</text>
        <text class="body-text">1. 本小程序提供免费试用额度</text>
        <text class="body-text">2. 超出免费额度后需付费使用</text>
        <text class="body-text">3. 具体收费标准以页面显示为准</text>
      </view>

      <view class="section">
        <text class="section-heading">七、免责声明</text>
        <text class="body-text">1. 因不可抗力导致的服务中断，本小程序不承担责任</text>
        <text class="body-text">2. 因用户违规操作导致的损失，由用户自行承担</text>
        <text class="body-text">3. 平台不对用户上传视频内容的合法性承担审查义务，如用户上传内容涉及侵权或其他违法行为，一切法律后果由用户自行承担</text>
        <text class="body-text">4. 因用户违反本协议或相关法律法规导致第三方索赔的，用户应赔偿平台因此遭受的一切损失（包括但不限于赔偿金、律师费、诉讼费等）</text>
        <text class="body-text">5. 平台有权在发现或怀疑用户存在违规行为时，立即终止服务并删除相关数据，且无需提前通知</text>
      </view>

      <view class="section">
        <text class="section-heading">八、协议变更</text>
        <text class="body-text">本小程序有权根据业务需要修改本协议，修改后的协议将在小程序内公布。</text>
      </view>

      <view class="section">
        <text class="section-heading">九、联系我们</text>
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
