/**
 * 修复服务文件中的语法错误和编码问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 修复 user.ts 文件
function fixUserService() {
  const filePath = path.join(rootDir, 'src/services/user.ts');
  
  // 完全重写的内容
  const newContent = `import { api } from './api';
import { handleError } from 'utils/errorHandler';
import { showNotification } from '@/hooks/notification-compat';

// 用户相关接口定义
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'contributor';
  status: 'active' | 'inactive' | 'suspended';
  department: string;
  position: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  loginCount: number;
  isOnline: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer' | 'contributor';
  department: string;
  position: string;
  phone?: string;
  permissions: string[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'editor' | 'viewer' | 'contributor';
  status?: 'active' | 'inactive' | 'suspended';
  department?: string;
  position?: string;
  phone?: string;
  permissions?: string[];
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    admin: number;
    editor: number;
    viewer: number;
    contributor: number;
  };
  usersByDepartment: {
    [key: string]: number;
  };
  loginStats: {
    date: string;
    count: number;
  }[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export interface UserActivity {
  id: number;
  userId: number;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ip: string;
  userAgent: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface BulkUserOperation {
  userIds: number[];
  operation: 'activate' | 'deactivate' | 'suspend' | 'delete';
}

// 用户管理服务类
export class UserService {
  // 获取用户列表
  static async getUsers(
    params: UserListParams = {}
  ): Promise<UserListResponse> {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取用户列表失败');
      throw error;
    }
  }

  // 获取用户详情
  static async getUserById(id: number): Promise<User> {
    try {
      const response = await api.get(\`/users/\${id}\`);
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取用户详情失败');
      throw error;
    }
  }

  // 创建用户
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await api.post('/users', userData);
      showNotification({
        title: '成功',
        message: '用户创建成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '创建用户失败');
      throw error;
    }
  }

  // 更新用户
  static async updateUser(
    id: number,
    userData: UpdateUserRequest
  ): Promise<User> {
    try {
      const response = await api.put(\`/users/\${id}\`, userData);
      showNotification({
        title: '成功',
        message: '用户更新成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '更新用户失败');
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(\`/users/\${id}\`);
      showNotification({
        title: '成功',
        message: '用户删除成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '删除用户失败');
      throw error;
    }
  }

  // 批量操作用户
  static async bulkOperateUsers(operation: BulkUserOperation): Promise<void> {
    try {
      await api.post('/users/bulk-operation', operation);
      showNotification({
        title: '成功',
        message: '批量操作成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '批量操作失败');
      throw error;
    }
  }

  // 重置用户密码
  static async resetPassword(
    id: number
  ): Promise<{ temporaryPassword: string }> {
    try {
      const response = await api.post(\`/users/\${id}/reset-password\`);
      showNotification({
        title: '成功',
        message: '密码重置成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '重置密码失败');
      throw error;
    }
  }

  // 修改用户密码
  static async changePassword(
    id: number,
    passwordData: PasswordChangeRequest
  ): Promise<void> {
    try {
      await api.post(\`/users/\${id}/change-password\`, passwordData);
      showNotification({
        title: '成功',
        message: '密码修改成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '修改密码失败');
      throw error;
    }
  }

  // 获取用户统计数据
  static async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取用户统计失败');
      throw error;
    }
  }

  // 获取所有权限
  static async getPermissions(): Promise<Permission[]> {
    try {
      const response = await api.get('/permissions');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取权限列表失败');
      throw error;
    }
  }

  // 获取所有角色
  static async getRoles(): Promise<Role[]> {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取角色列表失败');
      throw error;
    }
  }

  // 创建角色
  static async createRole(
    roleData: Omit<Role, 'id' | 'userCount'>
  ): Promise<Role> {
    try {
      const response = await api.post('/roles', roleData);
      showNotification({
        title: '成功',
        message: '角色创建成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '创建角色失败');
      throw error;
    }
  }

  // 更新角色
  static async updateRole(
    id: string,
    roleData: Partial<Omit<Role, 'id' | 'userCount'>>
  ): Promise<Role> {
    try {
      const response = await api.put(\`/roles/\${id}\`, roleData);
      showNotification({
        title: '成功',
        message: '角色更新成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '更新角色失败');
      throw error;
    }
  }

  // 删除角色
  static async deleteRole(id: string): Promise<void> {
    try {
      await api.delete(\`/roles/\${id}\`);
      showNotification({
        title: '成功',
        message: '角色删除成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '删除角色失败');
      throw error;
    }
  }

  // 获取用户活动日志
  static async getUserActivities(
    userId?: number,
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{
    activities: UserActivity[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const url = userId ? \`/users/\${userId}/activities\` : '/users/activities';
      const response = await api.get(url, { params });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '获取用户活动日志失败');
      throw error;
    }
  }

  // 上传用户头像
  static async uploadAvatar(
    id: number,
    file: File
  ): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post(\`/users/\${id}/avatar\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showNotification({
        title: '成功',
        message: '头像上传成功',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '头像上传失败');
      throw error;
    }
  }

  // 导出用户数据
  static async exportUsers(params: UserListParams = {}): Promise<Blob> {
    try {
      const response = await api.get('/users/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '导出用户数据失败');
      throw error;
    }
  }

  // 导入用户数据
  static async importUsers(file: File): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showNotification({
        title: '成功',
        message: '用户数据导入完成',
        type: 'success',
      });
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '导入用户数据失败');
      throw error;
    }
  }

  // 检查用户名是否可用
  static async checkUsernameAvailability(
    username: string
  ): Promise<{ available: boolean }> {
    try {
      const response = await api.get(\`/users/check-username/\${username}\`);
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '检查用户名失败');
      throw error;
    }
  }

  // 检查邮箱是否可用
  static async checkEmailAvailability(
    email: string
  ): Promise<{ available: boolean }> {
    try {
      const response = await api.get(\`/users/check-email/\${email}\`);
      return response.data;
    } catch (error: unknown) {
      handleError(error as Error, '检查邮箱失败');
      throw error;
    }
  }

  // 发送邀请邮件
  static async sendInvitation(email: string, role: string): Promise<void> {
    try {
      await api.post('/users/invite', { email, role });
      showNotification({
        title: '成功',
        message: '邀请邮件发送成功',
        type: 'success',
      });
    } catch (error: unknown) {
      handleError(error as Error, '发送邀请邮件失败');
      throw error;
    }
  }
}

// 导出默认服务实例
export default UserService;
`;

  try {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('已修复 user.ts 文件');
    return true;
  } catch (error) {
    console.error('修复 user.ts 时出错:', error);
    return false;
  }
}

// 修复 monitor.ts 文件
function fixMonitorService() {
  const filePath = path.join(rootDir, 'src/services/monitor.ts');
  
  // 完全重写的内容
  const newContent = `import { api } from './api';
import { handleError } from 'utils/errorHandler';
import { showNotification } from '@/hooks/notification-compat';

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
  context: Record<string, any>;
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
  details: Record<string, any>;
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
  details?: Record<string, any>;
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
  config: Record<string, any>;
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
  static async getPerformanceMetrics(params: {
    startDate?: string;
    endDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  } = {}): Promise<PerformanceMetrics[]> {
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
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      await api.post('/monitor/errors', error);
    } catch (err: unknown) {
      console.error('记录错误失败:', err);
      // 不抛出异常，避免循环错误
    }
  }

  // 获取错误日志
  static async getErrorLogs(
    filter: ErrorLogFilter = {}
  ): Promise<{
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
  static async getErrorStats(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ErrorLogStats> {
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
      await api.put(\`/monitor/errors/\${id}/resolve\`);
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
      const response = await api.put(\`/monitor/alert-configs/\${id}\`, config);
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
      await api.delete(\`/monitor/alert-configs/\${id}\`);
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
  static async getAlerts(
    filter: AlertFilter = {}
  ): Promise<{
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
      await api.put(\`/monitor/alerts/\${id}/acknowledge\`);
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
  static async getAuditLogs(
    filter: AuditLogFilter = {}
  ): Promise<{
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
      const response = await api.get(\`/monitor/dashboards/\${id}\`);
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
    dashboard: Partial<Omit<MonitoringDashboard, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<MonitoringDashboard> {
    try {
      const response = await api.put(\`/monitor/dashboards/\${id}\`, dashboard);
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
      await api.delete(\`/monitor/dashboards/\${id}\`);
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
      await api.put(\`/monitor/dashboards/\${id}/set-default\`);
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
`;

  try {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('已修复 monitor.ts 文件');
    return true;
  } catch (error) {
    console.error('修复 monitor.ts 时出错:', error);
    return false;
  }
}

// 主函数：执行所有修复操作
async function main() {
  console.log('开始修复服务文件...');
  
  // 修复 user.ts
  const userFixed = fixUserService();
  if (userFixed) {
    console.log('user.ts 文件修复成功');
  } else {
    console.log('user.ts 文件修复失败');
  }
  
  // 修复 monitor.ts
  const monitorFixed = fixMonitorService();
  if (monitorFixed) {
    console.log('monitor.ts 文件修复成功');
  } else {
    console.log('monitor.ts 文件修复失败');
  }
  
  console.log('所有服务文件修复完成');
}

// 执行主函数
main().catch(error => {
  console.error('修复过程中出错:', error);
  process.exit(1);
});
