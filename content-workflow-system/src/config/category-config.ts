import { CategoryConfig, CategoryType } from '../types/inspiration-types';

// 分类配置
const categoryConfig: Record<CategoryType, CategoryConfig> = {
  科技: {
    emoji: '💻',
    color: 'bg-blue-100 text-blue-800',
    description: '科技、AI、数码产品等',
  },
  生活: {
    emoji: '🏡',
    color: 'bg-green-100 text-green-800',
    description: '日常生活、家居、健康等',
  },
  娱乐: {
    emoji: '🎬',
    color: 'bg-purple-100 text-purple-800',
    description: '电影、音乐、游戏等',
  },
  财经: {
    emoji: '💰',
    color: 'bg-yellow-100 text-yellow-800',
    description: '金融、投资、经济等',
  },
  教育: {
    emoji: '📚',
    color: 'bg-indigo-100 text-indigo-800',
    description: '学习、培训、考试等',
  },
  时尚: {
    emoji: '👗',
    color: 'bg-pink-100 text-pink-800',
    description: '服饰、美妆、潮流等',
  },
  体育: {
    emoji: '⚽',
    color: 'bg-orange-100 text-orange-800',
    description: '运动、比赛、健身等',
  },
  社会: {
    emoji: '🌍',
    color: 'bg-gray-100 text-gray-800',
    description: '新闻、时事、社会现象等',
  },
  汽车: {
    emoji: '🚗',
    color: 'bg-red-50 text-red-600',
    description: '汽车、交通、出行等',
  },
  旅游: {
    emoji: '✈️',
    color: 'bg-cyan-100 text-cyan-800',
    description: '旅行、景点、攻略等',
  },
};

export default categoryConfig;
