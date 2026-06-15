# Component Overview

Architecture overview of the frontend components in the Video Subtitle Removal Mini-Program.

---

## Table of Contents

- [Architecture](#architecture)
- [Component Categories](#component-categories)
- [Component List](#component-list)
- [Design Principles](#design-principles)

---

## Architecture

The application uses Vue 3 Composition API with `<script setup>` syntax. Components follow a hierarchical structure:

- **Page components** (`src/pages/`) - Full page views
- **Shared components** (`src/components/`) - Reusable UI elements
- **Utility components** - Helper components for specific tasks

---

## Component Categories

| Category | Directory | Description |
|----------|-----------|-------------|
| Pages | `src/pages/` | Full page views |
| Components | `src/components/` | Reusable components |

---

## Component List

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| [VideoUploader](./video-uploader.md) | `src/components/VideoUploader.vue` | Video file upload |
| PrivacyDialog | `src/components/PrivacyDialog.vue` | Privacy consent dialog |

### Page Components

| Page | Path | Description |
|------|------|-------------|
| Index | `src/pages/index/` | Home page |
| Upload | `src/pages/upload/` | Upload page |
| Preview | `src/pages/preview/` | Video preview |
| Processing | `src/pages/processing/` | Task processing |
| Result | `src/pages/result/` | Result display |
| Login | `src/pages/login/` | User login |
| User | `src/pages/user/` | User center |
| History | `src/pages/history/` | Processing history |
| Recharge | `src/pages/recharge/` | Points recharge |

---

## Design Principles

1. **Single Responsibility**: Each component handles one concern
2. **Composition over Inheritance**: Use composables for shared logic
3. **Platform Abstraction**: Use conditional compilation for platform differences
4. **Type Safety**: All props and events are fully typed
5. **Accessibility**: Include proper ARIA attributes where applicable

---

*Last updated: 2026-06-15*
