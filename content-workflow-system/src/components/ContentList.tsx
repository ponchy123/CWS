import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar } from 'lucide-react';

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
  metadata?: {
    generatedBy?: string;
    generatedAt?: string;
  };
}

interface ContentListProps {
  refreshTrigger: number;
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
  onEdit: (content: Content) => void;
  onDelete: (id: string) => void;
}

export default function ContentList({ 
  refreshTrigger, 
  searchTerm, 
  selectedCategory, 
  selectedStatus,
  onEdit,
  onDelete 
}: ContentListProps) {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      
      // 强制防缓存
      params.append('_t', Date.now().toString());
      params.append('_r', refreshTrigger.toString());
      
      console.log('🔄 ContentList: 获取内容列表', { refreshTrigger, searchTerm, selectedCategory, selectedStatus });
      
      const response = await fetch(`http://localhost:3004/api/content?${params}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newContents = data.data?.contents || [];
        console.log('✅ ContentList: 获取成功', {
          count: newContents.length,
          firstTitle: newContents[0]?.title,
          refreshTrigger,
          allTitles: newContents.map((c: Content) => c.title).slice(0, 5)
        });
        
        // 强制更新状态
        setContents([...newContents]);
      } else {
        console.error('❌ ContentList: 获取失败', data.message);
        setContents([]);
      }
    } catch (error) {
      console.error('❌ ContentList: 网络错误', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 ContentList: useEffect触发', { refreshTrigger, searchTerm, selectedCategory, selectedStatus });
    fetchContents();
  }, [refreshTrigger, searchTerm, selectedCategory, selectedStatus]);

  // 强制重新渲染的调试useEffect
  useEffect(() => {
    console.log('📊 ContentList: 内容状态更新', { 
      contentsLength: contents.length, 
      refreshTrigger,
      firstContent: contents[0]?.title 
    });
  }, [contents, refreshTrigger]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-500 mb-2">暂无内容</div>
          <div className="text-sm text-gray-400">
            刷新触发器: {refreshTrigger} | 搜索: "{searchTerm}" | 分类: "{selectedCategory}" | 状态: "{selectedStatus}"
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 ContentList: 开始渲染', { 
    contentsLength: contents.length, 
    refreshTrigger,
    contentIds: contents.map((c: Content) => c._id).slice(0, 5)
  });

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-4">
        显示 {contents.length} 条内容 (刷新触发器: {refreshTrigger})
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {contents.map((content: Content, index: number) => {
          console.log(`🔍 渲染内容 ${index + 1}:`, content.title);
          return (
            <Card 
              key={`${content._id}-${index}`} 
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(content)}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(content._id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{content.category}</Badge>
                  <Badge className={`text-xs ${getPriorityColor(content.priority)}`}>
                    {content.priority}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(content.status)}`}>
                    {getStatusText(content.status)}
                  </Badge>
                  {content.metadata?.generatedBy === 'AI' && (
                    <Badge className="text-xs bg-purple-100 text-purple-800">
                      🤖 AI生成
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {content.summary && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{content.summary}</p>
                )}
                <p className="text-sm text-gray-500 line-clamp-3 mb-3">{content.content}</p>
                
                {content.tags && content.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {content.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {content.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{content.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{new Date(content.createdAt).toLocaleDateString('zh-CN')}</span>
                  {content.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(content.scheduledAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}