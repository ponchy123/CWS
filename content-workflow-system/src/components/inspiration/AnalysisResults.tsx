import React, { useState } from 'react';

import { Brain } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import categoryConfig from '../../config/category-config';
import platformConfig from '../../config/platform-config';
import {
  AnalysisResult,
  CategoryType,
  CategorizedResult,
} from '../../types/inspiration-types';
import { formatDate } from '../../utils/inspiration-utils';

interface AnalysisResultsProps {
  analysisResults: AnalysisResult[];
  onCategorize: (results: CategorizedResult[]) => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResults,
  onCategorize,
}) => {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedResult(expandedResult === id ? null : id);
  };

  const handleCategorize = () => {
    const categorizedResults: CategorizedResult[] = analysisResults.map(
      result => {
        // 基于内容智能分类
        let category: CategoryType = '科技';
        const topic = result.topic.toLowerCase();

        if (
          topic.includes('手机') ||
          topic.includes('电脑') ||
          topic.includes('科技')
        ) {
          category = '科技';
        } else if (
          topic.includes('电影') ||
          topic.includes('音乐') ||
          topic.includes('明星')
        ) {
          category = '娱乐';
        } else if (
          topic.includes('股票') ||
          topic.includes('经济') ||
          topic.includes('金融')
        ) {
          category = '财经';
        } else if (
          topic.includes('学习') ||
          topic.includes('教育') ||
          topic.includes('考试')
        ) {
          category = '教育';
        } else if (
          topic.includes('时尚') ||
          topic.includes('穿搭') ||
          topic.includes('美妆')
        ) {
          category = '时尚';
        } else if (
          topic.includes('足球') ||
          topic.includes('篮球') ||
          topic.includes('比赛')
        ) {
          category = '体育';
        } else if (
          topic.includes('社会') ||
          topic.includes('新闻') ||
          topic.includes('事件')
        ) {
          category = '社会';
        } else if (topic.includes('汽车') || topic.includes('车')) {
          category = '汽车';
        } else if (
          topic.includes('旅游') ||
          topic.includes('旅行') ||
          topic.includes('景点')
        ) {
          category = '旅游';
        } else {
          category = '生活';
        }

        // 生成标签
        const tags = [
          ...result.analysis.keywords,
          result.platform,
          result.analysis.contentType,
          result.analysis.popularity.level,
        ];

        return {
          ...result,
          category,
          tags: Array.from(new Set(tags)),
          categoryInfo: categoryConfig[category],
          createdAt: formatDate(new Date()),
          lastUpdated: formatDate(new Date()),
        };
      }
    );

    onCategorize(categorizedResults);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Brain className='h-5 w-5' />
            AI智能分析结果
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisResults.length > 0 ? (
            <div className='space-y-6'>
              {analysisResults.map(result => (
                <Card key={result.id} className='overflow-hidden'>
                  <CardHeader className='bg-gray-50 py-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Badge
                          className={platformConfig[result.platform]?.color}
                        >
                          {platformConfig[result.platform]?.emoji}{' '}
                          {result.platform}
                        </Badge>
                        <h3 className='font-medium'>{result.topic}</h3>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => toggleExpand(result.id)}
                      >
                        {expandedResult === result.id ? '收起' : '展开'}
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedResult === result.id && (
                    <CardContent className='pt-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <h4 className='font-medium mb-2'>情感分析</h4>
                          <Badge
                            className={
                              result.analysis.sentiment === '积极'
                                ? 'bg-green-100 text-green-800'
                                : result.analysis.sentiment === '消极'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {result.analysis.sentiment}
                          </Badge>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>热度预测</h4>
                          <div className='flex items-center gap-2'>
                            <div className='w-full bg-gray-200 rounded-full h-2.5'>
                              <div
                                className='bg-blue-600 h-2.5 rounded-full'
                                style={{
                                  width: `${result.analysis.popularity.score}%`,
                                }}
                              ></div>
                            </div>
                            <span className='text-sm'>
                              {result.analysis.popularity.level}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>关键词</h4>
                          <div className='flex flex-wrap gap-1'>
                            {result.analysis.keywords.map((keyword, index) => (
                              <Badge key={index} variant='outline'>
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>目标受众</h4>
                          <div className='flex flex-wrap gap-1'>
                            {result.analysis.targetAudience.map(
                              (audience, index) => (
                                <Badge key={index} variant='outline'>
                                  {audience}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>

                        <div className='md:col-span-2'>
                          <h4 className='font-medium mb-2'>内容建议</h4>
                          <ul className='list-disc pl-5 space-y-1'>
                            {result.analysis.contentSuggestions.map(
                              (suggestion, index) => (
                                <li key={index} className='text-sm'>
                                  {suggestion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}

              <div className='flex justify-end'>
                <Button onClick={handleCategorize}>智能分类整理</Button>
              </div>
            </div>
          ) : (
            <div className='text-center py-12 text-gray-500'>
              暂无分析结果，请先进行AI智能分析
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;
