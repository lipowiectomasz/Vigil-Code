#!/usr/bin/env node

/**
 * Master Orchestrator Initialization Script
 * Demonstrates autonomous agent orchestration
 */

const MasterOrchestrator = require('./orchestrator');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     MASTER ORCHESTRATOR - Autonomous Agent System      ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════${colors.reset}`);
  console.log();

  // Initialize orchestrator
  console.log(`${colors.yellow}[INIT]${colors.reset} Initializing Master Orchestrator...`);
  const orchestrator = new MasterOrchestrator({
    state: {
      stateDir: './.claude/state',
      maxStateAge: 24 * 60 * 60 * 1000
    }
  });

  try {
    await orchestrator.initialize();
    console.log(`${colors.green}[READY]${colors.reset} Orchestrator initialized successfully`);
    console.log();

    // Display status
    const status = orchestrator.getStatus();
    console.log(`${colors.bright}System Status:${colors.reset}`);
    console.log(`  • Agents loaded: ${status.agents.length}`);
    console.log(`  • Active workflows: ${status.activeWorkflows}`);
    console.log(`  • Message bus ready: ${status.messageBus.agents > 0 ? 'Yes' : 'No'}`);
    console.log();

    // Query agent capabilities
    console.log(`${colors.bright}Available Agents:${colors.reset}`);
    const capabilities = await orchestrator.queryAgentCapabilities();
    for (const [agent, caps] of Object.entries(capabilities)) {
      if (!caps.error) {
        console.log(`  • ${colors.cyan}${agent}${colors.reset}: ${caps.description || 'Ready'}`);
      }
    }
    console.log();

    // Interactive mode or single task execution
    if (process.argv[2]) {
      // Execute task from command line argument
      const task = process.argv.slice(2).join(' ');
      await executeTask(orchestrator, task);
      process.exit(0);
    } else {
      // Interactive mode
      console.log(`${colors.bright}Interactive Mode${colors.reset}`);
      console.log('Enter a task description or command:');
      console.log('  • "help" - Show available commands');
      console.log('  • "status" - Show system status');
      console.log('  • "exit" - Exit the orchestrator');
      console.log();

      startInteractiveMode(orchestrator);
    }

  } catch (error) {
    console.error(`${colors.bright}${colors.red}[ERROR]${colors.reset} Initialization failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Execute a task using the orchestrator
 */
async function executeTask(orchestrator, taskDescription) {
  console.log(`${colors.blue}[TASK]${colors.reset} ${taskDescription}`);
  console.log();

  // Show classification
  const classifier = orchestrator.classifier;
  const classification = await classifier.classify(taskDescription);
  console.log(`${colors.magenta}[CLASSIFY]${colors.reset} Category: ${classification.category} (${Math.round(classification.confidence * 100)}% confidence)`);

  if (classification.keywords.length > 0) {
    console.log(`${colors.magenta}[KEYWORDS]${colors.reset} ${classification.keywords.join(', ')}`);
  }

  // Show strategy
  const strategy = classifier.determineStrategy(classification);
  console.log(`${colors.magenta}[STRATEGY]${colors.reset} ${strategy.type}${strategy.workflow ? ` (${strategy.workflow})` : ''}`);

  if (strategy.agents.length > 0) {
    console.log(`${colors.magenta}[AGENTS]${colors.reset} ${strategy.agents.join(', ')}`);
  }
  console.log();

  // Execute task
  console.log(`${colors.yellow}[EXECUTE]${colors.reset} Starting task execution...`);

  try {
    const startTime = Date.now();
    const result = await orchestrator.handleTask(taskDescription);
    const duration = Date.now() - startTime;

    console.log();
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${result.summary}`);

    // Show execution details
    if (result.metadata) {
      console.log();
      console.log(`${colors.bright}Execution Details:${colors.reset}`);
      console.log(`  • Category: ${result.metadata.category}`);
      console.log(`  • Complexity: ${result.metadata.complexity}`);
      console.log(`  • Agents used: ${result.metadata.agents.join(', ')}`);
      console.log(`  • Duration: ${duration}ms`);
    }

    // Show results based on type
    if (result.details) {
      console.log();
      console.log(`${colors.bright}Results:${colors.reset}`);

      if (result.details.type === 'parallel') {
        console.log(`  • Parallel execution: ${result.details.successful.length}/${result.details.total} succeeded`);
      } else if (result.details.type === 'workflow') {
        console.log(`  • Workflow: ${result.details.workflow}`);
        console.log(`  • Steps completed: ${result.details.steps.length}`);
      } else if (result.details.type === 'sequential') {
        console.log(`  • Sequential execution: ${result.details.results.length} steps`);
      }
    }

  } catch (error) {
    console.error(`${colors.bright}${colors.red}[FAILED]${colors.reset} Task execution failed:`, error.message);
  }
}

/**
 * Start interactive mode
 */
function startInteractiveMode(orchestrator) {
  rl.question(`${colors.cyan}> ${colors.reset}`, async (input) => {
    const command = input.trim().toLowerCase();

    if (command === 'exit' || command === 'quit') {
      console.log(`${colors.yellow}[EXIT]${colors.reset} Shutting down orchestrator...`);
      await orchestrator.shutdown();
      rl.close();
      process.exit(0);

    } else if (command === 'help') {
      showHelp();
      startInteractiveMode(orchestrator);

    } else if (command === 'status') {
      showStatus(orchestrator);
      startInteractiveMode(orchestrator);

    } else if (command === 'agents') {
      await showAgents(orchestrator);
      startInteractiveMode(orchestrator);

    } else if (command.startsWith('test ')) {
      runTestScenario(orchestrator, command.substring(5));
      startInteractiveMode(orchestrator);

    } else if (command) {
      // Execute as task
      await executeTask(orchestrator, command);
      console.log();
      startInteractiveMode(orchestrator);

    } else {
      startInteractiveMode(orchestrator);
    }
  });
}

/**
 * Show help information
 */
function showHelp() {
  console.log();
  console.log(`${colors.bright}Available Commands:${colors.reset}`);
  console.log('  help    - Show this help message');
  console.log('  status  - Show orchestrator status');
  console.log('  agents  - List available agents and capabilities');
  console.log('  test    - Run test scenarios');
  console.log('  exit    - Exit the orchestrator');
  console.log();
  console.log(`${colors.bright}Task Examples:${colors.reset}`);
  console.log('  Add SQL injection detection pattern');
  console.log('  Test PII detection for credit cards');
  console.log('  Run security audit');
  console.log('  Fix failing tests in bypass-scenarios');
  console.log();
}

/**
 * Show orchestrator status
 */
function showStatus(orchestrator) {
  const status = orchestrator.getStatus();
  console.log();
  console.log(`${colors.bright}Orchestrator Status:${colors.reset}`);
  console.log(`  • Initialized: ${status.initialized ? 'Yes' : 'No'}`);
  console.log(`  • Agents: ${status.agents.length} loaded`);
  console.log(`  • Active workflows: ${status.activeWorkflows}`);
  console.log(`  • Message bus agents: ${status.messageBus.agents}`);
  console.log(`  • Message history: ${status.messageBus.messageCount} messages`);
  console.log();
}

/**
 * Show available agents
 */
async function showAgents(orchestrator) {
  console.log();
  console.log(`${colors.bright}Querying agent capabilities...${colors.reset}`);

  const capabilities = await orchestrator.queryAgentCapabilities();

  console.log();
  for (const [agent, caps] of Object.entries(capabilities)) {
    if (!caps.error) {
      console.log(`${colors.cyan}${agent}:${colors.reset}`);
      console.log(`  Version: ${caps.version || 'N/A'}`);
      console.log(`  Description: ${caps.description || 'N/A'}`);
      if (caps.capabilities && caps.capabilities.length > 0) {
        console.log(`  Capabilities: ${caps.capabilities.join(', ')}`);
      }
      console.log();
    }
  }
}

/**
 * Run test scenarios
 */
async function runTestScenario(orchestrator, scenario) {
  console.log();
  console.log(`${colors.bright}Test Scenarios:${colors.reset}`);

  const scenarios = {
    'pattern': 'Add detection pattern for SQL injection attack',
    'pii': 'Test PII detection for Polish PESEL numbers',
    'security': 'Run security audit and check vulnerabilities',
    'workflow': 'Create test for new jailbreak pattern and verify',
    'parallel': 'Analyze detection logs and generate dashboard'
  };

  if (scenario && scenarios[scenario]) {
    console.log(`Running test: ${scenario}`);
    await executeTask(orchestrator, scenarios[scenario]);
  } else {
    console.log('Available test scenarios:');
    for (const [key, description] of Object.entries(scenarios)) {
      console.log(`  test ${key} - ${description}`);
    }
  }
  console.log();
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log(`\n${colors.yellow}[SIGINT]${colors.reset} Graceful shutdown...`);
  process.exit(0);
});

// Run main function
main().catch(error => {
  console.error(`${colors.bright}${colors.red}[FATAL]${colors.reset}`, error);
  process.exit(1);
});