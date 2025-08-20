import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PlatformIntegration() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        <span className='ml-2 text-gray-600'>加载中...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>平台集成</h1>
          <p className='text-gray-600'>管理与各内容平台的接入与授权</p>
        </div>
        <Button className='bg-blue-600 hover:bg-blue-700'>新增平台</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>已接入平台</CardTitle>
          <CardDescription>展示平台列表与授权状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-gray-700'>
            暂无平台接入，点击“新增平台”进行配置。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
