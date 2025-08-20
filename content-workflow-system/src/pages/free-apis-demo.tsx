import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { freeApisService, UnsplashImage, Quote, NewsArticle, WeatherData, Joke, Poem } from '@/services/freeApis';
import { 
  Search, 
  Image, 
  Quote as QuoteIcon, 
  Newspaper, 
  Cloud, 
  QrCode, 
  Smile,
  RefreshCw,
  Download,
  ExternalLink,
  Copy
} from 'lucide-react';

export default function FreeApisDemoPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [joke, setJoke] = useState<Joke | null>(null);
  const [poem, setPoem] = useState<Poem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherCity, setWeatherCity] = useState('北京');
  const [qrText, setQrText] = useState('https://example.com');
  const { toast } = useToast();

  // 获取随机图片
  const fetchRandomImages = async () => {
    setLoading(true);
    try {
      const result = await freeApisService.getRandomImages(12);
      setImages(result.data || []);
      toast({
        title: '图片加载成功',
        description: `获取了 ${result.data?.length || 0} 张随机图片`,
      });
    } catch (error) {
      toast({
        title: '获取图片失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 搜索图片
  const searchImages = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const result = await freeApisService.getUnsplashImages(searchQuery, 12);
      setImages(result.data || []);
      toast({
        title: '搜索完成',
        description: `找到 ${result.data?.length || 0} 张相关图片`,
      });
    } catch (error) {
      toast({
        title: '搜索失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取随机名言
  const fetchRandomQuote = async () => {
    setLoading(true);
    try {
      const result = await freeApisService.getRandomQuote();
      setQuote(result.data);
      toast({
        title: '名言获取成功',
        description: '已获取新的励志名言',
      });
    } catch (error) {
      toast({
        title: '获取名言失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取新闻
  const fetchNews = async () => {
    setLoading(true);
    try {
      const result = await freeApisService.getTopHeadlines('us');
      setNews(result.data?.articles?.slice(0, 6) || []);
      toast({
        title: '新闻加载成功',
        description: `获取了 ${result.data?.articles?.length || 0} 条新闻`,
      });
    } catch (error) {
      toast({
        title: '获取新闻失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取天气
  const fetchWeather = async () => {
    if (!weatherCity.trim()) return;
    
    setLoading(true);
    try {
      const result = await freeApisService.getCurrentWeather(weatherCity);
      setWeather(result.data);
      toast({
        title: '天气获取成功',
        description: `已获取 ${weatherCity} 的天气信息`,
      });
    } catch (error) {
      toast({
        title: '获取天气失败',
        description: '请检查城市名称或稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取随机笑话
  const fetchRandomJoke = async () => {
    setLoading(true);
    try {
      const result = await freeApisService.getRandomJoke();
      setJoke(result.data);
      toast({
        title: '笑话获取成功',
        description: '希望能让您开心一下！',
      });
    } catch (error) {
      toast({
        title: '获取笑话失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取随机诗歌
  const fetchRandomPoem = async () => {
    setLoading(true);
    try {
      const result = await freeApisService.getRandomPoem();
      setPoem(result.data);
      toast({
        title: '诗歌获取成功',
        description: '为您带来诗意灵感！',
      });
    } catch (error) {
      toast({
        title: '获取诗歌失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '已复制到剪贴板',
      description: '内容已成功复制',
    });
  };

  // 初始化数据
  useEffect(() => {
    fetchRandomImages();
    fetchRandomQuote();
    fetchRandomPoem();
    fetchNews();
    fetchWeather();
    fetchRandomJoke();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">免费API演示</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          基于 Free-APIs 项目集成的多种免费API服务，为内容创作提供丰富的素材和工具
        </p>
      </div>

      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            图片素材
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <QuoteIcon className="h-4 w-4" />
            名言警句
          </TabsTrigger>
          <TabsTrigger value="poetry" className="flex items-center gap-2">
            <QuoteIcon className="h-4 w-4" />
            诗歌灵感
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            新闻资讯
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            天气信息
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            二维码
          </TabsTrigger>
          <TabsTrigger value="jokes" className="flex items-center gap-2">
            <Smile className="h-4 w-4" />
            幽默内容
          </TabsTrigger>
        </TabsList>

        {/* 图片素材 */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Unsplash 高质量图片
              </CardTitle>
              <CardDescription>
                获取免费的高质量图片素材，支持搜索和随机获取
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索图片关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchImages()}
                />
                <Button onClick={searchImages} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </Button>
                <Button variant="outline" onClick={fetchRandomImages} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  随机
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={image.urls.small}
                        alt={image.alt_description}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" asChild>
                            <a href={image.urls.full} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => copyToClipboard(image.urls.regular)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground truncate">
                        by {image.user.name}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 名言警句 */}
        <TabsContent value="quotes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QuoteIcon className="h-5 w-5" />
                励志名言
              </CardTitle>
              <CardDescription>
                获取名人名言和励志语录，为内容创作提供灵感
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={fetchRandomQuote} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  获取新名言
                </Button>
              </div>

              {quote && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500">
                  <CardContent className="p-6">
                    <blockquote className="text-lg italic mb-4">
                      "{quote.content}"
                    </blockquote>
                    <div className="flex justify-between items-center">
                      <cite className="text-sm font-medium">— {quote.author}</cite>
                      <div className="flex gap-2">
                        {quote.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => copyToClipboard(`"${quote.content}" — ${quote.author}`)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制名言
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 诗歌灵感 */}
        <TabsContent value="poetry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QuoteIcon className="h-5 w-5" />
                诗歌灵感
              </CardTitle>
              <CardDescription>
                获取经典诗歌作品，为创作提供文学灵感和艺术素材
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={fetchRandomPoem} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  获取随机诗歌
                </Button>
              </div>

              {poem && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2">{poem.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">作者: {poem.author}</p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {poem.lines.map((line, index) => (
                        <p key={index} className="text-base leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">
                        共 {poem.linecount} 行
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(`${poem.title}\n作者: ${poem.author}\n\n${poem.lines.join('\n')}`)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制诗歌
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 新闻资讯 */}
        <TabsContent value="news" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                热门新闻
              </CardTitle>
              <CardDescription>
                获取最新的新闻资讯，了解热点话题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={fetchNews} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新新闻
              </Button>

              <div className="grid gap-4">
                {news.map((article, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {article.urlToImage && (
                          <img
                            src={article.urlToImage}
                            alt={article.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {article.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{article.source.name}</Badge>
                            <Button size="sm" variant="outline" asChild>
                              <a href={article.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                阅读全文
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 天气信息 */}
        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                天气查询
              </CardTitle>
              <CardDescription>
                查询全球城市的实时天气信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="输入城市名称..."
                  value={weatherCity}
                  onChange={(e) => setWeatherCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
                />
                <Button onClick={fetchWeather} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  查询
                </Button>
              </div>

              {weather && (
                <Card className="bg-gradient-to-r from-blue-50 to-sky-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">{weather.location}</h3>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{weather.temperature}°C</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {weather.description}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">湿度: </span>
                        <span className="font-medium">{weather.humidity}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">风速: </span>
                        <span className="font-medium">{weather.windSpeed} m/s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 二维码生成 */}
        <TabsContent value="qrcode" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                二维码生成器
              </CardTitle>
              <CardDescription>
                将文本或链接转换为二维码
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">输入文本或链接:</label>
                <Input
                  placeholder="https://example.com"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                />
              </div>

              {qrText && (
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={freeApisService.generateQRCode(qrText, 200)}
                    alt="QR Code"
                    className="border rounded-lg"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(freeApisService.generateQRCode(qrText, 200))}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    复制二维码链接
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 幽默内容 */}
        <TabsContent value="jokes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                幽默笑话
              </CardTitle>
              <CardDescription>
                获取有趣的笑话，为内容增添趣味性
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={fetchRandomJoke} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                获取新笑话
              </Button>

              {joke && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500">
                  <CardContent className="p-6">
                    {joke.type === 'twopart' ? (
                      <div className="space-y-3">
                        <p className="text-lg">{joke.setup}</p>
                        <p className="text-lg font-medium text-orange-600">{joke.delivery}</p>
                      </div>
                    ) : (
                      <p className="text-lg">{joke.joke}</p>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <Badge variant="secondary">{joke.category}</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(joke.type === 'twopart' ? `${joke.setup}\n${joke.delivery}` : joke.joke || '')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制笑话
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}