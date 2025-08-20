import { useEffect, useState } from 'react';
import { Calendar, Clock, Send, Pause, Play, RefreshCw, Plus, Filter, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PublishTask {
  _id: string;
  title: string;
  content: string;
  platforms: Array<{
    name: string;
    status: 'pending' | 'published' | 'failed' | 'scheduled';
    publishedAt?: string;
    scheduledAt?: string;
    error?: string;
  }>;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledAt?: string;
  createdAt: string;
  category: string;
}

export default function PublishManager() {
  const [publishTasks, setPublishTasks] = useState<PublishTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const platforms = ['知乎', 'B站', '公众号', '小红书', '抖音'];
  const statuses = ['scheduled', 'publishing', 'published', 'failed'];

  // 获取发布任务列表
  const fetchPublishTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPlatform) params.append('platform', selectedPlatform);
      
      const response = await fetch(`http://localhost:3004/api/publish?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPublishTasks(data.data.tasks || []);
      } else {
        // 使用模拟数据
        const mockTasks: PublishTask[] = [
          {
            _id: '1',
            title: 'AI工具使用指南',
            content: '详细介绍各种AI工具的使用方法...',
            category: 'AI工具',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            platforms: [
              { name: '知乎', status: 'scheduled', scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
              { name: 'B站', status: 'scheduled', scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() }
            ]
          },
          {
            _id: '2',
            title: '产品设计最佳实践',
            content: '分享产品设计的核心原则和方法...',
            category: '产品设计',
            status: 'published',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            platforms: [
              { name: '公众号', status: 'published', publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
              { name: '小红书', status: 'published', publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
            ]
          },
          {
            _id: '3',
            title: '营销策略分析',
            content: '深度分析当前市场营销趋势...',
            category: '营销策略',
            status: 'failed',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            platforms: [
              { name: '抖音', status: 'failed', error: '内容审核未通过' },
              { name: '知乎', status: 'published', publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() }
            ]
          }
        ];
        setPublishTasks(mockTasks);
      }
    } catch (error) {
      console.error('获取发布任务失败:', error);
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 立即发布
  const publishNow = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3004/api/publish/${taskId}/publish-now`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "发布成功",
          description: "内容已开始发布",
        });
        fetchPublishTasks();
      } else {
        toast({
          title: "发布失败",
          description: data.message || "发布任务失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('发布失败:', error);
      toast({
        title: "网络错误",
        description: "无法执行发布操作",
        variant: "destructive",
      });
    }
  };

  // 暂停发布
  const pauseTask = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3004/api/publish/${taskId}/pause`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "已暂停",
          description: "发布任务已暂停",
        });
        fetchPublishTasks();
      } else {
        toast({
          title: "操作失败",
          description: data.message || "暂停任务失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('暂停任务失败:', error);
      toast({
        title: "网络错误",
        description: "无法暂停任务",
        variant: "destructive",
      });
    }
  };

  // 重试发布
  const retryTask = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3004/api/publish/${taskId}/retry`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "重试成功",
          description: "发布任务已重新开始",
        });
        fetchPublishTasks();
      } else {
        toast({
          title: "重试失败",
          description: data.message || "重试任务失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('重试任务失败:', error);
      toast({
        title: "网络错误",
        description: "无法重试任务",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPublishTasks();
  }, [searchTerm, selectedStatus, selectedPlatform]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'publishing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布';
      case 'scheduled': return '已排程';
      case 'publishing': return '发布中';
      case 'failed': return '发布失败';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'publishing': return <Send className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPlatformStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">发布管理</h1>
          <p className="text-gray-600">统一管理内容的发布与排程</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPublishTasks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            新建发布任务
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">总任务数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已排程</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {publishTasks.filter(task => task.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已发布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publishTasks.filter(task => task.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">发布失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {publishTasks.filter(task => task.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索发布任务..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="选择平台" />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部平台</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
              ))}
            </SelectContent>
        </Select>
      </div>

      {/* 发布任务列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : publishTasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-2">暂无发布任务</div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个发布任务
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          publishTasks.map((task) => (
            <Card key={task._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {task.content}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {task.status === 'scheduled' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => publishNow(task._id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          立即发布
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseTask(task._id)}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          暂停
                        </Button>
                      </>
                    )}
                    {task.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryTask(task._id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        重试
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 平台发布状态 */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">发布平台</div>
                    <div className="flex flex-wrap gap-2">
                      {task.platforms.map((platform, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Badge className={`text-xs ${getPlatformStatusColor(platform.status)}`}>
                            {platform.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {platform.status === 'published' && platform.publishedAt && 
                              `已发布 ${new Date(platform.publishedAt).toLocaleString('zh-CN')}`
                            }
                            {platform.status === 'scheduled' && platform.scheduledAt && 
                              `排程 ${new Date(platform.scheduledAt).toLocaleString('zh-CN')}`
                            }
                            {platform.status === 'failed' && platform.error && 
                              `失败: ${platform.error}`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                    {task.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        排程时间: {new Date(task.scheduledAt).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}