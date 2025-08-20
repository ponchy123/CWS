import React, { useState } from 'react';

import {
  LayoutDashboard,
  Lightbulb,
  PenTool,
  Calendar,
  Send,
  BarChart3,
  Link as LinkIcon,
  Users,
  UserCog,
  Activity,
  Settings,
  CreditCard,
  Globe,
  Zap,
  Database,
  Menu,
  X,
  Bell,
  Search,
  User,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// 图标映射
const iconMap = {
  LayoutDashboard,
  Lightbulb,
  PenTool,
  Calendar,
  Send,
  BarChart3,
  Link: LinkIcon,
  Users,
  UserCog,
  Activity,
  Settings,
  CreditCard,
  Globe,
  Zap,
  Database,
};

type RouteItem = { path: string; name: string; icon: keyof typeof iconMap };

interface LayoutProps {
  children: React.ReactNode;
  routes: RouteItem[];
}

const Layout: React.FC<LayoutProps> = ({ children, routes }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden'
          role='button'
          tabIndex={0}
          aria-label='关闭侧边栏遮罩'
          onClick={() => setSidebarOpen(false)}
          onKeyDown={e => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              setSidebarOpen(false);
            }
          }}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex items-center justify-between h-16 px-6 border-b'>
          <h1 className='text-xl font-bold text-gray-900'>内容工作流系统</h1>
          <Button
            variant='ghost'
            size='sm'
            className='lg:hidden'
            onClick={() => setSidebarOpen(false)}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex-1 py-6 overflow-y-auto'>
          <nav className='px-3 space-y-1'>
            {routes.map(route => {
              const Icon = iconMap[route.icon as keyof typeof iconMap];
              const isActive = location.pathname === route.path;

              return (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors w-full',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className='mr-3 h-5 w-5 flex-shrink-0' />
                  <span className="truncate">{route.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* 顶部导航栏 */}
        <header className='bg-white shadow-sm border-b'>
          <div className='flex items-center justify-between h-16 px-6'>
            <div className='flex items-center'>
              <Button
                variant='ghost'
                size='sm'
                className='lg:hidden mr-2'
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className='h-5 w-5' />
              </Button>

              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='搜索功能...'
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <Button variant='ghost' size='sm'>
                <Bell className='h-5 w-5' />
              </Button>
              <Button variant='ghost' size='sm'>
                <User className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className='flex-1 p-6 overflow-auto'>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
