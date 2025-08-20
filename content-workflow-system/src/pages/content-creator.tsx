import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, Save, FileText, Image, Video, Link } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ContentList from '@/components/ContentList';

interface Content {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: string;
  priority: string;
  platforms: Array<{
    name: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  coverImage?: string;
}

export default function ContentCreator() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();

  // 新建内容表单数据
  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    summary: '',
    category: '职业发展',
    tags: '',
    priority: 'medium',
    platforms: [] as string[],
    scheduledAt: ''
  });

  const categories = ['职业发展', 'AI工具', '行业分析', '文案技巧', '产品设计', '营销策略'];
  const statuses = ['draft', 'published', 'scheduled', 'archived'];
  const priorities = ['low', 'medium', 'high'];
  const platforms = ['知乎', 'B站', '公众号', '小红书', '抖音'];


  // AI自动创作内容
  const handleAIGenerate = async () => {
    try {
      setIsGenerating(true);
      
      toast({
        title: "AI创作中...",
        description: "正在基于热门话题生成内容，请稍候",
      });

      const response = await fetch('http://localhost:3004/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: '职业发展',
          tags: ['AI创作', '自动生成'],
          inspiration: '基于当前热门话题',
          metadata: {
            generatedBy: 'AI',
            generatedAt: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "🎉 AI创作成功！",
          description: `已生成内容：${data.data.title}`,
        });
        
        console.log('🎯 AI生成成功，触发ContentList刷新');
        
        // 清除所有筛选条件，确保能看到新生成的内容
        setSearchTerm('');
        setSelectedCategory('all');
        setSelectedStatus('all');
        
        // 触发ContentList组件刷新
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "AI创作失败",
          description: data.message || "无法生成内容",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('AI创作失败:', error);
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 创建内容
  const handleCreateContent = async () => {
    try {
      const contentData = {
        ...newContent,
        tags: newContent.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        platforms: newContent.platforms.map(platform => ({
          name: platform,
          status: 'draft'
        }))
      };

      const response = await fetch('http://localhost:3004/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "创建成功",
          description: "内容已成功创建",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "创建失败",
          description: data.message || "创建内容失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('创建内容失败:', error);
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive",
      });
    }
  };

  // 更新内容
  const handleUpdateContent = async () => {
    if (!editingContent) return;

    try {
      const contentData = {
        ...newContent,
        tags: newContent.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        platforms: newContent.platforms.map(platform => ({
          name: platform,
          status: 'draft'
        }))
      };

      const response = await fetch(`http://localhost:3004/api/content/${editingContent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "更新成功",
          description: "内容已成功更新",
        });
        setEditingContent(null);
        resetForm();
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "更新失败",
          description: data.message || "更新内容失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('更新内容失败:', error);
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive",
      });
    }
  };

  // 删除内容
  const deleteContent = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3004/api/content/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "删除成功",
          description: "内容已删除",
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "删除失败",
          description: data.message || "删除内容失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('删除内容失败:', error);
      toast({
        title: "网络错误",
        description: "无法删除内容",
        variant: "destructive",
      });
    }
  };

  // 重置表单
  const resetForm = () => {
    setNewContent({
      title: '',
      content: '',
      summary: '',
      category: '职业发展',
      tags: '',
      priority: 'medium',
      platforms: [],
      scheduledAt: ''
    });
  };

  // 编辑内容
  const startEdit = (content: Content) => {
    setEditingContent(content);
    setNewContent({
      title: content.title,
      content: content.content,
      summary: content.summary || '',
      category: content.category,
      tags: content.tags.join(', '),
      priority: content.priority,
      platforms: content.platforms.map(p => p.name),
      scheduledAt: content.scheduledAt ? new Date(content.scheduledAt).toISOString().slice(0, 16) : ''
    });
    setIsCreateDialogOpen(true);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布';
      case 'draft': return '草稿';
      case 'scheduled': return '已排程';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容创作</h1>
          <p className="text-gray-600">创建和管理您的内容</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAIGenerate}
            className="bg-green-600 hover:bg-green-700"
            disabled={isGenerating}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'AI创作中...' : 'AI自动创作'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingContent(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                新建内容
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContent ? '编辑内容' : '创建新内容'}</DialogTitle>
                <DialogDescription>
                  {editingContent ? '修改现有内容' : '创建一个新的内容'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">标题</Label>
                  <Input
                    id="title"
                    value={newContent.title}
                    onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                    placeholder="输入内容标题"
                  />
                </div>
                <div>
                  <Label htmlFor="summary">摘要</Label>
                  <Input
                    id="summary"
                    value={newContent.summary}
                    onChange={(e) => setNewContent({...newContent, summary: e.target.value})}
                    placeholder="内容摘要（可选）"
                  />
                </div>
                <div>
                  <Label htmlFor="content">内容</Label>
                  <Textarea
                    id="content"
                    value={newContent.content}
                    onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                    placeholder="输入内容正文..."
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Select value={newContent.category} onValueChange={(value) => setNewContent({...newContent, category: value})}>
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
                    <Label htmlFor="priority">优先级</Label>
                    <Select value={newContent.priority} onValueChange={(value) => setNewContent({...newContent, priority: value})}>
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
                </div>
                <div>
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    value={newContent.tags}
                    onChange={(e) => setNewContent({...newContent, tags: e.target.value})}
                    placeholder="用逗号分隔多个标签"
                  />
                </div>
                <div>
                  <Label>发布平台</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {platforms.map(platform => (
                      <Button
                        key={platform}
                        variant={newContent.platforms.includes(platform) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const platforms = newContent.platforms.includes(platform)
                            ? newContent.platforms.filter(p => p !== platform)
                            : [...newContent.platforms, platform];
                          setNewContent({...newContent, platforms});
                        }}
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="scheduledAt">排程时间（可选）</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={newContent.scheduledAt}
                    onChange={(e) => setNewContent({...newContent, scheduledAt: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={editingContent ? handleUpdateContent : handleCreateContent}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingContent ? '更新' : '创建'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索内容..."
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
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
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
              <SelectItem key={status} value={status}>{getStatusText(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 内容列表 */}
      <ContentList
        refreshTrigger={refreshTrigger}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        onEdit={startEdit}
        onDelete={deleteContent}
      />
    </div>
  );
}