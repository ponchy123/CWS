/**
 * 工作流管理器 - 统一管理工作流引擎和事件总线
 */
const WorkflowEngine = require('./WorkflowEngine');
const EventBus = require('./EventBus');

class WorkflowManager {
  constructor() {
    this.eventBus = new EventBus();
    this.workflowEngine = new WorkflowEngine();
    this.workflowEngine.setEventBus(this.eventBus);
    try {
      this.logger = require('../config/logger').logger || require('../config/logger');
    } catch (error) {
      // 使用默认日志器
      this.logger = {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.log
      };
    }
    
    this.setupDefaultWorkflows();
    this.setupEventHandlers();
  }

  /**
   * 设置默认工作流
   */
  setupDefaultWorkflows() {
    // 内容创作工作流
    this.workflowEngine.registerWorkflow('content-creation', {
      name: '内容创作工作流',
      description: '从灵感收集到内容发布的完整流程',
      steps: [
        {
          name: 'collect-inspiration',
          type: 'agent',
          agent: 'HotTopicsAgent',
          action: 'getHotTopics',
          params: { sources: ['weibo', 'zhihu', 'v2ex'] }
        },
        {
          name: 'analyze-content',
          type: 'agent',
          agent: 'ContentAnalysisAgent',
          action: 'analyzeTopics',
          params: {}
        },
        {
          name: 'create-content',
          type: 'agent',
          agent: 'ContentManagementAgent',
          action: 'createContent',
          params: {}
        },
        {
          name: 'schedule-publish',
          type: 'agent',
          agent: 'PublishSchedulerAgent',
          action: 'schedulePublish',
          params: {}
        }
      ]
    });

    // 用户行为分析工作流
    this.workflowEngine.registerWorkflow('user-behavior-analysis', {
      name: '用户行为分析工作流',
      description: '分析用户行为并生成个性化推荐',
      steps: [
        {
          name: 'collect-behavior',
          type: 'agent',
          agent: 'UserBehaviorAgent',
          action: 'collectBehaviorData',
          params: {}
        },
        {
          name: 'analyze-patterns',
          type: 'agent',
          agent: 'UserBehaviorAgent',
          action: 'analyzePatterns',
          params: {}
        },
        {
          name: 'generate-recommendations',
          type: 'agent',
          agent: 'ContentAnalysisAgent',
          action: 'generateRecommendations',
          params: {}
        }
      ]
    });

    // 内容发布工作流
    this.workflowEngine.registerWorkflow('content-publishing', {
      name: '内容发布工作流',
      description: '多平台内容发布和监控',
      steps: [
        {
          name: 'prepare-content',
          type: 'agent',
          agent: 'ContentManagementAgent',
          action: 'prepareForPublish',
          params: {}
        },
        {
          name: 'publish-parallel',
          type: 'parallel',
          steps: [
            {
              name: 'publish-weibo',
              type: 'agent',
              agent: 'PublishSchedulerAgent',
              action: 'publishToWeibo',
              params: {}
            },
            {
              name: 'publish-zhihu',
              type: 'agent',
              agent: 'PublishSchedulerAgent',
              action: 'publishToZhihu',
              params: {}
            }
          ]
        },
        {
          name: 'monitor-performance',
          type: 'agent',
          agent: 'ContentAnalysisAgent',
          action: 'monitorPerformance',
          params: {}
        }
      ]
    });

    this.logger.info('默认工作流已注册');
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // Agent 请求处理
    this.eventBus.subscribe('agent.request', async (data) => {
      try {
        const { agentManager } = require('../agents/AgentManager');
        
        const agent = agentManager.getAgent(data.agent);
        if (!agent) {
          throw new Error(`Agent 不存在: ${data.agent}`);
        }

        const result = await agent[data.action](data.params);
        
        this.eventBus.publish('agent.response', {
          instanceId: data.instanceId,
          step: data.step,
          result,
          error: null
        });
        
      } catch (error) {
        this.eventBus.publish('agent.response', {
          instanceId: data.instanceId,
          step: data.step,
          result: null,
          error: error.message
        });
      }
    }, { agentId: 'WorkflowManager' });

    // 工作流完成处理
    this.eventBus.subscribe('workflow.completed', (data) => {
      this.logger.info(`工作流完成通知: ${data.workflowId} (${data.instanceId})`);
      
      // 可以在这里添加完成后的处理逻辑
      // 比如发送通知、更新数据库等
    }, { agentId: 'WorkflowManager' });

    // 错误处理
    this.eventBus.subscribe('error', (data) => {
      this.logger.error('工作流错误:', data);
    }, { agentId: 'WorkflowManager' });
  }

  /**
   * 启动内容创作工作流
   */
  async startContentCreationWorkflow(params = {}) {
    return await this.workflowEngine.startWorkflow('content-creation', params);
  }

  /**
   * 启动用户行为分析工作流
   */
  async startUserBehaviorAnalysisWorkflow(userId) {
    return await this.workflowEngine.startWorkflow('user-behavior-analysis', { userId });
  }

  /**
   * 启动内容发布工作流
   */
  async startContentPublishingWorkflow(contentId, platforms = []) {
    return await this.workflowEngine.startWorkflow('content-publishing', { 
      contentId, 
      platforms 
    });
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(instanceId) {
    return this.workflowEngine.getInstanceStatus(instanceId);
  }

  /**
   * 停止工作流
   */
  stopWorkflow(instanceId) {
    return this.workflowEngine.stopWorkflow(instanceId);
  }

  /**
   * 获取所有工作流
   */
  getWorkflows() {
    return this.workflowEngine.getWorkflows();
  }

  /**
   * 获取运行中的实例
   */
  getRunningInstances() {
    return this.workflowEngine.getRunningInstances();
  }

  /**
   * 获取事件统计
   */
  getEventStats() {
    return this.eventBus.getEventStats();
  }

  /**
   * 获取事件历史
   */
  getEventHistory(filter = {}) {
    return this.eventBus.getEventHistory(filter);
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      eventBus: this.eventBus.healthCheck(),
      workflows: {
        registered: this.workflowEngine.getWorkflows().length,
        running: this.workflowEngine.getRunningInstances().length
      }
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.eventBus.cleanupHistory();
    this.logger.info('工作流管理器资源清理完成');
  }
}

module.exports = WorkflowManager;