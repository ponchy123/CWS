import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Settings,
  Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
  };
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  cpu: number;
  memory: number;
  port?: number;
  lastRestart: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export default function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 45, cores: 8, temperature: 65 },
    memory: { used: 8.2, total: 16, usage: 51 },
    disk: { used: 120, total: 500, usage: 24 },
    network: { inbound: 1.2, outbound: 0.8, latency: 15 },
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      id: '1',
      name: 'Web Server',
      status: 'running',
      uptime: '5天 12小时',
      cpu: 12,
      memory: 256,
      port: 3002,
      lastRestart: '2024-01-10 09:30:00',
    },
    {
      id: '2',
      name: 'Database',
      status: 'running',
      uptime: '15天 8小时',
      cpu: 8,
      memory: 512,
      port: 27017,
      lastRestart: '2024-01-01 00:00:00',
    },
    {
      id: '3',
      name: 'Redis Cache',
      status: 'running',
      uptime: '10天 3小时',
      cpu: 2,
      memory: 64,
      port: 6379,
      lastRestart: '2024-01-05 14:20:00',
    },
    {
      id: '4',
      name: 'AI Service',
      status: 'error',
      uptime: '0分钟',
      cpu: 0,
      memory: 0,
      lastRestart: '2024-01-15 10:15:00',
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-01-15 16:45:23',
      level: 'error',
      service: 'AI Service',
      message: 'Connection timeout to OpenAI API',
    },
    {
      id: '2',
      timestamp: '2024-01-15 16:44:12',
      level: 'warn',
      service: 'Web Server',
      message: 'High memory usage detected: 85%',
    },
    {
      id: '3',
      timestamp: '2024-01-15 16:43:45',
      level: 'info',
      service: 'Database',
      message: 'Backup completed successfully',
    },
    {
      id: '4',
      timestamp: '2024-01-15 16:42:30',
      level: 'info',
      service: 'Redis Cache',
      message: 'Cache cleared: 1,234 keys removed',
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: {
          ...prev.cpu,
          usage: Math.max(10, Math.min(90, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(40, Math.min(80, prev.cpu.temperature + (Math.random() - 0.5) * 5)),
        },
        memory: {
          ...prev.memory,
          usage: Math.max(20, Math.min(85, prev.memory.usage + (Math.random() - 0.5) * 5)),
        },
        disk: {
          ...prev.disk,
          usage: Math.max(10, Math.min(95, prev.disk.usage + (Math.random() - 0.5) * 2)),
        },
        network: {
          inbound: Math.max(0, prev.network.inbound + (Math.random() - 0.5) * 0.5),
          outbound: Math.max(0, prev.network.outbound + (Math.random() - 0.5) * 0.3),
          latency: Math.max(5, Math.min(100, prev.network.latency + (Math.random() - 0.5) * 10)),
        },
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'stopped': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const runningServices = services.filter(s => s.status === 'running').length;
  const errorServices = services.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统监控</h1>
          <p className="text-gray-600">实时监控系统性能和服务状态</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新数据'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            监控设置
          </Button>
        </div>
      </div>

      {/* 系统概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">正常</div>
            <p className="text-xs text-muted-foreground">
              运行时间: 15天 8小时
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">服务状态</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningServices}/{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {errorServices > 0 ? `${errorServices} 个服务异常` : '所有服务正常'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在线用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +12% 较昨日
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">响应时间</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.network.latency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              平均响应时间
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">系统指标</TabsTrigger>
          <TabsTrigger value="services">服务状态</TabsTrigger>
          <TabsTrigger value="logs">系统日志</TabsTrigger>
          <TabsTrigger value="alerts">告警管理</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* 系统指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="mr-2 h-5 w-5" />
                  CPU 使用率
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">使用率</span>
                  <span className="text-sm text-gray-500">{metrics.cpu.usage.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.cpu.usage} className="w-full" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">核心数:</span>
                    <span className="ml-2 font-medium">{metrics.cpu.cores}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">温度:</span>
                    <span className="ml-2 font-medium">{metrics.cpu.temperature.toFixed(0)}°C</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  内存使用
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">使用率</span>
                  <span className="text-sm text-gray-500">{metrics.memory.usage.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.memory.usage} className="w-full" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">已用:</span>
                    <span className="ml-2 font-medium">{metrics.memory.used.toFixed(1)} GB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">总计:</span>
                    <span className="ml-2 font-medium">{metrics.memory.total} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="mr-2 h-5 w-5" />
                  磁盘空间
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">使用率</span>
                  <span className="text-sm text-gray-500">{metrics.disk.usage.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.disk.usage} className="w-full" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">已用:</span>
                    <span className="ml-2 font-medium">{metrics.disk.used} GB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">总计:</span>
                    <span className="ml-2 font-medium">{metrics.disk.total} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="mr-2 h-5 w-5" />
                  网络流量
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">入站</span>
                      <span className="text-sm text-gray-500">{metrics.network.inbound.toFixed(1)} MB/s</span>
                    </div>
                    <Progress value={(metrics.network.inbound / 5) * 100} className="w-full" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">出站</span>
                      <span className="text-sm text-gray-500">{metrics.network.outbound.toFixed(1)} MB/s</span>
                    </div>
                    <Progress value={(metrics.network.outbound / 5) * 100} className="w-full" />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">延迟:</span>
                  <span className="ml-2 font-medium">{metrics.network.latency.toFixed(0)} ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>服务状态监控</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>服务名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>运行时间</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>内存</TableHead>
                    <TableHead>端口</TableHead>
                    <TableHead>最后重启</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="flex items-center">
                        {getStatusIcon(service.status)}
                        <span className="ml-2 font-medium">{service.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status === 'running' ? '运行中' : 
                           service.status === 'stopped' ? '已停止' : '错误'}
                        </Badge>
                      </TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>{service.cpu}%</TableCell>
                      <TableCell>{service.memory} MB</TableCell>
                      <TableCell>{service.port || '-'}</TableCell>
                      <TableCell>{service.lastRestart}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {service.status === 'running' ? (
                            <Button variant="outline" size="sm">
                              重启
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              启动
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            日志
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>系统日志</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    导出日志
                  </Button>
                  <Button variant="outline" size="sm">
                    清空日志
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Badge className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                        <span>{log.timestamp}</span>
                        <span>•</span>
                        <span>{log.service}</span>
                      </div>
                      <p className="text-sm text-gray-900">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>告警规则配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">CPU 使用率告警</h4>
                        <Badge className="bg-green-100 text-green-800">已启用</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        当 CPU 使用率超过 80% 持续 5 分钟时触发告警
                      </p>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">配置</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">内存使用率告警</h4>
                        <Badge className="bg-green-100 text-green-800">已启用</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        当内存使用率超过 90% 时立即触发告警
                      </p>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">配置</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">磁盘空间告警</h4>
                        <Badge className="bg-yellow-100 text-yellow-800">已禁用</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        当磁盘使用率超过 85% 时触发告警
                      </p>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">配置</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">服务异常告警</h4>
                        <Badge className="bg-green-100 text-green-800">已启用</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        当关键服务停止运行时立即触发告警
                      </p>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">配置</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">最近告警记录</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">AI Service 连接失败</p>
                          <p className="text-xs text-gray-500">2024-01-15 16:45:23</p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">严重</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">内存使用率过高</p>
                          <p className="text-xs text-gray-500">2024-01-15 16:44:12</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">警告</Badge>
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