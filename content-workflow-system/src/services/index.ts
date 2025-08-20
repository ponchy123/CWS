// 统一导出所有服务
export { api } from './api';
export type { ApiResponse } from './api';
export { AuthService, authService } from './auth';
export { ContentService, contentService } from './content';
export { analyticsService } from './analytics';
export { PublishService, publishService } from './publish';
export { InspirationService, inspirationService } from './inspiration';
export { UserService } from './user';
export { SystemService, systemService } from './system';
export { platformService } from './platform';
export { customerService } from './customer';
export { MonitorService } from './monitor';
export { SettingsService } from './settings';

// 类型导出
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
} from './auth';
export type { Content, ContentTemplate, ContentPlan } from './content';
export type { PublishTask, PublishResult, PublishConfig } from './publish';
export type { Inspiration, InspirationCategory } from './inspiration';
