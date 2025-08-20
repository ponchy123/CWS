// 灵感工具函数

// 格式化日期
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 从文本中提取关键词
export const extractKeywords = (text: string, platform?: string): string[] => {
  if (!text) return [];

  // 移除标点符号和特殊字符
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');

  // 分词（简化版本）
  const words = cleanText.split(/\s+/).filter(word => word.length > 1);

  // 常见停用词
  const stopWords = [
    '的',
    '了',
    '在',
    '是',
    '我',
    '有',
    '和',
    '就',
    '不',
    '人',
    '都',
    '一',
    '一个',
    '上',
    '也',
    '很',
    '到',
    '说',
    '要',
    '去',
    '你',
    '会',
    '着',
    '没有',
    '看',
    '好',
    '自己',
    '这',
  ];

  // 过滤停用词并去重
  const keywords = [
    ...new Set(
      words.filter(word => !stopWords.includes(word) && word.length >= 2)
    ),
  ];

  // 根据平台调整关键词权重
  if (platform) {
    const platformKeywords = {
      微博: ['热搜', '话题', '讨论'],
      知乎: ['问题', '回答', '专业'],
      抖音: ['视频', '创意', '娱乐'],
      小红书: ['种草', '分享', '生活'],
      B站: ['视频', 'UP主', '弹幕'],
    };

    const platformSpecific =
      platformKeywords[platform as keyof typeof platformKeywords] || [];
    keywords.unshift(...platformSpecific.filter(kw => text.includes(kw)));
  }

  return keywords.slice(0, 10); // 返回前10个关键词
};

// 分析目标受众
export const analyzeTargetAudience = (
  content: string
): {
  ageGroup: string;
  interests: string[];
  demographics: string;
} => {
  // 简化的受众分析逻辑
  const keywords = content.toLowerCase();

  let ageGroup = '25-35岁';
  if (keywords.includes('学生') || keywords.includes('校园')) {
    ageGroup = '18-25岁';
  } else if (keywords.includes('职场') || keywords.includes('工作')) {
    ageGroup = '25-40岁';
  } else if (keywords.includes('退休') || keywords.includes('养老')) {
    ageGroup = '50岁以上';
  }

  const interests: string[] = [];
  if (keywords.includes('科技')) interests.push('科技');
  if (keywords.includes('美食')) interests.push('美食');
  if (keywords.includes('旅游')) interests.push('旅游');
  if (keywords.includes('健身')) interests.push('健身');
  if (keywords.includes('音乐')) interests.push('音乐');
  if (keywords.includes('电影')) interests.push('电影');

  return {
    ageGroup,
    interests: interests.length > 0 ? interests : ['生活方式', '娱乐'],
    demographics: '一线城市白领为主',
  };
};

// 预测流行度
export const predictPopularity = (
  topic: string
): {
  score: number;
  trend: 'rising' | 'stable' | 'declining';
  factors: string[];
} => {
  // 简化的流行度预测逻辑
  const trendingKeywords = [
    'AI',
    '人工智能',
    '元宇宙',
    '新能源',
    '直播',
    '短视频',
  ];
  const stableKeywords = ['美食', '旅游', '健康', '教育'];

  let score = 50;
  let trend: 'rising' | 'stable' | 'declining' = 'stable';
  const factors: string[] = [];

  if (trendingKeywords.some(keyword => topic.includes(keyword))) {
    score += 30;
    trend = 'rising';
    factors.push('热门话题');
  }

  if (stableKeywords.some(keyword => topic.includes(keyword))) {
    score += 10;
    factors.push('长期稳定');
  }

  // 随机因素模拟
  score += Math.random() * 20 - 10;
  score = Math.max(0, Math.min(100, score));

  if (factors.length === 0) {
    factors.push('基础热度');
  }

  return { score: Math.round(score), trend, factors };
};

// 分析趋势
export const analyzeTrend = (
  data: Array<{ value?: number }>
): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
} => {
  if (!data || data.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      description: '数据不足，无法分析趋势',
    };
  }

  const recent = data.slice(-5);
  const older = data.slice(-10, -5);

  const recentAvg =
    recent.reduce((sum, item) => sum + (item.value || 0), 0) / recent.length;
  const olderAvg =
    older.length > 0
      ? older.reduce((sum, item) => sum + (item.value || 0), 0) / older.length
      : recentAvg;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  let direction: 'up' | 'down' | 'stable' = 'stable';
  let description = '趋势平稳';

  if (Math.abs(change) > 5) {
    if (change > 0) {
      direction = 'up';
      description = '呈上升趋势';
    } else {
      direction = 'down';
      description = '呈下降趋势';
    }
  }

  return {
    direction,
    percentage: Math.abs(Math.round(change)),
    description,
  };
};

// 生成内容建议
export const generateContentSuggestions = (
  topic: string
): {
  titles: string[];
  angles: string[];
  formats: string[];
} => {
  const baseTitles = [
    `关于${topic}的深度解析`,
    `${topic}：你需要知道的一切`,
    `${topic}的最新趋势分析`,
    `如何在${topic}领域脱颖而出`,
    `${topic}实战指南`,
  ];

  const angles = [
    '新手入门',
    '专家观点',
    '案例分析',
    '趋势预测',
    '实用技巧',
    '常见误区',
    '行业对比',
  ];

  const formats = [
    '图文教程',
    '视频讲解',
    '信息图表',
    '问答形式',
    '案例故事',
    '数据报告',
    '专家访谈',
  ];

  return {
    titles: baseTitles,
    angles: angles.slice(0, 5),
    formats: formats.slice(0, 4),
  };
};

// 内容质量评估
export const assessContentQuality = (
  content: string
): {
  score: number;
  suggestions: string[];
  strengths: string[];
} => {
  let score = 60;
  const suggestions: string[] = [];
  const strengths: string[] = [];

  // 长度检查
  if (content.length < 100) {
    suggestions.push('内容过短，建议增加更多细节');
    score -= 10;
  } else if (content.length > 500) {
    strengths.push('内容详实');
    score += 10;
  }

  // 结构检查
  if (content.includes('\n') || content.includes('。')) {
    strengths.push('结构清晰');
    score += 5;
  } else {
    suggestions.push('建议增加段落分隔，提高可读性');
    score -= 5;
  }

  // 关键词密度
  const words = content.split(/\s+/);
  if (words.length > 50) {
    strengths.push('词汇丰富');
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return { score, suggestions, strengths };
};

// 热点话题分析
export const analyzeHotTopics = (
  topics: string[]
): {
  trending: string[];
  emerging: string[];
  declining: string[];
} => {
  // 简化的话题分析
  const trendingTopics = topics.filter(topic =>
    ['AI', '短视频', '直播', '元宇宙', '新能源'].some(keyword =>
      topic.includes(keyword)
    )
  );

  const emergingTopics = topics.filter(topic =>
    ['Web3', '虚拟现实', '区块链', '可持续发展'].some(keyword =>
      topic.includes(keyword)
    )
  );

  const decliningTopics = topics.filter(topic =>
    ['传统媒体', '纸质书籍'].some(keyword => topic.includes(keyword))
  );

  return {
    trending: trendingTopics.slice(0, 5),
    emerging: emergingTopics.slice(0, 3),
    declining: decliningTopics.slice(0, 2),
  };
};

// 竞争对手分析
export const analyzeCompetitors = (
  _niche: string
): {
  competitors: Array<{
    name: string;
    strength: number;
    weaknesses: string[];
    opportunities: string[];
  }>;
  marketGap: string[];
} => {
  // 模拟竞争对手数据
  const competitors = [
    {
      name: '竞争对手A',
      strength: 85,
      weaknesses: ['内容更新频率低', '用户互动不足'],
      opportunities: ['可以在视频内容方面超越', '社交媒体营销有待加强'],
    },
    {
      name: '竞争对手B',
      strength: 72,
      weaknesses: ['内容深度不够', '专业性有待提升'],
      opportunities: ['可以提供更专业的内容', '用户体验可以优化'],
    },
  ];

  const marketGap = [
    '缺少针对初学者的入门内容',
    '高质量的案例分析较少',
    '实时互动内容不足',
    '多媒体内容形式单一',
  ];

  return { competitors, marketGap };
};

export default {
  formatDate,
  generateId,
  analyzeTargetAudience,
  predictPopularity,
  analyzeTrend,
  generateContentSuggestions,
  assessContentQuality,
  analyzeHotTopics,
  analyzeCompetitors,
};
