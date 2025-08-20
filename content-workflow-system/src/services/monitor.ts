import { showNotification } from '@/hooks/notification-compat';
import { handleError } from '@/utils/errorHandler';

import { api } from './api';

// 监控相关接口定义
export interface SystemStatus {
  status: 'normal' | 'warning' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeUsers: number;
  lastUpdated: string;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  resourceLoadTime: number;
  renderTime: number;
  totalTime: number;
  timestamp: string;
}

export interface ErrorLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  timestamp: string;
  resolved: boolean;
  userId?: number;
  url?: string;
  userAgent?: string;
}

export interface ErrorLogFilter {
  level?: 'info' | 'warning' | 'error' | 'critical';
  startDate?: string;
  endDate?: string;
  resolved?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ErrorLogStats {
  total: number;
  byLevel: {
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
  byDate: {
    date: string;
    count: number;
  }[];
  topErrors: {
    message: string;
    count: number;
  }[];
}

export interface AlertConfig {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
    duration?: number; // 持续时间（秒）
  };
  actions: {
    type: 'email' | 'sms' | 'webhook';
    target: string;
  }[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  configId: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface AlertFilter {
  level?: 'info' | 'warning' | 'error' | 'critical';
  startDate?: string;
  endDate?: string;
  acknowledged?: boolean;
  configId?: string;
  page?: number;
  limit?: number;
}

export interface AuditLog {
  id: string;
  userId: number;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ip: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditLogFilter {
  userId?: number;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface HealthCheck {
  service: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastChecked: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  widgets: MonitoringWidget[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

export interface MonitoringWidget {
  id: string;
  type: 'chart' | 'gauge' | 'status' | 'log' | 'counter';
  title: string;
  metric: string;
  config: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 监控服务类
export class MonitorService {
  // 获取系统状态
  static async getSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await api.get('/monitor/system-status');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取系统状态失败');
      throw error;
    }
  }

  // 获取性能指标
  static async getPerformanceMetrics(
    params: {
      startDate?: string;
      endDate?: string;
      interval?: 'minute' | 'hour' | 'day';
    } = {}
  ): Promise<PerformanceMetrics[]> {
    try {
      const response = await api.get('/monitor/performance', { params });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取性能指标失败');
      throw error;
    }
  }

  // 记录前端错误
  static async logError(error: {
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await api.post('/monitor/errors', error);
    } catch (err: unknown) {
      console.error('记录错误失败:', err);
      // 不抛出异常，避免循环错误
    }
  }

  // 获取错误日志
  static async getErrorLogs(filter: ErrorLogFilter = {}): Promise<{
    logs: ErrorLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await api.get('/monitor/errors', { params: filter });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取错误日志失败');
      throw error;
    }
  }

  // 获取错误日志统计
  static async getErrorStats(
    params: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ErrorLogStats> {
    try {
      const response = await api.get('/monitor/errors/stats', { params });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取错误统计失败');
      throw error;
    }
  }

  // 解决错误
  static async resolveError(id: string): Promise<void> {
    try {
      await api.put(`/monitor/errors/${id}/resolve`);
      showNotification({
        title: '成功',
        message: '错误已标记为已解决',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '解决错误失败');
      throw error;
    }
  }

  // 批量解决错误
  static async resolveErrors(ids: string[]): Promise<void> {
    try {
      await api.put('/monitor/errors/resolve-batch', { ids });
      showNotification({
        title: '成功',
        message: '已批量解决错误',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '批量解决错误失败');
      throw error;
    }
  }

  // 获取告警配置列表
  static async getAlertConfigs(): Promise<AlertConfig[]> {
    try {
      const response = await api.get('/monitor/alert-configs');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取告警配置失败');
      throw error;
    }
  }

  // 创建告警配置
  static async createAlertConfig(
    config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AlertConfig> {
    try {
      const response = await api.post('/monitor/alert-configs', config);
      showNotification({
        title: '成功',
        message: '告警配置创建成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '创建告警配置失败');
      throw error;
    }
  }

  // 更新告警配置
  static async updateAlertConfig(
    id: string,
    config: Partial<Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AlertConfig> {
    try {
      const response = await api.put(`/monitor/alert-configs/${id}`, config);
      showNotification({
        title: '成功',
        message: '告警配置更新成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '更新告警配置失败');
      throw error;
    }
  }

  // 删除告警配置
  static async deleteAlertConfig(id: string): Promise<void> {
    try {
      await api.delete(`/monitor/alert-configs/${id}`);
      showNotification({
        title: '成功',
        message: '告警配置删除成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '删除告警配置失败');
      throw error;
    }
  }

  // 获取告警列表
  static async getAlerts(filter: AlertFilter = {}): Promise<{
    alerts: Alert[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await api.get('/monitor/alerts', { params: filter });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取告警列表失败');
      throw error;
    }
  }

  // 确认告警
  static async acknowledgeAlert(id: string): Promise<void> {
    try {
      await api.put(`/monitor/alerts/${id}/acknowledge`);
      showNotification({
        title: '成功',
        message: '告警已确认',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '确认告警失败');
      throw error;
    }
  }

  // 批量确认告警
  static async acknowledgeAlerts(ids: string[]): Promise<void> {
    try {
      await api.put('/monitor/alerts/acknowledge-batch', { ids });
      showNotification({
        title: '成功',
        message: '已批量确认告警',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '批量确认告警失败');
      throw error;
    }
  }

  // 获取审计日志
  static async getAuditLogs(filter: AuditLogFilter = {}): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await api.get('/monitor/audit-logs', { params: filter });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取审计日志失败');
      throw error;
    }
  }

  // 导出审计日志
  static async exportAuditLogs(filter: AuditLogFilter = {}): Promise<Blob> {
    try {
      const response = await api.get('/monitor/audit-logs/export', {
        params: filter,
        responseType: 'blob',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '导出审计日志失败');
      throw error;
    }
  }

  // 获取健康检查状态
  static async getHealthChecks(): Promise<HealthCheck[]> {
    try {
      const response = await api.get('/monitor/health');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取健康检查状态失败');
      throw error;
    }
  }

  // 获取监控仪表板列表
  static async getDashboards(): Promise<MonitoringDashboard[]> {
    try {
      const response = await api.get('/monitor/dashboards');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取监控仪表板列表失败');
      throw error;
    }
  }

  // 获取监控仪表板详情
  static async getDashboard(id: string): Promise<MonitoringDashboard> {
    try {
      const response = await api.get(`/monitor/dashboards/${id}`);
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取监控仪表板详情失败');
      throw error;
    }
  }

  // 创建监控仪表板
  static async createDashboard(
    dashboard: Omit<MonitoringDashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MonitoringDashboard> {
    try {
      const response = await api.post('/monitor/dashboards', dashboard);
      showNotification({
        title: '成功',
        message: '监控仪表板创建成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '创建监控仪表板失败');
      throw error;
    }
  }

  // 更新监控仪表板
  static async updateDashboard(
    id: string,
    dashboard: Partial<
      Omit<MonitoringDashboard, 'id' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<MonitoringDashboard> {
    try {
      const response = await api.put(`/monitor/dashboards/${id}`, dashboard);
      showNotification({
        title: '成功',
        message: '监控仪表板更新成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '更新监控仪表板失败');
      throw error;
    }
  }

  // 删除监控仪表板
  static async deleteDashboard(id: string): Promise<void> {
    try {
      await api.delete(`/monitor/dashboards/${id}`);
      showNotification({
        title: '成功',
        message: '监控仪表板删除成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '删除监控仪表板失败');
      throw error;
    }
  }

  // 设置默认仪表板
  static async setDefaultDashboard(id: string): Promise<void> {
    try {
      await api.put(`/monitor/dashboards/${id}/set-default`);
      showNotification({
        title: '成功',
        message: '已设置为默认仪表板',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '设置默认仪表板失败');
      throw error;
    }
  }
}

// 导出默认服务实例
export default MonitorService;
