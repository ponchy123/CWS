const axios = require('axios');

async function quickTest() {
  console.log('🚀 快速测试修复后的NewsNow API...');
  console.log('=' .repeat(50));
  
  try {
    // 测试服务器连接
    console.log('🔗 测试服务器连接...');
    const healthResponse = await axios.get('http://localhost:3002/api/hot-topics?limit=1', {
      timeout: 10000
    });
    
    if (healthResponse.data.success) {
      console.log('✅ 服务器连接成功');
      
      // 测试NewsNow真实数据
      console.log('\n🎯 测试NewsNow真实数据获取...');
      const testResponse = await axios.get('http://localhost:3002/api/hot-topics', {
        params: {
          source: 'newsnow-real',
          sources: 'zhihu',
          limit: 3,
          mode: 'latest'
        },
        timeout: 15000
      });
      
      if (testResponse.data.success) {
        const topics = testResponse.data.data;
        console.log(`✅ 成功获取 ${topics.length} 条数据`);
        
        // 检查真实数据比例
        const realDataCount = topics.filter(t => t.isRealData).length;
        const realDataRatio = Math.round((realDataCount / topics.length) * 100);
        
        console.log(`🎯 真实数据比例: ${realDataCount}/${topics.length} (${realDataRatio}%)`);
        
        if (realDataRatio > 0) {
          console.log('🎉 修复成功！现在可以获取到真实数据了！');
          
          // 显示真实数据示例
          const realData = topics.filter(t => t.isRealData);
          if (realData.length > 0) {
            console.log('\n📋 真实数据示例:');
            realData.forEach((topic, index) => {
              console.log(`${index + 1}. ${topic.title}`);
              console.log(`   平台: ${topic.platform} | 热度: ${topic.heat} | 真实数据: ✅`);
            });
          }
        } else {
          console.log('⚠️ 仍在使用备用数据，可能需要进一步调试');
        }
        
      } else {
        console.log('❌ API请求失败:', testResponse.data.message);
      }
      
    } else {
      console.log('❌ 服务器响应异常');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 服务器未启动，请手动启动服务器:');
      console.log('cd content-workflow-system/server && npm start');
    } else {
      console.log('❌ 测试失败:', error.message);
    }
  }
}

quickTest();