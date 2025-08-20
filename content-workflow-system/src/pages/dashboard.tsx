﻿import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Users, FileText, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  publishedCount: number;
  newFollowers: number;
  conversionRate: string;
}

interface InspirationStats {
  total: number;
  today: number;
  completed: number;
  starred: number;
}

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    publishedCount: 0,
    newFollowers: 0,
    conversionRate: '0'
  });
  const [inspirationStats, setInspirationStats] = useState<InspirationStats>({
    total: 0,
    today: 0,
    completed: 0,
    starred: 0
  });
  const [contentStats, setContentStats] = useState<ContentStats>({
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0
  });

  const { toast } = useToast();

  // 获取分析数据
  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/analytics/overview');
      const data = await response.json();
      
      if (data.success) {
        setDashboardStats(data.data);
      } else {
        // 如果需要认证，使用模拟数据
        setDashboardStats({
          totalViews: 12500,
          totalLikes: 890,
          totalComments: 234,
          totalShares: 156,
          publishedCount: 8,
          newFollowers: 45,
          conversionRate: '7.12'
        });
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      // 使用模拟数据作为后备
      setDashboardStats({
        totalViews: 12500,
        totalLikes: 890,
        totalComments: 234,
        totalShares: 156,
        publishedCount: 8,
        newFollowers: 45,
        conversionRate: '7.12'
      });
    }
  };

  // 获取灵感统计
  const fetchInspirationStats = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/inspiration/stats/overview');
      const data = await response.json();
      
      if (data.success) {
        setInspirationStats(data.data);
      }
    } catch (error) {
      console.error('获取灵感统计失败:', error);
    }
  };

  // 获取内容统计
  const fetchContentStats = async () => {
    try {
      // 获取不同状态的内容数量
      const [totalRes, publishedRes, draftRes, scheduledRes] = await Promise.all([
        fetch('http://localhost:3004/api/content?limit=1'),
        fetch('http://localhost:3004/api/content?status=published&limit=1'),
        fetch('http://localhost:3004/api/content?status=draft&limit=1'),
        fetch('http://localhost:3004/api/content?status=scheduled&limit=1')
      ]);

      const [totalData, publishedData, draftData, scheduledData] = await Promise.all([
        totalRes.json(),
        publishedRes.json(),
        draftRes.json(),
        scheduledRes.json()
      ]);

      setContentStats({
        total: totalData.success ? totalData.data.pagination?.total || 0 : 0,
        published: publishedData.success ? publishedData.data.pagination?.total || 0 : 0,
        draft: draftData.success ? draftData.data.pagination?.total || 0 : 0,
        scheduled: scheduledData.success ? scheduledData.data.pagination?.total || 0 : 0
      });
    } catch (error) {
      console.error('获取内容统计失败:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAnalyticsData(),
        fetchInspirationStats(),
        fetchContentStats()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      fetchAnalyticsData(),
      fetchInspirationStats(),
      fetchContentStats()
    ]);
    toast({
      title: "刷新成功",
      description: "数据已更新",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-600">欢迎回来，查看您的内容创作概览</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <TrendingUp className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            快速创建
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
            <div className="text-2xl font-bold">{dashboardStats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              转化率 {dashboardStats.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总点赞数</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              互动率 {((dashboardStats.totalLikes / Math.max(dashboardStats.totalViews, 1)) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评论数</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalComments.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">+{dashboardStats.newFollowers}</div>
            <p className="text-xs text-muted-foreground">
              本周新增
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 内容统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">内容概览</CardTitle>
            <CardDescription>内容创作统计</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">总内容数</span>
              <span className="font-semibold">{contentStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">已发布</span>
              <span className="font-semibold text-green-600">{contentStats.published}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">草稿</span>
              <span className="font-semibold text-yellow-600">{contentStats.draft}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">已排程</span>
              <span className="font-semibold text-blue-600">{contentStats.scheduled}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">灵感统计</CardTitle>
            <CardDescription>创作灵感管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">总灵感数</span>
              <span className="font-semibold">{inspirationStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">今日新增</span>
              <span className="font-semibold text-blue-600">{inspirationStats.today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">已完成</span>
              <span className="font-semibold text-green-600">{inspirationStats.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">已收藏</span>
              <span className="font-semibold text-yellow-600">{inspirationStats.starred}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">发布统计</CardTitle>
            <CardDescription>近期发布表现</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">本周发布</span>
              <span className="font-semibold">{dashboardStats.publishedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">平均阅读</span>
              <span className="font-semibold">
                {dashboardStats.publishedCount > 0 
                  ? Math.round(dashboardStats.totalViews / dashboardStats.publishedCount).toLocaleString()
                  : '0'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">分享次数</span>
              <span className="font-semibold">{dashboardStats.totalShares}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">互动总数</span>
              <span className="font-semibold">
                {(dashboardStats.totalLikes + dashboardStats.totalComments + dashboardStats.totalShares).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">快速操作</CardTitle>
          <CardDescription>常用功能快捷入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">新建内容</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">添加灵感</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Share2 className="h-6 w-6" />
              <span className="text-sm">发布管理</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span className="text-sm">数据分析</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}