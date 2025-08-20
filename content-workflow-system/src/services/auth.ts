import { api } from './api';

// 认证相关类型定义
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// 认证服务类
export class AuthService {
  private static apiClient = api;

  // 登录
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.apiClient.post('/api/auth/login', credentials);
    return response.data;
  }

  // 注册
  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.apiClient.post('/api/auth/register', data);
    return response.data;
  }

  // 登出
  static async logout(): Promise<void> {
    const response = await this.apiClient.post('/api/auth/logout');
    return response.data;
  }

  // 刷新令牌
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.apiClient.post('/api/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<User> {
    const response = await this.apiClient.get('/api/auth/me');
    return response.data;
  }

  // 更新用户信息
  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.apiClient.put('/api/auth/profile', data);
    return response.data;
  }

  // 修改密码
  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await this.apiClient.post('/api/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  }

  // 忘记密码
  static async forgotPassword(email: string): Promise<void> {
    const response = await this.apiClient.post('/api/auth/forgot-password', {
      email,
    });
    return response.data;
  }

  // 重置密码
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    const response = await this.apiClient.post('/api/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  }
}

// 创建服务实例
export const authService = new AuthService();

export default AuthService;
