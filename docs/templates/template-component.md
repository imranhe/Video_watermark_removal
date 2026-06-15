# [Component Name]

Brief description of the component and its purpose.

---

## Table of Contents

- [Overview](#overview)
- [Import](#import)
- [Props](#props)
- [Events](#events)
- [Slots](#slots)
- [Methods](#methods)
- [Usage Examples](#usage-examples)
- [Platform Notes](#platform-notes)

---

## Overview

Describe when and why to use this component. Include a visual description or screenshot reference if applicable.

**Scenarios:**

- Scenario 1: when you need to ...
- Scenario 2: when you want to ...

---

## Import

```vue
<script setup lang="ts">
import ComponentName from '@/components/ComponentName.vue'
</script>
```

---

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `propName` | `string` | `''` | Yes | Description of the prop |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | No | Component size |
| `disabled` | `boolean` | `false` | No | Whether the component is disabled |
| `maxCount` | `number` | `10` | No | Maximum number of items |
| `onChange` | `(value: string) => void` | `undefined` | No | Callback when value changes |

### Prop Details

#### `propName`

Detailed explanation of the prop, including valid values and edge cases.

```typescript
// Type definition
propName: {
  type: String as PropType<string>,
  required: true,
  validator: (value: string) => value.length > 0
}
```

---

## Events

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `change` | `{ value: string, index: number }` | Emitted when selection changes |
| `submit` | `FormData` | Emitted when form is submitted |
| `error` | `{ code: number, message: string }` | Emitted on error |

### Event Details

#### `change`

```typescript
// Event payload type
interface ChangeEvent {
  value: string
  index: number
}
```

```vue
<!-- Usage -->
<ComponentName @change="handleChange" />
```

---

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| `default` | - | Main content area |
| `header` | `{ title: string }` | Custom header |
| `footer` | `{ count: number }` | Custom footer |

```vue
<ComponentName>
  <template #header="{ title }">
    <h2>{{ title }}</h2>
  </template>

  <template #default>
    <p>Main content</p>
  </template>

  <template #footer="{ count }">
    <span>Total: {{ count }}</span>
  </template>
</ComponentName>
```

---

## Methods

Methods can be accessed via template ref:

```vue
<template>
  <ComponentName ref="componentRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const componentRef = ref()

// Call method
componentRef.value?.reset()
</script>
```

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `reset()` | - | `void` | Reset component to initial state |
| `validate()` | - | `Promise<boolean>` | Validate current state |

---

## Usage Examples

### Basic Usage

```vue
<template>
  <ComponentName
    :prop-name="value"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ComponentName from '@/components/ComponentName.vue'

const value = ref('initial')

const handleChange = (event: { value: string; index: number }) => {
  console.log('Changed:', event.value)
}
</script>
```

### With Slots

```vue
<template>
  <ComponentName :prop-name="value">
    <template #header="{ title }">
      <div class="custom-header">{{ title }}</div>
    </template>
  </ComponentName>
</template>
```

### Disabled State

```vue
<ComponentName
  :prop-name="value"
  :disabled="isSubmitting"
/>
```

---

## Platform Notes

| Platform | Support | Notes |
|----------|---------|-------|
| H5 | Full | Works as expected |
| WeChat Mini Program | Full | See WeChat-specific notes below |
| Alipay Mini Program | Full | See Alipay-specific notes below |
| App | Full | Native rendering |

### WeChat Mini Program Notes

- Note 1: specific behavior in WeChat
- Note 2: any required configuration

### Alipay Mini Program Notes

- Note 1: specific behavior in Alipay
- Note 2: any required configuration

---

*Last updated: YYYY-MM-DD*
