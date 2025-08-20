import { api } from './api';

// 性能指标类型
export interface PerformanceMetrics {
  // 页面性能
  pagePerformance: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
  };

  // 资源性能
  resourcePerformance: {
    totalSize: number;
    compressedSize: number;
    resourceCount: number;
    cacheHitRate: number;
    cdnHitRate: number;
    imageOptimization: number;
  };

  // 网络性能
  networkPerformance: {
    bandwidth: number;
    latency: number;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };

  // 运行时性能
  runtimePerformance: {
    memoryUsage: number;
    cpuUsage: number;
    frameRate: number;
    longTasks: number;
    scriptExecutionTime: number;
    renderTime: number;
  };
}

// 性能优化建议
export interface OptimizationSuggestion {
  id: string;
  category: 'loading' | 'rendering' | 'network' | 'caching' | 'code' | 'images';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // 预期性能提升百分比
  effort: 'low' | 'medium' | 'high';
  implementation: {
    steps: string[];
    codeExample?: string;
    resources: string[];
  };
  metrics: {
    before: any;
    expectedAfter: any;
  };
}

// 性能监控配置
export interface PerformanceMonitorConfig {
  enabled: boolean;
  sampleRate: number;
  thresholds: {
    loadTime: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
  };
  alerts: {
    email: boolean;
    webhook?: string;
    recipients: string[];
  };
}

// 缓存策略
export interface CacheStrategy {
  type: 'memory' | 'disk' | 'cdn' | 'browser';
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  compression: boolean;
  encryption: boolean;
}

// 性能预算
export interface PerformanceBudget {
  metrics: {
    loadTime: number;
    bundleSize: number;
    imageSize: number;
    requestCount: number;
  };
  alerts: {
    threshold: number;
    action: 'warn' | 'fail' | 'block';
  };
}

class PerformanceOptimizationService {
  private baseUrl = '/advanced/performance';

  // 获取性能指标
  async getPerformanceMetrics(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
    page?: string
  ): Promise<PerformanceMetrics> {
    try {
      const response = await api.get(`${this.baseUrl}/metrics`, {
        params: { timeRange, page }
      });
      return response.data;
    } catch (error) {
      console.error('获取性能指标失败:', error);
      throw error;
    }
  }

  // 分析性能瓶颈
  async analyzeBottlenecks(url?: string): Promise<{
    bottlenecks: Array<{
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      impact: number;
      location: string;
    }>;
    recommendations: OptimizationSuggestion[];
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/analyze`, { url });
      return response.data;
    } catch (error) {
      console.error('性能瓶颈分析失败:', error);
      throw error;
    }
  }

  // 获取优化建议
  async getOptimizationSuggestions(
    category?: OptimizationSuggestion['category']
  ): Promise<OptimizationSuggestion[]> {
    try {
      const response = await api.get(`${this.baseUrl}/suggestions`, {
        params: { category }
      });
      return response.data;
    } catch (error) {
      console.error('获取优化建议失败:', error);
      throw error;
    }
  }

  // 执行性能测试
  async runPerformanceTest(config: {
    url: string;
    device: 'desktop' | 'mobile';
    network: 'fast' | 'slow' | 'offline';
    iterations: number;
  }): Promise<{
    testId: string;
    results: PerformanceMetrics;
    lighthouse: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
    recommendations: OptimizationSuggestion[];
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/test`, config);
      return response.data;
    } catch (error) {
      console.error('性能测试失败:', error);
      throw error;
    }
  }

  // 配置性能监控
  async configureMonitoring(config: PerformanceMonitorConfig): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/monitoring/config`, config);
    } catch (error) {
      console.error('配置性能监控失败:', error);
      throw error;
    }
  }

  // 获取监控配置
  async getMonitoringConfig(): Promise<PerformanceMonitorConfig> {
    try {
      const response = await api.get(`${this.baseUrl}/monitoring/config`);
      return response.data;
    } catch (error) {
      console.error('获取监控配置失败:', error);
      throw error;
    }
  }

  // 设置缓存策略
  async setCacheStrategy(
    resource: string,
    strategy: CacheStrategy
  ): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/cache/strategy`, {
        resource,
        strategy
      });
    } catch (error) {
      console.error('设置缓存策略失败:', error);
      throw error;
    }
  }

  // 清除缓存
  async clearCache(type?: CacheStrategy['type']): Promise<{
    cleared: number;
    size: number;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/cache/clear`, { type });
      return response.data;
    } catch (error) {
      console.error('清除缓存失败:', error);
      throw error;
    }
  }

  // 优化图片
  async optimizeImages(images: string[]): Promise<{
    optimized: Array<{
      original: string;
      optimized: string;
      sizeBefore: number;
      sizeAfter: number;
      savings: number;
    }>;
    totalSavings: number;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/optimize/images`, {
        images
      });
      return response.data;
    } catch (error) {
      console.error('图片优化失败:', error);
      throw error;
    }
  }

  // 压缩资源
  async compressResources(resources: Array<{
    type: 'js' | 'css' | 'html';
    content: string;
  }>): Promise<Array<{
    type: string;
    originalSize: number;
    compressedSize: number;
    compression: number;
    content: string;
  }>> {
    try {
      const response = await api.post(`${this.baseUrl}/compress`, {
        resources
      });
      return response.data;
    } catch (error) {
      console.error('资源压缩失败:', error);
      throw error;
    }
  }

  // 代码分割分析
  async analyzeCodeSplitting(): Promise<{
    bundles: Array<{
      name: string;
      size: number;
      modules: string[];
      dependencies: string[];
    }>;
    suggestions: Array<{
      type: 'split' | 'merge' | 'lazy-load';
      target: string;
      reason: string;
      impact: number;
    }>;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/code-splitting`);
      return response.data;
    } catch (error) {
      console.error('代码分割分析失败:', error);
      throw error;
    }
  }

  // 设置性能预算
  async setPerformanceBudget(budget: PerformanceBudget): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/budget`, budget);
    } catch (error) {
      console.error('设置性能预算失败:', error);
      throw error;
    }
  }

  // 检查性能预算
  async checkPerformanceBudget(): Promise<{
    status: 'pass' | 'warn' | 'fail';
    results: Array<{
      metric: string;
      current: number;
      budget: number;
      status: 'pass' | 'warn' | 'fail';
    }>;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/budget/check`);
      return response.data;
    } catch (error) {
      console.error('检查性能预算失败:', error);
      throw error;
    }
  }

  // 生成性能报告
  async generatePerformanceReport(
    timeRange: '24h' | '7d' | '30d' = '7d',
    format: 'pdf' | 'html' | 'json' = 'pdf'
  ): Promise<Blob | any> {
    try {
      const response = await api.get(`${this.baseUrl}/report`, {
        params: { timeRange, format },
        responseType: format === 'json' ? 'json' : 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('生成性能报告失败:', error);
      throw error;
    }
  }

  // 实时性能监控
  async startRealTimeMonitoring(
    onMetrics: (metrics: PerformanceMetrics) => void,
    onAlert: (alert: any) => void
  ): Promise<{
    stop: () => void;
  }> {
    try {
      // 模拟实时监控
      let isMonitoring = true;
      
      const monitor = async () => {
        while (isMonitoring) {
          try {
            const metrics = await this.getPerformanceMetrics('1h');
            onMetrics(metrics);
            
            // 检查阈值
            if (metrics.pagePerformance.loadTime > 3000) {
              onAlert({
                type: 'performance',
                message: '页面加载时间超过阈值',
                value: metrics.pagePerformance.loadTime,
                threshold: 3000
              });
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (error) {
            console.error('实时监控错误:', error);
          }
        }
      };
      
      monitor();
      
      return {
        stop: () => {
          isMonitoring = false;
        }
      };
    } catch (error) {
      console.error('启动实时监控失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const performanceOptimizationService = new PerformanceOptimizationService();

// 性能优化工具函数
export const performanceUtils = {
  // 计算性能分数
  calculatePerformanceScore: (metrics: PerformanceMetrics): number => {
    const weights = {
      loadTime: 0.3,
      fcp: 0.2,
      lcp: 0.2,
      fid: 0.15,
      cls: 0.15
    };
    
    const scores = {
      loadTime: Math.max(0, 100 - (metrics.pagePerformance.loadTime / 50)),
      fcp: Math.max(0, 100 - (metrics.pagePerformance.firstContentfulPaint / 20)),
      lcp: Math.max(0, 100 - (metrics.pagePerformance.largestContentfulPaint / 25)),
      fid: Math.max(0, 100 - (metrics.pagePerformance.firstInputDelay / 1)),
      cls: Math.max(0, 100 - (metrics.pagePerformance.cumulativeLayoutShift * 1000))
    };
    
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  },

  // 格式化文件大小
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  // 计算压缩率
  calculateCompressionRatio: (original: number, compressed: number): number => {
    return ((original - compressed) / original) * 100;
  },

  // 检测性能问题
  detectPerformanceIssues: (metrics: PerformanceMetrics): Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
  }> => {
    const issues = [];
    
    if (metrics.pagePerformance.loadTime > 3000) {
      issues.push({
        type: 'slow-loading',
        severity: 'critical' as const,
        message: '页面加载时间过长'
      });
    }
    
    if (metrics.pagePerformance.firstContentfulPaint > 1800) {
      issues.push({
        type: 'slow-fcp',
        severity: 'high' as const,
        message: '首次内容绘制时间过长'
      });
    }
    
    if (metrics.pagePerformance.cumulativeLayoutShift > 0.1) {
      issues.push({
        type: 'layout-shift',
        severity: 'medium' as const,
        message: '累积布局偏移过大'
      });
    }
    
    if (metrics.resourcePerformance.totalSize > 5 * 1024 * 1024) {
      issues.push({
        type: 'large-bundle',
        severity: 'high' as const,
        message: '资源包过大'
      });
    }
    
    return issues;
  },

  // 生成优化建议
  generateOptimizationSuggestions: (metrics: PerformanceMetrics): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];
    
    if (metrics.pagePerformance.loadTime > 3000) {
      suggestions.push({
        id: 'reduce-load-time',
        category: 'loading',
        priority: 'critical',
        title: '减少页面加载时间',
        description: '页面加载时间过长，影响用户体验',
        impact: 40,
        effort: 'medium',
        implementation: {
          steps: [
            '启用资源压缩',
            '优化图片格式和大小',
            '使用CDN加速',
            '减少HTTP请求数量'
          ],
          codeExample: `
// 启用Gzip压缩
app.use(compression());

// 图片懒加载
<img loading="lazy" src="image.jpg" alt="description" />
          `,
          resources: [
            'https://web.dev/fast/',
            'https://developers.google.com/speed/pagespeed/insights/'
          ]
        },
        metrics: {
          before: { loadTime: metrics.pagePerformance.loadTime },
          expectedAfter: { loadTime: metrics.pagePerformance.loadTime * 0.6 }
        }
      });
    }
    
    if (metrics.resourcePerformance.cacheHitRate < 80) {
      suggestions.push({
        id: 'improve-caching',
        category: 'caching',
        priority: 'high',
        title: '改善缓存策略',
        description: '缓存命中率较低，可以通过优化缓存策略提升性能',
        impact: 25,
        effort: 'low',
        implementation: {
          steps: [
            '设置合适的缓存头',
            '使用浏览器缓存',
            '实施服务端缓存',
            '配置CDN缓存'
          ],
          codeExample: `
// 设置缓存头
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false
}));
          `,
          resources: [
            'https://web.dev/http-cache/',
            'https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching'
          ]
        },
        metrics: {
          before: { cacheHitRate: metrics.resourcePerformance.cacheHitRate },
          expectedAfter: { cacheHitRate: 90 }
        }
      });
    }
    
    return suggestions;
  },

  // 监控性能趋势
  analyzePerformanceTrend: (
    historicalData: Array<{ date: string; metrics: PerformanceMetrics }>
  ): {
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
    insights: string[];
  } => {
    if (historicalData.length < 2) {
      return { trend: 'stable', changeRate: 0, insights: [] };
    }
    
    const recent = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    
    const recentScore = performanceUtils.calculatePerformanceScore(recent.metrics);
    const previousScore = performanceUtils.calculatePerformanceScore(previous.metrics);
    
    const changeRate = ((recentScore - previousScore) / previousScore) * 100;
    
    let trend: 'improving' | 'declining' | 'stable';
    if (changeRate > 5) {
      trend = 'improving';
    } else if (changeRate < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    const insights = [];
    if (trend === 'improving') {
      insights.push('性能持续改善，继续保持优化工作');
    } else if (trend === 'declining') {
      insights.push('性能有所下降，需要关注并采取优化措施');
    } else {
      insights.push('性能保持稳定，可以考虑进一步优化');
    }
    
    return { trend, changeRate, insights };
  }
};

// 性能优化最佳实践
export const PERFORMANCE_BEST_PRACTICES = {
  loading: [
    '使用代码分割减少初始包大小',
    '实施懒加载延迟非关键资源',
    '优化关键渲染路径',
    '使用预加载关键资源',
    '启用HTTP/2推送'
  ],
  
  caching: [
    '设置合适的缓存策略',
    '使用CDN加速静态资源',
    '实施浏览器缓存',
    '配置服务端缓存',
    '使用缓存预热'
  ],
  
  images: [
    '选择合适的图片格式',
    '实施响应式图片',
    '使用图片压缩',
    '实施图片懒加载',
    '使用WebP格式'
  ],
  
  javascript: [
    '移除未使用的代码',
    '使用Tree Shaking',
    '压缩JavaScript代码',
    '避免长时间运行的任务',
    '优化事件处理器'
  ],
  
  css: [
    '移除未使用的CSS',
    '压缩CSS文件',
    '使用CSS关键路径',
    '避免CSS阻塞渲染',
    '优化CSS选择器'
  ]
};