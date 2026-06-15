/**
 * 订单相关类型定义
 */

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export type PaymentPlatform = 'wechat' | 'alipay';

export interface Order {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  status: OrderStatus;
  platform: PaymentPlatform;
  createdAt: string;
}

export interface CreateOrderParams {
  credits: number;
  platform: PaymentPlatform;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}
