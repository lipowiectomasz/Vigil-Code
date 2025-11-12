/**
 * Master Orchestrator Agent
 *
 * Meta-agent that coordinates all 10 specialized vg-* agents.
 * Handles task classification, agent routing, workflow execution, and result synthesis.
 *
 * @version 2.0.0
 * @type Meta-Agent
 */

const MasterOrchestrator = require('./orchestrator');
const TaskClassifier = require('../../core/task-classifier');

class MasterOrchestratorAgent {
  constructor(config = {}) {
    this.config = config;
    this.orchestrator = null;
    this.classifier = new TaskClassifier();
    this.initialized = false;
  }

  /**
   * Initialize the Master Orchestrator
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('[MasterOrchestratorAgent] Initializing...');

    // Create orchestrator instance
    this.orchestrator = new MasterOrchestrator(this.config);
    await this.orchestrator.initialize();

    this.initialized = true;
    console.log('[MasterOrchestratorAgent] Initialization complete');
  }

  /**
   * Execute a task using the Master Orchestrator
   *
   * @param {Object} params - Task parameters
   * @param {string} params.task - User's request/task description
   * @param {string} [params.action] - Optional specific action (classify|execute|workflow)
   * @param {Object} [params.options] - Additional options
   * @returns {Promise<Object>} Execution result
   */
  async execute(params) {
    await this.initialize();

    const { task, action = 'auto', parallel = true } = params;

    console.log(`\n🎯 Master Orchestrator: ${task}\n`);

    try {
      // Step 1: Classify the task
      const classification = await this.classifier.classify(task);

      this._reportClassification(classification);

      // Step 2: Execute based on strategy
      let result;

      if (action === 'classify') {
        // Just return classification
        result = classification;
      } else if (classification.workflow) {
        // Execute workflow template
        result = await this.executeWorkflowWithProgress(
          classification.workflow,
          { task, classification },
          parallel
        );
      } else if (classification.strategy === 'parallel' && parallel) {
        // Parallel execution with Task tool (colored threads)
        result = await this.executeParallelWithProgress(
          classification.agents,
          { task, classification }
        );
      } else if (classification.strategy === 'sequential') {
        // Sequential execution
        result = await this.executeSequentialWithProgress(
          classification.agents,
          { task, classification }
        );
      } else {
        // Single agent execution
        result = await this.executeSingleWithProgress(
          classification.agents[0],
          { task, classification }
        );
      }

      // Step 3: Report results
      this._reportResults(result);

      return {
        success: true,
        classification,
        result,
        execution_time: result.execution_time || 0
      };

    } catch (error) {
      console.error(`\n❌ Execution failed: ${error.message}\n`);

      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Execute workflow with progress reporting (like pr-review-toolkit)
   * @private
   */
  async executeWorkflowWithProgress(workflowName, context, parallel) {
    console.log(`\n🎭 Executing workflow: ${workflowName}\n`);

    // Get workflow steps
    const workflow = this._getWorkflow(workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    const startTime = Date.now();
    const results = [];

    if (parallel && workflow.parallel_capable) {
      // Execute steps in parallel using Task tool
      console.log(`⚡ Parallel execution (${workflow.steps.length} agents)\n`);

      // This will create colored threads in Claude Code UI
      const promises = workflow.steps.map(step =>
        this._invokeAgentViaTask(step.agent, step.action, context)
      );

      const parallelResults = await Promise.allSettled(promises);

      parallelResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          results.push({ agent: workflow.steps[i].agent, result: result.value, status: 'success' });
        } else {
          results.push({ agent: workflow.steps[i].agent, error: result.reason, status: 'failed' });
        }
      });
    } else {
      // Sequential execution
      console.log(`📝 Sequential execution (${workflow.steps.length} steps)\n`);

      for (const step of workflow.steps) {
        console.log(`   ${step.icon || '▶️'} ${step.agent}: ${step.action}`);

        try {
          const stepResult = await this._invokeAgentDirect(step.agent, step.action, context);
          results.push({ agent: step.agent, result: stepResult, status: 'success' });
          console.log(`   ✅ Completed\n`);
        } catch (error) {
          results.push({ agent: step.agent, error: error.message, status: 'failed' });
          console.log(`   ❌ Failed: ${error.message}\n`);

          if (!step.continue_on_error) {
            break;
          }
        }
      }
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      workflow: workflowName,
      results,
      execution_time: executionTime,
      summary: this._synthesizeWorkflowResults(results)
    };
  }

  /**
   * Execute parallel agents with progress (colored threads)
   * @private
   */
  async executeParallelWithProgress(agents, context) {
    console.log(`\n⚡ Parallel Execution (${agents.length} agents)\n`);

    const startTime = Date.now();

    // Launch all agents in parallel using Task tool
    // This creates separate colored threads in Claude Code
    const promises = agents.map(agentName =>
      this._invokeAgentViaTask(agentName, 'execute', context)
    );

    const results = await Promise.allSettled(promises);

    const processed = results.map((result, i) => ({
      agent: agents[i],
      status: result.status === 'fulfilled' ? 'success' : 'failed',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      agents: processed,
      execution_time: executionTime,
      summary: this._synthesizeParallelResults(processed)
    };
  }

  /**
   * Execute sequential agents with progress
   * @private
   */
  async executeSequentialWithProgress(agents, context) {
    console.log(`\n📝 Sequential Execution (${agents.length} agents)\n`);

    const startTime = Date.now();
    const results = [];

    for (const agentName of agents) {
      console.log(`   ▶️  ${agentName}`);

      try {
        const result = await this._invokeAgentDirect(agentName, 'execute', context);
        results.push({ agent: agentName, result, status: 'success' });
        console.log(`   ✅ Completed\n`);
      } catch (error) {
        results.push({ agent: agentName, error: error.message, status: 'failed' });
        console.log(`   ❌ Failed: ${error.message}\n`);
        break; // Stop on first failure
      }
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      agents: results,
      execution_time: executionTime,
      summary: this._synthesizeSequentialResults(results)
    };
  }

  /**
   * Execute single agent with progress
   * @private
   */
  async executeSingleWithProgress(agentName, context) {
    console.log(`\n🤖 Single Agent: ${agentName}\n`);

    const startTime = Date.now();

    try {
      const result = await this._invokeAgentDirect(agentName, 'execute', context);
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

      return {
        agent: agentName,
        result,
        status: 'success',
        execution_time: executionTime
      };
    } catch (error) {
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

      return {
        agent: agentName,
        error: error.message,
        status: 'failed',
        execution_time: executionTime
      };
    }
  }

  /**
   * Invoke agent via Task tool (creates colored thread in Claude Code)
   * @private
   */
  async _invokeAgentViaTask(agentName, action, context) {
    // IMPORTANT: This would need to be called from Claude Code context
    // For now, we'll simulate the behavior
    // In actual Claude Code, this would use the Task tool

    console.log(`      [Thread] ${agentName} started (${context.task})`);

    // Simulate agent work
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      agent: agentName,
      action,
      result: 'Task completed',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Invoke agent directly (internal call, no Task tool)
   * @private
   */
  async _invokeAgentDirect(agentName, action, context) {
    // Load and execute agent directly
    const agentPath = `../${agentName}/agent.js`;

    try {
      const AgentClass = require(agentPath);
      const agent = new AgentClass();

      return await agent.execute({
        task: context.task,
        action,
        context
      });
    } catch (error) {
      throw new Error(`Agent ${agentName} failed: ${error.message}`);
    }
  }

  /**
   * Get workflow definition
   * @private
   */
  _getWorkflow(name) {
    // Import centralized workflow definitions
    const workflows = require('../../core/workflows');
    return workflows[name];
  }

  /**
   * Synthesize workflow results
   * @private
   */
  _synthesizeWorkflowResults(results) {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return {
      total: results.length,
      successful,
      failed,
      success_rate: ((successful / results.length) * 100).toFixed(0) + '%'
    };
  }

  /**
   * Synthesize parallel results
   * @private
   */
  _synthesizeParallelResults(results) {
    return this._synthesizeWorkflowResults(results);
  }

  /**
   * Synthesize sequential results
   * @private
   */
  _synthesizeSequentialResults(results) {
    return this._synthesizeWorkflowResults(results);
  }

  /**
   * Classify a task without executing
   *
   * @param {string} task - Task description
   * @returns {Promise<Object>} Classification result
   */
  async classify(task) {
    const classification = await this.classifier.classify(task);
    this._reportClassification(classification);
    return classification;
  }

  /**
   * Execute a specific workflow template
   *
   * @param {string} workflowName - Workflow template name
   * @param {Object} params - Workflow parameters
   * @returns {Promise<Object>} Workflow result
   */
  async executeWorkflow(workflowName, params) {
    await this.initialize();
    return await this.orchestrator.executeWorkflow(workflowName, params);
  }

  /**
   * Get status of all agents
   *
   * @returns {Promise<Object>} Agent status information
   */
  async getAgentStatus() {
    await this.initialize();

    const agents = Array.from(this.orchestrator.agents.keys());
    const status = {};

    for (const agentName of agents) {
      const agent = this.orchestrator.agents.get(agentName);
      status[agentName] = {
        initialized: agent.initialized || false,
        available: true
      };
    }

    return status;
  }

  /**
   * List available workflow templates
   *
   * @returns {Array<string>} Workflow template names
   */
  getWorkflowTemplates() {
    return [
      'PATTERN_ADDITION',
      'SECURITY_AUDIT',
      'PII_ENTITY_ADDITION',
      'TEST_EXECUTION',
      'SERVICE_DEPLOYMENT'
    ];
  }

  /**
   * Report classification results
   * @private
   */
  _reportClassification(classification) {
    console.log('════════════════════════════════════════════════════════');
    console.log('📊 Classification:');
    console.log(`   • Category: ${classification.category}`);
    console.log(`   • Confidence: ${classification.confidence}%`);
    console.log(`   • Agents: ${classification.agents.join(', ')}`);
    console.log(`   • Strategy: ${classification.strategy}`);
    if (classification.workflow) {
      console.log(`   • Workflow: ${classification.workflow}`);
    }
    console.log('');
  }

  /**
   * Report execution results
   * @private
   */
  _reportResults(result) {
    console.log('════════════════════════════════════════════════════════');
    console.log(`✨ Task Completed in ${result.execution_time || 0}s\n`);

    if (result.summary) {
      console.log('📋 Summary:');
      console.log(`   ${result.summary}\n`);
    }

    if (result.agents_used) {
      console.log(`🤝 Coordinated ${result.agents_used.length} agents:`);
      result.agents_used.forEach(agent => {
        console.log(`   • ${agent}`);
      });
      console.log('');
    }

    if (result.recommendations) {
      console.log('💡 Next Steps:');
      result.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log('');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.orchestrator) {
      await this.orchestrator.cleanup();
    }
    this.initialized = false;
  }
}

// Export the agent class
module.exports = MasterOrchestratorAgent;

// Example usage (when run directly)
if (require.main === module) {
  const agent = new MasterOrchestratorAgent();

  async function demo() {
    console.log('=== Master Orchestrator Agent Demo ===\n');

    // Example 1: Simple task
    await agent.execute({
      task: 'Run all tests'
    });

    // Example 2: Complex workflow
    await agent.execute({
      task: 'Add SQL injection detection pattern'
    });

    // Example 3: Just classify
    const classification = await agent.classify('Run security audit');
    console.log('Classification result:', JSON.stringify(classification, null, 2));

    // Example 4: Get agent status
    const status = await agent.getAgentStatus();
    console.log('\nAgent Status:', JSON.stringify(status, null, 2));

    // Cleanup
    await agent.cleanup();
  }

  demo().catch(console.error);
}
