import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { RefreshCw, TrendingUp, Clock, ExternalLink, Sparkles, Settings, Flame, Zap } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface HotTopic {
  title: string;
  platform: string;
  url: string;
  heat: number;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  createdAt: string;
  rank: number;
  source?: string;
  mode?: string;
  color?: string;
  isRealData?: boolean;
  aiAnalysis?: {
    sentiment: string;
    keywords: string[];
    contentType: string;
    difficulty: string;
    estimatedReadTime: number;
    targetAudience: string[];
    viralPotential: number;
    commercialValue: number;
    trendScore: number;
    engagementRate: number;
    shareability: number;
    timeValue: string;
    competitiveness: number;
    authenticity: number;
    reliability: number;
  };
}

interface DataSource {
  id: string;
  name: string;
  category: string;
  color: string;
  endpoint: string;
}

interface SourceRecommendation {
  name: string;
  sources: string[];
  description: string;
}

const HotTopics: React.FC = () => {
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('hottest'); // 'hottest' 或 'latest'
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, SourceRecommendation>>({});
  const [limit, setLimit] = useState(15);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HotTopic | null>(null);
  const { toast } = useToast();

  // 获取可用数据源
  const fetchAvailableSources = async () => {
    try {
      const response = await fetch('/api/hot-topics/sources');
      const result = await response.json();
      
      if (result.success) {
        setAvailableSources(result.data.sources || []);
        setRecommendations(result.data.recommendations || {});
      }
    } catch (error) {
      console.error('获取数据源失败:', error);
    }
  };

  // 获取热点话题
  const fetchHotTopics = async () => {
    setLoading(true);
    try {
      console.log(`🔥 请求 NewsNow 热点数据: ${mode} - ${selectedSources.join(',')}`);

      const response = await fetch('/api/hot-topics/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: mode,
          sources: selectedSources,
          limit: limit
        })
      });

      const result = await response.json();

      if (result.success) {
        setHotTopics(result.data || []);
        toast({
          title: "数据更新成功",
          description: `获取到 ${result.data?.length || 0} 条${mode === 'latest' ? '最新' : '最热'}热点话题`,
        });
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取热点话题失败:', error);
      toast({
        title: "获取失败",
        description: "无法获取热点话题，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 应用推荐数据源组合
  const applyRecommendation = (key: string) => {
    const recommendation = recommendations[key];
    if (recommendation) {
      setSelectedSources(recommendation.sources);
      toast({
        title: "应用推荐配置",
        description: `已应用 ${recommendation.name} 数据源组合`,
      });
    }
  };

  // 切换模式
  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    toast({
      title: "模式切换",
      description: `已切换到${newMode === 'latest' ? '最新' : '最热'}模式`,
    });
  };

  // 自动刷新控制
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHotTopics();
      }, 30000); // 30秒刷新一次
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  // 初始化
  useEffect(() => {
    fetchAvailableSources();
    fetchHotTopics();
  }, []);

  // 当配置改变时重新获取数据
  useEffect(() => {
    if (availableSources.length > 0) {
      const timer = setTimeout(() => {
        fetchHotTopics();
      }, 100); // 延迟100ms确保DOM已准备好
      return () => clearTimeout(timer);
    }
  }, [mode, selectedSources, limit]);

  // 格式化热度数值
  const formatHeat = (heat: number) => {
    if (heat >= 10000) {
      return `${(heat / 10000).toFixed(1)}万`;
    }
    return heat.toLocaleString();
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 获取情感色彩
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 获取难度标签颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                NewsNow 热点话题
              </CardTitle>
              <CardDescription>
                基于 NewsNow 真实数据源，聚合 15+ 平台热点话题
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {showAdvanced ? '简化' : '高级'}
              </Button>
              <Button
                onClick={fetchHotTopics}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 基础控制 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 模式选择 */}
            <div className="space-y-2">
              <Label>模式</Label>
              <Select value={mode} onValueChange={handleModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hottest">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-500" />
                      最热话题
                    </div>
                  </SelectItem>
                  <SelectItem value="latest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      最新话题
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 数量限制 */}
            <div className="space-y-2">
              <Label>显示数量</Label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 条</SelectItem>
                  <SelectItem value="15">15 条</SelectItem>
                  <SelectItem value="20">20 条</SelectItem>
                  <SelectItem value="30">30 条</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 自动刷新 */}
            <div className="space-y-2">
              <Label>自动刷新</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <span className="text-sm text-gray-600">
                  {autoRefresh ? '已开启' : '已关闭'}
                </span>
              </div>
            </div>
          </div>

          {/* 高级控制 */}
          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              {/* 推荐数据源组合 */}
              {Object.keys(recommendations).length > 0 && (
                <div className="space-y-2">
                  <Label>推荐组合</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(recommendations).map(([key, rec]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => applyRecommendation(key)}
                        className="text-xs"
                      >
                        {rec.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* 自定义数据源选择 */}
              {availableSources.length > 0 && (
                <div className="space-y-2">
                  <Label>选择数据源 ({selectedSources.length} 个已选)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {availableSources.map((source) => (
                      <div
                        key={source.id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          selectedSources.includes(source.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (selectedSources.includes(source.id)) {
                            setSelectedSources(selectedSources.filter(s => s !== source.id));
                          } else {
                            setSelectedSources([...selectedSources, source.id]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          <span className="text-sm font-medium">{source.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{source.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热点话题列表 */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>正在获取{mode === 'latest' ? '最新' : '最热'}话题...</p>
          </div>
        ) : hotTopics.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">暂无热点话题数据</p>
              <Button onClick={fetchHotTopics} className="mt-4">
                重新获取
              </Button>
            </CardContent>
          </Card>
        ) : (
          hotTopics.map((topic, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        #{topic.rank}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: topic.color || '#6c757d',
                          color: topic.color || '#6c757d'
                        }}
                      >
                        {topic.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {topic.category}
                      </Badge>
                      {topic.isRealData && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          真实数据
                        </Badge>
                      )}
                      {mode === 'latest' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          最新
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {topic.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {topic.summary}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-red-500 font-semibold mb-1">
                      <Flame className="h-4 w-4" />
                      {formatHeat(topic.heat)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(topic.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {topic.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* AI 分析结果 */}
                {topic.aiAnalysis && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">情感倾向:</span>
                        <span className={`ml-1 font-medium ${getSentimentColor(topic.aiAnalysis.sentiment)}`}>
                          {topic.aiAnalysis.sentiment === 'positive' ? '积极' : 
                           topic.aiAnalysis.sentiment === 'negative' ? '消极' : '中性'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">传播潜力:</span>
                        <span className="ml-1 font-medium text-blue-600">
                          {topic.aiAnalysis.viralPotential}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">商业价值:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {topic.aiAnalysis.commercialValue}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">阅读时长:</span>
                        <span className="ml-1 font-medium">
                          {topic.aiAnalysis.estimatedReadTime}分钟
                        </span>
                      </div>
                    </div>
                    
                    {topic.aiAnalysis.targetAudience && (
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm">目标受众:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {topic.aiAnalysis.targetAudience.map((audience, audienceIndex) => (
                            <Badge key={audienceIndex} variant="outline" className="text-xs">
                              {audience}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      生成灵感
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(topic.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      查看原文
                    </Button>
                  </div>
                  
                  {topic.aiAnalysis && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDifficultyColor(topic.aiAnalysis.difficulty)}`}
                      >
                        {topic.aiAnalysis.difficulty === 'low' ? '简单' :
                         topic.aiAnalysis.difficulty === 'medium' ? '中等' : '困难'}
                      </Badge>
                      {topic.aiAnalysis.authenticity && (
                        <span>真实度: {topic.aiAnalysis.authenticity}%</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 话题详情弹窗 */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-2">{selectedTopic.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedTopic.platform}</Badge>
                    <Badge variant="outline">{selectedTopic.category}</Badge>
                    <span className="text-sm text-gray-500">
                      热度: {formatHeat(selectedTopic.heat)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTopic(null)}
                >
                  关闭
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">内容摘要</h4>
                  <p className="text-gray-700">{selectedTopic.summary}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">详细内容</h4>
                  <div className="prose max-w-none">
                    {selectedTopic.content.split('\n').map((line, index) => (
                      <p key={index} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>

                {selectedTopic.aiAnalysis && (
                  <div>
                    <h4 className="font-semibold mb-2">AI 深度分析</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>传播潜力:</strong> {selectedTopic.aiAnalysis.viralPotential}%
                        </div>
                        <div>
                          <strong>商业价值:</strong> {selectedTopic.aiAnalysis.commercialValue}%
                        </div>
                        <div>
                          <strong>趋势分数:</strong> {selectedTopic.aiAnalysis.trendScore}%
                        </div>
                        <div>
                          <strong>参与度:</strong> {selectedTopic.aiAnalysis.engagementRate}%
                        </div>
                        <div>
                          <strong>分享性:</strong> {selectedTopic.aiAnalysis.shareability}%
                        </div>
                        <div>
                          <strong>竞争激烈度:</strong> {selectedTopic.aiAnalysis.competitiveness}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => window.open(selectedTopic.url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    查看原文
                  </Button>
                  <Button variant="outline">
                    <Sparkles className="h-4 w-4 mr-1" />
                    生成创作灵感
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HotTopics;