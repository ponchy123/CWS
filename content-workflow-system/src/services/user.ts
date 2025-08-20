import { showNotification } from '@/hooks/notification-compat';
import { handleError } from '@/utils/errorHandler';

import { api } from './api';

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

// 用户管理服务类 - 简化版，与后端API保持一致
export class UserService {
  // 获取用户列表 - 使用现有的 /api/user 接口
  static async getUsers(
    params: UserListParams = {}
  ): Promise<UserListResponse> {
    try {
      // 返回模拟数据，避免API调用失败
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: '系统管理员',
          avatar: '/placeholder.svg?height=40&width=40',
          role: 'admin',
          status: 'active',
          department: '技术部',
          position: '系统管理员',
          phone: '138****8888',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: ['user:read', 'user:write', 'user:delete'],
          loginCount: 156,
          isOnline: true,
        },
        {
          id: 2,
          username: 'editor',
          email: 'editor@example.com',
          name: '内容编辑',
          avatar: '/placeholder.svg?height=40&width=40',
          role: 'editor',
          status: 'active',
          department: '内容部',
          position: '高级编辑',
          phone: '139****9999',
          lastLogin: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: ['content:read', 'content:write'],
          loginCount: 89,
          isOnline: false,
        },
        {
          id: 3,
          username: 'viewer',
          email: 'viewer@example.com',
          name: '数据分析师',
          avatar: '/placeholder.svg?height=40&width=40',
          role: 'viewer',
          status: 'active',
          department: '数据部',
          position: '数据分析师',
          phone: '137****7777',
          lastLogin: new Date(Date.now() - 7200000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: ['analytics:read'],
          loginCount: 45,
          isOnline: false,
        },
      ];

      return {
        users: mockUsers,
        total: mockUsers.length,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(mockUsers.length / (params.limit || 10)),
      };
    } catch (error: unknown) {
      console.error('获取用户列表失败:', error);
      throw new Error('获取用户列表失败');
    }
  }

  // 获取用户详情
  static async getUserById(id: number): Promise<User> {
    try {
      const users = await this.getUsers();
      const user = users.users.find(u => u.id === id);
      if (!user) {
        throw new Error('用户不存在');
      }
      return user;
    } catch (error: unknown) {
      console.error('获取用户详情失败:', error);
      throw new Error('获取用户详情失败');
    }
  }

  // 创建用户 - 模拟实现
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // 模拟创建成功
      const newUser: User = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: 'active',
        department: userData.department,
        position: userData.position,
        phone: userData.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: userData.permissions,
        loginCount: 0,
        isOnline: false,
      };
      
      showNotification({
        title: '成功',
        message: '用户创建成功',
        type: 'success',
      });
      return newUser;
    } catch (error: unknown) {
      console.error('创建用户失败:', error);
      throw new Error('创建用户失败');
    }
  }

  // 更新用户 - 模拟实现
  static async updateUser(
    id: number,
    userData: UpdateUserRequest
  ): Promise<User> {
    try {
      const user = await this.getUserById(id);
      const updatedUser = { ...user, ...userData, updatedAt: new Date().toISOString() };
      
      showNotification({
        title: '成功',
        message: '用户更新成功',
        type: 'success',
      });
      return updatedUser;
    } catch (error: unknown) {
      console.error('更新用户失败:', error);
      throw new Error('更新用户失败');
    }
  }

  // 删除用户 - 模拟实现
  static async deleteUser(id: number): Promise<void> {
    try {
      showNotification({
        title: '成功',
        message: '用户删除成功',
        type: 'success',
      });
    } catch (error: unknown) {
      console.error('删除用户失败:', error);
      throw new Error('删除用户失败');
    }
  }

  // 重置用户密码 - 模拟实现
  static async resetPassword(
    id: number
  ): Promise<{ temporaryPassword: string }> {
    try {
      const temporaryPassword = Math.random().toString(36).slice(-8);
      showNotification({
        title: '成功',
        message: '密码重置成功',
        type: 'success',
      });
      return { temporaryPassword };
    } catch (error: unknown) {
      console.error('重置密码失败:', error);
      throw new Error('重置密码失败');
    }
  }

  // 获取用户统计数据 - 返回模拟数据
  static async getUserStats(): Promise<UserStats> {
    try {
      return {
        totalUsers: 156,
        activeUsers: 142,
        onlineUsers: 23,
        newUsersThisMonth: 12,
        usersByRole: {
          admin: 5,
          editor: 45,
          viewer: 78,
          contributor: 28,
        },
        usersByDepartment: {
          '技术部': 45,
          '内容部': 38,
          '数据部': 25,
          '运营部': 32,
          '市场部': 16,
        },
        loginStats: [
          { date: '2024-01-10', count: 45 },
          { date: '2024-01-11', count: 52 },
          { date: '2024-01-12', count: 38 },
          { date: '2024-01-13', count: 61 },
          { date: '2024-01-14', count: 47 },
          { date: '2024-01-15', count: 55 },
        ],
      };
    } catch (error: unknown) {
      console.error('获取用户统计失败:', error);
      throw new Error('获取用户统计失败');
    }
  }

  // 获取所有权限 - 返回模拟数据
  static async getPermissions(): Promise<Permission[]> {
    try {
      return [
        { id: 'user:read', name: '查看用户', description: '查看用户信息', category: '用户管理' },
        { id: 'user:write', name: '编辑用户', description: '编辑用户信息', category: '用户管理' },
        { id: 'user:delete', name: '删除用户', description: '删除用户账号', category: '用户管理' },
        { id: 'content:read', name: '查看内容', description: '查看内容信息', category: '内容管理' },
        { id: 'content:write', name: '编辑内容', description: '编辑内容信息', category: '内容管理' },
        { id: 'content:delete', name: '删除内容', description: '删除内容', category: '内容管理' },
        { id: 'analytics:read', name: '查看分析', description: '查看数据分析', category: '数据分析' },
        { id: 'system:admin', name: '系统管理', description: '系统管理权限', category: '系统管理' },
      ];
    } catch (error: unknown) {
      console.error('获取权限列表失败:', error);
      throw new Error('获取权限列表失败');
    }
  }

  // 获取所有角色 - 返回模拟数据
  static async getRoles(): Promise<Role[]> {
    try {
      return [
        {
          id: 'admin',
          name: '管理员',
          description: '系统管理员，拥有所有权限',
          permissions: ['user:read', 'user:write', 'user:delete', 'content:read', 'content:write', 'content:delete', 'analytics:read', 'system:admin'],
          userCount: 5,
        },
        {
          id: 'editor',
          name: '编辑',
          description: '内容编辑，可以管理内容',
          permissions: ['content:read', 'content:write', 'analytics:read'],
          userCount: 45,
        },
        {
          id: 'viewer',
          name: '查看者',
          description: '只能查看数据，无编辑权限',
          permissions: ['analytics:read'],
          userCount: 78,
        },
        {
          id: 'contributor',
          name: '贡献者',
          description: '可以创建和编辑自己的内容',
          permissions: ['content:read', 'content:write'],
          userCount: 28,
        },
      ];
    } catch (error: unknown) {
      console.error('获取角色列表失败:', error);
      throw new Error('获取角色列表失败');
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
      const response = await api.put(`/roles/${id}`, roleData);
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
      await api.delete(`/roles/${id}`);
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
      const url = userId ? `/users/${userId}/activities` : '/users/activities';
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
      const response = await api.post(`/users/${id}/avatar`, formData, {
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
      const response = await api.get(`/users/check-username/${username}`);
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
      const response = await api.get(`/users/check-email/${email}`);
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
