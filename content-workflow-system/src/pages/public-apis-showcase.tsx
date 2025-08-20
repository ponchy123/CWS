import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ExternalLink, Heart, Lightbulb, Palette, Quote, Cat, Dog, Smile, Code, BookOpen, Type } from 'lucide-react';

interface ApiResult {
  success: boolean;
  data: any;
  error?: string;
}

const PublicApisShowcase: React.FC = () => {
  const [results, setResults] = useState<Record<string, ApiResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const apis = [
    {
      id: 'advice-slip',
      name: '建议箴言',
      description: '获取随机的人生建议和箴言',
      endpoint: '/api/public-apis/content/advice-slip',
      icon: <Lightbulb className="w-5 h-5" />,
      category: '内容创作'
    },
    {
      id: 'random-user',
      name: '随机用户',
      description: '生成随机用户信息，用于内容示例',
      endpoint: '/api/public-apis/content/random-user',
      icon: <Heart className="w-5 h-5" />,
      category: '内容创作'
    },
    {
      id: 'random-fact',
      name: '随机事实',
      description: '获取有趣的随机事实，激发创作灵感',
      endpoint: '/api/public-apis/content/random-fact',
      icon: <Lightbulb className="w-5 h-5" />,
      category: '内容创作'
    },
    {
      id: 'activity',
      name: '活动建议',
      description: '获取随机活动建议，丰富内容主题',
      endpoint: '/api/public-apis/content/activity',
      icon: <Heart className="w-5 h-5" />,
      category: '内容创作'
    },
    {
      id: 'random-color',
      name: '随机颜色',
      description: '获取随机颜色，用于设计灵感',
      endpoint: '/api/public-apis/design/random-color',
      icon: <Palette className="w-5 h-5" />,
      category: '设计灵感'
    },
    {
      id: 'quote-garden',
      name: '名言花园',
      description: '获取精选名言警句',
      endpoint: '/api/public-apis/content/quote-garden',
      icon: <Quote className="w-5 h-5" />,
      category: '内容创作'
    },
    {
      id: 'cat-image',
      name: '猫咪图片',
      description: '获取可爱的猫咪图片',
      endpoint: '/api/public-apis/content/cat-image',
      icon: <Cat className="w-5 h-5" />,
      category: '轻松内容'
    },
    {
      id: 'dog-image',
      name: '狗狗图片',
      description: '获取可爱的狗狗图片',
      endpoint: '/api/public-apis/content/dog-image',
      icon: <Dog className="w-5 h-5" />,
      category: '轻松内容'
    },
    {
      id: 'meme',
      name: '表情包',
      description: '获取热门表情包',
      endpoint: '/api/public-apis/content/meme',
      icon: <Smile className="w-5 h-5" />,
      category: '轻松内容'
    },
    {
      id: 'programming-joke',
      name: '编程笑话',
      description: '获取编程相关的笑话',
      endpoint: '/api/public-apis/content/programming-joke',
      icon: <Code className="w-5 h-5" />,
      category: '轻松内容'
    },
    {
      id: 'poetry',
      name: '随机诗歌',
      description: '获取经典诗歌作品',
      endpoint: '/api/public-apis/content/poetry',
      icon: <BookOpen className="w-5 h-5" />,
      category: '内容创作'
    },
    {
      id: 'random-word',
      name: '随机单词',
      description: '获取随机单词，激发写作灵感',
      endpoint: '/api/public-apis/content/random-word',
      icon: <Type className="w-5 h-5" />,
      category: '内容创作'
    }
  ];

  const fetchApiData = async (api: typeof apis[0]) => {
    setLoading(prev => ({ ...prev, [api.id]: true }));
    
    try {
      const response = await fetch(`http://localhost:3004${api.endpoint}`);
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

  const fetchAllApis = async () => {
    for (const api of apis) {
      await fetchApiData(api);
      // 添加小延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  useEffect(() => {
    fetchAllApis();
  }, []);

  const renderApiResult = (api: typeof apis[0]) => {
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
      case 'advice-slip':
        return (
          <div className="p-4">
            <p className="text-lg font-medium mb-2">"{result.data.advice}"</p>
            <p className="text-sm text-gray-500">ID: {result.data.id}</p>
          </div>
        );

      case 'random-user':
        return (
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <img 
                src={result.data.avatar} 
                alt={result.data.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium">{result.data.name}</p>
                <p className="text-sm text-gray-500">{result.data.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{result.data.location}</p>
          </div>
        );

      case 'random-fact':
        return (
          <div className="p-4">
            <p className="text-base">{result.data.fact}</p>
          </div>
        );

      case 'activity':
        return (
          <div className="p-4">
            <p className="font-medium mb-2">{result.data.activity}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{result.data.type}</Badge>
              <Badge variant="outline">参与者: {result.data.participants}</Badge>
              <Badge variant="outline">价格: {result.data.price === 0 ? '免费' : `$${result.data.price}`}</Badge>
            </div>
          </div>
        );

      case 'random-color':
        return (
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-16 h-16 rounded-lg border"
                style={{ backgroundColor: result.data.hex }}
              ></div>
              <div>
                <p className="font-medium">{result.data.hex}</p>
                {result.data.name && (
                  <p className="text-sm text-gray-500">{result.data.name}</p>
                )}
                {result.data.rgb && (
                  <p className="text-sm text-gray-500">RGB: {result.data.rgb}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'quote-garden':
        return (
          <div className="p-4">
            <p className="text-lg mb-2">"{result.data.quote}"</p>
            <p className="text-sm text-gray-600">— {result.data.author}</p>
            {result.data.genre && (
              <Badge variant="outline" className="mt-2">{result.data.genre}</Badge>
            )}
          </div>
        );

      case 'cat-image':
      case 'dog-image':
        return (
          <div className="p-4">
            <img 
              src={result.data.url} 
              alt={api.name}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=图片加载失败';
              }}
            />
            {result.data.width && result.data.height && (
              <p className="text-sm text-gray-500 mt-2">
                尺寸: {result.data.width} × {result.data.height}
              </p>
            )}
          </div>
        );

      case 'meme':
        return (
          <div className="p-4">
            <img 
              src={result.data.url} 
              alt={result.data.title}
              className="w-full h-48 object-cover rounded-lg mb-3"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=图片加载失败';
              }}
            />
            <p className="font-medium mb-1">{result.data.title}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>r/{result.data.subreddit}</span>
              <span>👍 {result.data.ups}</span>
            </div>
          </div>
        );

      case 'programming-joke':
        return (
          <div className="p-4">
            <p className="font-medium mb-2">{result.data.setup}</p>
            <p className="text-gray-700">{result.data.punchline}</p>
            <Badge variant="outline" className="mt-2">{result.data.type}</Badge>
          </div>
        );

      case 'poetry':
        return (
          <div className="p-4">
            <h4 className="font-medium mb-1">{result.data.title}</h4>
            <p className="text-sm text-gray-600 mb-3">by {result.data.author}</p>
            <div className="space-y-1">
              {result.data.lines.map((line: string, index: number) => (
                <p key={index} className="text-sm">{line}</p>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              总行数: {result.data.linecount}
            </p>
          </div>
        );

      case 'random-word':
        return (
          <div className="p-4">
            <p className="text-2xl font-bold text-center py-4">
              {result.data.word}
            </p>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const categories = [...new Set(apis.map(api => api.category))];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">公共API展示</h1>
        <p className="text-gray-600 mb-4">
          基于 public-api-lists 项目精选的免费API，为内容创作提供丰富的数据源和灵感。
        </p>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchAllApis} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>刷新所有API</span>
          </Button>
          <a 
            href="https://public-api-lists.github.io/public-api-lists/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
            <span>访问 Public API Lists</span>
          </a>
        </div>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apis
              .filter(api => api.category === category)
              .map(api => (
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
                </Card>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">关于这些API</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium mb-2">特点优势：</h4>
            <ul className="space-y-1">
              <li>• 完全免费，无需API密钥</li>
              <li>• 数据丰富，适合内容创作</li>
              <li>• 响应快速，稳定可靠</li>
              <li>• 支持多种内容类型</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">应用场景：</h4>
            <ul className="space-y-1">
              <li>• 内容创作灵感获取</li>
              <li>• 社交媒体素材生成</li>
              <li>• 设计配色方案参考</li>
              <li>• 轻松娱乐内容制作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicApisShowcase;