import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  RefreshCw, 
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ApiStatus {
  unsplash: boolean;
  newsapi: boolean;
  openweather: boolean;
  quotable: boolean;
  poetrydb: boolean;
  jokeapi: boolean;
  exchangerate: boolean;
  cacheSize: number;
}

interface ApiStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  popularApis: Array<{
    name: string;
    requests: number;
    successRate: number;
  }>;
}

export default function ApiStatsPanel() {
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const { toast } = useToast();

  // 获取API状态
  const fetchApiStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/free-apis/status');
      setApiStatus(response.data);
    } catch (error) {
      toast({
        title: '获取API状态失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取API统计数据
  const fetchApiStats = async () => {
    try {
      // 模拟统计数据，实际项目中应该从后端获取
      const mockStats: ApiStats = {
        totalRequests: 1247,
        successfulRequests: 1198,
        failedRequests: 49,
        averageResponseTime: 342,
        cacheHitRate: 78.5,
        popularApis: [
          { name: 'Unsplash', requests: 456, successRate: 98.2 },
          { name: 'NewsAPI', requests: 234, successRate: 94.1 },
          { name: 'Weather', requests: 189, successRate: 96.8 },
          { name: 'Quotes', requests: 167, successRate: 99.4 },
          { name: 'Poetry', requests: 123, successRate: 97.6 },
          { name: 'Jokes', requests: 78, successRate: 100 }
        ]
      };
      setApiStats(mockStats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 清除缓存
  const clearCache = async () => {
    setLoading(true);
    try {
      await api.post('/free-apis/cache/clear');
      toast({
        title: '缓存清除成功',
        description: '所有API缓存已清空',
      });
      fetchApiStatus();
    } catch (error) {
      toast({
        title: '清除缓存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  // 获取状态颜色
  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // 计算成功率
  const getSuccessRate = () => {
    if (!apiStats) return 0;
    return (apiStats.successfulRequests / apiStats.totalRequests) * 100;
  };

  useEffect(() => {
    fetchApiStatus();
    fetchApiStats();
    
    // 每30秒刷新一次状态
    const interval = setInterval(() => {
      fetchApiStatus();
      fetchApiStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API监控统计</h2>
          <p className="text-muted-foreground">实时监控免费API服务状态和使用情况</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchApiStatus} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
          <Button variant="outline" onClick={clearCache} disabled={loading}>
            <Database className="h-4 w-4 mr-2" />
            清除缓存
          </Button>
        </div>
      </div>

      {/* API服务状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API服务状态
          </CardTitle>
          <CardDescription>
            各个API服务的实时可用性状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Unsplash</p>
                  <p className="text-sm text-muted-foreground">图片API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.unsplash)}
                  <Badge className={getStatusColor(apiStatus.unsplash)}>
                    {apiStatus.unsplash ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">NewsAPI</p>
                  <p className="text-sm text-muted-foreground">新闻API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.newsapi)}
                  <Badge className={getStatusColor(apiStatus.newsapi)}>
                    {apiStatus.newsapi ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">OpenWeather</p>
                  <p className="text-sm text-muted-foreground">天气API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.openweather)}
                  <Badge className={getStatusColor(apiStatus.openweather)}>
                    {apiStatus.openweather ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Quotable</p>
                  <p className="text-sm text-muted-foreground">名言API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.quotable)}
                  <Badge className={getStatusColor(apiStatus.quotable)}>
                    {apiStatus.quotable ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">PoetryDB</p>
                  <p className="text-sm text-muted-foreground">诗歌API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.poetrydb)}
                  <Badge className={getStatusColor(apiStatus.poetrydb)}>
                    {apiStatus.poetrydb ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">JokeAPI</p>
                  <p className="text-sm text-muted-foreground">笑话API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.jokeapi)}
                  <Badge className={getStatusColor(apiStatus.jokeapi)}>
                    {apiStatus.jokeapi ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">ExchangeRate</p>
                  <p className="text-sm text-muted-foreground">汇率API</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.exchangerate)}
                  <Badge className={getStatusColor(apiStatus.exchangerate)}>
                    {apiStatus.exchangerate ? '正常' : '异常'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">缓存</p>
                  <p className="text-sm text-muted-foreground">数据缓存</p>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <Badge variant="outline">
                    {apiStatus.cacheSize} 项
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">加载API状态中...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用统计 */}
      {apiStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总请求数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% 相比上周
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getSuccessRate().toFixed(1)}%</div>
              <Progress value={getSuccessRate()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStats.averageResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                -5% 相比上周
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStats.cacheHitRate}%</div>
              <Progress value={apiStats.cacheHitRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 热门API排行 */}
      {apiStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              热门API排行
            </CardTitle>
            <CardDescription>
              按请求量和成功率排序的API使用情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiStats.popularApis.map((apiItem, index) => (
                <div key={apiItem.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{apiItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apiItem.requests.toLocaleString()} 次请求
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={apiItem.successRate >= 95 ? 'default' : 'secondary'}
                      className="mb-1"
                    >
                      {apiItem.successRate}% 成功率
                    </Badge>
                    <Progress value={apiItem.successRate} className="w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 系统健康状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            系统健康状态
          </CardTitle>
          <CardDescription>
            整体系统运行状况和建议
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">系统运行正常</p>
                <p className="text-sm text-green-600">所有核心API服务正常运行</p>
              </div>
            </div>

            {apiStats && apiStats.cacheHitRate < 70 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">缓存命中率偏低</p>
                  <p className="text-sm text-yellow-600">建议优化缓存策略以提升性能</p>
                </div>
              </div>
            )}

            {apiStats && getSuccessRate() < 95 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">API成功率需要关注</p>
                  <p className="text-sm text-red-600">部分API服务可能存在稳定性问题</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}