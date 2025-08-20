// 全局类型声明
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown) => void;
    };
    gtag?: (
      command: 'event',
      eventName: string,
      parameters?: {
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }
}

export {};
