import { PlatformConfig, PlatformType } from '../types/inspiration-types';

// 平台配置
const platformConfig: Record<PlatformType, PlatformConfig> = {
  微博: {
    emoji: '🔥',
    color: 'bg-red-100 text-red-800',
    url: 'https://weibo.com',
  },
  知乎: {
    emoji: '💡',
    color: 'bg-blue-100 text-blue-800',
    url: 'https://zhihu.com',
  },
  抖音: {
    emoji: '🎵',
    color: 'bg-black text-white',
    url: 'https://douyin.com',
  },
  小红书: {
    emoji: '📕',
    color: 'bg-red-50 text-red-600',
    url: 'https://xiaohongshu.com',
  },
  百度: {
    emoji: '🔍',
    color: 'bg-blue-50 text-blue-600',
    url: 'https://baidu.com',
  },
};

export default platformConfig;
