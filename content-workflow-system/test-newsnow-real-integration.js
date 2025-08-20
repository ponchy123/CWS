import axios from 'axios';

/**
 * NewsNow 真实 API 集成测试脚本
 * 测试与 https://newsnow.busiyi.world/ 的集成效果
 */

const API_BASE = 'http://localhost:3002/api';

// 测试配置
const TEST_CONFIGS = [
  {
    name: '混合数据源 - 最热模式',
    params: { source: 'mixed', mode: 'hottest', limit: 10 }
  },
  {
    name: '真实 NewsNow - 最新模式',
    params: { source: 'newsnow-real', mode: 'latest', limit: 8 }
  },
  {
    name: '真实 NewsNow - 知乎+微博',
    params: { source: 'newsnow-real', mode: 'hottest', sources: 'zhihu,weibo', limit: 6 }
  },
  {
    name: '单一数据源 - 知乎',
    endpoint: '/hot-topics/source/zhihu',
    params: { mode: 'latest', limit: 5 }
  }
];

async function testHotTopicsAPI() {
  console.log('🚀 开始测试 NewsNow 真实 API 集成...\n');
  
  for (const config of TEST_CONFIGS) {
    console.log(`📊 测试: ${config.name}`);
    console.log('=' .repeat(50));
    
    try {
      const endpoint = config.endpoint || '/hot-topics';
      const url = `${API_BASE}${endpoint}`;
      const params = new URLSearchParams(config.params);
      
      console.log(`🔗 请求地址: ${url}?${params}`);
      
      const startTime = Date.now();
      const response = await axios.get(`${url}?${params}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NewsNow-Test-Client/1.0'
        }
      });
      const endTime = Date.now();
      
      if (response.data.success) {
        const topics = response.data.data || [];
        console.log(`✅ 请求成功 (${endTime - startTime}ms)`);
        console.log(`📈 获取到 ${topics.length} 条热点话题`);
        console.log(`🔄 数据源: ${response.data.source}, 模式: ${response.data.mode}`);
        
        if (topics.length > 0) {
          console.log('\n🎯 热点话题预览:');
          topics.slice(0, 3).forEach((topic, index) => {
            console.log(`\n${index + 1}. ${topic.title}`);
            console.log(`   平台: ${topic.platform} | 热度: ${formatHeat(topic.heat)} | 分类: ${topic.category}`);
            console.log(`   标签: ${topic.tags?.join(', ') || '无'}`);
            console.log(`   时间: ${formatTime(topic.createdAt)}`);
            
            if (topic.isRealData !== undefined) {
              console.log(`   数据类型: ${topic.isRealData ? '真实数据' : '备用数据'}`);
            }
            
            if (topic.aiAnalysis) {
              console.log(`   AI分析: 情感${getSentimentText(topic.aiAnalysis.sentiment)} | 传播潜力${topic.aiAnalysis.viralPotential}% | 商业价值${topic.aiAnalysis.commercialValue}%`);
            }
          });
          
          // 数据质量分析
          console.log('\n📊 数据质量分析:');
          const realDataCount = topics.filter(t => t.isRealData).length;
          const avgHeat = topics.reduce((sum, t) => sum + (t.heat || 0), 0) / topics.length;
          const platforms = [...new Set(topics.map(t => t.platform))];
          const categories = [...new Set(topics.map(t => t.category))];
          
          console.log(`   真实数据比例: ${realDataCount}/${topics.length} (${Math.round(realDataCount/topics.length*100)}%)`);
          console.log(`   平均热度: ${formatHeat(Math.round(avgHeat))}`);
          console.log(`   覆盖平台: ${platforms.join(', ')}`);
          console.log(`   涉及分类: ${categories.join(', ')}`);
        }
        
      } else {
        console.log(`❌ 请求失败: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`❌ 请求异常: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${error.response.data?.message || '未知错误'}`);
      }
    }
    
    console.log('\n');
  }
}

async function testDataSourcesAPI() {
  console.log('📋 测试数据源列表 API...');
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE}/hot-topics/sources`, {
      timeout: 10000
    });
    
    if (response.data.success) {
      const { sources, recommendations } = response.data.data;
      
      console.log(`✅ 获取到 ${sources.length} 个可用数据源`);
      console.log('\n🎯 数据源列表:');
      sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source.name} (${source.id})`);
        console.log(`   分类: ${source.category} | 端点: ${source.endpoint}`);
      });
      
      console.log(`\n🎨 推荐组合 (${Object.keys(recommendations).length} 个):`);
      Object.entries(recommendations).forEach(([key, rec]) => {
        console.log(`• ${rec.name}: ${rec.sources.join(', ')}`);
        console.log(`  ${rec.description}`);
      });
      
    } else {
      console.log(`❌ 获取数据源失败: ${response.data.message}`);
    }
    
  } catch (error) {
    console.log(`❌ 数据源 API 异常: ${error.message}`);
  }
  
  console.log('\n');
}

async function testPerformance() {
  console.log('⚡ 性能测试...');
  console.log('=' .repeat(50));
  
  const testCases = [
    { name: '混合数据源', params: { source: 'mixed', limit: 15 } },
    { name: '真实NewsNow', params: { source: 'newsnow-real', limit: 15 } },
    { name: '本地数据', params: { source: 'local', limit: 15 } }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔄 测试 ${testCase.name}...`);
    
    const times = [];
    const successCount = { success: 0, total: 3 };
    
    for (let i = 0; i < 3; i++) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${API_BASE}/hot-topics`, {
          params: testCase.params,
          timeout: 20000
        });
        const endTime = Date.now();
        
        if (response.data.success) {
          times.push(endTime - startTime);
          successCount.success++;
        }
        successCount.total++;
        
      } catch (error) {
        console.log(`   第${i+1}次请求失败: ${error.message}`);
        successCount.total++;
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`   成功率: ${successCount.success}/${successCount.total} (${Math.round(successCount.success/successCount.total*100)}%)`);
      console.log(`   平均响应时间: ${avgTime.toFixed(0)}ms`);
      console.log(`   最快/最慢: ${minTime}ms / ${maxTime}ms`);
    } else {
      console.log(`   ❌ 所有请求都失败了`);
    }
    
    console.log('');
  }
}

// 工具函数
function formatHeat(heat) {
  if (heat >= 10000) {
    return `${(heat / 10000).toFixed(1)}万`;
  }
  return heat.toLocaleString();
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

function getSentimentText(sentiment) {
  switch (sentiment) {
    case 'positive': return '积极';
    case 'negative': return '消极';
    default: return '中性';
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🎯 NewsNow 真实 API 集成测试');
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  console.log('测试目标: http://localhost:3002');
  console.log('=' .repeat(80));
  console.log('');
  
  try {
    // 测试服务器连接
    console.log('🔗 检查服务器连接...');
    await axios.get(`${API_BASE}/hot-topics?limit=1`, { timeout: 5000 });
    console.log('✅ 服务器连接正常\n');
    
    // 运行各项测试
    await testDataSourcesAPI();
    await testHotTopicsAPI();
    await testPerformance();
    
    console.log('🎉 所有测试完成！');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.log('❌ 服务器连接失败，请确保后端服务正在运行');
    console.log(`错误信息: ${error.message}`);
    console.log('\n启动命令:');
    console.log('cd content-workflow-system/server && npm start');
  }
}

// 运行测试
// 直接运行测试
runAllTests();

export {
  testHotTopicsAPI,
  testDataSourcesAPI,
  testPerformance,
  runAllTests
};
