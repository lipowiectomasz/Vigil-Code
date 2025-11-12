#!/usr/bin/env node

/**
 * Master Orchestrator Demo Script
 * Demonstrates autonomous agent coordination with real examples
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Mock the orchestrator for demonstration
class DemoOrchestrator {
  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
    this.messageBus = new MockMessageBus();
    this.initializeAgents();
    this.initializeWorkflows();
  }

  initializeAgents() {
    // Simulate loaded agents
    this.agents.set('test-automation', { status: 'ready', capabilities: ['create_test', 'run_test', 'verify_test'] });
    this.agents.set('workflow-business-logic', { status: 'ready', capabilities: ['add_pattern', 'suggest_pattern'] });
    this.agents.set('pii-detection', { status: 'ready', capabilities: ['detect_pii', 'analyze_entity'] });
  }

  initializeWorkflows() {
    this.workflows.set('PATTERN_ADDITION', {
      name: 'Pattern Addition Workflow',
      steps: [
        { agent: 'test-automation', action: 'create_test' },
        { agent: 'test-automation', action: 'run_test' },
        { agent: 'workflow-business-logic', action: 'add_pattern' },
        { agent: 'test-automation', action: 'verify_test' }
      ]
    });
  }

  async simulateTask(task, scenario) {
    console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Scenario: ${scenario}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.blue}[USER]${colors.reset} ${task}\n`);

    // Simulate classification
    await this.delay(500);
    const classification = this.classifyTask(task);
    console.log(`${colors.magenta}[CLASSIFY]${colors.reset} Category: ${classification.category}`);
    console.log(`${colors.magenta}[CONFIDENCE]${colors.reset} ${Math.round(classification.confidence * 100)}%`);
    console.log(`${colors.magenta}[KEYWORDS]${colors.reset} ${classification.keywords.join(', ')}\n`);

    // Simulate strategy determination
    await this.delay(300);
    const strategy = this.determineStrategy(classification);
    console.log(`${colors.yellow}[STRATEGY]${colors.reset} ${strategy.type}`);
    if (strategy.workflow) {
      console.log(`${colors.yellow}[WORKFLOW]${colors.reset} ${strategy.workflow}`);
    }
    console.log(`${colors.yellow}[AGENTS]${colors.reset} ${strategy.agents.join(', ')}\n`);

    // Simulate execution
    await this.simulateExecution(strategy);

    console.log(`\n${colors.green}[COMPLETE]${colors.reset} Task completed successfully`);
  }

  classifyTask(task) {
    const taskLower = task.toLowerCase();

    if (taskLower.includes('pattern') || taskLower.includes('detection')) {
      return {
        category: 'detection',
        confidence: 0.9,
        keywords: ['pattern', 'detection', 'sql injection'],
        agents: ['workflow-business-logic', 'test-automation']
      };
    } else if (taskLower.includes('pii') || taskLower.includes('privacy')) {
      return {
        category: 'pii',
        confidence: 0.85,
        keywords: ['pii', 'credit card', 'personal'],
        agents: ['pii-detection']
      };
    } else if (taskLower.includes('test')) {
      return {
        category: 'testing',
        confidence: 0.8,
        keywords: ['test', 'verify'],
        agents: ['test-automation']
      };
    }

    return {
      category: 'general',
      confidence: 0.5,
      keywords: [],
      agents: []
    };
  }

  determineStrategy(classification) {
    if (classification.category === 'detection') {
      return {
        type: 'workflow',
        workflow: 'PATTERN_ADDITION',
        agents: classification.agents
      };
    } else if (classification.agents.length > 1) {
      return {
        type: 'parallel',
        agents: classification.agents
      };
    } else {
      return {
        type: 'single',
        agents: classification.agents
      };
    }
  }

  async simulateExecution(strategy) {
    console.log(`${colors.bright}Execution Log:${colors.reset}`);
    console.log('─'.repeat(60));

    if (strategy.type === 'workflow') {
      await this.simulateWorkflow(strategy.workflow);
    } else if (strategy.type === 'parallel') {
      await this.simulateParallel(strategy.agents);
    } else {
      await this.simulateSingle(strategy.agents[0]);
    }
  }

  async simulateWorkflow(workflowName) {
    const workflow = this.workflows.get(workflowName);
    console.log(`\n${colors.cyan}[WORKFLOW]${colors.reset} Executing: ${workflow.name}`);

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      await this.delay(800);

      console.log(`\n${colors.bright}Step ${i + 1}/${workflow.steps.length}:${colors.reset}`);
      console.log(`  → Agent: ${colors.cyan}${step.agent}${colors.reset}`);
      console.log(`  → Action: ${step.action}`);

      // Simulate step execution
      await this.delay(500);
      const result = await this.simulateAgentAction(step.agent, step.action);
      console.log(`  → Result: ${colors.green}${result}${colors.reset}`);

      // Show inter-agent communication if applicable
      if (i === 1 && workflowName === 'PATTERN_ADDITION') {
        console.log(`\n  ${colors.yellow}[INTER-AGENT]${colors.reset} test-automation → workflow-business-logic`);
        console.log(`  ${colors.yellow}[MESSAGE]${colors.reset} Test failed as expected, pattern needed`);
      }
    }
  }

  async simulateParallel(agents) {
    console.log(`\n${colors.cyan}[PARALLEL]${colors.reset} Executing ${agents.length} agents simultaneously`);

    const promises = agents.map(agent => this.simulateAgentExecution(agent));
    await Promise.all(promises);
  }

  async simulateSingle(agent) {
    console.log(`\n${colors.cyan}[SINGLE]${colors.reset} Executing agent: ${agent}`);
    await this.simulateAgentExecution(agent);
  }

  async simulateAgentExecution(agent) {
    await this.delay(600);
    console.log(`  → ${colors.cyan}${agent}${colors.reset}: Processing...`);
    await this.delay(800);
    console.log(`  → ${colors.cyan}${agent}${colors.reset}: ${colors.green}Complete${colors.reset}`);
  }

  async simulateAgentAction(agent, action) {
    const responses = {
      'test-automation': {
        'create_test': 'Created test file: sql-injection.test.js',
        'run_test': 'Test failed (expected - no pattern yet)',
        'verify_test': 'Test passed ✓ Pattern detected correctly'
      },
      'workflow-business-logic': {
        'add_pattern': 'Added pattern to SQL_INJECTION category',
        'suggest_pattern': 'Suggested: /exec\\s*\\(|union\\s+select/i'
      },
      'pii-detection': {
        'detect_pii': 'Found 3 PII entities (CREDIT_CARD, EMAIL, PHONE)',
        'analyze_entity': 'CREDIT_CARD: 95% confidence, regex + ML'
      }
    };

    return responses[agent]?.[action] || 'Action completed';
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class MockMessageBus {
  constructor() {
    this.messages = [];
  }

  async send(message) {
    this.messages.push(message);
    console.log(`  ${colors.yellow}[MSG]${colors.reset} ${message.from} → ${message.to}: ${message.type}`);
  }
}

// Demo scenarios
async function runDemo() {
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     MASTER ORCHESTRATOR DEMONSTRATION                         ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log();
  console.log('This demo shows how the Master Orchestrator autonomously:');
  console.log('  • Classifies tasks using intelligent analysis');
  console.log('  • Selects appropriate agents or workflows');
  console.log('  • Coordinates multi-agent execution');
  console.log('  • Enables inter-agent communication');
  console.log();

  const orchestrator = new DemoOrchestrator();

  // Scenario 1: Workflow execution
  await orchestrator.simulateTask(
    'Add SQL injection detection pattern with proper testing',
    '1. WORKFLOW EXECUTION (TDD Pattern Addition)'
  );

  await orchestrator.delay(2000);

  // Scenario 2: Single agent
  await orchestrator.simulateTask(
    'Test PII detection for credit card numbers',
    '2. SINGLE AGENT EXECUTION'
  );

  await orchestrator.delay(2000);

  // Scenario 3: Parallel execution
  await orchestrator.simulateTask(
    'Analyze detection patterns and test coverage',
    '3. PARALLEL AGENT EXECUTION'
  );

  console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}                    DEMONSTRATION COMPLETE                     ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log();
  console.log(`${colors.bright}Key Capabilities Demonstrated:${colors.reset}`);
  console.log();
  console.log(`  ${colors.green}✓${colors.reset} Intelligent task classification with confidence scoring`);
  console.log(`  ${colors.green}✓${colors.reset} Automatic workflow template selection`);
  console.log(`  ${colors.green}✓${colors.reset} Sequential workflow execution with 4 steps`);
  console.log(`  ${colors.green}✓${colors.reset} Inter-agent communication during workflow`);
  console.log(`  ${colors.green}✓${colors.reset} Single agent autonomous execution`);
  console.log(`  ${colors.green}✓${colors.reset} Parallel multi-agent coordination`);
  console.log();
  console.log(`${colors.bright}Implementation Status:${colors.reset}`);
  console.log();
  console.log(`  ${colors.cyan}Core Infrastructure:${colors.reset} ${colors.green}✓ Complete${colors.reset}`);
  console.log(`    • BaseAgent class with messaging`);
  console.log(`    • MessageBus for async communication`);
  console.log(`    • StateManager for persistence`);
  console.log(`    • TaskClassifier for routing`);
  console.log();
  console.log(`  ${colors.cyan}Master Orchestrator:${colors.reset} ${colors.green}✓ Complete${colors.reset}`);
  console.log(`    • Autonomous task handling`);
  console.log(`    • Workflow execution engine`);
  console.log(`    • Progress tracking`);
  console.log();
  console.log(`  ${colors.cyan}Agents Implemented:${colors.reset} ${colors.yellow}3 of 10${colors.reset}`);
  console.log(`    ${colors.green}✓${colors.reset} test-automation`);
  console.log(`    ${colors.green}✓${colors.reset} workflow-business-logic`);
  console.log(`    ${colors.green}✓${colors.reset} pii-detection`);
  console.log(`    ${colors.yellow}○${colors.reset} 7 agents pending implementation`);
  console.log();
  console.log(`${colors.bright}To test the real orchestrator:${colors.reset}`);
  console.log();
  console.log(`  cd .claude/agents/vg-master-orchestrator`);
  console.log(`  node init.js`);
  console.log();
  console.log(`${colors.bright}To use in your workflow:${colors.reset}`);
  console.log();
  console.log(`  /orchestrate [your task description]`);
  console.log();
}

// Run the demo
runDemo().catch(error => {
  console.error(`${colors.red}[ERROR]${colors.reset}`, error);
  process.exit(1);
});