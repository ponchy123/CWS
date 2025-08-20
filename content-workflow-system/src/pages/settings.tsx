import { useState, useEffect } from 'react';

import {
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Key,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { SettingsService } from '../services';

import type {
  SystemSettings,
  UserPreferences,
  IntegrationConfig,
} from '../services/settings';

export default function Settings() {
  // 状态管理
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [, setSystemSettings] = useState<SystemSettings | null>(null);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);

  // 表单状态
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    publishSuccess: true,
    publishFailed: true,
    newFollower: false,
    weeklyReport: true,
  });

  // 加载设置数据
  const loadSettingsData = async () => {
    try {
      setLoading(true);

      // 并行加载所有设置数据
      const [systemResponse, preferencesResponse, integrationsResponse] =
        await Promise.all([
          SettingsService.getSystemSettings(),
          SettingsService.getUserPreferences('current-user'),
          SettingsService.getIntegrations(),
        ]);

      setSystemSettings(systemResponse);
      setUserPreferences(preferencesResponse);
      setIntegrations(integrationsResponse);

      // 更新通知设置状态
      if (preferencesResponse.notifications) {
        setNotifications({
          email: preferencesResponse.notifications.email,
          push: preferencesResponse.notifications.push,
          sms: preferencesResponse.notifications.sms,
          publishSuccess: true,
          publishFailed: true,
          newFollower: false,
          weeklyReport: true,
        });
      }
    } catch (error) {
      console.error('加载设置数据失败:', error);
      // 设置默认数据以防API失败
      setSystemSettings({
        general: {
          siteName: '内容工作流系统',
          siteDescription: '智能内容创作与发布平台',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          dateFormat: 'YYYY-MM-DD',
          theme: 'auto',
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
          },
          sessionTimeout: 3600,
          twoFactorAuth: false,
          loginAttempts: 5,
          lockoutDuration: 300,
        },
        notification: {
          email: {
            enabled: true,
            smtp: {
              host: 'smtp.example.com',
              port: 587,
              username: '',
              password: '',
              encryption: 'tls',
            },
          },
          push: { enabled: false, vapidKey: '' },
          sms: { enabled: false, provider: '', apiKey: '' },
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retention: 30,
          location: 'local',
          cloudConfig: {
            provider: '',
            bucket: '',
            accessKey: '',
            secretKey: '',
          },
        },
        api: {
          rateLimit: {
            enabled: true,
            requestsPerMinute: 100,
            requestsPerHour: 1000,
          },
          cors: {
            enabled: true,
            allowedOrigins: ['*'],
          },
          authentication: {
            jwtExpiration: 3600,
            refreshTokenExpiration: 86400,
          },
        },
        performance: {
          cache: {
            enabled: true,
            ttl: 3600,
            maxSize: 100,
          },
          compression: {
            enabled: true,
            level: 6,
          },
          logging: {
            level: 'info',
            retention: 30,
          },
        },
      });

      setUserPreferences({
        id: '1',
        userId: 'current-user',
        theme: 'auto',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
        dashboard: {
          layout: 'default',
          widgets: ['overview', 'recent-content', 'analytics'],
        },
        privacy: {
          profileVisibility: 'public',
          activityTracking: true,
          dataSharing: false,
        },
      });

      setIntegrations([
        {
          id: '1',
          name: '知乎',
          type: 'social',
          enabled: true,
          config: {},
          status: 'connected',
          lastSync: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'B站',
          type: 'social',
          enabled: true,
          config: {},
          status: 'connected',
          lastSync: new Date().toISOString(),
        },
        {
          id: '3',
          name: '小红书',
          type: 'social',
          enabled: false,
          config: {},
          status: 'error',
          lastSync: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadSettingsData();
  }, []);

  // 保存系统设置

  // 保存用户偏好设置
  const handleSaveUserPreferences = async () => {
    try {
      setSaving(true);

      if (userPreferences) {
        await SettingsService.updateUserPreferences('current-user', {
          ...userPreferences,
          notifications: {
            email: notifications.email,
            push: notifications.push,
            sms: notifications.sms,
          },
        });
      }

      console.warn('用户偏好设置保存成功');
    } catch (error) {
      console.error('保存用户偏好设置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 保存集成配置
  const handleSaveIntegrations = async () => {
    try {
      setSaving(true);

      for (const integration of integrations) {
        await SettingsService.updateIntegration(integration.id, integration);
      }

      console.warn('集成配置保存成功');
    } catch (error) {
      console.error('保存集成配置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 保存设置（通用）
  const handleSaveSettings = async () => {
    await handleSaveUserPreferences();
  };

  // 导出数据
  const handleExportData = async () => {
    try {
      const response = await SettingsService.exportSettings();
      // 创建下载链接
      const blob = new Blob([response], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出数据失败:', error);
    }
  };

  // 导入数据
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const response = await SettingsService.importSettings(file);
          if (response.success) {
            console.warn('数据导入成功');
            await loadSettingsData(); // 重新加载数据
          }
        } catch (error) {
          console.error('导入数据失败:', error);
        }
      }
    };
    input.click();
  };

  // 重置设置
  const handleResetSettings = async () => {
    // eslint-disable-next-line no-alert
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      try {
        await SettingsService.resetSystemSettings();
        console.warn('设置已重置');
        await loadSettingsData(); // 重新加载数据
      } catch (error) {
        console.error('重置设置失败:', error);
      }
    }
  };

  // 删除账户
  const handleDeleteAccount = () => {
    console.warn('账户删除功能需要联系管理员');
  };

  return (
    <div className='space-y-6'>
      {/* 页面标题 */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>系统设置</h1>
        <p className='text-gray-600'>管理你的账户和系统偏好设置</p>
      </div>

      <Tabs defaultValue='profile' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='profile'>个人资料</TabsTrigger>
          <TabsTrigger value='notifications'>通知设置</TabsTrigger>
          <TabsTrigger value='security'>安全设置</TabsTrigger>
          <TabsTrigger value='appearance'>外观设置</TabsTrigger>
          <TabsTrigger value='integrations'>集成配置</TabsTrigger>
          <TabsTrigger value='data'>数据管理</TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <User className='mr-2 h-5 w-5' />
                个人资料
              </CardTitle>
              <CardDescription>管理你的基本信息和偏好设置</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center space-x-6'>
                <div className='w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center'>
                  <User className='h-10 w-10 text-gray-500' />
                </div>
                <div className='space-y-2'>
                  <Button variant='outline' size='sm'>
                    <Upload className='mr-2 h-4 w-4' />
                    上传头像
                  </Button>
                  <p className='text-sm text-gray-600'>
                    支持 JPG、PNG 格式，最大 2MB
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='username'>用户名</Label>
                  <Input id='username' defaultValue='张小明' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>邮箱地址</Label>
                  <Input
                    id='email'
                    type='email'
                    defaultValue='zhangxm@example.com'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>联系电话</Label>
                  <Input id='phone' defaultValue='138****8888' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='company'>公司/组织</Label>
                  <Input id='company' defaultValue='阿里巴巴' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='position'>职位</Label>
                  <Input id='position' defaultValue='产品经理' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='location'>所在地区</Label>
                  <Select defaultValue='hangzhou'>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='beijing'>北京</SelectItem>
                      <SelectItem value='shanghai'>上海</SelectItem>
                      <SelectItem value='guangzhou'>广州</SelectItem>
                      <SelectItem value='shenzhen'>深圳</SelectItem>
                      <SelectItem value='hangzhou'>杭州</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bio'>个人简介</Label>
                <Textarea
                  id='bio'
                  placeholder='介绍一下你自己...'
                  defaultValue='专注于AI产品设计和用户体验，热爱分享产品思考和行业洞察。'
                  rows={3}
                />
              </div>

              <div className='space-y-4'>
                <h4 className='font-medium'>偏好设置</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>公开个人资料</p>
                      <p className='text-sm text-gray-600'>
                        允许其他用户查看你的基本信息
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>显示在线状态</p>
                      <p className='text-sm text-gray-600'>
                        让其他用户知道你是否在线
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>接收系统邮件</p>
                      <p className='text-sm text-gray-600'>
                        接收产品更新和重要通知
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='mr-2 h-4 w-4' />
                  )}
                  {saving ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Bell className='mr-2 h-5 w-5' />
                通知设置
              </CardTitle>
              <CardDescription>管理你希望接收的通知类型</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='font-medium mb-4'>通知方式</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>邮件通知</p>
                      <p className='text-sm text-gray-600'>
                        通过邮件接收重要通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={checked =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>推送通知</p>
                      <p className='text-sm text-gray-600'>
                        在浏览器中显示推送通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={checked =>
                        setNotifications({ ...notifications, push: checked })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>短信通知</p>
                      <p className='text-sm text-gray-600'>
                        通过短信接收紧急通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={checked =>
                        setNotifications({ ...notifications, sms: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>通知内容</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>发布成功</p>
                      <p className='text-sm text-gray-600'>
                        内容成功发布到平台时通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.publishSuccess}
                      onCheckedChange={checked =>
                        setNotifications({
                          ...notifications,
                          publishSuccess: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>发布失败</p>
                      <p className='text-sm text-gray-600'>
                        内容发布失败时立即通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.publishFailed}
                      onCheckedChange={checked =>
                        setNotifications({
                          ...notifications,
                          publishFailed: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>新增粉丝</p>
                      <p className='text-sm text-gray-600'>
                        有新粉丝关注时通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newFollower}
                      onCheckedChange={checked =>
                        setNotifications({
                          ...notifications,
                          newFollower: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>周报推送</p>
                      <p className='text-sm text-gray-600'>
                        每周发送数据分析报告
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={checked =>
                        setNotifications({
                          ...notifications,
                          weeklyReport: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveUserPreferences} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      保存设置
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='security' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Shield className='mr-2 h-5 w-5' />
                安全设置
              </CardTitle>
              <CardDescription>管理你的账户安全和隐私设置</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='font-medium mb-4'>密码设置</h4>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='currentPassword'>当前密码</Label>
                    <Input id='currentPassword' type='password' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='newPassword'>新密码</Label>
                    <Input id='newPassword' type='password' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword'>确认新密码</Label>
                    <Input id='confirmPassword' type='password' />
                  </div>
                  <Button variant='outline'>
                    <Key className='mr-2 h-4 w-4' />
                    更新密码
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>两步验证</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>启用两步验证</p>
                      <p className='text-sm text-gray-600'>
                        使用手机验证码增强账户安全
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>登录通知</p>
                      <p className='text-sm text-gray-600'>
                        新设备登录时发送通知
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>API 密钥管理</h4>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='apiKey'>API 密钥</Label>
                    <div className='flex space-x-2'>
                      <Input
                        id='apiKey'
                        type={showApiKey ? 'text' : 'password'}
                        defaultValue='sk-1234567890abcdef'
                        readOnly
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <Button variant='outline' size='sm'>
                      <RefreshCw className='mr-2 h-4 w-4' />
                      重新生成
                    </Button>
                    <Button variant='outline' size='sm'>
                      复制密钥
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>会话管理</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <p className='font-medium'>当前会话</p>
                      <p className='text-sm text-gray-600'>
                        Windows · Chrome · 192.168.1.100
                      </p>
                    </div>
                    <span className='text-sm text-green-600'>活跃</span>
                  </div>
                  <div className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <p className='font-medium'>移动设备</p>
                      <p className='text-sm text-gray-600'>
                        iPhone · Safari · 2小时前
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      终止会话
                    </Button>
                  </div>
                </div>
                <Button variant='outline' className='w-full mt-4'>
                  终止所有其他会话
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Palette className='mr-2 h-5 w-5' />
                外观设置
              </CardTitle>
              <CardDescription>自定义界面外观和显示偏好</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='font-medium mb-4'>主题设置</h4>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='border rounded-lg p-4 cursor-pointer hover:border-blue-500'>
                    <div className='w-full h-20 bg-white border rounded mb-2'></div>
                    <p className='text-sm text-center'>浅色主题</p>
                  </div>
                  <div className='border rounded-lg p-4 cursor-pointer hover:border-blue-500'>
                    <div className='w-full h-20 bg-gray-900 border rounded mb-2'></div>
                    <p className='text-sm text-center'>深色主题</p>
                  </div>
                  <div className='border rounded-lg p-4 cursor-pointer hover:border-blue-500 border-blue-500'>
                    <div className='w-full h-20 bg-gradient-to-br from-white to-gray-900 border rounded mb-2'></div>
                    <p className='text-sm text-center'>跟随系统</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>显示设置</h4>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='fontSize'>字体大小</Label>
                    <Select defaultValue='medium'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='small'>小</SelectItem>
                        <SelectItem value='medium'>中</SelectItem>
                        <SelectItem value='large'>大</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='language'>界面语言</Label>
                    <Select defaultValue='zh-CN'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='zh-CN'>简体中文</SelectItem>
                        <SelectItem value='zh-TW'>繁体中文</SelectItem>
                        <SelectItem value='en-US'>English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='timezone'>时区</Label>
                    <Select defaultValue='Asia/Shanghai'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Asia/Shanghai'>
                          北京时间 (UTC+8)
                        </SelectItem>
                        <SelectItem value='America/New_York'>
                          纽约时间 (UTC-5)
                        </SelectItem>
                        <SelectItem value='Europe/London'>
                          伦敦时间 (UTC+0)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>界面偏好</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>紧凑模式</p>
                      <p className='text-sm text-gray-600'>减少界面元素间距</p>
                    </div>
                    <Switch />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>显示侧边栏</p>
                      <p className='text-sm text-gray-600'>
                        始终显示导航侧边栏
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>动画效果</p>
                      <p className='text-sm text-gray-600'>启用界面过渡动画</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveUserPreferences} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      保存外观设置
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='integrations' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Globe className='mr-2 h-5 w-5' />
                集成配置
              </CardTitle>
              <CardDescription>管理第三方服务和API集成</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='font-medium mb-4'>AI 服务配置</h4>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='openaiKey'>OpenAI API Key</Label>
                    <Input
                      id='openaiKey'
                      type='password'
                      placeholder='sk-...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='claudeKey'>Claude API Key</Label>
                    <Input
                      id='claudeKey'
                      type='password'
                      placeholder='sk-ant-...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='geminiKey'>Gemini API Key</Label>
                    <Input id='geminiKey' type='password' placeholder='AI...' />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>平台集成状态</h4>
                <div className='space-y-3'>
                  {integrations.map(integration => (
                    <div
                      key={integration.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            integration.name === '知乎'
                              ? 'bg-blue-100'
                              : integration.name === 'B站'
                                ? 'bg-pink-100'
                                : integration.name === '小红书'
                                  ? 'bg-red-100'
                                  : 'bg-gray-100'
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              integration.name === '知乎'
                                ? 'text-blue-600'
                                : integration.name === 'B站'
                                  ? 'text-pink-600'
                                  : integration.name === '小红书'
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                            }`}
                          >
                            {integration.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium'>{integration.name}</p>
                          <p
                            className={`text-sm ${
                              integration.status === 'connected'
                                ? 'text-gray-600'
                                : integration.status === 'error'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                            }`}
                          >
                            {integration.status === 'connected'
                              ? '已连接'
                              : integration.status === 'error'
                                ? '连接错误 · 需要重新授权'
                                : '未连接'}
                            {integration.status === 'connected' &&
                              ' · API v2.1'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            integration.status === 'connected'
                              ? 'bg-green-500'
                              : integration.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          }`}
                        ></span>
                        <Button variant='outline' size='sm'>
                          {integration.status === 'connected'
                            ? '配置'
                            : integration.status === 'error'
                              ? '重连'
                              : '连接'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveIntegrations} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      保存集成配置
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='data' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Database className='mr-2 h-5 w-5' />
                数据管理
              </CardTitle>
              <CardDescription>
                管理你的数据备份、导入导出和隐私设置
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='font-medium mb-4'>数据备份</h4>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 border rounded-lg'>
                    <div>
                      <p className='font-medium'>自动备份</p>
                      <p className='text-sm text-gray-600'>
                        每天自动备份你的数据
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between p-4 border rounded-lg'>
                    <div>
                      <p className='font-medium'>最后备份时间</p>
                      <p className='text-sm text-gray-600'>
                        2024-01-15 02:00:00
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      立即备份
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>数据导入导出</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-center space-y-2'>
                        <Download className='mx-auto h-8 w-8 text-blue-600' />
                        <h5 className='font-medium'>导出数据</h5>
                        <p className='text-sm text-gray-600'>
                          下载你的所有数据
                        </p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleExportData}
                        >
                          开始导出
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-center space-y-2'>
                        <Upload className='mx-auto h-8 w-8 text-green-600' />
                        <h5 className='font-medium'>导入数据</h5>
                        <p className='text-sm text-gray-600'>
                          从备份文件恢复数据
                        </p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleImportData}
                        >
                          选择文件
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4'>存储使用情况</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>内容数据</span>
                    <span className='text-sm text-gray-600'>2.3 GB</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>媒体文件</span>
                    <span className='text-sm text-gray-600'>1.8 GB</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>系统缓存</span>
                    <span className='text-sm text-gray-600'>0.5 GB</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{ width: '46%' }}
                    ></div>
                  </div>
                  <div className='flex items-center justify-between text-sm text-gray-600 mt-1'>
                    <span>已使用 4.6 GB</span>
                    <span>总共 10 GB</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='font-medium mb-4 text-red-600'>危险操作</h4>
                <div className='space-y-4'>
                  <div className='border border-red-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-red-600'>重置所有设置</p>
                        <p className='text-sm text-gray-600'>
                          将所有设置恢复为默认值
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='outline' size='sm'>
                            <RefreshCw className='mr-2 h-4 w-4' />
                            重置设置
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认重置设置</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作将重置所有设置为默认值，包括个人资料、通知偏好、外观设置等。此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetSettings}>
                              确认重置
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className='border border-red-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-red-600'>删除账户</p>
                        <p className='text-sm text-gray-600'>
                          永久删除你的账户和所有数据
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='destructive' size='sm'>
                            <Trash2 className='mr-2 h-4 w-4' />
                            删除账户
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除账户</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作将永久删除你的账户和所有相关数据，包括内容、设置、集成配置等。此操作不可撤销，请谨慎操作。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className='bg-red-600 hover:bg-red-700'
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
