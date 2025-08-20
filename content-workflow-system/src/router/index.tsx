import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Layout from '@/components/Layout';
import ContentCreator from '@/pages/content-creator';
import ContentPlanning from '@/pages/content-planning';
import CustomerManager from '@/pages/customer-manager';
import Dashboard from '@/pages/dashboard';
import DataAnalytics from '@/pages/data-analytics';
import PlatformIntegration from '@/pages/platform-integration';
import PublishManager from '@/pages/publish-manager';
import Settings from '@/pages/settings';
import SmartInspirationSystem from '@/pages/smart-inspiration-system';
import SystemMonitor from '@/pages/system-monitor';
import UserManagement from '@/pages/user-management';
import PricingPage from '@/pages/pricing';
import FreeApisDemoPage from '@/pages/free-apis-demo';
import PublicApisShowcase from '@/pages/public-apis-showcase';
import EnhancedPublicApis from '@/pages/enhanced-public-apis';
import ApiStatsPage from '@/pages/api-stats';
import AdvancedFeaturesPage from '@/pages/advanced-features';

/* 路由配置与类型 */
type IconName =
  | 'LayoutDashboard'
  | 'Lightbulb'
  | 'PenTool'
  | 'Calendar'
  | 'Send'
  | 'BarChart3'
  | 'Link'
  | 'Users'
  | 'UserCog'
  | 'Activity'
  | 'Settings'
  | 'CreditCard'
  | 'Globe'
  | 'Zap'
  | 'Database';

type RouteItemEx = {
  path: string;
  name: string;
  component: React.ComponentType;
  icon: IconName;
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const routes: RouteItemEx[] = [
  {
    path: '/',
    name: '工作台',
    component: Dashboard,
    icon: 'LayoutDashboard',
  },
  {
    path: '/smart-inspiration-system',
    name: '智能灵感系统',
    component: SmartInspirationSystem,
    icon: 'Lightbulb',
  },
  {
    path: '/content-creator',
    name: '内容创作器',
    component: ContentCreator,
    icon: 'PenTool',
  },
  {
    path: '/content-planning',
    name: '内容规划',
    component: ContentPlanning,
    icon: 'Calendar',
  },
  {
    path: '/publish-manager',
    name: '发布管理',
    component: PublishManager,
    icon: 'Send',
  },
  {
    path: '/data-analytics',
    name: '数据分析',
    component: DataAnalytics,
    icon: 'BarChart3',
  },
  {
    path: '/platform-integration',
    name: '平台集成',
    component: PlatformIntegration,
    icon: 'Link',
  },
  {
    path: '/customer-manager',
    name: '客户管理',
    component: CustomerManager,
    icon: 'Users',
  },
  {
    path: '/user-management',
    name: '用户管理',
    component: UserManagement,
    icon: 'UserCog',
  },
  {
    path: '/system-monitor',
    name: '系统监控',
    component: SystemMonitor,
    icon: 'Activity',
  },
  {
    path: '/settings',
    name: '系统设置',
    component: Settings,
    icon: 'Settings',
  },
  {
    path: '/pricing',
    name: '套餐定价',
    component: PricingPage,
    icon: 'CreditCard',
  },
  {
    path: '/free-apis-demo',
    name: 'API演示',
    component: FreeApisDemoPage,
    icon: 'Globe',
  },
  {
    path: '/public-apis-showcase',
    name: '公共API展示',
    component: PublicApisShowcase,
    icon: 'Zap',
  },
  {
    path: '/enhanced-public-apis',
    name: '增强版API',
    component: EnhancedPublicApis,
    icon: 'Database',
  },
  {
    path: '/api-stats',
    name: 'API统计',
    component: ApiStatsPage,
    icon: 'BarChart3',
  },
  {
    path: '/advanced-features',
    name: '高级功能',
    component: AdvancedFeaturesPage,
    icon: 'Settings',
  },
];

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Layout routes={routes}>
        <Routes>
          {routes.map(route => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}
          {/* 默认重定向到工作台 */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;
