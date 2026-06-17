<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { ref } from "vue";
import { installGlobalErrorCapture, logInfo, logError } from "@/utils/logger";

const privacyDialog = ref<any>(null);

onLaunch(() => {
  // 启动全局错误日志
  installGlobalErrorCapture();
  logInfo("应用启动");

  // 检查是否已同意隐私协议
  const agreed = uni.getStorageSync('privacy_agreed');
  if (!agreed) {
    setTimeout(() => {
      privacyDialog.value?.showPrivacyDialog();
    }, 500);
  }
});
onShow(() => {
  logInfo("应用显示");
});
onHide(() => {
  logInfo("应用隐藏");
});
</script>
<template>
  <PrivacyDialog ref="privacyDialog" />
</template>
<style></style>
