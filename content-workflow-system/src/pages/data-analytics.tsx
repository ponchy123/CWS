﻿import { useEffect, useState } from 'react';
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Users, BarChart3, PieChart, Download, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  publishedCount: number;
  newFollowers: number;
  conversionRate: string;
}

interface PlatformData {
  platform: string;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  contentCount: number;
  avgViews: number;
}

interface ContentPerformance {
  _id: string;
  title: string;
  category: string;
  publishedAt: string;
  analytics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
}

interface TrendData {
  _id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export default function DataAnalytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    publishedCount: 0,
    newFollowers: 0,
    conversionRate: '0'
  });
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const { toast } = useToast();

  // 获取分析概览数据
  const fetchAnalyticsOverview = async () => {
    try {
      const response = await fetch(`http://localhost:3004/api/analytics/overview?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        // 无数据时返回空值
        setAnalyticsData({
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          publishedCount: 0,
          newFollowers: 0,
          conversionRate: '0'
        });
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      // 错误时返回空值
      setAnalyticsData({
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        publishedCount: 0,
        newFollowers: 0,
        conversionRate: '0'
      });
    }
  };

  // 获取平台数据
  const fetchPlatformData = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/analytics/platforms');
      const data = await response.json();
      
      if (data.success) {
        setPlatformData(data.data);
      } else {
        // 无数据时返回空数组
        setPlatformData([]);
      }
    } catch (error) {
      console.error('获取平台数据失败:', error);
      setPlatformData([]);
    }
  };

  // 获取内容表现数据
  const fetchContentPerformance = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/analytics/content-performance?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setContentPerformance(data.data);
      } else {
        // 无数据时返回空数组
        setContentPerformance([]);
      }
    } catch (error) {
      console.error('获取内容表现数据失败:', error);
      setContentPerformance([]);
    }
  };

  // 获取趋势数据
  const fetchTrendData = async () => {
    try {
      const response = await fetch(`http://localhost:3004/api/analytics/trends?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setTrendData(data.data);
      } else {
        // 无数据时返回空数组
        setTrendData([]);
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      setTrendData([]);
    }
  };

  // 导出数据
  const exportData = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/analytics/export?type=all&format=json');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "导出成功",
          description: "数据已成功导出",
        });
      } else {
        throw new Error('导出失败');
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      toast({
        title: "导出失败",
        description: "无法导出数据",
        variant: "destructive",
      });
    }
  };

  // 刷新所有数据
  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnalyticsOverview(),
      fetchPlatformData(),
      fetchContentPerformance(),
      fetchTrendData()
    ]);
    setLoading(false);
    
    toast({
      title: "刷新成功",
      description: "数据已更新",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAnalyticsOverview(),
        fetchPlatformData(),
        fetchContentPerformance(),
        fetchTrendData()
      ]);
      setLoading(false);
    };

    loadData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
          <p className="text-gray-600">关键指标与趋势概览</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">近7天</SelectItem>
              <SelectItem value="30d">近30天</SelectItem>
              <SelectItem value="90d">近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总阅读量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              转化率 {analyticsData.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总点赞数</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              互动率 {((analyticsData.totalLikes / Math.max(analyticsData.totalViews, 1)) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评论数</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalComments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃度指标
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新增粉丝</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{analyticsData.newFollowers}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === '7d' ? '本周' : timeRange === '30d' ? '本月' : '本季度'}新增
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 平台表现 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            平台表现分析
          </CardTitle>
          <CardDescription>各平台的内容表现对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformData.map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{platform.platform}</Badge>
                  <div className="text-sm text-gray-600">
                    {platform.contentCount} 篇内容
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{platform.totalViews.toLocaleString()}</div>
                    <div className="text-gray-500">阅读量</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{platform.totalLikes.toLocaleString()}</div>
                    <div className="text-gray-500">点赞数</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{Math.round(platform.avgViews).toLocaleString()}</div>
                    <div className="text-gray-500">平均阅读</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">
                      {((platform.totalLikes / Math.max(platform.totalViews, 1)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-500">互动率</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 内容表现排行 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            热门内容排行
          </CardTitle>
          <CardDescription>表现最佳的内容列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contentPerformance.map((content, index) => (
              <div key={content._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium line-clamp-1">{content.title}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" className="text-xs">{content.category}</Badge>
                      <span>{new Date(content.publishedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{content.analytics.totalViews.toLocaleString()}</div>
                    <div className="text-gray-500">阅读</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{content.analytics.totalLikes.toLocaleString()}</div>
                    <div className="text-gray-500">点赞</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{content.analytics.totalComments.toLocaleString()}</div>
                    <div className="text-gray-500">评论</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            数据趋势
          </CardTitle>
          <CardDescription>近期数据变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {trendData.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">总阅读量</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {trendData.reduce((sum, item) => sum + item.likes, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">总点赞数</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {trendData.reduce((sum, item) => sum + item.comments, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">总评论数</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {trendData.reduce((sum, item) => sum + item.shares, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">总分享数</div>
              </div>
            </div>
            
            {/* 简单的趋势展示 */}
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-700 mb-3">日均数据趋势</div>
              <div className="space-y-2">
                {trendData.slice(-7).map((item, index) => (
                  <div key={item._id} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-500">
                      {new Date(item._id).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Eye className="h-3 w-3" />
                        {item.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Heart className="h-3 w-3" />
                        {item.likes.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MessageCircle className="h-3 w-3" />
                        {item.comments.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Share2 className="h-3 w-3" />
                        {item.shares.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}