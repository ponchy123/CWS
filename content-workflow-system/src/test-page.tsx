import React from 'react';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          内容工作流系统测试页面
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">今日阅读量</h2>
            <div className="text-3xl font-bold text-blue-600">12.5K</div>
            <div className="text-sm text-green-600 mt-2">+12%</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">发布内容</h2>
            <div className="text-3xl font-bold text-blue-600">8</div>
            <div className="text-sm text-green-600 mt-2">+2</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">互动量</h2>
            <div className="text-3xl font-bold text-blue-600">2.3K</div>
            <div className="text-sm text-green-600 mt-2">+18%</div>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">系统状态</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>前端服务</span>
              <span className="text-green-600">运行中</span>
            </div>
            <div className="flex justify-between">
              <span>后端API</span>
              <span className="text-green-600">运行中</span>
            </div>
            <div className="flex justify-between">
              <span>数据库连接</span>
              <span className="text-yellow-600">使用模拟数据</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            快速创建内容
          </button>
        </div>
      </div>
    </div>
  );
}