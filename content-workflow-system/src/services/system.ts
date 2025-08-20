import { api } from './api';

// 系统相关类型定义
export interface SystemInfo {
  version: string;
  buildTime: string;
  environment: 'development' | 'staging' | 'production';
  uptime: number;
  nodeVersion: string;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface SystemConfig {
  siteName: string;
  siteDescription: string;
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface SystemLog {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  source: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface BackupInfo {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'failed' | 'in_progress';
}

// 系统服务类
export class SystemService {
  private static apiClient = api;

  // 获取系统信息
  static async getSystemInfo(): Promise<SystemInfo> {
    const response = await this.apiClient.get('/api/system/info');
    return response.data;
  }

  // 获取系统配置
  static async getSystemConfig(): Promise<SystemConfig> {
    const response = await this.apiClient.get('/api/system/config');
    return response.data;
  }

  // 更新系统配置
  static async updateSystemConfig(
    config: Partial<SystemConfig>
  ): Promise<SystemConfig> {
    const response = await this.apiClient.put('/api/system/config', config);
    return response.data;
  }

  // 获取系统日志
  static async getSystemLogs(
    params: {
      page?: number;
      limit?: number;
      level?: string;
      source?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    const response = await this.apiClient.get('/api/system/logs', { params });
    return response.data;
  }

  // 清理系统日志
  static async clearSystemLogs(olderThan?: string) {
    const response = await this.apiClient.delete('/api/system/logs', {
      data: { olderThan },
    });
    return response.data;
  }

  // 获取备份列表
  static async getBackups() {
    const response = await this.apiClient.get('/api/system/backups');
    return response.data;
  }

  // 创建备份
  static async createBackup(type: 'full' | 'incremental' = 'full') {
    const response = await this.apiClient.post('/api/system/backups', { type });
    return response.data;
  }

  // 恢复备份
  static async restoreBackup(backupId: string) {
    const response = await this.apiClient.post(
      `/api/system/backups/${backupId}/restore`
    );
    return response.data;
  }

  // 删除备份
  static async deleteBackup(backupId: string) {
    const response = await this.apiClient.delete(
      `/api/system/backups/${backupId}`
    );
    return response.data;
  }

  // 系统健康检查
  static async healthCheck() {
    const response = await this.apiClient.get('/api/system/health');
    return response.data;
  }

  // 重启系统服务
  static async restartService(serviceName: string) {
    const response = await this.apiClient.post(
      `/api/system/services/${serviceName}/restart`
    );
    return response.data;
  }

  // 获取系统统计
  static async getSystemStats() {
    const response = await this.apiClient.get('/api/system/stats');
    return response.data;
  }

  // 清理系统缓存
  static async clearCache() {
    const response = await this.apiClient.post('/api/system/cache/clear');
    return response.data;
  }

  // 优化数据库
  static async optimizeDatabase() {
    const response = await this.apiClient.post('/api/system/database/optimize');
    return response.data;
  }
}

// 创建服务实例
export const systemService = new SystemService();

export default SystemService;
