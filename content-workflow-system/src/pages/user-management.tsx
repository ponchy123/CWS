/* eslint-disable import/no-duplicates */
import { useState, useEffect, useCallback } from 'react';

import { format } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Clock,
  Activity,
  Plus,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  UserService,
  User,
  UserStats,
  Role,
  Permission,
  UpdateUserRequest,
} from '../services/user';

export default function UserManagement() {
  // 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage] = useState(1);


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, statsData, rolesData, permissionsData] =
        await Promise.all([
          UserService.getUsers({
            page: currentPage,
            limit: 10,
            search: searchTerm || undefined,
            role: selectedRole !== 'all' ? selectedRole : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
          }),
          UserService.getUserStats(),
          UserService.getRoles(),
          UserService.getPermissions(),
        ]);

      setUsers(usersData.users);
      setUserStats(statsData);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteUser = async (userId: number) => {
    try {
      await UserService.deleteUser(userId);
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        await UserService.updateUser(userId, { status: newStatus });
        loadData(); // 重新加载数据
      }
    } catch (error) {
      console.error('切换用户状态失败:', error);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const result = await UserService.resetPassword(userId);
      // eslint-disable-next-line no-alert
      alert(`密码重置成功，临时密码：${result.temporaryPassword}`);
    } catch (error) {
      console.error('重置密码失败:', error);
    }
  };

  const handleEditUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const handleUpdateUser = async (
    userId: number,
    userData: UpdateUserRequest
  ) => {
    try {
      await UserService.updateUser(userId, userData);
      setSelectedUser(null);
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('更新用户失败:', error);
    }
  };

  // 状态和角色颜色映射
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    editor: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
    contributor: 'bg-green-100 text-green-800',
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>加载中...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 页面标题和操作栏 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>用户管理</h1>
          <p className='text-gray-600'>管理系统用户和权限配置</p>
        </div>

        <div className='flex space-x-2'>
          <Button variant='outline'>
            <Upload className='mr-2 h-4 w-4' />
            批量导入
          </Button>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            导出用户
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className='bg-blue-600 hover:bg-blue-700'>
                <UserPlus className='mr-2 h-4 w-4' />
                添加用户
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>添加新用户</DialogTitle>
                <DialogDescription>创建新的系统用户账号</DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='userName'>用户姓名</Label>
                    <Input id='userName' placeholder='输入用户姓名...' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='userEmail'>邮箱地址</Label>
                    <Input
                      id='userEmail'
                      type='email'
                      placeholder='输入邮箱地址...'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='userPhone'>联系电话</Label>
                    <Input id='userPhone' placeholder='输入联系电话...' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='userRole'>用户角色</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='选择用户角色' />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='userDepartment'>部门</Label>
                    <Input id='userDepartment' placeholder='输入所属部门...' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='userPosition'>职位</Label>
                    <Input id='userPosition' placeholder='输入职位...' />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='userPassword'>初始密码</Label>
                  <div className='relative'>
                    <Input
                      id='userPassword'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='输入初始密码...'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='flex justify-end space-x-2'>
                  <Button variant='outline'>取消</Button>
                  <Button
                    className='bg-blue-600 hover:bg-blue-700'
                    onClick={() => {
                      // 这里应该从表单获取数据并调用 handleAddUser
                      // 暂时使用空的实现来修复类型错误
                      console.warn('创建用户按钮被点击');
                    }}
                  >
                    创建用户
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计概览 */}
      {userStats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>总用户数</p>
                  <div className='flex items-center mt-2'>
                    <p className='text-2xl font-bold text-gray-900'>
                      {userStats.totalUsers}
                    </p>
                    <div className='ml-2 flex items-center text-sm text-green-600'>
                      <span>+{userStats.newUsersThisMonth}</span>
                    </div>
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-blue-50'>
                  <Users className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>活跃用户</p>
                  <div className='flex items-center mt-2'>
                    <p className='text-2xl font-bold text-gray-900'>
                      {userStats.activeUsers}
                    </p>
                    <div className='ml-2 flex items-center text-sm text-green-600'>
                      <span>
                        {Math.round(
                          (userStats.activeUsers / userStats.totalUsers) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-green-50'>
                  <Activity className='h-6 w-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>在线用户</p>
                  <div className='flex items-center mt-2'>
                    <p className='text-2xl font-bold text-gray-900'>
                      {userStats.onlineUsers}
                    </p>
                    <div className='ml-2 flex items-center text-sm text-blue-600'>
                      <span>实时</span>
                    </div>
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-purple-50'>
                  <Shield className='h-6 w-6 text-purple-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>管理员</p>
                  <div className='flex items-center mt-2'>
                    <p className='text-2xl font-bold text-gray-900'>
                      {userStats.usersByRole.admin}
                    </p>
                    <div className='ml-2 flex items-center text-sm text-orange-600'>
                      <span>核心</span>
                    </div>
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-orange-50'>
                  <Clock className='h-6 w-6 text-orange-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue='users' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='users'>用户列表</TabsTrigger>
          <TabsTrigger value='roles'>角色管理</TabsTrigger>
          <TabsTrigger value='permissions'>权限配置</TabsTrigger>
          <TabsTrigger value='audit'>操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value='users' className='space-y-4'>
          {/* 搜索和筛选栏 */}
          <Card>
            <CardContent className='p-4'>
              <div className='flex flex-col lg:flex-row gap-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                      placeholder='搜索用户姓名或邮箱...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className='w-32'>
                      <SelectValue placeholder='角色' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>所有角色</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue placeholder='状态' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>所有状态</SelectItem>
                      <SelectItem value='active'>活跃</SelectItem>
                      <SelectItem value='inactive'>非活跃</SelectItem>
                      <SelectItem value='pending'>待审核</SelectItem>
                      <SelectItem value='suspended'>已停用</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant='outline' size='sm'>
                    <Filter className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户信息</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>部门/职位</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className='flex items-center space-x-3'>
                          <img
                            src={
                              user.avatar ||
                              '/placeholder.svg?height=40&width=40'
                            }
                            alt={user.name}
                            className='w-10 h-10 rounded-full'
                          />
                          <div>
                            <div className='font-medium'>{user.name}</div>
                            <div className='text-sm text-gray-600'>
                              {user.email}
                            </div>
                            <div className='text-sm text-gray-600'>
                              {user.phone || '未设置'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            roleColors[user.role as keyof typeof roleColors]
                          }
                        >
                          {user.role === 'admin'
                            ? '管理员'
                            : user.role === 'editor'
                              ? '编辑'
                              : user.role === 'viewer'
                                ? '查看者'
                                : '贡献者'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{user.department}</div>
                          <div className='text-sm text-gray-600'>
                            {user.position}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            statusColors[
                              user.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {user.status === 'active'
                            ? '活跃'
                            : user.status === 'inactive'
                              ? '非活跃'
                              : '已停用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className='text-sm'>
                            {format(
                              new Date(user.lastLogin),
                              'yyyy-MM-dd HH:mm',
                              { locale: zhCN }
                            )}
                          </div>
                        ) : (
                          <span className='text-gray-400'>从未登录</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {format(new Date(user.createdAt), 'yyyy-MM-dd', {
                            locale: zhCN,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user.id)}
                            >
                              <Edit className='mr-2 h-4 w-4' />
                              编辑用户
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(user.id)}
                            >
                              <Key className='mr-2 h-4 w-4' />
                              重置密码
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <Lock className='mr-2 h-4 w-4' />
                                  停用用户
                                </>
                              ) : (
                                <>
                                  <Unlock className='mr-2 h-4 w-4' />
                                  启用用户
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-red-600'
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              删除用户
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
        </TabsContent>

        <TabsContent value='roles' className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-medium'>角色管理</h3>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='mr-2 h-4 w-4' />
              添加角色
            </Button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {roles.map(role => (
              <Card key={role.id} className='hover:shadow-md transition-shadow'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg'>{role.name}</CardTitle>
                    <Badge
                      variant='outline'
                      className='bg-blue-100 text-blue-800'
                    >
                      {role.userCount} 用户
                    </Badge>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <h4 className='font-medium mb-2'>权限列表</h4>
                    <div className='flex flex-wrap gap-1'>
                      {role.permissions.slice(0, 4).map(permission => {
                        const perm = permissions.find(p => p.id === permission);
                        return (
                          <Badge
                            key={permission}
                            variant='secondary'
                            className='text-xs'
                          >
                            {perm?.name || permission}
                          </Badge>
                        );
                      })}
                      {role.permissions.length > 4 && (
                        <Badge variant='secondary' className='text-xs'>
                          +{role.permissions.length - 4} 更多
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className='flex space-x-2'>
                    <Button variant='outline' size='sm' className='flex-1'>
                      <Edit className='mr-1 h-3 w-3' />
                      编辑
                    </Button>
                    <Button variant='outline' size='sm' className='flex-1'>
                      <Eye className='mr-1 h-3 w-3' />
                      查看
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='permissions' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Key className='mr-2 h-5 w-5' />
                权限配置
              </CardTitle>
              <CardDescription>管理系统权限和访问控制</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {Object.entries(
                  permissions.reduce(
                    (acc, perm) => {
                      if (!acc[perm.category]) acc[perm.category] = [];
                      acc[perm.category].push(perm);
                      return acc;
                    },
                    {} as Record<string, typeof permissions>
                  )
                ).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className='font-medium mb-3'>{category}</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                      {perms.map(permission => (
                        <div
                          key={permission.id}
                          className='flex items-center justify-between p-3 border rounded-lg'
                        >
                          <div>
                            <div className='font-medium'>{permission.name}</div>
                            <div className='text-sm text-gray-600'>
                              {permission.id}
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='audit' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Activity className='mr-2 h-5 w-5' />
                操作日志
              </CardTitle>
              <CardDescription>查看用户操作和系统审计日志</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center space-x-4'>
                  <Input placeholder='搜索操作日志...' className='flex-1' />
                  <Select>
                    <SelectTrigger className='w-32'>
                      <SelectValue placeholder='操作类型' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>所有操作</SelectItem>
                      <SelectItem value='login'>登录</SelectItem>
                      <SelectItem value='create'>创建</SelectItem>
                      <SelectItem value='update'>更新</SelectItem>
                      <SelectItem value='delete'>删除</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className='w-32'>
                      <SelectValue placeholder='时间范围' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='today'>今天</SelectItem>
                      <SelectItem value='week'>本周</SelectItem>
                      <SelectItem value='month'>本月</SelectItem>
                      <SelectItem value='all'>全部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='border rounded-lg'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>用户</TableHead>
                        <TableHead>操作</TableHead>
                        <TableHead>资源</TableHead>
                        <TableHead>IP地址</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>2024-01-15 14:30:25</TableCell>
                        <TableCell>张小明</TableCell>
                        <TableCell>创建用户</TableCell>
                        <TableCell>用户管理</TableCell>
                        <TableCell>192.168.1.100</TableCell>
                        <TableCell>
                          <Badge variant='default'>成功</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2024-01-15 14:25:18</TableCell>
                        <TableCell>李小红</TableCell>
                        <TableCell>发布内容</TableCell>
                        <TableCell>内容管理</TableCell>
                        <TableCell>192.168.1.101</TableCell>
                        <TableCell>
                          <Badge variant='default'>成功</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2024-01-15 14:20:12</TableCell>
                        <TableCell>王大强</TableCell>
                        <TableCell>查看数据</TableCell>
                        <TableCell>数据分析</TableCell>
                        <TableCell>192.168.1.102</TableCell>
                        <TableCell>
                          <Badge variant='default'>成功</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2024-01-15 14:15:45</TableCell>
                        <TableCell>陈小美</TableCell>
                        <TableCell>登录失败</TableCell>
                        <TableCell>用户认证</TableCell>
                        <TableCell>192.168.1.103</TableCell>
                        <TableCell>
                          <Badge variant='destructive'>失败</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 用户编辑弹窗 */}
      {selectedUser && (
        <Dialog
          open={!!selectedUser}
          onOpenChange={() => setSelectedUser(null)}
        >
          <DialogContent className='sm:max-w-[700px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center space-x-3'>
                <img
                  src={
                    selectedUser.avatar || '/placeholder.svg?height=40&width=40'
                  }
                  alt={selectedUser.name}
                  className='w-10 h-10 rounded-full'
                />
                <span>编辑用户 - {selectedUser.name}</span>
              </DialogTitle>
              <DialogDescription>修改用户基本信息和权限配置</DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updateData: UpdateUserRequest = {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  role: formData.get('role') as
                    | 'admin'
                    | 'editor'
                    | 'viewer'
                    | 'contributor',
                  status: formData.get('status') as
                    | 'active'
                    | 'inactive'
                    | 'suspended',
                  department: formData.get('department') as string,
                  position: formData.get('position') as string,
                  permissions: Array.from(
                    formData.getAll('permissions')
                  ) as string[],
                };
                await handleUpdateUser(selectedUser.id, updateData);
              }}
            >
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='editUserName'>用户姓名</Label>
                    <Input
                      id='editUserName'
                      name='name'
                      defaultValue={selectedUser.name}
                      placeholder='输入用户姓名...'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='editUserEmail'>邮箱地址</Label>
                    <Input
                      id='editUserEmail'
                      name='email'
                      type='email'
                      defaultValue={selectedUser.email}
                      placeholder='输入邮箱地址...'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='editUserPhone'>联系电话</Label>
                    <Input
                      id='editUserPhone'
                      name='phone'
                      defaultValue={selectedUser.phone || ''}
                      placeholder='输入联系电话...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='editUserRole'>用户角色</Label>
                    <Select name='role' defaultValue={selectedUser.role}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='admin'>管理员</SelectItem>
                        <SelectItem value='editor'>编辑</SelectItem>
                        <SelectItem value='viewer'>查看者</SelectItem>
                        <SelectItem value='contributor'>贡献者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='editUserDepartment'>部门</Label>
                    <Input
                      id='editUserDepartment'
                      name='department'
                      defaultValue={selectedUser.department}
                      placeholder='输入所属部门...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='editUserPosition'>职位</Label>
                    <Input
                      id='editUserPosition'
                      name='position'
                      defaultValue={selectedUser.position}
                      placeholder='输入职位...'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='editUserStatus'>用户状态</Label>
                  <Select name='status' defaultValue={selectedUser.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>活跃</SelectItem>
                      <SelectItem value='inactive'>非活跃</SelectItem>
                      <SelectItem value='suspended'>已停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>用户权限</Label>
                  <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3'>
                    {permissions.map(permission => (
                      <div
                        key={permission.id}
                        className='flex items-center space-x-2'
                      >
                        <input
                          type='checkbox'
                          name='permissions'
                          value={permission.id}
                          id={`perm-${permission.id}`}
                          defaultChecked={selectedUser.permissions.includes(
                            permission.id
                          )}
                          className='rounded'
                        />
                        <Label
                          htmlFor={`perm-${permission.id}`}
                          className='text-sm'
                        >
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='flex justify-end space-x-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setSelectedUser(null)}
                  >
                    取消
                  </Button>
                  <Button
                    type='submit'
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    保存修改
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
