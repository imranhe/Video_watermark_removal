/**
 * 订单状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Order, OrderStatus, PaymentPlatform } from '@/types';

export const useOrderStore = defineStore('order', () => {
  // State
  const orders = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const paidOrders = computed(() =>
    orders.value.filter((o) => o.status === 'paid')
  );
  const totalSpent = computed(() =>
    paidOrders.value.reduce((sum, o) => sum + o.amount, 0)
  );

  // Actions
  async function createOrder(packageId: string, platform: 'wechat' | 'alipay') {
    isLoading.value = true;
    error.value = null;

    try {
      const { post } = await import('@/api/request');
      const response = await post<any>('/v1/orders', {
        package_id: packageId,
        payment_method: platform,
      });
      const orderData = response.data;
      const order: Order = {
        id: orderData.id,
        orderNo: orderData.order_no,
        userId: orderData.user_id,
        packageId: orderData.package_id,
        packageName: orderData.package_name,
        amount: orderData.amount,
        credits: orderData.credits,
        status: orderData.status,
        paymentMethod: orderData.payment_method,
        paymentParams: orderData.payment_params,
        transactionId: null,
        paidAt: null,
        createdAt: orderData.created_at,
        updatedAt: orderData.created_at,
        deletedAt: null,
      };
      currentOrder.value = order;
      orders.value.unshift(order);
      return order;
    } catch (err: any) {
      error.value = err.message || '创建订单失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function payOrder(orderId: string) {
    try {
      // 支付参数已在 createOrder 返回的 paymentParams 中
      // 小程序端调用 wx.requestPayment 发起支付
      const order = orders.value.find((o) => o.id === orderId);
      if (order && order.paymentParams) {
        await new Promise<void>((resolve, reject) => {
          uni.requestPayment({
            ...order.paymentParams,
            success: () => {
              if (order) {
                order.status = 'paid';
                currentOrder.value = order;
              }
              resolve();
            },
            fail: (err) => reject(new Error(err.errMsg || '支付失败')),
          });
        });
      }
    } catch (err: any) {
      error.value = err.message || '支付失败';
      throw err;
    }
  }

  function setCurrentOrder(order: Order | null) {
    currentOrder.value = order;
  }

  function clearOrders() {
    orders.value = [];
    currentOrder.value = null;
  }

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    // Getters
    paidOrders,
    totalSpent,
    // Actions
    createOrder,
    payOrder,
    setCurrentOrder,
    clearOrders,
  };
});
