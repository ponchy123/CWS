import React, { useState } from 'react';

import { Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import platformConfig from '../../config/platform-config';
import { ContentPlan } from '../../types/inspiration-types';

interface WorkflowManagementProps {
  contentPlans: ContentPlan[];
}

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({
  contentPlans,
}) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const toggleExpand = (id: string) => {
    setExpandedPlan(expandedPlan === id ? null : id);
  };

  const statuses = ['待创作', '创作中', '审核中', '已发布'];

  const filteredPlans =
    statusFilter === 'all'
      ? contentPlans
      : contentPlans.filter(plan => plan.status === statusFilter);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            创作执行管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 状态筛选 */}
          <div className='mb-6'>
            <h3 className='text-sm font-medium mb-3'>按状态筛选</h3>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setStatusFilter('all')}
              >
                全部
              </Button>
              {statuses.map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* 内容计划列表 */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium'>内容计划列表</h3>

            {filteredPlans.length > 0 ? (
              filteredPlans.map(plan => (
                <Card key={plan.id} className='overflow-hidden'>
                  <CardHeader className='bg-gray-50 py-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Badge className={platformConfig[plan.platform]?.color}>
                          {platformConfig[plan.platform]?.emoji} {plan.platform}
                        </Badge>
                        <Badge
                          className={
                            plan.priority === '高'
                              ? 'bg-red-100 text-red-800'
                              : plan.priority === '中'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }
                        >
                          {plan.priority}优先级
                        </Badge>
                        <Badge
                          className={
                            plan.status === '待创作'
                              ? 'bg-gray-100 text-gray-800'
                              : plan.status === '创作中'
                                ? 'bg-blue-100 text-blue-800'
                                : plan.status === '审核中'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                          }
                        >
                          {plan.status}
                        </Badge>
                        <h3 className='font-medium'>{plan.title}</h3>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => toggleExpand(plan.id)}
                      >
                        {expandedPlan === plan.id ? '收起' : '展开'}
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedPlan === plan.id && (
                    <CardContent className='pt-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <h4 className='font-medium mb-2'>内容类型</h4>
                          <p>{plan.contentType}</p>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>预计发布时间</h4>
                          <p>{plan.publishTime}</p>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>目标受众</h4>
                          <p>{plan.targetAudience}</p>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>关键词</h4>
                          <p>{plan.keywords}</p>
                        </div>

                        <div className='md:col-span-2'>
                          <h4 className='font-medium mb-2'>内容描述</h4>
                          <p className='text-sm'>{plan.description}</p>
                        </div>

                        <div className='md:col-span-2'>
                          <h4 className='font-medium mb-2'>任务清单</h4>
                          <ul className='list-disc pl-5 space-y-1'>
                            {plan.tasks.map((task, index) => (
                              <li key={index} className='text-sm'>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className='mt-4 flex justify-end gap-2'>
                        <Button variant='outline' size='sm'>
                          编辑计划
                        </Button>
                        <Button size='sm'>开始创作</Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className='text-center py-8 text-gray-500'>
                暂无内容计划数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowManagement;
