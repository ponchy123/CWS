import { api } from './api';

// 免费API服务类
export class FreeApisService {
  private baseUrl = '/free-apis';

  // Unsplash 图片API
  async getUnsplashImages(query: string, count: number = 12) {
    try {
      const response = await api.get(`${this.baseUrl}/unsplash/search`, {
        params: { query, count }
      });
      return response.data;
    } catch (error) {
      console.error('获取Unsplash图片失败:', error);
      throw error;
    }
  }

  // 获取随机高质量图片
  async getRandomImages(count: number = 12) {
    try {
      const response = await api.get(`${this.baseUrl}/unsplash/random`, {
        params: { count }
      });
      return response.data;
    } catch (error) {
      console.error('获取随机图片失败:', error);
      throw error;
    }
  }

  // Quotable 名言API
  async getRandomQuote() {
    try {
      const response = await api.get(`${this.baseUrl}/quotes/random`);
      return response.data;
    } catch (error) {
      console.error('获取名言失败:', error);
      throw error;
    }
  }

  // 根据标签获取名言
  async getQuotesByTag(tag: string) {
    try {
      const response = await api.get(`${this.baseUrl}/quotes/tag/${tag}`);
      return response.data;
    } catch (error) {
      console.error('获取标签名言失败:', error);
      throw error;
    }
  }

  // 获取名言标签列表
  async getQuoteTags() {
    try {
      const response = await api.get(`${this.baseUrl}/quotes/tags`);
      return response.data;
    } catch (error) {
      console.error('获取名言标签失败:', error);
      throw error;
    }
  }

  // QR码生成API
  generateQRCode(text: string, size: number = 200) {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
  }

  // 生成带logo的QR码
  generateQRCodeWithLogo(text: string, logoUrl: string, size: number = 200) {
    const encodedText = encodeURIComponent(text);
    const encodedLogo = encodeURIComponent(logoUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&logo=${encodedLogo}`;
  }

  // Poetry DB 诗歌API
  async getRandomPoem() {
    try {
      const response = await api.get(`${this.baseUrl}/poetry/random`);
      return response.data;
    } catch (error) {
      console.error('获取随机诗歌失败:', error);
      throw error;
    }
  }

  // 根据作者获取诗歌
  async getPoemsByAuthor(author: string) {
    try {
      const response = await api.get(`${this.baseUrl}/poetry/author/${author}`);
      return response.data;
    } catch (error) {
      console.error('获取作者诗歌失败:', error);
      throw error;
    }
  }

  // NewsAPI 新闻API
  async getTopHeadlines(country: string = 'us', category?: string) {
    try {
      const response = await api.get(`${this.baseUrl}/news/headlines`, {
        params: { country, category }
      });
      return response.data;
    } catch (error) {
      console.error('获取头条新闻失败:', error);
      throw error;
    }
  }

  // 搜索新闻
  async searchNews(query: string, sortBy: string = 'publishedAt') {
    try {
      const response = await api.get(`${this.baseUrl}/news/search`, {
        params: { query, sortBy }
      });
      return response.data;
    } catch (error) {
      console.error('搜索新闻失败:', error);
      throw error;
    }
  }

  // 天气API
  async getCurrentWeather(city: string) {
    try {
      const response = await api.get(`${this.baseUrl}/weather/current`, {
        params: { city }
      });
      return response.data;
    } catch (error) {
      console.error('获取天气信息失败:', error);
      throw error;
    }
  }

  // 获取天气预报
  async getWeatherForecast(city: string, days: number = 5) {
    try {
      const response = await api.get(`${this.baseUrl}/weather/forecast`, {
        params: { city, days }
      });
      return response.data;
    } catch (error) {
      console.error('获取天气预报失败:', error);
      throw error;
    }
  }

  // Lorem Ipsum 文本生成
  async generateLoremText(paragraphs: number = 3, wordsPerParagraph: number = 50) {
    try {
      const response = await api.get(`${this.baseUrl}/lorem/generate`, {
        params: { paragraphs, wordsPerParagraph }
      });
      return response.data;
    } catch (error) {
      console.error('生成Lorem文本失败:', error);
      throw error;
    }
  }

  // 随机用户头像生成
  generateAvatar(name: string, size: number = 128, background?: string) {
    const encodedName = encodeURIComponent(name);
    let url = `https://ui-avatars.com/api/?name=${encodedName}&size=${size}`;
    if (background) {
      url += `&background=${background}`;
    }
    return url;
  }

  // 机器人头像生成
  generateRobotAvatar(seed: string, size: number = 128) {
    return `https://robohash.org/${encodeURIComponent(seed)}?size=${size}x${size}`;
  }

  // 汇率转换API
  async getCurrencyRates(baseCurrency: string = 'USD') {
    try {
      const response = await api.get(`${this.baseUrl}/currency/rates`, {
        params: { base: baseCurrency }
      });
      return response.data;
    } catch (error) {
      console.error('获取汇率失败:', error);
      throw error;
    }
  }

  // 转换货币
  async convertCurrency(amount: number, from: string, to: string) {
    try {
      const response = await api.get(`${this.baseUrl}/currency/convert`, {
        params: { amount, from, to }
      });
      return response.data;
    } catch (error) {
      console.error('货币转换失败:', error);
      throw error;
    }
  }

  // 获取随机笑话
  async getRandomJoke() {
    try {
      const response = await api.get(`${this.baseUrl}/jokes/random`);
      return response.data;
    } catch (error) {
      console.error('获取笑话失败:', error);
      throw error;
    }
  }

  // 根据类别获取笑话
  async getJokesByCategory(category: string) {
    try {
      const response = await api.get(`${this.baseUrl}/jokes/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('获取分类笑话失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const freeApisService = new FreeApisService();

// 类型定义
export interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
  links: {
    download: string;
  };
}

export interface Quote {
  _id: string;
  content: string;
  author: string;
  tags: string[];
  length: number;
}

export interface Poem {
  title: string;
  author: string;
  lines: string[];
  linecount: number;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface CurrencyRate {
  currency: string;
  rate: number;
}

export interface Joke {
  id: number;
  type: string;
  setup?: string;
  delivery?: string;
  joke?: string;
  category: string;
  safe: boolean;
}