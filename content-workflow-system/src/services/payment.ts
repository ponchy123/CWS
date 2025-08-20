import { api } from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export interface CreateOrderRequest {
  amount: number;
  description: string;
  paymentMethod: string;
  userId: string;
  planType?: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  description: string;
  paymentMethod: string;
  userId: string;
  planType?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  paymentParams: any;
  qrCode?: string;
}

class PaymentService {
  // 获取支付方式列表
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get('/payment/methods');
    return response.data;
  }

  // 创建支付订单
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await api.post('/payment/create-order', orderData);
    return response.data;
  }

  // 查询订单状态
  async getOrderStatus(orderId: string): Promise<PaymentOrder> {
    const response = await api.get(`/payment/order-status/${orderId}`);
    return response.data;
  }

  // 轮询订单状态
  async pollOrderStatus(orderId: string, maxAttempts: number = 60): Promise<PaymentOrder> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          attempts++;
          const order = await this.getOrderStatus(orderId);
          
          if (order.status === 'paid') {
            clearInterval(interval);
            resolve(order);
          } else if (order.status === 'failed' || order.status === 'cancelled') {
            clearInterval(interval);
            reject(new Error(`支付${order.status === 'failed' ? '失败' : '已取消'}`));
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('支付超时'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 3000); // 每3秒查询一次
    });
  }

  // 取消订单
  async cancelOrder(orderId: string): Promise<void> {
    await api.post(`/payment/cancel-order/${orderId}`);
  }
}

export const paymentService = new PaymentService();