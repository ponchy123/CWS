import React, { useState } from 'react';

import { Tag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import categoryConfig from '../../config/category-config';
import platformConfig from '../../config/platform-config';
import {
  CategorizedResult,
  ContentPlan,
  CategoryType,
} from '../../types/inspiration-types';
import { generateId } from '../../utils/inspiration-utils';

interface ContentPlanningProps {
  categorizedResults: CategorizedResult[];
  onCreatePlans: (plans: ContentPlan[]) => void;
}

const ContentPlanning: React.FC<ContentPlanningProps> = ({
  categorizedResults,
  onCreatePlans,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryType | 'all'
  >('all');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  const toggleResultSelection = (id: string) => {
    if (selectedResults.includes(id)) {
      setSelectedResults(prev => prev.filter(resultId => resultId !== id));
    } else {
      setSelectedResults(prev => [...prev, id]);
    }
  };

  const handleCreatePlans = () => {
    const selectedItems = categorizedResults.filter(result =>
      selectedResults.includes(result.id)
    );

    const contentPlans: ContentPlan[] = selectedItems.map(result => {
      // 基于分析结果生成内容计划
      const contentTypes = ['文章', '视频', '图文', '短视频', '直播'];
      const priorities = ['高', '中', '低'];
      const statuses = ['待创作', '创作中', '审核中', '已发布'];

      return {
        id: generateId(),
        title: `关于"${result.topic}"的${contentTypes[Math.floor(Math.random() * contentTypes.length)]}`,
        platform: result.platform,
        contentType:
          contentTypes[Math.floor(Math.random() * contentTypes.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        estimatedTime: ['30分钟', '1小时', '2小时', '半天'][
          Math.floor(Math.random() * 4)
        ],
        targetAudience: result.analysis.targetAudience.join('、'),
        keywords: result.analysis.keywords.join('、'),
        publishTime: new Date(
          Date.now() + Math.floor(Math.random() * 7) * 86400000
        ).toLocaleDateString(),
        expectedEngagement: ['高', '中', '低'][Math.floor(Math.random() * 3)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        description: `基于热点"${result.topic}"创作${result.analysis.contentType}类内容，针对${result.analysis.targetAudience[0]}等受众，预计${result.analysis.popularity.level}热度。`,
        tasks: ['收集素材', '撰写大纲', '创作内容', '审核修改', '发布推广'],
      };
    });

    onCreatePlans(contentPlans);
  };

  const filteredResults =
    selectedCategory === 'all'
      ? categorizedResults
      : categorizedResults.filter(
          result => result.category === selectedCategory
        );

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Tag className='h-5 w-5' />
            分类与标签管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 分类筛选 */}
          <div className='mb-6'>
            <h3 className='text-sm font-medium mb-3'>按分类筛选</h3>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </Button>
              {Object.keys(categoryConfig).map(category => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => setSelectedCategory(category as CategoryType)}
                  className='flex items-center gap-1'
                >
                  <span>{categoryConfig[category as CategoryType].emoji}</span>
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* 分类结果列表 */}
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-sm font-medium'>分类结果列表</h3>
              <span className='text-sm text-gray-500'>
                已选择: {selectedResults.length}
              </span>
            </div>

            {filteredResults.length > 0 ? (
              filteredResults.map(result => (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedResults.includes(result.id)
                      ? 'border-blue-500 bg-blue-50'
                      : ''
                  }`}
                  role='button'
                  tabIndex={0}
                  aria-pressed={selectedResults.includes(result.id)}
                  onClick={() => toggleResultSelection(result.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleResultSelection(result.id);
                    }
                  }}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <Badge className={platformConfig[result.platform]?.color}>
                      {platformConfig[result.platform]?.emoji} {result.platform}
                    </Badge>
                    <Badge className={result.categoryInfo?.color || ''}>
                      {result.categoryInfo?.emoji} {result.category}
                    </Badge>
                  </div>
                  <h4 className='font-medium mb-1'>{result.topic}</h4>
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {result.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant='outline' className='text-xs'>
                        {tag}
                      </Badge>
                    ))}
                    {result.tags.length > 3 && (
                      <Badge variant='outline' className='text-xs'>
                        +{result.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-8 text-gray-500'>
                暂无分类结果数据
              </div>
            )}
          </div>

          {/* 创建内容计划按钮 */}
          <div className='mt-6 flex justify-end'>
            <Button
              onClick={handleCreatePlans}
              disabled={selectedResults.length === 0}
            >
              创建内容计划
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentPlanning;
