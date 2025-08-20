/**
 * Agent 系统入口文件
 * 统一导出所有 Agent 和管理器
 */

const { agentManager } = require('./AgentManager');
const ContentAnalysisAgent = require('./ContentAnalysisAgent');
const ContentManagementAgent = require('./ContentManagementAgentV3');
const HotTopicsAgent = require('./HotTopicsAgent');
const PublishSchedulerAgent = require('./PublishSchedulerAgent');
const UserBehaviorAgent = require('./UserBehaviorAgent');
const AnalyticsAgent = require('./AnalyticsAgentV2');
const MarketingAgent = require('./MarketingAgentV2');
const RecommendationAgent = require('./RecommendationAgentV2');
const UserManagementAgent = require('./UserManagementAgent');
const PaymentProcessingAgent = require('./PaymentProcessingAgent');
const { logger } = require('../config/logger');

// 初始化所有 Agent
function initializeAgents() {
  logger.info('开始初始化 Agent 系统', {
    type: 'agent_system_init'
  });

  try {
    // 创建 Agent 实例
    const contentAnalysisAgent = new ContentAnalysisAgent();
    const contentManagementAgent = new ContentManagementAgent();
    const hotTopicsAgent = new HotTopicsAgent();
    const publishSchedulerAgent = new PublishSchedulerAgent();
    const userBehaviorAgent = new UserBehaviorAgent();
    const analyticsAgent = new AnalyticsAgent();
    const marketingAgent = new MarketingAgent();
    const recommendationAgent = new RecommendationAgent();
    const userManagementAgent = new UserManagementAgent();
    const paymentProcessingAgent = new PaymentProcessingAgent();

    // 注册到管理器
    agentManager.register(contentAnalysisAgent);
    agentManager.register(contentManagementAgent);
    agentManager.register(hotTopicsAgent);
    agentManager.register(publishSchedulerAgent);
    agentManager.register(userBehaviorAgent);
    agentManager.register(analyticsAgent);
    agentManager.register(marketingAgent);
    agentManager.register(recommendationAgent);
    agentManager.register(userManagementAgent);
    agentManager.register(paymentProcessingAgent);

    logger.info('Agent 系统初始化完成', {
      totalAgents: 10,
      agents: ['content_analysis', 'content_management', 'hot_topics', 'publish_scheduler', 'user_behavior', 'analytics', 'marketing', 'recommendation', 'user_management', 'payment_processing'],
      type: 'agent_system_ready'
    });

    return {
      contentAnalysisAgent,
      contentManagementAgent,
      hotTopicsAgent,
      publishSchedulerAgent,
      userBehaviorAgent,
      analyticsAgent,
      marketingAgent,
      recommendationAgent,
      userManagementAgent,
      paymentProcessingAgent,
      agentManager
    };

  } catch (error) {
    logger.error('Agent 系统初始化失败', {
      error: error.message,
      type: 'agent_system_error'
    }, error);
    
    throw error;
  }
}

// 创建工作流
function createWorkflows() {
  return {
    // 内容创作工作流
    contentCreationWorkflow: {
      name: 'content_creation',
      steps: [
        {
          name: 'analyze_hot_topics',
          agentName: 'hot_topics',
          input: { platforms: ['weibo', 'zhihu', 'juejin'], limit: 10 },
          usesPreviousResult: false
        },
        {
          name: 'analyze_content',
          agentName: 'content_analysis',
          usesPreviousResult: true,
          resultProcessor: (hotTopicsResult) => ({
            content: hotTopicsResult.analysis.trendingTopics[0]?.title || '默认内容',
            analysisTypes: ['sentiment', 'keywords', 'seo']
          })
        },
        {
          name: 'schedule_publish',
          agentName: 'publish_scheduler',
          usesPreviousResult: true,
          resultProcessor: (analysisResult) => ({
            content: analysisResult.content,
            platforms: ['weibo', 'zhihu'],
            scheduleType: 'optimal'
          })
        }
      ]
    },

    // 用户个性化推荐工作流
    personalizationWorkflow: {
      name: 'personalization',
      steps: [
        {
          name: 'analyze_user_behavior',
          agentName: 'user_behavior',
          usesPreviousResult: false
        },
        {
          name: 'get_hot_topics',
          agentName: 'hot_topics',
          input: { platforms: ['weibo', 'zhihu'], limit: 20 },
          usesPreviousResult: false
        },
        {
          name: 'generate_recommendations',
          agentName: 'recommendation',
          usesPreviousResult: true,
          resultProcessor: (results) => ({
            userId: results[0].userIdentifier,
            analysisType: 'recommendation',
            candidateContent: results[1].analysis.mergedTopics.topics.slice(0, 10)
          })
        }
      ]
    },

    // 数据分析工作流
    analyticsWorkflow: {
      name: 'analytics',
      steps: [
        {
          name: 'collect_user_data',
          agentName: 'user_behavior',
          usesPreviousResult: false
        },
        {
          name: 'analyze_content_performance',
          agentName: 'content_analysis',
          usesPreviousResult: true
        },
        {
          name: 'generate_analytics_report',
          agentName: 'analytics',
          usesPreviousResult: true,
          resultProcessor: (results) => ({
            userMetrics: results[0],
            contentMetrics: results[1],
            reportType: 'comprehensive'
          })
        }
      ]
    },

    // 营销自动化工作流
    marketingWorkflow: {
      name: 'marketing',
      steps: [
        {
          name: 'analyze_target_audience',
          agentName: 'user_behavior',
          usesPreviousResult: false
        },
        {
          name: 'create_marketing_content',
          agentName: 'content_management',
          usesPreviousResult: true
        },
        {
          name: 'execute_marketing_campaign',
          agentName: 'marketing',
          usesPreviousResult: true,
          resultProcessor: (results) => ({
            audience: results[0],
            content: results[1],
            campaignType: 'automated'
          })
        }
      ]
    },

    // 智能发布优化工作流
    smartPublishWorkflow: {
      name: 'smart_publish',
      steps: [
        {
          name: 'analyze_user_patterns',
          agentName: 'user_behavior',
          usesPreviousResult: false
        },
        {
          name: 'analyze_content_quality',
          agentName: 'content_analysis',
          usesPreviousResult: true,
          resultProcessor: (userResult) => ({
            content: '待发布的内容',
            analysisTypes: ['sentiment', 'readability', 'seo']
          })
        },
        {
          name: 'optimize_schedule',
          agentName: 'publish_scheduler',
          usesPreviousResult: true,
          resultProcessor: (results) => ({
            content: results[1].content,
            platforms: ['weibo', 'wechat', 'zhihu'],
            scheduleType: 'optimal',
            priority: results[1].report.overallScore > 80 ? 'high' : 'normal'
          })
        }
      ]
    }
  };
}

module.exports = {
  initializeAgents,
  createWorkflows,
  agentManager,
  ContentAnalysisAgent,
  HotTopicsAgent,
  PublishSchedulerAgent,
  UserBehaviorAgent
};