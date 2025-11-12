/**
 * Workflow Executor - Executes workflow templates with parallel and sequential steps
 * Handles error recovery, retries, and progress tracking
 */

class WorkflowExecutor {
  constructor(config) {
    this.orchestrator = config.orchestrator;
    this.messageBus = config.messageBus;
    this.stateManager = config.stateManager;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Execute a workflow template
   */
  async execute(workflowId, template) {
    console.log(`[WorkflowExecutor] Executing workflow: ${template.name}`);

    const workflow = await this.stateManager.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Update workflow status
    await this.stateManager.updateWorkflowStatus(workflowId, 'running');

    const results = {
      type: 'workflow',
      workflow: template.name,
      steps: [],
      startTime: Date.now(),
      endTime: null,
      duration: null,
      success: true
    };

    try {
      // Group steps by parallel execution
      const stepGroups = this.groupSteps(template.steps);

      // Execute step groups
      for (const group of stepGroups) {
        const groupResults = await this.executeStepGroup(workflowId, group, workflow);
        results.steps.push(...groupResults);

        // Check for failures
        const failed = groupResults.filter(r => !r.success);
        if (failed.length > 0 && !template.continueOnError) {
          results.success = false;
          break;
        }
      }

      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;

      // Update workflow status
      const finalStatus = results.success ? 'completed' : 'failed';
      await this.stateManager.updateWorkflowStatus(workflowId, finalStatus);

      return results;

    } catch (error) {
      console.error(`[WorkflowExecutor] Workflow execution failed:`, error);

      results.success = false;
      results.error = error.message;
      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;

      await this.stateManager.updateWorkflowStatus(workflowId, 'failed');
      await this.stateManager.addWorkflowError(workflowId, error);

      throw error;
    }
  }

  /**
   * Group steps by parallel execution capability
   */
  groupSteps(steps) {
    const groups = [];
    let currentGroup = [];

    for (const step of steps) {
      if (step.parallel && currentGroup.length > 0) {
        // Add to current parallel group
        currentGroup.push(step);
      } else {
        // Start new group
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [step];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Execute a group of steps (parallel or sequential)
   */
  async executeStepGroup(workflowId, steps, workflow) {
    if (steps.length === 0) {
      return [];
    }

    // Check if all steps can be parallel
    const isParallel = steps.every(s => s.parallel);

    if (isParallel && steps.length > 1) {
      console.log(`[WorkflowExecutor] Executing ${steps.length} steps in parallel`);
      return await this.executeParallelSteps(workflowId, steps, workflow);
    } else {
      console.log(`[WorkflowExecutor] Executing ${steps.length} steps sequentially`);
      return await this.executeSequentialSteps(workflowId, steps, workflow);
    }
  }

  /**
   * Execute steps in parallel
   */
  async executeParallelSteps(workflowId, steps, workflow) {
    const promises = steps.map(step =>
      this.executeStep(workflowId, step, workflow)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      const step = steps[index];
      if (result.status === 'fulfilled') {
        return {
          step: step.agent,
          action: step.action,
          success: true,
          result: result.value,
          timestamp: Date.now()
        };
      } else {
        return {
          step: step.agent,
          action: step.action,
          success: false,
          error: result.reason.message,
          timestamp: Date.now()
        };
      }
    });
  }

  /**
   * Execute steps sequentially
   */
  async executeSequentialSteps(workflowId, steps, workflow) {
    const results = [];
    let previousResult = null;

    for (const step of steps) {
      try {
        const result = await this.executeStep(workflowId, step, workflow, previousResult);

        results.push({
          step: step.agent,
          action: step.action,
          success: true,
          result,
          timestamp: Date.now()
        });

        previousResult = result;

      } catch (error) {
        console.error(`[WorkflowExecutor] Step failed:`, error);

        results.push({
          step: step.agent,
          action: step.action,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });

        // Stop execution on failure (unless continueOnError is set)
        if (!step.continueOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single step with retry logic
   */
  async executeStep(workflowId, step, workflow, previousResult = null) {
    console.log(`[WorkflowExecutor] Executing step: ${step.agent}.${step.action}`);

    let lastError = null;
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        // Update workflow current step
        await this.stateManager.updateWorkflow(workflowId, {
          currentStep: `${step.agent}.${step.action}`
        });

        // Report progress
        await this.orchestrator.updateProgress('workflow-executor', {
          percentage: this.calculateProgress(workflow, step),
          message: `Executing ${step.agent}.${step.action}`
        });

        // Prepare payload
        const payload = {
          workflowId,
          action: step.action,
          task: workflow.state.request,
          context: workflow.state.context,
          previousResult,
          stepConfig: step.config || {}
        };

        // Invoke agent
        const result = await this.orchestrator.invokeAgent(step.agent, payload);

        // Save step result
        await this.stateManager.addStepResult(workflowId, `${step.agent}.${step.action}`, result);

        return result;

      } catch (error) {
        lastError = error;
        retries++;

        if (retries <= this.maxRetries) {
          console.log(`[WorkflowExecutor] Retry ${retries}/${this.maxRetries} for ${step.agent}.${step.action}`);
          await this.delay(this.retryDelay * retries);
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Calculate workflow progress
   */
  calculateProgress(workflow, currentStep) {
    // Simple progress calculation based on step position
    // Can be enhanced with weighted steps
    const totalSteps = workflow.state.strategy.steps?.length || 1;
    const currentIndex = workflow.state.strategy.steps?.findIndex(
      s => s.agent === currentStep.agent && s.action === currentStep.action
    ) || 0;

    return Math.round((currentIndex / totalSteps) * 100);
  }

  /**
   * Handle step failure with recovery options
   */
  async handleStepFailure(workflowId, step, error) {
    console.error(`[WorkflowExecutor] Step ${step.agent}.${step.action} failed:`, error);

    // Check for fallback agent
    if (step.fallback) {
      console.log(`[WorkflowExecutor] Trying fallback agent: ${step.fallback}`);
      const fallbackStep = { ...step, agent: step.fallback };
      return await this.executeStep(workflowId, fallbackStep, workflow);
    }

    // Check for error handler
    if (step.onError) {
      return await this.executeErrorHandler(workflowId, step.onError, error);
    }

    // No recovery option, propagate error
    throw error;
  }

  /**
   * Execute error handler
   */
  async executeErrorHandler(workflowId, handler, error) {
    console.log(`[WorkflowExecutor] Executing error handler: ${handler.type}`);

    switch (handler.type) {
      case 'retry':
        // Already handled in executeStep
        break;

      case 'skip':
        return { skipped: true, reason: error.message };

      case 'notify':
        await this.messageBus.broadcast({
          from: 'workflow-executor',
          type: 'notify',
          payload: {
            workflowId,
            error: error.message,
            handler: handler.type
          }
        });
        break;

      case 'custom':
        if (handler.agent && handler.action) {
          return await this.orchestrator.invokeAgent(handler.agent, {
            workflowId,
            action: handler.action,
            error: error.message
          });
        }
        break;

      default:
        console.warn(`[WorkflowExecutor] Unknown error handler type: ${handler.type}`);
    }
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WorkflowExecutor;