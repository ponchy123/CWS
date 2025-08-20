import { toast } from '@/hooks/use-toast';

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const typeToTitle = (
  type: 'success' | 'error' | 'warning' | 'info'
): string => {
  switch (type) {
    case 'success':
      return '成功';
    case 'error':
      return '错误';
    case 'warning':
      return '警告';
    default:
      return '信息';
  }
};

const typeToVariant = (
  type: 'success' | 'error' | 'warning' | 'info'
): 'default' | 'destructive' => {
  return type === 'error' ? 'destructive' : 'default';
};

export const showNotification = (
  messageOrOptions: string | NotificationOptions,
  type?: 'success' | 'error' | 'warning' | 'info'
) => {
  let title: string | undefined;
  let message: string;
  let notificationType: 'success' | 'error' | 'warning' | 'info';
  let duration: number | undefined;

  if (typeof messageOrOptions === 'string') {
    message = messageOrOptions;
    notificationType = type || 'info';
  } else {
    const {
      title: optTitle,
      message: optMessage,
      type: optType = 'info',
      duration: optDuration,
    } = messageOrOptions;
    title = optTitle;
    message = optMessage;
    notificationType = optType;
    duration = optDuration;
  }

  if (!title) {
    title = typeToTitle(notificationType);
  }

  toast({
    title,
    description: message,
    variant: typeToVariant(notificationType),
  });
};

// 便捷方法
export const showSuccess = (message: string, title = '成功') => {
  showNotification({ title, message, type: 'success' });
};

export const showError = (message: string, title = '错误') => {
  showNotification({ title, message, type: 'error' });
};

export const showWarning = (message: string, title = '警告') => {
  showNotification({ title, message, type: 'warning' });
};

export const showInfo = (message: string, title = '信息') => {
  showNotification({ title, message, type: 'info' });
};
