// 错误类型定义
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class ApiError extends Error {
  public code: string;
  public details?: unknown;

  constructor(message: string, code: string = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error {
  public field: string;
  public value: unknown;

  constructor(message: string, field: string, value: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class NetworkError extends Error {
  public status?: number;
  public url?: string;

  constructor(message: string, status?: number, url?: string) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
  }
}

// 错误处理器
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 添加错误监听器
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  // 移除错误监听器
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  // 处理错误
  handleError(error: Error | AppError): AppError {
    let appError: AppError;

    if (error instanceof ApiError) {
      appError = {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date(),
      };
    } else if (error instanceof ValidationError) {
      appError = {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: { field: error.field, value: error.value },
        timestamp: new Date(),
      };
    } else if (error instanceof NetworkError) {
      appError = {
        code: 'NETWORK_ERROR',
        message: error.message,
        details: { status: error.status, url: error.url },
        timestamp: new Date(),
      };
    } else {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        details: error,
        timestamp: new Date(),
      };
    }

    // 通知所有监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (listenerError) {
        console.error('错误监听器执行失败:', listenerError);
      }
    });

    // 记录错误到控制台
    console.error('应用错误:', appError);

    return appError;
  }

  // 获取用户友好的错误消息
  getUserFriendlyMessage(error: AppError): string {
    const errorMessages: Record<string, string> = {
      API_ERROR: '服务器请求失败，请稍后重试',
      NETWORK_ERROR: '网络连接异常，请检查网络设置',
      VALIDATION_ERROR: '输入数据格式不正确',
      AUTH_ERROR: '身份验证失败，请重新登录',
      PERMISSION_ERROR: '权限不足，无法执行此操作',
      NOT_FOUND: '请求的资源不存在',
      RATE_LIMIT: '请求过于频繁，请稍后再试',
      SERVER_ERROR: '服务器内部错误，请联系管理员',
    };

    return errorMessages[error.code] || error.message || '操作失败，请稍后重试';
  }
}

// 全局错误处理函数
export const handleError = (
  error: Error | AppError,
  customMessage?: string
): AppError => {
  const errorHandler = ErrorHandler.getInstance();
  const appError = errorHandler.handleError(error);

  // 如果提供了自定义消息，使用自定义消息
  if (customMessage) {
    appError.message = customMessage;
  }

  return appError;
};

// 错误边界组件的错误处理
export const handleComponentError = (error: Error, errorInfo: unknown): void => {
  const appError = handleError(error);

  // 可以在这里添加错误上报逻辑
  console.error('组件错误:', {
    error: appError,
    errorInfo,
    stack: error.stack,
  });
};
