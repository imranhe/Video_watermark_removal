<template>
  <view class="page">
    <!-- Tabs -->
    <view class="tabs">
      <view class="tab" :class="{ active: currentTab === 'points' }" @tap="currentTab = 'points'">
        <text class="tab-text">积分明细</text>
      </view>
      <view class="tab" :class="{ active: currentTab === 'orders' }" @tap="currentTab = 'orders'">
        <text class="tab-text">充值记录</text>
      </view>
    </view>

    <!-- Points list -->
    <view v-if="currentTab === 'points'">
      <view class="record-list" v-if="pointsLogs.length > 0">
        <view class="record-item" v-for="log in pointsLogs" :key="log.id">
          <view class="record-info">
            <text class="record-title">{{ log.description }}</text>
            <text class="record-time">{{ formatTime(log.createdAt) }}</text>
          </view>
          <text class="record-amount" :class="{ positive: log.amount > 0 }">
            {{ log.amount > 0 ? '+' : '' }}{{ log.amount }}
          </text>
        </view>
      </view>
      <view class="empty" v-else>
        <text class="empty-text">暂无积分记录</text>
      </view>
    </view>

    <!-- Orders list -->
    <view v-if="currentTab === 'orders'">
      <view class="record-list" v-if="orders.length > 0">
        <view class="record-item" v-for="order in orders" :key="order.id">
          <view class="record-info">
            <text class="record-title">{{ order.packageName || '积分充值' }}</text>
            <text class="record-time">{{ formatTime(order.createdAt) }}</text>
          </view>
          <text class="record-amount paid">¥{{ order.amount }}</text>
        </view>
      </view>
      <view class="empty" v-else>
        <text class="empty-text">暂无充值记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { PointsLog, Order } from '@/types';
import { formatTime } from '@/utils/format';

const currentTab = ref<'points' | 'orders'>('points');
const pointsLogs = ref<PointsLog[]>([]);
const orders = ref<Order[]>([]);

onMounted(async () => {
  try {
    const { get } = await import('@/api/request');
    const [pointsRes, ordersRes] = await Promise.allSettled([
      get<any>('/v1/points/logs'),
      get<any>('/v1/orders'),
    ]);
    if (pointsRes.status === 'fulfilled') {
      pointsLogs.value = pointsRes.value.data?.list || pointsRes.value.data || [];
    }
    if (ordersRes.status === 'fulfilled') {
      orders.value = ordersRes.value.data?.list || ordersRes.value.data || [];
    }
  } catch {
    // ignore
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
}
.tabs {
  display: flex;
  background: var(--color-bg-secondary);
  box-shadow: var(--shadow-xs);
}
.tab {
  flex: 1;
  text-align: center;
  padding: var(--space-4) 0;
  border-bottom: 2px solid transparent;
}
.tab.active {
  border-bottom-color: var(--color-primary);
}
.tab-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
.tab.active .tab-text {
  color: var(--color-primary);
}
.record-list {
  padding: var(--space-2) var(--space-4);
}
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  border-bottom: 0.5px solid var(--color-separator);
}
.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.record-title {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}
.record-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
.record-amount {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.record-amount.positive {
  color: var(--color-success);
}
.record-amount.paid {
  color: var(--color-primary);
}
.empty {
  text-align: center;
  padding: var(--space-20) var(--space-4);
}
.empty-text {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
}
</style>
