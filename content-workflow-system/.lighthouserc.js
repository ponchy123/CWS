module.exports = {
  ci: {
    collect: {
      // 要测试的URL
      url: [
        'http://localhost:4173',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/content-creator',
        'http://localhost:4173/content-planning',
        'http://localhost:4173/inspiration-manager'
      ],
      // 启动服务器命令
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:4173',
      startServerReadyTimeout: 30000,
      // 收集设置
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // 禁用某些审计以加快速度
        skipAudits: [
          'uses-http2',
          'uses-long-cache-ttl',
          'uses-text-compression'
        ]
      }
    },
    assert: {
      // 性能阈值
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // 具体指标阈值
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // 资源大小限制
        'total-byte-weight': ['warn', { maxNumericValue: 1024000 }], // 1MB
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        
        // 无障碍性检查
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // SEO检查
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'crawlable-anchors': 'error'
      }
    },
    upload: {
      // 上传到 Lighthouse CI 服务器（如果有的话）
      target: 'temporary-public-storage',
      // 或者上传到自定义服务器
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN
    },
    server: {
      // 如果运行自己的 LHCI 服务器
      // port: 9001,
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDialect: 'sqlite',
      //   sqlDatabasePath: './lhci.db'
      // }
    }
  }
};