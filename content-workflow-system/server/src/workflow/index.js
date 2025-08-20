/**
 * 工作流系统入口
 * 集成 WorkflowEngine 和 EventBus
 */

const WorkflowEngine = require('./WorkflowEngine');
const EventBus = require('./EventBus');
const { logger } = require('../config/logger');

class WorkflowSystem {
  constructor(options = {}) {
    this.eventBus = new EventBus(options.eventBus);
    this.agentManager = options.agentManager;
    this.workflowEngine = new WorkflowEngine(this.agentManager, this.eventBus);
    
    this.setupEventHandlers();
    this.registerBuiltinWorkflows();
    
    logger.info('工作流系统初始化完成', {
      type: 'workflow_system_init'
    });
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 监听工作流事件
    this.eventBus.on('workflow.completed', (event) => {
      logger.info('工作流完成事件', {
        executionId: event.data.executionId,
        workflowId: event.data.workflowId,
        duration: event.data.duration,
        type: 'workflow_completed_event'
      });
    });

    this.eventBus.on('workflow.failed', (event) => {
      logger.error('工作流失败事件', {
        executionId: event.data.executionId,
        workflowId: event.data.workflowId,
        error: event.data.error,
        type: 'workflow_failed_event'
      });
    });

    // 监听 Agent 事件
    this.eventBus.on('agent.completed', (event) => {
      logger.debug('Agent完成事件', {
        agentName: event.data.agentName,
        executionTime: event.data.executionTime,
        type: 'agent_completed_event'
      });
    });
  }

  /**
   * 注册内置工作流
   */
  registerBuiltinWorkflows() {
    // 内容创建工作流
    this.workflowEngine.registerWorkflow('content_creation_workflow', {
      name: '内容创建工作流',
      description: '完整的内容创建、分析、优化流程',
      version: '1.0.0',
      steps: [
        {
          name: '内容分析',
          type: 'agent',
          config: {
            agentName: 'content_analysis',
            parameters: {
              content: '${content}',
              title: '${title}',
              analysisTypes: ['sentiment', 'keywords', 'seo', 'readability']
            }
          }
        },
        {
          name: '创建内容',
          type: 'agent',
          config: {
            agentName: 'content_management',
            parameters: {
              operation: 'create'
            }
          },
          outputMapping: {
            'data.id': 'contentId',
            'data.title': 'contentTitle'
          }
        },
        {
          name: '发布调度',
          type: 'agent',
          config: {
            agentName: 'publish_scheduler',
            parameters: {
              platforms: ['weibo', 'zhihu'],
              scheduleType: 'optimal'
            }
          },
          condition: 'data.status === "published"'
        }
      ]
    });

    // 热点内容工作流
    this.workflowEngine.registerWorkflow('trending_content_workflow', {
      name: '热点内容工作流',
      description: '基于热点话题的内容创建流程',
      version: '1.0.0',
      steps: [
        {
          name: '获取热点话题',
          type: 'agent',
          config: {
            agentName: 'hot_topics',
            parameters: {
              platforms: ['weibo', 'zhihu', 'juejin'],
              limit: 10
            }
          }
        },
        {
          name: '分析用户兴趣',
          type: 'agent',
          config: {
            agentName: 'user_behavior',
            parameters: {
              analysisType: 'profile' // 使用支持的分析类型
              // userId 将从输入数据中自动获取
            }
          }
        },
        {
          name: '匹配热点与兴趣',
          type: 'transform',
          config: {
            script: `
              // 简单的匹配逻辑
              const topics = context.topics || [];
              const interests = context.interests || [];
              
              const matches = topics.filter(topic => 
                interests.some(interest => 
                  topic.title && topic.title.includes(interest.keyword)
                )
              );
              
              return {
                ...context,
                matchedTopics: matches,
                recommendedTopic: matches[0] || topics[0]
              };
            `
          }
        },
        {
          name: '生成内容建议',
          type: 'transform',
          config: {
            script: `
              // 基于用户画像和热点话题生成内容建议
              const userProfile = context.profile || {};
              const interests = userProfile.interests?.primary || [];
              const matchedTopics = context.matchedTopics || [];
              const recommendedTopic = context.recommendedTopic;
              
              const contentSuggestions = [];
              
              // 基于用户兴趣生成建议
              interests.forEach(interest => {
                contentSuggestions.push({
                  type: 'interest-based',
                  title: interest.interest + '相关内容创作建议',
                  description: '基于您对' + interest.interest + '的兴趣（权重' + interest.weight + '）',
                  keywords: [interest.interest],
                  priority: interest.weight
                });
              });
              
              // 基于推荐话题生成建议
              if (recommendedTopic) {
                contentSuggestions.push({
                  type: 'trending-based',
                  title: '热点话题：' + (recommendedTopic.title || '当前热门话题'),
                  description: '基于当前热点趋势的内容创作建议',
                  keywords: recommendedTopic.keywords || ['热点', '趋势'],
                  priority: 0.9
                });
              }
              
              // 生成综合建议
              const finalSuggestions = {
                contentIdeas: contentSuggestions,
                recommendedPlatforms: userProfile.platformUsage ? 
                  Object.entries(userProfile.platformUsage)
                    .sort(([,a], [,b]) => b.engagementRate - a.engagementRate)
                    .slice(0, 3)
                    .map(([platform, stats]) => ({
                      platform,
                      engagementRate: stats.engagementRate,
                      reason: '高参与度平台 (' + Math.round(stats.engagementRate * 100) + '%)'
                    })) : [],
                optimalTiming: userProfile.activityTime?.peakHours?.slice(0, 2) || [],
                summary: '基于用户行为分析，建议创作' + (interests[0]?.interest || '相关') + '内容，在' + (userProfile.contentPreference?.favoritePlatform || '推荐平台') + '发布'
              };
              
              return {
                ...context,
                contentSuggestions: finalSuggestions,
                analysisComplete: true
              };
            `
          }
        }
      ]
    });

    // 用户行为分析工作流
    this.workflowEngine.registerWorkflow('user_analysis_workflow', {
      name: '用户行为分析工作流',
      description: '深度用户行为分析和个性化推荐',
      version: '1.0.0',
      steps: [
        {
          name: '用户行为分析',
          type: 'agent',
          config: {
            agentName: 'user_behavior',
            parameters: {
              analysisType: 'profile',
              timeRange: '30d'
            }
          }
        },
        {
          name: '内容推荐',
          type: 'agent',
          config: {
            agentName: 'content_management',
            parameters: {
              operation: 'search'
            }
          }
        },
        {
          name: '生成分析报告',
          type: 'transform',
          config: {
            script: `
              // 生成用户分析报告
              const profile = context.profile || {};
              const searchResults = context.data || {};
              
              const report = {
                userId: context.userIdentifier,
                analysisDate: new Date().toISOString(),
                userProfile: {
                  interests: profile.interests?.primary || [],
                  activityPattern: profile.activityTime?.peakHours || [],
                  engagementLevel: profile.engagementLevel?.level || 'unknown',
                  preferredPlatforms: Object.entries(profile.platformUsage || {})
                    .sort(([,a], [,b]) => b.engagementRate - a.engagementRate)
                    .slice(0, 3)
                    .map(([platform, stats]) => ({
                      platform,
                      engagementRate: Math.round(stats.engagementRate * 100)
                    }))
                },
                contentRecommendations: {
                  availableContent: searchResults.contents?.length || 0,
                  recommendedTopics: profile.interests?.primary?.map(i => i.interest) || [],
                  optimalTiming: profile.activityTime?.peakHours?.slice(0, 2) || []
                },
                insights: [
                  '用户主要兴趣：' + (profile.interests?.primary?.[0]?.interest || '未知'),
                  '最活跃时间：' + (profile.activityTime?.peakHours?.[0]?.hour || '未知') + '点',
                  '参与度等级：' + (profile.engagementLevel?.level || '未知'),
                  '推荐平台：' + (profile.contentPreference?.favoritePlatform || '未知')
                ],
                summary: '用户分析完成，发现' + (profile.interests?.primary?.length || 0) + '个主要兴趣点，建议在' + (profile.contentPreference?.favoritePlatform || '推荐平台') + '发布内容'
              };
              
              return {
                ...context,
                analysisReport: report,
                analysisComplete: true
              };
            `
          }
        }
      ]
    });

    logger.info('内置工作流注册完成', {
      workflowCount: 3,
      type: 'builtin_workflows_registered'
    });
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(workflowId, input, context) {
    return await this.workflowEngine.executeWorkflow(workflowId, input, context);
  }

  /**
   * 获取工作流引擎
   */
  getWorkflowEngine() {
    return this.workflowEngine;
  }

  /**
   * 获取事件总线
   */
  getEventBus() {
    return this.eventBus;
  }

  /**
   * 获取系统状态
   */
  getStatus() {
    return {
      workflows: this.workflowEngine.getMetrics(),
      events: this.eventBus.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const [workflowHealth, eventBusHealth] = await Promise.all([
        this.workflowEngine.healthCheck ? this.workflowEngine.healthCheck() : { status: 'healthy' },
        this.eventBus.healthCheck()
      ]);

      const isHealthy = workflowHealth.status === 'healthy' && eventBusHealth.status === 'healthy';

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? '工作流系统运行正常' : '工作流系统存在问题',
        timestamp: new Date().toISOString(),
        components: {
          workflowEngine: workflowHealth,
          eventBus: eventBusHealth
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `工作流系统健康检查失败: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// 单例模式
let instance = null;

function getInstance(options) {
  if (!instance) {
    instance = new WorkflowSystem(options);
  }
  return instance;
}

function initializeWorkflowSystem(agentManager) {
  if (!instance) {
    instance = new WorkflowSystem({ agentManager });
  }
  return instance;
}

module.exports = {
  WorkflowSystem,
  getInstance,
  initializeWorkflowSystem,
  WorkflowEngine,
  EventBus
};
