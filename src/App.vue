<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { ref } from "vue";

const privacyDialog = ref<any>(null);

onLaunch(() => {
  console.log("App Launch");
  // 检查是否已同意隐私协议
  const agreed = uni.getStorageSync('privacy_agreed');
  if (!agreed) {
    // 显示隐私协议弹窗
    setTimeout(() => {
      privacyDialog.value?.showPrivacyDialog();
    }, 500);
  }
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<template>
  <PrivacyDialog ref="privacyDialog" />
</template>
<style></style>
