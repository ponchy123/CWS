﻿import { useEffect, useState } from 'react';
import { Plus, Search, Star, Trash2, RefreshCw, TrendingUp, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Inspiration {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  priority: string;
  isStarred: boolean;
  createdAt: string;
  source?: string;
}

export default function SmartInspirationSystem() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotTopicsLoading, setHotTopicsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showHotTopics, setShowHotTopics] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    completed: 0,
    starred: 0
  });
  
  const { toast } = useToast();

  // 新建灵感表单数据
  const [newInspiration, setNewInspiration] = useState({
    title: '',
    content: '',
    category: '职业发展',
    tags: '',
    priority: 'medium',
    source: ''
  });

  const categories = ['职业发展', 'AI工具', '行业分析', '文案技巧', '产品设计', '营销策略'];
  const statuses = ['待处理', '进行中', '已完成', '已放弃'];

  // 获取灵感列表
  const fetchInspirations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // 添加真实数据参数
      params.append('useRealData', 'true');
      params.append('limit', '15');
      params.append('type', 'hottest');
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      
      console.log('🎯 获取灵感数据，参数:', Object.fromEntries(params));
      
      const response = await fetch(`http://localhost:3004/api/inspiration?${params}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 成功获取灵感数据:', data.data);
        setInspirations(data.data.inspirations || []);
        
        if (data.data.isRealData) {
          toast({
            title: "数据更新",
            description: `已获取 ${data.data.inspirations?.length || 0} 条真实灵感数据`,
          });
        }
      } else {
        console.log('❌ 获取灵感失败:', data.message);
        toast({
          title: "获取失败",
          description: data.message || "无法获取灵感列表",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('获取灵感列表失败:', error);
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/inspiration/stats/overview');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 创建灵感
  const handleCreateInspiration = async () => {
    try {
      const inspirationData = {
        ...newInspiration,
        tags: newInspiration.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await fetch('http://localhost:3004/api/inspiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspirationData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "创建成功",
          description: "灵感已成功创建",
        });
        setIsCreateDialogOpen(false);
        setNewInspiration({
          title: '',
          content: '',
          category: '职业发展',
          tags: '',
          priority: 'medium',
          source: ''
        });
        fetchInspirations();
        fetchStats();
      } else {
        toast({
          title: "创建失败",
          description: data.message || "创建灵感失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('创建灵感失败:', error);
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive",
      });
    }
  };

  // 切换收藏状态
  const toggleStar = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3004/api/inspiration/${id}/star`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: data.message,
          description: "收藏状态已更新",
        });
        fetchInspirations();
        fetchStats();
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      toast({
        title: "操作失败",
        description: "无法更新收藏状态",
        variant: "destructive",
      });
    }
  };

  // 删除灵感
  const deleteInspiration = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3004/api/inspiration/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "删除成功",
          description: "灵感已删除",
        });
        fetchInspirations();
        fetchStats();
      }
    } catch (error) {
      console.error('删除灵感失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除灵感",
        variant: "destructive",
      });
    }
  };

  // 抓取热点话题
  const fetchHotTopics = async (useRealAPI: boolean = true) => {
    try {
      setHotTopicsLoading(true);
      console.log('🔥 请求 NewsNow 热点数据');
      
      const response = await fetch('http://localhost:3004/api/hot-topics/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'hottest',
          sources: ['zhihu', 'weibo', 'v2ex', 'bilibili', 'sspai', 'juejin'], // 使用稳定的数据源
          limit: 20
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setHotTopics(data.data || []);
        setShowHotTopics(true);
        toast({
          title: "抓取成功",
          description: `成功抓取 ${data.data?.length || 0} 个热点话题`,
        });
        // 刷新灵感列表，因为热点会自动转换为灵感
        fetchInspirations();
        fetchStats();
      } else {
        toast({
          title: "抓取失败",
          description: data.message || "无法抓取热点话题",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('抓取热点话题失败:', error);
      const errorMessage = error instanceof Error ? error.message : '无法连接到服务器';
      toast({
        title: errorMessage.includes('429') || errorMessage.includes('频繁') ? "请求限制" : "网络错误",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setHotTopicsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspirations();
    fetchStats();
  }, [searchTerm, selectedCategory, selectedStatus]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成': return 'bg-green-100 text-green-800';
      case '进行中': return 'bg-blue-100 text-blue-800';
      case '待处理': return 'bg-gray-100 text-gray-800';
      case '已放弃': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能灵感系统</h1>
          <p className="text-gray-600">收集、管理和转化创作灵感</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchInspirations(); fetchStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fetchHotTopics(true)}
            disabled={hotTopicsLoading}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {hotTopicsLoading ? '抓取中...' : '抓取热点'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                新建灵感
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>创建新灵感</DialogTitle>
                <DialogDescription>添加一个新的创作灵感</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">标题</Label>
                  <Input
                    id="title"
                    value={newInspiration.title}
                    onChange={(e) => setNewInspiration({...newInspiration, title: e.target.value})}
                    placeholder="输入灵感标题"
                  />
                </div>
                <div>
                  <Label htmlFor="content">内容</Label>
                  <Textarea
                    id="content"
                    value={newInspiration.content}
                    onChange={(e) => setNewInspiration({...newInspiration, content: e.target.value})}
                    placeholder="描述你的灵感..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">分类</Label>
                  <Select value={newInspiration.category} onValueChange={(value) => setNewInspiration({...newInspiration, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    value={newInspiration.tags}
                    onChange={(e) => setNewInspiration({...newInspiration, tags: e.target.value})}
                    placeholder="用逗号分隔多个标签"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">优先级</Label>
                  <Select value={newInspiration.priority} onValueChange={(value) => setNewInspiration({...newInspiration, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">来源</Label>
                  <Input
                    id="source"
                    value={newInspiration.source}
                    onChange={(e) => setNewInspiration({...newInspiration, source: e.target.value})}
                    placeholder="灵感来源（可选）"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateInspiration}>
                    创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">总灵感数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">今日新增</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已收藏</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.starred}</div>
          </CardContent>
        </Card>
      </div>

      {/* 简化的标签切换 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button 
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
            !showHotTopics ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setShowHotTopics(false)}
        >
          <Zap className="h-4 w-4" />
          我的灵感
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
            showHotTopics ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setShowHotTopics(true)}
        >
          <TrendingUp className="h-4 w-4" />
          热点话题
        </button>
      </div>

      {/* 主要内容区域 */}
      {!showHotTopics ? (
        <div className="space-y-6">
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索灵感..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 灵感列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : inspirations.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">暂无灵感</div>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个灵感
                  </Button>
                </div>
              </div>
            ) : (
              inspirations.map((inspiration) => (
                <Card key={inspiration._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">{inspiration.title}</CardTitle>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStar(inspiration._id)}
                          className={inspiration.isStarred ? 'text-yellow-500' : 'text-gray-400'}
                        >
                          <Star className="h-4 w-4" fill={inspiration.isStarred ? 'currentColor' : 'none'} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInspiration(inspiration._id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">{inspiration.category}</Badge>
                      <Badge className={`text-xs ${getPriorityColor(inspiration.priority)}`}>
                        {inspiration.priority}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(inspiration.status)}`}>
                        {inspiration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">{inspiration.content}</p>
                    {inspiration.tags && inspiration.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {inspiration.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(inspiration.createdAt).toLocaleDateString('zh-CN')}
                      {inspiration.source && ` • 来源: ${inspiration.source}`}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 热点话题列表 */}
          <div className="space-y-4">
            {hotTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotTopics.map((topic, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-400">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2 hover:text-orange-600 transition-colors">
                          {topic.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className="bg-red-100 text-red-800 animate-pulse">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {topic.heat?.toLocaleString() || 'N/A'}
                          </Badge>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                            {topic.platform}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          {topic.category}
                        </Badge>
                        {topic.aiAnalysis && (
                          <>
                            <Badge className="text-xs bg-green-100 text-green-800">
                              {topic.aiAnalysis.sentiment || '积极'}
                            </Badge>
                            <Badge className="text-xs bg-blue-100 text-blue-800">
                              {topic.aiAnalysis.estimatedReadTime || 3}分钟阅读
                            </Badge>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 摘要 */}
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border-l-4 border-orange-300">
                        <p className="text-sm text-gray-700 font-medium">{topic.summary}</p>
                      </div>
                      
                      {/* 详细内容（如果有的话） */}
                      {topic.content && (
                        <div className="bg-white border rounded-lg p-3 space-y-2 shadow-inner max-h-32 overflow-y-auto">
                          <div className="text-xs font-medium text-gray-600 border-b pb-1">详细内容</div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {topic.content.split('\n').slice(0, 3).map((paragraph: string, pIndex: number) => (
                              paragraph.trim() && (
                                <p key={pIndex} className="mb-1">
                                  {paragraph.length > 100 ? `${paragraph.substring(0, 100)}...` : paragraph}
                                </p>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 标签 */}
                      {topic.tags && topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {topic.tags.slice(0, 4).map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              #{tag}
                            </Badge>
                          ))}
                          {topic.tags.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{topic.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* AI分析信息 */}
                      {topic.aiAnalysis && (
                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-1">
                            <span className="text-purple-500">👥</span>
                            <span>{topic.aiAnalysis.targetAudience?.[0] || '通用受众'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-500">📊</span>
                            <span>{topic.aiAnalysis.contentType || '资讯'}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 底部操作栏 */}
                      <div className="flex items-center justify-between pt-2 border-t text-xs">
                        <div className="text-gray-500">
                          {new Date(topic.createdAt).toLocaleString('zh-CN')}
                        </div>
                        <div className="flex gap-2">
                          {topic.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(topic.url, '_blank')}
                              className="h-7 px-2 text-xs hover:bg-blue-50"
                            >
                              查看原文
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            className="h-7 px-2 text-xs bg-orange-500 hover:bg-orange-600"
                            onClick={() => {
                              // 将热点转换为灵感
                              setNewInspiration({
                                title: topic.title,
                                content: topic.summary + (topic.content ? '\n\n详细内容:\n' + topic.content.substring(0, 200) + '...' : ''),
                                category: topic.category || '行业分析',
                                tags: topic.tags?.join(', ') || '',
                                priority: 'medium',
                                source: `${topic.platform}热点话题`
                              });
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            转为灵感
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-4">暂无热点话题数据</div>
                <Button onClick={() => fetchHotTopics()} disabled={hotTopicsLoading}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {hotTopicsLoading ? '抓取中...' : '抓取热点话题'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}