/**
 * 订单状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface Order {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  status: 'pending' | 'paid' | 'cancelled';
  platform: 'wechat' | 'alipay';
  createdAt: string;
}

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
  async function createOrder(amount: number, credits: number, platform: 'wechat' | 'alipay') {
    isLoading.value = true;
    error.value = null;

    try {
      // TODO: 调用后端创建订单接口
      // const response = await post<Order>('/api/orders/create', {
      //   amount,
      //   credits,
      //   platform,
      // });
      // currentOrder.value = response.data;
      // orders.value.unshift(response.data);
      // return response.data;

      // Mock 实现
      const mockOrder: Order = {
        id: Date.now().toString(),
        userId: 'user-1',
        amount,
        credits,
        status: 'pending',
        platform,
        createdAt: new Date().toISOString(),
      };
      currentOrder.value = mockOrder;
      orders.value.unshift(mockOrder);
      return mockOrder;
    } catch (err: any) {
      error.value = err.message || '创建订单失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function payOrder(orderId: string) {
    try {
      // TODO: 调用支付接口
      // await post(`/api/orders/${orderId}/pay`);

      // Mock 实现
      const order = orders.value.find((o) => o.id === orderId);
      if (order) {
        order.status = 'paid';
        currentOrder.value = order;
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
