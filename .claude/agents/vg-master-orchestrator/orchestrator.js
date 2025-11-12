/**
 * Master Orchestrator - Autonomous agent coordination system
 * Analyzes tasks, routes to agents, manages workflows, and synthesizes results
 */

const TaskClassifier = require('../../core/task-classifier');
const MessageBus = require('../../core/message-bus');
const StateManager = require('../../core/state-manager');
const WorkflowExecutor = require('./workflow-executor');
const ProgressReporter = require('../../core/progress-reporter');

class MasterOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.classifier = new TaskClassifier();
    this.messageBus = new MessageBus();
    this.stateManager = new StateManager(config.state);
    this.workflowExecutor = null;
    this.progressReporter = new ProgressReporter();
    this.agents = new Map();
    this.activeWorkflows = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the orchestrator
   */
  async initialize() {
    console.log('[MasterOrchestrator] Initializing...');

    // Initialize core components
    await this.stateManager.initialize();

    // Create workflow executor
    this.workflowExecutor = new WorkflowExecutor({
      orchestrator: this,
      messageBus: this.messageBus,
      stateManager: this.stateManager
    });

    // Set up message bus listeners
    this.setupMessageBusListeners();

    // Load and initialize agents
    await this.loadAgents();

    this.initialized = true;
    console.log('[MasterOrchestrator] Initialization complete');
  }

  /**
   * Main entry point - handle user task autonomously
   */
  async handleTask(userRequest, context = {}) {
    // Start progress reporting
    this.progressReporter.startTask(userRequest);

    try {
      // 1. Classify the task
      const classification = await this.classifier.classify(userRequest);
      this.progressReporter.reportClassification(classification);

      // 2. Analyze complexity
      const complexity = this.classifier.analyzeComplexity(userRequest);

      // 3. Determine execution strategy
      const strategy = this.classifier.determineStrategy(classification);
      this.progressReporter.reportStrategy(strategy.type);

      // 4. Create workflow state
      const workflowId = this.generateWorkflowId();
      const workflow = await this.stateManager.createWorkflow(workflowId, {
        request: userRequest,
        classification,
        complexity,
        strategy,
        context
      });

      this.activeWorkflows.set(workflowId, workflow);

      // 5. Execute based on strategy
      let result;
      switch (strategy.type) {
        case 'workflow':
          result = await this.executeWorkflow(workflowId, strategy);
          break;
        case 'parallel':
          result = await this.executeParallel(workflowId, strategy);
          break;
        case 'sequential':
          result = await this.executeSequential(workflowId, strategy);
          break;
        case 'single':
          result = await this.executeSingle(workflowId, strategy);
          break;
        default:
          throw new Error(`Unknown strategy type: ${strategy.type}`);
      }

      // 6. Complete workflow
      await this.stateManager.completeWorkflow(workflowId, result);
      this.activeWorkflows.delete(workflowId);

      // 7. Synthesize and return results
      const synthesized = this.synthesizeResults(result, classification, complexity);

      // Report completion
      this.progressReporter.completeTask(synthesized);

      return synthesized;

    } catch (error) {
      // Report failure
      this.progressReporter.failTask(error);
      throw error;
    }
  }

  /**
   * Execute a predefined workflow
   */
  async executeWorkflow(workflowId, strategy) {
    console.log(`[MasterOrchestrator] Executing workflow: ${strategy.workflow}`);

    const template = this.classifier.getWorkflowTemplate(strategy.workflow);
    if (!template) {
      throw new Error(`Workflow template not found: ${strategy.workflow}`);
    }

    return await this.workflowExecutor.execute(workflowId, template);
  }

  /**
   * Execute agents in parallel
   */
  async executeParallel(workflowId, strategy) {
    // Report parallel execution
    this.progressReporter.reportParallelExecution(strategy.agents);

    const promises = strategy.agents.map(agentName =>
      this.invokeAgent(agentName, {
        workflowId,
        task: this.activeWorkflows.get(workflowId).state.request
      })
    );

    const results = await Promise.allSettled(promises);

    // Process results
    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

    if (failed.length > 0) {
      console.warn(`[MasterOrchestrator] ${failed.length} agents failed:`, failed);
    }

    return {
      type: 'parallel',
      successful,
      failed,
      total: results.length
    };
  }

  /**
   * Execute agents sequentially
   */
  async executeSequential(workflowId, strategy) {
    console.log(`[MasterOrchestrator] Executing ${strategy.agents.length} agents sequentially`);

    const results = [];
    let previousResult = null;

    for (const agentName of strategy.agents) {
      try {
        const result = await this.invokeAgent(agentName, {
          workflowId,
          task: this.activeWorkflows.get(workflowId).state.request,
          previousResult
        });
        results.push({ agent: agentName, result });
        previousResult = result;
      } catch (error) {
        console.error(`[MasterOrchestrator] Agent ${agentName} failed:`, error);
        results.push({ agent: agentName, error: error.message });
        break; // Stop on first failure in sequential execution
      }
    }

    return {
      type: 'sequential',
      results
    };
  }

  /**
   * Execute single agent
   */
  async executeSingle(workflowId, strategy) {
    if (strategy.agents.length === 0) {
      throw new Error('No agents available for task');
    }

    const agentName = strategy.agents[0];
    console.log(`[MasterOrchestrator] Executing single agent: ${agentName}`);

    return await this.invokeAgent(agentName, {
      workflowId,
      task: this.activeWorkflows.get(workflowId).state.request
    });
  }

  /**
   * Invoke an agent
   */
  async invokeAgent(agentName, payload) {
    if (!this.agents.has(agentName)) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Report agent start
    this.progressReporter.startAgent(agentName);
    const startTime = Date.now();

    try {
      const message = {
        from: 'orchestrator',
        to: agentName,
        type: 'invoke',
        payload,
        timestamp: Date.now(),
        messageId: this.generateMessageId()
      };

      const result = await this.messageBus.sendAndWait(message);
      const duration = Date.now() - startTime;

      // Report agent completion
      this.messageBus.emitCompletion(agentName, duration, { success: true, result });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Report agent failure
      this.messageBus.emitCompletion(agentName, duration, { success: false, error: error.message });

      throw error;
    }
  }

  /**
   * Query agent capabilities
   */
  async queryAgentCapabilities() {
    return await this.messageBus.queryCapabilities();
  }

  /**
   * Synthesize results for user
   */
  synthesizeResults(result, classification, complexity) {
    const synthesis = {
      success: true,
      summary: '',
      details: result,
      metadata: {
        category: classification.category,
        confidence: classification.confidence,
        complexity: complexity.estimatedDuration,
        agents: classification.agents
      }
    };

    // Generate summary based on result type
    if (typeof result === 'object') {
      if (result.type === 'parallel') {
        synthesis.summary = `Completed ${result.successful.length} of ${result.total} agent tasks`;
      } else if (result.type === 'sequential') {
        synthesis.summary = `Executed ${result.results.length} agents sequentially`;
      } else if (result.type === 'workflow') {
        synthesis.summary = `Completed ${result.workflow} workflow with ${result.steps.length} steps`;
      } else {
        synthesis.summary = 'Task completed successfully';
      }
    } else {
      synthesis.summary = 'Task completed successfully';
    }

    return synthesis;
  }

  /**
   * Update workflow progress
   */
  async updateProgress(agentName, progress) {
    console.log(`[MasterOrchestrator] Progress from ${agentName}: ${progress.percentage}% - ${progress.message}`);

    // Emit progress event
    this.messageBus.emit('agent:progress', {
      agent: agentName,
      progress
    });
  }

  /**
   * Load and initialize agents
   */
  async loadAgents() {
    const agentList = [
      'vg-workflow-business-logic',
      'vg-workflow-infrastructure',
      'vg-test-automation',
      'vg-backend-api',
      'vg-frontend-ui',
      'vg-data-analytics',
      'vg-pii-detection',
      'vg-infrastructure-deployment',
      'vg-security-compliance',
      'vg-documentation'
    ];

    console.log(`[MasterOrchestrator] Loading ${agentList.length} agents...`);

    for (const agentName of agentList) {
      try {
        const AgentClass = require(`../${agentName}/agent.js`);
        const agent = new AgentClass();

        await agent.initialize({
          messageBus: this.messageBus,
          orchestrator: this,
          stateManager: this.stateManager
        });

        this.agents.set(agentName, agent);
        console.log(`[MasterOrchestrator] ✓ Loaded agent: ${agentName}`);
      } catch (error) {
        console.warn(`[MasterOrchestrator] ✗ Failed to load agent ${agentName}:`, error.message);
      }
    }

    console.log(`[MasterOrchestrator] Successfully loaded ${this.agents.size} of ${agentList.length} agents`);

    if (this.agents.size === agentList.length) {
      console.log(`[MasterOrchestrator] ✅ All agents loaded successfully!`);
    } else {
      console.log(`[MasterOrchestrator] ⚠️  Some agents failed to load`);
    }
  }

  /**
   * Set up message bus event listeners
   */
  setupMessageBusListeners() {
    this.messageBus.on('agent:registered', (agentName) => {
      console.log(`[MasterOrchestrator] Agent registered: ${agentName}`);
    });

    this.messageBus.on('agent:unregistered', (agentName) => {
      console.log(`[MasterOrchestrator] Agent unregistered: ${agentName}`);
    });

    this.messageBus.on('message:error', ({ message, error }) => {
      console.error(`[MasterOrchestrator] Message error:`, error);
    });

    // Progress reporting events
    this.messageBus.on('agent:progress', ({ agent, progress }) => {
      this.progressReporter.reportProgress(agent, progress);
    });

    this.messageBus.on('agent:action', ({ agent, action }) => {
      this.progressReporter.reportAction(agent, action);
    });

    this.messageBus.on('agent:completion', ({ agent, duration, result }) => {
      this.progressReporter.completeAgent(agent, duration, result);
    });

    this.messageBus.on('agent:inter-call', ({ from, to, action }) => {
      this.progressReporter.reportInterAgentCall(from, to, action);
    });
  }

  /**
   * Handle emergency stop
   */
  async emergencyStop(workflowId) {
    console.warn(`[MasterOrchestrator] Emergency stop requested for workflow: ${workflowId}`);

    if (this.activeWorkflows.has(workflowId)) {
      await this.stateManager.updateWorkflowStatus(workflowId, 'cancelled');
      this.activeWorkflows.delete(workflowId);
    }

    // Notify all agents to stop work on this workflow
    await this.messageBus.broadcast({
      from: 'orchestrator',
      type: 'notify',
      payload: {
        action: 'emergency_stop',
        workflowId
      }
    });
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      agents: Array.from(this.agents.keys()),
      activeWorkflows: this.activeWorkflows.size,
      messageBus: {
        agents: this.messageBus.getRegisteredAgents().length,
        messageCount: this.messageBus.messageLog.length
      }
    };
  }

  /**
   * Generate unique workflow ID
   */
  generateWorkflowId() {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    console.log('[MasterOrchestrator] Shutting down...');

    // Complete all active workflows
    for (const [workflowId, workflow] of this.activeWorkflows) {
      await this.emergencyStop(workflowId);
    }

    // Clear state
    this.agents.clear();
    this.activeWorkflows.clear();

    console.log('[MasterOrchestrator] Shutdown complete');
  }
}

module.exports = MasterOrchestrator;