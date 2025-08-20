/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../../config/environment';
import { logger } from '../../config/logger';

// 扩展 AxiosRequestConfig 类型以支持 metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// 使用统一配置管理
const apiConfig = config.getApiConfig();

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: apiConfig.baseURL + '/api',
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token和日志
apiClient.interceptors.request.use(
  config => {
    const startTime = Date.now();
    config.metadata = { startTime };
    
    // 添加认证token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 记录API请求日志
    logger.apiRequest(config.method?.toUpperCase() || 'GET', config.url || '', {
      headers: config.headers,
      params: config.params,
    });
    
    return config;
  },
  error => {
    logger.error('API请求失败', { error: error.message });
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理和日志
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    
    // 记录API响应日志
    logger.apiResponse(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      duration
    );
    
    return response.data;
  },
  error => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    const status = error.response?.status || 0;
    
    // 记录API错误日志
    logger.apiResponse(
      error.config?.method?.toUpperCase() || 'GET',
      error.config?.url || '',
      status,
      duration
    );
    
    // 处理认证错误
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/dashboard';
      logger.security('用户认证过期，强制登出', { status, url: error.config?.url });
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    
    // 处理其他错误
    const message = error.response?.data?.message || error.message || '请求失败';
    logger.error('API请求错误', { 
      status, 
      message, 
      url: error.config?.url,
      method: error.config?.method 
    });
    
    return Promise.reject(new Error(message));
  }
);

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  items: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

// 通用API方法
export const api = {
  // GET请求
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return apiClient.get(url, config);
  },

  // POST请求
  post: <T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return apiClient.post(url, data, config);
  },

  // PUT请求
  put: <T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return apiClient.put(url, data, config);
  },

  // PATCH请求
  patch: <T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return apiClient.patch(url, data, config);
  },

  // DELETE请求
  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return apiClient.delete(url, config);
  },
};

export default apiClient;
