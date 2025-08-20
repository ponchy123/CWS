import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  Image, 
  Quote, 
  User, 
  Type,
  Newspaper,
  QrCode,
  Link,
  Smile,
  Laugh,
  Globe,
  Hash,
  UserCircle,
  ImageIcon,
  Key,
  Lock,
  Zap,
  Database,
  Palette,
  Code
} from 'lucide-react';

interface ApiResult {
  success: boolean;
  data: any;
  error?: string;
}

const EnhancedPublicApis: React.FC = () => {
  const [results, setResults] = useState<Record<string, ApiResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [customParams, setCustomParams] = useState<Record<string, any>>({});

  const apiCategories = {
    '内容创作': [
      {
        id: 'placeholder-post',
        name: 'JSONPlaceholder 文章',
        description: '生成假的博客文章内容，用于内容模板',
        endpoint: '/api/enhanced-public-apis/content/placeholder-post',
        icon: <FileText className="w-5 h-5" />,
        params: []
      },
      {
        id: 'lorem-image',
        name: 'Lorem Picsum 图片',
        description: '生成指定尺寸的随机图片',
        endpoint: '/api/enhanced-public-apis/content/lorem-image',
        icon: <Image className="w-5 h-5" />,
        params: [
          { name: 'width', label: '宽度', type: 'number', default: 400 },
          { name: 'height', label: '高度', type: 'number', default: 300 }
        ]
      },
      {
        id: 'quotable',
        name: 'Quotable 名言',
        description: '获取带标签的精选名言警句',
        endpoint: '/api/enhanced-public-apis/content/quotable',
        icon: <Quote className="w-5 h-5" />,
        params: []
      },
      {
        id: 'faker-person',
        name: 'Faker 用户信息',
        description: '生成完整的假用户信息',
        endpoint: '/api/enhanced-public-apis/content/faker-person',
        icon: <User className="w-5 h-5" />,
        params: []
      },
      {
        id: 'lorem-text',
        name: 'Lorem Ipsum 文本',
        description: '生成指定数量的占位文本',
        endpoint: '/api/enhanced-public-apis/content/lorem-text',
        icon: <Type className="w-5 h-5" />,
        params: [
          { name: 'type', label: '类型', type: 'select', options: ['paragraphs', 'words', 'sentences'], default: 'paragraphs' },
          { name: 'amount', label: '数量', type: 'number', default: 2 }
        ]
      }
    ],
    '新闻资讯': [
      {
        id: 'top-headlines',
        name: 'Hacker News 头条',
        description: '获取技术新闻头条',
        endpoint: '/api/enhanced-public-apis/news/top-headlines',
        icon: <Newspaper className="w-5 h-5" />,
        params: []
      }
    ],
    '工具类': [
      {
        id: 'qr-code',
        name: 'QR码生成器',
        description: '为任意文本生成QR码',
        endpoint: '/api/enhanced-public-apis/tools/qr-code',
        icon: <QrCode className="w-5 h-5" />,
        params: [
          { name: 'text', label: '文本内容', type: 'text', default: 'Hello World' },
          { name: 'size', label: '尺寸', type: 'select', options: ['100x100', '200x200', '300x300'], default: '200x200' }
        ]
      },
      {
        id: 'shorten-url',
        name: 'URL短链接',
        description: '将长URL转换为短链接',
        endpoint: '/api/enhanced-public-apis/tools/shorten-url',
        icon: <Link className="w-5 h-5" />,
        params: [
          { name: 'url', label: 'URL地址', type: 'text', default: 'https://example.com' }
        ]
      },
      {
        id: 'uuid',
        name: 'UUID生成器',
        description: '生成唯一标识符',
        endpoint: '/api/enhanced-public-apis/tools/uuid',
        icon: <Key className="w-5 h-5" />,
        params: []
      },
      {
        id: 'password',
        name: '密码生成器',
        description: '生成安全密码',
        endpoint: '/api/enhanced-public-apis/tools/password',
        icon: <Lock className="w-5 h-5" />,
        params: [
          { name: 'length', label: '长度', type: 'number', default: 12 },
          { name: 'symbols', label: '包含符号', type: 'boolean', default: true },
          { name: 'numbers', label: '包含数字', type: 'boolean', default: true }
        ]
      }
    ],
    '娱乐类': [
      {
        id: 'chuck-norris-joke',
        name: 'Chuck Norris 笑话',
        description: '获取Chuck Norris主题笑话',
        endpoint: '/api/enhanced-public-apis/fun/chuck-norris-joke',
        icon: <Smile className="w-5 h-5" />,
        params: []
      },
      {
        id: 'dad-joke',
        name: '爸爸笑话',
        description: '获取经典爸爸笑话',
        endpoint: '/api/enhanced-public-apis/fun/dad-joke',
        icon: <Laugh className="w-5 h-5" />,
        params: []
      }
    ],
    '数据类': [
      {
        id: 'random-country',
        name: '随机国家信息',
        description: '获取世界各国详细信息',
        endpoint: '/api/enhanced-public-apis/data/random-country',
        icon: <Globe className="w-5 h-5" />,
        params: []
      },
      {
        id: 'number-fact',
        name: '数字趣事',
        description: '获取关于数字的有趣事实',
        endpoint: '/api/enhanced-public-apis/data/number-fact',
        icon: <Hash className="w-5 h-5" />,
        params: [
          { name: 'number', label: '数字', type: 'number', default: 42 },
          { name: 'type', label: '类型', type: 'select', options: ['trivia', 'math', 'date', 'year'], default: 'trivia' }
        ]
      }
    ],
    '设计类': [
      {
        id: 'avatar',
        name: 'UI头像生成',
        description: '为用户名生成头像',
        endpoint: '/api/enhanced-public-apis/design/avatar',
        icon: <UserCircle className="w-5 h-5" />,
        params: [
          { name: 'name', label: '用户名', type: 'text', default: 'John Doe' },
          { name: 'background', label: '背景色', type: 'text', default: 'random' },
          { name: 'size', label: '尺寸', type: 'select', options: ['64', '128', '256'], default: '128' }
        ]
      },
      {
        id: 'placeholder',
        name: '占位图片',
        description: '生成自定义占位图片',
        endpoint: '/api/enhanced-public-apis/design/placeholder',
        icon: <ImageIcon className="w-5 h-5" />,
        params: [
          { name: 'width', label: '宽度', type: 'number', default: 300 },
          { name: 'height', label: '高度', type: 'number', default: 200 },
          { name: 'text', label: '文本', type: 'text', default: 'Placeholder' },
          { name: 'bgColor', label: '背景色', type: 'text', default: 'cccccc' }
        ]
      }
    ]
  };

  const fetchApiData = async (api: any) => {
    setLoading(prev => ({ ...prev, [api.id]: true }));
    
    try {
      const params = new URLSearchParams();
      
      // 添加自定义参数
      if (customParams[api.id]) {
        Object.entries(customParams[api.id]).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      
      const url = `http://localhost:3004${api.endpoint}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [api.id]: data
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [api.id]: {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : '请求失败'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [api.id]: false }));
    }
  };

  const updateCustomParam = (apiId: string, paramName: string, value: any) => {
    setCustomParams(prev => ({
      ...prev,
      [apiId]: {
        ...prev[apiId],
        [paramName]: value
      }
    }));
  };

  const fetchAllApis = async () => {
    const allApis = Object.values(apiCategories).flat();
    for (const api of allApis) {
      await fetchApiData(api);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  useEffect(() => {
    fetchAllApis();
  }, []);

  const renderApiResult = (api: any) => {
    const result = results[api.id];
    const isLoading = loading[api.id];

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          <span>加载中...</span>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="p-4 text-gray-500">
          暂无数据
        </div>
      );
    }

    if (!result.success) {
      return (
        <div className="p-4 text-red-500">
          错误: {result.error || '请求失败'}
        </div>
      );
    }

    // 根据不同API类型渲染不同的内容
    switch (api.id) {
      case 'placeholder-post':
        return (
          <div className="p-4">
            <h4 className="font-medium mb-2">{result.data.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{result.data.body.substring(0, 100)}...</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>ID: {result.data.id}</span>
              <span>用户: {result.data.userId}</span>
            </div>
          </div>
        );

      case 'lorem-image':
        return (
          <div className="p-4">
            <img 
              src={result.data.url} 
              alt="Lorem Picsum"
              className="w-full h-32 object-cover rounded-lg mb-2"
            />
            <p className="text-sm text-gray-500">
              尺寸: {result.data.width} × {result.data.height}
            </p>
          </div>
        );

      case 'quotable':
        return (
          <div className="p-4">
            <p className="text-base mb-2">"{result.data.content}"</p>
            <p className="text-sm text-gray-600 mb-2">— {result.data.author}</p>
            <div className="flex flex-wrap gap-1">
              {result.data.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'faker-person':
        return (
          <div className="p-4">
            <div className="space-y-2 text-sm">
              <p><strong>姓名:</strong> {result.data.firstname} {result.data.lastname}</p>
              <p><strong>邮箱:</strong> {result.data.email}</p>
              <p><strong>电话:</strong> {result.data.phone}</p>
              <p><strong>生日:</strong> {result.data.birthday}</p>
              <p><strong>性别:</strong> {result.data.gender}</p>
              <p><strong>网站:</strong> {result.data.website}</p>
            </div>
          </div>
        );

      case 'lorem-text':
        return (
          <div className="p-4">
            <div 
              className="text-sm text-gray-700 max-h-32 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: result.data.text }}
            />
            <p className="text-xs text-gray-500 mt-2">
              类型: {result.data.type} | 数量: {result.data.amount}
            </p>
          </div>
        );

      case 'top-headlines':
        return (
          <div className="p-4">
            <div className="space-y-2">
              {result.data.articles.slice(0, 3).map((article: any, index: number) => (
                <div key={index} className="border-b pb-2 last:border-b-0">
                  <p className="text-sm font-medium">{article.title}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>by {article.by}</span>
                    <span>👍 {article.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'qr-code':
        return (
          <div className="p-4">
            <div className="flex flex-col items-center">
              <img 
                src={result.data.qrCodeUrl} 
                alt="QR Code"
                className="mb-2"
              />
              <p className="text-sm text-gray-600 text-center">
                "{result.data.text}"
              </p>
            </div>
          </div>
        );

      case 'shorten-url':
        return (
          <div className="p-4">
            <div className="space-y-2">
              <p className="text-sm"><strong>原链接:</strong></p>
              <p className="text-xs text-gray-600 break-all">{result.data.originalUrl}</p>
              <p className="text-sm"><strong>短链接:</strong></p>
              <a 
                href={result.data.shortUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm break-all"
              >
                {result.data.shortUrl}
              </a>
            </div>
          </div>
        );

      case 'uuid':
        return (
          <div className="p-4">
            <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
              {result.data.uuid}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              版本: {result.data.version}
            </p>
          </div>
        );

      case 'password':
        return (
          <div className="p-4">
            <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all mb-2">
              {result.data.password}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>长度: {result.data.length}</p>
              <p>包含符号: {result.data.includeSymbols ? '是' : '否'}</p>
              <p>包含数字: {result.data.includeNumbers ? '是' : '否'}</p>
            </div>
          </div>
        );

      case 'chuck-norris-joke':
      case 'dad-joke':
        return (
          <div className="p-4">
            <p className="text-base">{result.data.joke}</p>
          </div>
        );

      case 'random-country':
        return (
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">{result.data.flag}</span>
              <div>
                <p className="font-medium">{result.data.name}</p>
                <p className="text-sm text-gray-600">{result.data.capital}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>地区: {result.data.region}</p>
              <p>人口: {result.data.population.toLocaleString()}</p>
            </div>
          </div>
        );

      case 'number-fact':
        return (
          <div className="p-4">
            <p className="text-base mb-2">{result.data.text}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{result.data.type}</Badge>
              <Badge variant={result.data.found ? "default" : "secondary"}>
                {result.data.found ? '真实' : '近似'}
              </Badge>
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className="p-4">
            <div className="flex flex-col items-center">
              <img 
                src={result.data.avatarUrl} 
                alt="Avatar"
                className="rounded-full mb-2"
              />
              <p className="text-sm font-medium">{result.data.name}</p>
              <p className="text-xs text-gray-500">
                {result.data.size}px | {result.data.background}
              </p>
            </div>
          </div>
        );

      case 'placeholder':
        return (
          <div className="p-4">
            <img 
              src={result.data.url} 
              alt="Placeholder"
              className="w-full h-32 object-cover rounded-lg mb-2"
            />
            <p className="text-sm text-gray-500">
              {result.data.width} × {result.data.height} | {result.data.text}
            </p>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const renderApiParams = (api: any) => {
    if (!api.params || api.params.length === 0) return null;

    return (
      <div className="p-4 border-t bg-gray-50">
        <h5 className="text-sm font-medium mb-3">参数设置</h5>
        <div className="space-y-3">
          {api.params.map((param: any) => (
            <div key={param.name} className="space-y-1">
              <Label htmlFor={`${api.id}-${param.name}`} className="text-xs">
                {param.label}
              </Label>
              {param.type === 'select' ? (
                <select
                  id={`${api.id}-${param.name}`}
                  className="w-full px-2 py-1 text-sm border rounded"
                  value={customParams[api.id]?.[param.name] || param.default}
                  onChange={(e) => updateCustomParam(api.id, param.name, e.target.value)}
                >
                  {param.options.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : param.type === 'boolean' ? (
                <input
                  id={`${api.id}-${param.name}`}
                  type="checkbox"
                  checked={customParams[api.id]?.[param.name] ?? param.default}
                  onChange={(e) => updateCustomParam(api.id, param.name, e.target.checked)}
                  className="w-4 h-4"
                />
              ) : (
                <Input
                  id={`${api.id}-${param.name}`}
                  type={param.type}
                  value={customParams[api.id]?.[param.name] || param.default}
                  onChange={(e) => updateCustomParam(api.id, param.name, e.target.value)}
                  className="text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">增强版公共API展示</h1>
        <p className="text-gray-600 mb-4">
          基于 public-api-lists 项目精心筛选的16个高质量免费API，涵盖内容创作、工具应用、娱乐互动等多个领域。
        </p>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchAllApis} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>刷新所有API</span>
          </Button>
          <a 
            href="https://github.com/public-api-lists/public-api-lists" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
            <span>访问 GitHub 项目</span>
          </a>
        </div>
      </div>

      {Object.entries(apiCategories).map(([category, apis]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>{category}</span>
            <Badge variant="outline">{apis.length} 个API</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apis.map(api => (
              <Card key={api.id} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {api.icon}
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchApiData(api)}
                      disabled={loading[api.id]}
                    >
                      {loading[api.id] ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <CardDescription>{api.description}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  {renderApiResult(api)}
                </CardContent>
                {renderApiParams(api)}
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>API统计信息</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">16</div>
            <div className="text-sm text-gray-600">总API数量</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-600">功能分类</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-gray-600">免费使用</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">需要密钥</div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>核心优势：</span>
            </h4>
            <ul className="space-y-1">
              <li>• 完全免费，无需注册或API密钥</li>
              <li>• 数据丰富，适合各种内容创作场景</li>
              <li>• 响应快速，支持实时参数调整</li>
              <li>• 智能缓存，提升访问性能</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>应用场景：</span>
            </h4>
            <ul className="space-y-1">
              <li>• 内容创作和模板生成</li>
              <li>• 原型设计和占位内容</li>
              <li>• 社交媒体素材制作</li>
              <li>• 开发测试和演示数据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPublicApis;