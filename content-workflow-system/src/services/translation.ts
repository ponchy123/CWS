import { api } from './api';

// 支持的语言类型
export type LanguageCode = 
  | 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'it' | 'pt' 
  | 'ru' | 'ar' | 'hi' | 'th' | 'vi' | 'id' | 'ms' | 'tl' | 'tr' | 'pl';

// 语言信息
export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

// 翻译结果
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  confidence: number;
  alternatives?: string[];
  detectedLanguage?: LanguageCode;
}

// 批量翻译结果
export interface BatchTranslationResult {
  results: TranslationResult[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// 语言检测结果
export interface LanguageDetectionResult {
  language: LanguageCode;
  confidence: number;
  alternatives: Array<{
    language: LanguageCode;
    confidence: number;
  }>;
}

// 翻译历史记录
export interface TranslationHistory {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  timestamp: string;
  userId?: string;
  favorite?: boolean;
}

class TranslationService {
  private baseUrl = '/advanced/translation';

  // 翻译文本
  async translateText(
    text: string,
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<TranslationResult> {
    try {
      const response = await api.post(`${this.baseUrl}/translate`, {
        text,
        targetLanguage,
        sourceLanguage
      });
      return response.data;
    } catch (error) {
      console.error('翻译文本失败:', error);
      throw error;
    }
  }

  // 批量翻译
  async translateBatch(
    texts: string[],
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<BatchTranslationResult> {
    try {
      const response = await api.post(`${this.baseUrl}/translate/batch`, {
        texts,
        targetLanguage,
        sourceLanguage
      });
      return response.data;
    } catch (error) {
      console.error('批量翻译失败:', error);
      throw error;
    }
  }

  // 检测语言
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const response = await api.post(`${this.baseUrl}/detect`, {
        text
      });
      return response.data;
    } catch (error) {
      console.error('语言检测失败:', error);
      throw error;
    }
  }

  // 获取支持的语言列表
  async getSupportedLanguages(): Promise<Language[]> {
    try {
      const response = await api.get(`${this.baseUrl}/languages`);
      return response.data;
    } catch (error) {
      console.error('获取支持语言失败:', error);
      throw error;
    }
  }

  // 获取翻译历史
  async getTranslationHistory(limit: number = 50): Promise<TranslationHistory[]> {
    try {
      const response = await api.get(`${this.baseUrl}/history`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取翻译历史失败:', error);
      throw error;
    }
  }

  // 保存翻译到历史
  async saveToHistory(translation: Omit<TranslationHistory, 'id' | 'timestamp'>): Promise<TranslationHistory> {
    try {
      const response = await api.post(`${this.baseUrl}/history`, translation);
      return response.data;
    } catch (error) {
      console.error('保存翻译历史失败:', error);
      throw error;
    }
  }

  // 删除翻译历史
  async deleteFromHistory(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/history/${id}`);
    } catch (error) {
      console.error('删除翻译历史失败:', error);
      throw error;
    }
  }

  // 收藏/取消收藏翻译
  async toggleFavorite(id: string): Promise<TranslationHistory> {
    try {
      const response = await api.patch(`${this.baseUrl}/history/${id}/favorite`);
      return response.data;
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      throw error;
    }
  }

  // 翻译文档
  async translateDocument(
    file: File,
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<{
    translatedContent: string;
    originalContent: string;
    metadata: {
      fileName: string;
      fileSize: number;
      wordCount: number;
      translationTime: number;
    };
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetLanguage', targetLanguage);
      if (sourceLanguage) {
        formData.append('sourceLanguage', sourceLanguage);
      }

      const response = await api.post(`${this.baseUrl}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('翻译文档失败:', error);
      throw error;
    }
  }

  // 实时翻译（WebSocket）
  async startRealtimeTranslation(
    targetLanguage: LanguageCode,
    onTranslation: (result: TranslationResult) => void,
    onError: (error: string) => void
  ): Promise<{
    send: (text: string) => void;
    close: () => void;
  }> {
    try {
      // 这里应该建立WebSocket连接
      // 为了演示，我们使用模拟实现
      let isConnected = true;

      const send = (text: string) => {
        if (!isConnected) return;
        
        // 模拟实时翻译
        setTimeout(async () => {
          try {
            const result = await this.translateText(text, targetLanguage);
            onTranslation(result);
          } catch (error) {
            onError(error instanceof Error ? error.message : '翻译失败');
          }
        }, 500);
      };

      const close = () => {
        isConnected = false;
      };

      return { send, close };
    } catch (error) {
      console.error('启动实时翻译失败:', error);
      throw error;
    }
  }

  // 获取翻译质量评分
  async getTranslationQuality(
    originalText: string,
    translatedText: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
  ): Promise<{
    score: number;
    factors: {
      accuracy: number;
      fluency: number;
      completeness: number;
    };
    suggestions: string[];
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/quality`, {
        originalText,
        translatedText,
        sourceLanguage,
        targetLanguage
      });
      return response.data;
    } catch (error) {
      console.error('获取翻译质量评分失败:', error);
      throw error;
    }
  }

  // 术语库管理
  async getTerminology(domain?: string): Promise<Array<{
    id: string;
    source: string;
    target: string;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    domain: string;
    confidence: number;
  }>> {
    try {
      const response = await api.get(`${this.baseUrl}/terminology`, {
        params: domain ? { domain } : {}
      });
      return response.data;
    } catch (error) {
      console.error('获取术语库失败:', error);
      throw error;
    }
  }

  // 添加术语
  async addTerminology(term: {
    source: string;
    target: string;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    domain: string;
  }): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/terminology`, term);
    } catch (error) {
      console.error('添加术语失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const translationService = new TranslationService();

// 支持的语言配置
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁体中文', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'हिन्दी', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'ไทย', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polski', nativeName: 'Polski', flag: '🇵🇱' }
];

// 翻译工具函数
export const translationUtils = {
  // 获取语言信息
  getLanguageInfo: (code: LanguageCode): Language | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  },

  // 检查是否为RTL语言
  isRTL: (code: LanguageCode): boolean => {
    const lang = translationUtils.getLanguageInfo(code);
    return lang?.rtl || false;
  },

  // 格式化语言显示名称
  formatLanguageName: (code: LanguageCode, showNative: boolean = true): string => {
    const lang = translationUtils.getLanguageInfo(code);
    if (!lang) return code;
    
    if (showNative && lang.name !== lang.nativeName) {
      return `${lang.name} (${lang.nativeName})`;
    }
    return lang.name;
  },

  // 估算翻译时间（基于文本长度）
  estimateTranslationTime: (text: string): number => {
    const wordCount = text.split(/\s+/).length;
    // 假设每分钟翻译500个单词
    return Math.max(1, Math.ceil(wordCount / 500));
  },

  // 计算翻译成本（模拟）
  calculateTranslationCost: (text: string, targetLanguages: LanguageCode[]): number => {
    const charCount = text.length;
    const baseRate = 0.01; // 每字符0.01元
    const languageMultiplier = targetLanguages.length;
    return charCount * baseRate * languageMultiplier;
  },

  // 验证文本是否适合翻译
  validateTextForTranslation: (text: string): {
    valid: boolean;
    issues: string[];
  } => {
    const issues: string[] = [];
    
    if (!text.trim()) {
      issues.push('文本不能为空');
    }
    
    if (text.length > 10000) {
      issues.push('文本长度超过限制（最大10000字符）');
    }
    
    // 检查是否包含过多特殊字符
    const specialCharRatio = (text.match(/[^\w\s\u4e00-\u9fff]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) {
      issues.push('文本包含过多特殊字符，可能影响翻译质量');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  },

  // 高亮翻译差异
  highlightDifferences: (original: string, translated: string): {
    originalHighlighted: string;
    translatedHighlighted: string;
  } => {
    // 简单的差异高亮实现
    // 实际项目中可以使用更复杂的diff算法
    return {
      originalHighlighted: original,
      translatedHighlighted: translated
    };
  },

  // 生成翻译建议
  generateTranslationSuggestions: (
    originalText: string,
    translatedText: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
  ): string[] => {
    const suggestions: string[] = [];
    
    // 基于语言特性的建议
    if (sourceLanguage === 'zh-CN' && targetLanguage === 'en') {
      suggestions.push('注意中英文语序差异');
      suggestions.push('检查时态和语态的准确性');
    }
    
    if (targetLanguage === 'ja') {
      suggestions.push('注意敬语的使用');
      suggestions.push('确认汉字读音的准确性');
    }
    
    // 基于文本长度的建议
    if (translatedText.length > originalText.length * 1.5) {
      suggestions.push('译文可能过于冗长，考虑简化表达');
    }
    
    if (translatedText.length < originalText.length * 0.7) {
      suggestions.push('译文可能过于简略，检查是否遗漏信息');
    }
    
    return suggestions;
  }
};

// 翻译质量评估器
export class TranslationQualityAssessor {
  // 评估翻译质量
  static assess(
    original: string,
    translated: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
  ): {
    overallScore: number;
    accuracy: number;
    fluency: number;
    completeness: number;
    suggestions: string[];
  } {
    const accuracy = this.assessAccuracy(original, translated);
    const fluency = this.assessFluency(translated, targetLanguage);
    const completeness = this.assessCompleteness(original, translated);
    
    const overallScore = (accuracy + fluency + completeness) / 3;
    const suggestions = translationUtils.generateTranslationSuggestions(
      original, translated, sourceLanguage, targetLanguage
    );
    
    return {
      overallScore,
      accuracy,
      fluency,
      completeness,
      suggestions
    };
  }
  
  // 评估准确性
  private static assessAccuracy(original: string, translated: string): number {
    // 简化的准确性评估
    // 实际项目中需要更复杂的NLP算法
    const lengthRatio = translated.length / original.length;
    if (lengthRatio < 0.5 || lengthRatio > 2) {
      return 60; // 长度差异过大
    }
    return 85; // 基础分数
  }
  
  // 评估流畅性
  private static assessFluency(translated: string, targetLanguage: LanguageCode): number {
    // 简化的流畅性评估
    const sentences = translated.split(/[.!?。！？]/);
    const avgSentenceLength = translated.length / sentences.length;
    
    // 基于平均句长评估
    if (avgSentenceLength > 100) {
      return 70; // 句子过长
    }
    if (avgSentenceLength < 10) {
      return 75; // 句子过短
    }
    return 90; // 合适的句长
  }
  
  // 评估完整性
  private static assessCompleteness(original: string, translated: string): number {
    // 简化的完整性评估
    const originalWords = original.split(/\s+/).length;
    const translatedWords = translated.split(/\s+/).length;
    const wordRatio = translatedWords / originalWords;
    
    if (wordRatio < 0.7) {
      return 70; // 可能遗漏内容
    }
    if (wordRatio > 1.5) {
      return 80; // 可能添加了额外内容
    }
    return 95; // 完整性良好
  }
}