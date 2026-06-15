# VideoUploader Component

Video file upload component with multi-platform support.

---

## Table of Contents

- [Overview](#overview)
- [Import](#import)
- [Props](#props)
- [Events](#events)
- [Usage Examples](#usage-examples)
- [Platform Notes](#platform-notes)

---

## Overview

The VideoUploader component handles video file selection, validation, and upload across all supported platforms (H5, WeChat Mini Program, Alipay Mini Program, App).

---

## Import

```vue
<script setup lang="ts">
import VideoUploader from '@/components/VideoUploader.vue'
</script>
```

---

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `maxSize` | `number` | `100` | No | Maximum file size in MB |
| `maxDuration` | `number` | `300` | No | Maximum video duration in seconds |
| `accept` | `string[]` | `['mp4', 'mov', 'avi']` | No | Accepted video formats |
| `disabled` | `boolean` | `false` | No | Whether upload is disabled |
| `autoUpload` | `boolean` | `true` | No | Upload immediately after selection |

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `{ file: VideoFile }` | Video file selected |
| `upload-start` | `{ taskId: string }` | Upload started |
| `upload-progress` | `{ progress: number }` | Upload progress (0-100) |
| `upload-success` | `{ taskId: string, url: string }` | Upload completed |
| `upload-error` | `{ code: number, message: string }` | Upload failed |
| `validate-error` | `{ type: string, message: string }` | Validation failed |

---

## Usage Examples

### Basic

```vue
<template>
  <VideoUploader
    @upload-success="handleSuccess"
    @upload-error="handleError"
  />
</template>
```

### Custom Configuration

```vue
<template>
  <VideoUploader
    :max-size="200"
    :max-duration="600"
    :accept="['mp4', 'mov']"
    :auto-upload="false"
    @select="handleSelect"
  />
</template>
```

---

## Platform Notes

| Platform | Support | Notes |
|----------|---------|-------|
| H5 | Full | Uses `<input type="file">` |
| WeChat Mini Program | Full | Uses `wx.chooseVideo` |
| Alipay Mini Program | Full | Uses `my.chooseVideo` |
| App | Full | Uses native file picker |

---

*Last updated: 2026-06-15*
