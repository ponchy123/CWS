import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Star,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive' | 'potential';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinDate: string;
  lastContact: string;
  totalValue: number;
  contentCount: number;
  tags: string[];
  notes: string;
}

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // 模拟数据
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: '张小明',
        email: 'zhangxm@example.com',
        phone: '138****8888',
        company: '阿里巴巴',
        status: 'active',
        level: 'gold',
        joinDate: '2024-01-15',
        lastContact: '2024-01-20',
        totalValue: 50000,
        contentCount: 25,
        tags: ['VIP', '长期合作'],
        notes: '重要客户，需要优先服务',
      },
      {
        id: '2',
        name: '李小红',
        email: 'lixh@example.com',
        phone: '139****9999',
        company: '腾讯',
        status: 'active',
        level: 'platinum',
        joinDate: '2023-12-01',
        lastContact: '2024-01-18',
        totalValue: 120000,
        contentCount: 45,
        tags: ['战略客户', '高价值'],
        notes: '战略合作伙伴，定期沟通',
      },
      {
        id: '3',
        name: '王小强',
        email: 'wangxq@example.com',
        phone: '137****7777',
        company: '字节跳动',
        status: 'potential',
        level: 'silver',
        joinDate: '2024-01-10',
        lastContact: '2024-01-12',
        totalValue: 15000,
        contentCount: 8,
        tags: ['潜在客户'],
        notes: '正在洽谈中，有合作意向',
      },
    ];
    setCustomers(mockCustomers);
  }, []);

  // 过滤客户
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || customer.level === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'potential': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 等级颜色映射
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 统计数据
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    potential: customers.filter(c => c.status === 'potential').length,
    totalValue: customers.reduce((sum, c) => sum + c.totalValue, 0),
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
          <p className="text-gray-600">管理客户信息和关系维护</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加客户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加新客户</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">客户姓名</Label>
                <Input id="name" placeholder="请输入客户姓名" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input id="email" type="email" placeholder="请输入邮箱地址" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input id="phone" placeholder="请输入联系电话" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">公司名称</Label>
                <Input id="company" placeholder="请输入公司名称" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">客户等级</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">青铜</SelectItem>
                    <SelectItem value="silver">白银</SelectItem>
                    <SelectItem value="gold">黄金</SelectItem>
                    <SelectItem value="platinum">铂金</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注信息</Label>
                <Textarea id="notes" placeholder="请输入备注信息" rows={3} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  添加客户
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总客户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +2 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃客户</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              活跃率 {Math.round((stats.active / stats.total) * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">潜在客户</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.potential}</div>
            <p className="text-xs text-muted-foreground">
              转化率 65%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总价值</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% 较上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle>客户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索客户姓名、邮箱或公司..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">非活跃</SelectItem>
                <SelectItem value="potential">潜在</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="bronze">青铜</SelectItem>
                <SelectItem value="silver">白银</SelectItem>
                <SelectItem value="gold">黄金</SelectItem>
                <SelectItem value="platinum">铂金</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              更多筛选
            </Button>
          </div>

          {/* 客户表格 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户信息</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>加入时间</TableHead>
                <TableHead>最后联系</TableHead>
                <TableHead>总价值</TableHead>
                <TableHead>内容数量</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.company}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status === 'active' ? '活跃' : 
                       customer.status === 'inactive' ? '非活跃' : '潜在'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(customer.level)}>
                      {customer.level === 'bronze' ? '青铜' :
                       customer.level === 'silver' ? '白银' :
                       customer.level === 'gold' ? '黄金' : '铂金'}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.joinDate}</TableCell>
                  <TableCell>{customer.lastContact}</TableCell>
                  <TableCell>¥{customer.totalValue.toLocaleString()}</TableCell>
                  <TableCell>{customer.contentCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          发送邮件
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          添加备注
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除客户
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 客户详情对话框 */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>客户详情 - {selectedCustomer.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">基本信息</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                      <span>加入时间: {selectedCustomer.joinDate}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">业务信息</Label>
                  <div className="mt-2 space-y-2">
                    <div>总价值: ¥{selectedCustomer.totalValue.toLocaleString()}</div>
                    <div>内容数量: {selectedCustomer.contentCount}</div>
                    <div>最后联系: {selectedCustomer.lastContact}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">标签</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">备注信息</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  {selectedCustomer.notes}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  关闭
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑客户
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}