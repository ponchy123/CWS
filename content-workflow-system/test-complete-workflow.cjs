const axios = require('axios');

const API_BASE = 'http://localhost:3004/api';

// 测试完整工作流程
async function testCompleteWorkflow() {
  console.log('🚀 开始测试完整内容工作流程...\n');

  try {
    // 1. 测试灵感收集
    console.log('📝 步骤 1: 测试灵感收集');
    const inspirationData = {
      title: '人工智能在内容创作中的应用',
      content: '随着AI技术的发展，内容创作正在经历革命性变化。从文本生成到图像创作，AI正在改变我们创作内容的方式。',
      source: 'manual',
      tags: ['AI', '内容创作', '技术趋势'],
      category: 'AI工具'
    };

    const inspirationResponse = await axios.post(`${API_BASE}/inspiration`, inspirationData);
    console.log('✅ 灵感创建成功:', inspirationResponse.data.data.title);
    const inspirationId = inspirationResponse.data.data._id;

    // 2. 测试热点话题获取
    console.log('\n🔥 步骤 2: 测试热点话题获取');
    const hotTopicsResponse = await axios.post(`${API_BASE}/agents/hot-topics`, {
      platforms: ['weibo', 'zhihu'],
      limit: 5,
      timeRange: '1h'
    });
    console.log('✅ 热点话题获取成功:', hotTopicsResponse.data.data?.length || 0, '条话题');
    if (hotTopicsResponse.data.data && hotTopicsResponse.data.data.length > 0) {
      console.log('   示例话题:', hotTopicsResponse.data.data[0].title);
    }

    // 3. 测试AI内容生成
    console.log('\n🤖 步骤 3: 测试AI内容生成');
    const generateData = {
      inspirationId: inspirationId,
      contentType: 'article',
      platform: 'blog',
      tone: 'professional',
      length: 'medium',
      includeImages: false
    };

    const generateResponse = await axios.post(`${API_BASE}/content/generate`, generateData);
    console.log('✅ AI内容生成成功');
    console.log('   标题:', generateResponse.data.data.title);
    console.log('   内容长度:', generateResponse.data.data.content.length, '字符');
    const contentId = generateResponse.data.data.id || generateResponse.data.data._id;
    console.log('   内容ID:', contentId);

    // 4. 测试内容列表获取
    console.log('\n📋 步骤 4: 测试内容列表获取');
    const contentListResponse = await axios.get(`${API_BASE}/content?limit=10`);
    console.log('✅ 内容列表获取成功:', contentListResponse.data.data.contents.length, '条内容');

    // 5. 测试内容编辑
    console.log('\n✏️ 步骤 5: 测试内容编辑');
    const updateData = {
      title: generateResponse.data.data.title + ' (已编辑)',
      content: generateResponse.data.data.content + '\n\n[编辑更新：添加了更多详细信息]',
      category: generateResponse.data.data.category,
      tags: [...(generateResponse.data.data.tags || []), '已编辑'],
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      platforms: [
        { name: '知乎', status: 'scheduled' },
        { name: 'B站', status: 'scheduled' }
      ]
    };

    const updateResponse = await axios.put(`${API_BASE}/content/${contentId}`, updateData);
    console.log('✅ 内容编辑成功');
    console.log('   新状态:', updateResponse.data.data.status);
    console.log('   计划发布时间:', new Date(updateResponse.data.data.scheduledAt).toLocaleString('zh-CN'));

    // 6. 测试发布管理
    console.log('\n📤 步骤 6: 测试发布管理');
    const publishResponse = await axios.post(`${API_BASE}/publish/tasks/${contentId}/publish`, {
      platforms: ['知乎']
    });
    console.log('✅ 发布计划设置成功');

    // 7. 测试数据分析
    console.log('\n📊 步骤 7: 测试数据分析');
    const analyticsResponse = await axios.get(`${API_BASE}/analytics/overview`);
    console.log('✅ 数据分析获取成功');
    console.log('   总浏览量:', analyticsResponse.data.data.totalViews);
    console.log('   总点赞数:', analyticsResponse.data.data.totalLikes);
    console.log('   已发布数:', analyticsResponse.data.data.publishedCount);

    // 8. 测试系统监控
    console.log('\n🔍 步骤 8: 测试系统监控');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 系统健康检查成功');
    console.log('   系统状态:', healthResponse.data.status);
    console.log('   数据库状态:', healthResponse.data.database);

    console.log('\n🎉 完整工作流程测试成功！');
    console.log('\n📋 测试总结:');
    console.log('   ✅ 灵感收集 - 正常');
    console.log('   ✅ 热点话题获取 - 正常');
    console.log('   ✅ AI内容生成 - 正常');
    console.log('   ✅ 内容管理 - 正常');
    console.log('   ✅ 发布调度 - 正常');
    console.log('   ✅ 数据分析 - 正常');
    console.log('   ✅ 系统监控 - 正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   详细错误:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testCompleteWorkflow();