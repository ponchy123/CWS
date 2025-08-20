import { api } from './api';

// 客户相关接口定义
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: string;
  status: 'high_intent' | 'following' | 'closed' | 'inactive' | 'lost';
  score: number;
  tags: string[];
  lastContact: string;
  nextFollowUp: string;
  notes: string;
  avatar: string;
  totalValue: number;
  interactions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  conversionRate: number;
  activeCustomers: number;
  averageCustomerValue: number;
  customerSatisfaction: number;
  averageConversionCycle: number;
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  rate: number;
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  source?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: string;
  status: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  score?: number;
  totalValue?: number;
  lastContact?: string;
  nextFollowUp?: string;
}

export interface ContactRecord {
  id: number;
  customerId: number;
  method: 'phone' | 'email' | 'meeting' | 'message';
  content: string;
  result: string;
  nextAction?: string;
  createdAt: string;
}

export interface FollowUpReminder {
  id: number;
  customerId: number;
  customer: Customer;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue';
  notes: string;
}

// 客户管理服务类
class CustomerService {
  // 获取客户统计数据
  async getCustomerStats(): Promise<CustomerStats> {
    const response = await api.get('/customers/stats');
    return response.data;
  }

  // 获取客户列表
  async getCustomers(filters?: CustomerFilters): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }

    const response = await api.get(`/customers?${params.toString()}`);
    return response.data;
  }

  // 获取单个客户详情
  async getCustomer(customerId: number): Promise<Customer> {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  }

  // 创建新客户
  async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    const response = await api.post('/customers', customerData);
    return response.data;
  }

  // 更新客户信息
  async updateCustomer(
    customerId: number,
    customerData: UpdateCustomerData
  ): Promise<Customer> {
    const response = await api.put(`/customers/${customerId}`, customerData);
    return response.data;
  }

  // 删除客户
  async deleteCustomer(customerId: number): Promise<void> {
    await api.delete(`/customers/${customerId}`);
  }

  // 批量导入客户
  async importCustomers(file: File): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 导出客户数据
  async exportCustomers(filters?: CustomerFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));

    const response = await api.get(`/customers/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // 获取转化漏斗数据
  async getConversionFunnel(): Promise<ConversionFunnelStage[]> {
    const response = await api.get('/customers/conversion-funnel');
    return response.data;
  }

  // 记录客户联系
  async recordContact(
    customerId: number,
    contactData: {
      method: 'phone' | 'email' | 'meeting' | 'message';
      content: string;
      result: string;
      nextAction?: string;
    }
  ): Promise<ContactRecord> {
    const response = await api.post(
      `/customers/${customerId}/contacts`,
      contactData
    );
    return response.data;
  }

  // 获取客户联系记录
  async getContactHistory(customerId: number): Promise<ContactRecord[]> {
    const response = await api.get(`/customers/${customerId}/contacts`);
    return response.data;
  }

  // 更新客户评分
  async updateCustomerScore(
    customerId: number,
    score: number
  ): Promise<Customer> {
    const response = await api.patch(`/customers/${customerId}/score`, {
      score,
    });
    return response.data;
  }

  // 添加客户标签
  async addCustomerTags(customerId: number, tags: string[]): Promise<Customer> {
    const response = await api.post(`/customers/${customerId}/tags`, { tags });
    return response.data;
  }

  // 移除客户标签
  async removeCustomerTags(
    customerId: number,
    tags: string[]
  ): Promise<Customer> {
    const response = await api.delete(`/customers/${customerId}/tags`, {
      data: { tags },
    });
    return response.data;
  }

  // 获取跟进提醒列表
  async getFollowUpReminders(): Promise<FollowUpReminder[]> {
    const response = await api.get('/customers/follow-up-reminders');
    return response.data;
  }

  // 创建跟进提醒
  async createFollowUpReminder(
    customerId: number,
    reminderData: {
      dueDate: string;
      priority: 'high' | 'medium' | 'low';
      notes: string;
    }
  ): Promise<FollowUpReminder> {
    const response = await api.post(
      `/customers/${customerId}/follow-up-reminders`,
      reminderData
    );
    return response.data;
  }

  // 完成跟进提醒
  async completeFollowUpReminder(
    reminderId: number
  ): Promise<FollowUpReminder> {
    const response = await api.patch(
      `/customers/follow-up-reminders/${reminderId}/complete`
    );
    return response.data;
  }

  // 获取客户分析数据
  async getCustomerAnalytics(dateRange?: {
    start: string;
    end: string;
  }): Promise<{
    sourceDistribution: { source: string; count: number; percentage: number }[];
    statusDistribution: { status: string; count: number; percentage: number }[];
    monthlyTrends: {
      month: string;
      newCustomers: number;
      conversions: number;
    }[];
    topCustomers: Customer[];
  }> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }

    const response = await api.get(`/customers/analytics?${params.toString()}`);
    return response.data;
  }

  // 搜索客户
  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await api.get(
      `/customers/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  // 获取客户活动时间线
  async getCustomerTimeline(customerId: number): Promise<
    {
      id: number;
      type:
        | 'contact'
        | 'status_change'
        | 'note_added'
        | 'tag_added'
        | 'value_updated';
      title: string;
      description: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    }[]
  > {
    const response = await api.get(`/customers/${customerId}/timeline`);
    return response.data;
  }
}

// 导出服务实例
export const customerService = new CustomerService();
