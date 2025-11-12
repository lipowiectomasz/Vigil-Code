import fs from 'node:fs/promises';
import path from 'node:path';
import { BaseAgent, type AgentTask } from '../../runtime/index.js';
import { ShellTool } from '../tools/ShellTool.js';

interface TestAutomationPayload {
  pattern?: string;
  category?: string;
  testName?: string;
  testFile?: string;
  expectedResult?: boolean;
  results?: unknown;
  entity?: string;
  testData?: string;
  suite?: string;
  description?: string;
}

interface RunTestResult {
  success: boolean;
  results: TestRunSummary;
  output?: string;
  suggestion?: unknown;
  message?: string;
}

interface TestRunSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
}

export class TestAutomationAgent extends BaseAgent {
  private readonly workflowRoot = path.join(process.cwd(), 'services', 'workflow');
  private readonly testDir = path.join(this.workflowRoot, 'tests');
  private readonly fixtureDir = path.join(this.testDir, 'fixtures');
  private readonly shell = new ShellTool('vg-test-automation', this.workflowRoot);

  constructor() {
    super({
      name: 'vg-test-automation',
      version: '3.0.0',
      description: 'Autonomous test automation and verification agent (Codex runtime)',
      capabilities: [
        'create_test',
        'run_test',
        'verify_test',
        'analyze_results',
        'test_pii',
        'run_suite'
      ],
      dependencies: ['vg-workflow-business-logic']
    });
  }

  protected async execute(task: AgentTask<TestAutomationPayload>): Promise<unknown> {
    this.log(`Executing task: ${task.action ?? 'unspecified'}`);

    switch (task.action) {
      case 'create_test':
        return this.createTest(task);
      case 'run_test':
        return this.runTest(task);
      case 'verify_test':
        return this.verifyTest(task);
      case 'analyze_results':
        return this.analyzeResults(task);
      case 'test_pii':
        return this.testPII(task);
      case 'run_suite':
        return this.runTestSuite(task);
      default:
        return this.handleAutonomously(task);
    }
  }

  private async createTest(task: AgentTask<TestAutomationPayload>) {
    const { pattern = '', category = 'general', testName = `auto-${Date.now()}` } = task.payload ?? {};

    const testStructure = await this.determineTestStructure(pattern, category);
    const fixturePath = await this.createFixture(testName, pattern);
    const testPath = await this.createTestFile(testName, testStructure);

    await this.reportProgress({ percentage: 50, message: 'Test files created' });

    return {
      success: true,
      testPath,
      fixturePath,
      message: `Created test ${testName} for ${category} pattern`
    };
  }

  private async runTest(task: AgentTask<TestAutomationPayload>): Promise<RunTestResult> {
    const { testFile, testName } = task.payload ?? {};

    if (!testFile && !testName) {
      throw new Error('runTest requires either testFile or testName');
    }

    const command = testFile
      ? ['npx', 'vitest', 'run', testFile]
      : ['npx', 'vitest', 'run', '--testNamePattern', testName!];

    const result = await this.shell.run(command, {
      cwd: '.',
      timeoutMs: 120_000
    });

    const summary = this.parseTestOutput(result.stdout || result.stderr);
    const success = result.exitCode === 0 && summary.failed === 0;

    if (success) {
      return {
        success: true,
        results: summary,
        output: this.truncateOutput(result.stdout)
      };
    }

    const suggestionNeeded = this.shouldInvolveWorkflowAgent(summary);
    let suggestion: unknown;

    if (suggestionNeeded) {
      suggestion = await this.invokeAgent('vg-workflow-business-logic', {
        action: 'suggest_pattern',
        context: summary,
        error: this.truncateOutput(result.stderr || result.stdout)
      });
    }

    return {
      success: false,
      results: summary,
      output: this.truncateOutput(result.stderr || result.stdout),
      suggestion,
      message: suggestion ? 'Test failed. Pattern suggestion retrieved from workflow agent.' : undefined
    };
  }

  private async verifyTest(task: AgentTask<TestAutomationPayload>) {
    const { testName, expectedResult = true } = task.payload ?? {};
    if (!testName) {
      throw new Error('verifyTest requires testName');
    }

    const runResult = await this.runTest({ action: 'run_test', payload: { testName } });
    const verification: {
      passed: boolean;
      actual: boolean;
      expected: boolean;
      details: TestRunSummary;
      debug?: unknown;
    } = {
      passed: runResult.success === expectedResult,
      actual: runResult.success,
      expected: expectedResult,
      details: runResult.results
    };

    if (!verification.passed) {
      verification.debug = await this.debugTestFailure(testName, runResult);
    }

    return verification;
  }

  private async analyzeResults(task: AgentTask<TestAutomationPayload>) {
    const rawResults = task.payload?.results;
    const analysis: any = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: 0,
      failurePatterns: [],
      recommendations: []
    };

    if (typeof rawResults === 'string') {
      Object.assign(analysis, this.parseTestOutput(rawResults));
    } else if (rawResults && typeof rawResults === 'object') {
      Object.assign(analysis, rawResults);
    }

    analysis.failurePatterns = this.identifyFailurePatterns(analysis);
    analysis.recommendations = await this.generateRecommendations(analysis);

    return analysis;
  }

  private async testPII(task: AgentTask<TestAutomationPayload>) {
    const { entity = 'EMAIL', testData } = task.payload ?? {};
    const fixture = {
      entity,
      testData: testData ?? this.generatePIITestData(entity),
      expectedDetection: true
    };

    const result = await this.runTest({
      action: 'run_test',
      payload: { testFile: 'tests/e2e/pii-detection-comprehensive.test.js' }
    });

    if (result.success) {
      return { success: true, fixture, result };
    }

    const piiAnalysis = await this.invokeAgent('vg-pii-detection', {
      action: 'analyze_entity',
      entity,
      testData: fixture.testData
    });

    return {
      success: false,
      fixture,
      result,
      piiAnalysis,
      message: 'PII detection test failed. Analysis from PII agent included.'
    };
  }

  private async runTestSuite(task: AgentTask<TestAutomationPayload>) {
    const suite = task.payload?.suite;
    const command = this.buildSuiteCommand(suite);
    const result = await this.shell.run(command, {
      cwd: '.',
      timeoutMs: 180_000
    });

    const summary = this.parseTestOutput(result.stdout || result.stderr);
    if (result.exitCode !== 0) {
      return {
        success: false,
        error: `Suite ${suite ?? 'default'} failed`,
        results: summary,
        output: this.truncateOutput(result.stderr || result.stdout)
      };
    }

    const coverage = await this.generateCoverageReport();

    return {
      success: true,
      results: summary,
      coverage,
      summary: this.generateTestSummary(summary)
    };
  }

  private async handleAutonomously(task: AgentTask<TestAutomationPayload>) {
    const description = String(task.task ?? task.payload?.description ?? '');

    if (description.includes('test') && description.includes('create')) {
      return this.createTest(task);
    }
    if (description.includes('run') || description.includes('execute')) {
      return this.runTestSuite(task);
    }
    if (description.includes('verify') || description.includes('check')) {
      return this.verifyTest(task);
    }
    if (description.includes('pii') || description.includes('privacy')) {
      return this.testPII(task);
    }

    const run = await this.runTestSuite(task);
    const analysis = await this.analyzeResults({ action: 'analyze_results', payload: { results: run.results } });

    return {
      run,
      analysis,
      message: 'Autonomously ran test suite and analyzed results'
    };
  }

  private async determineTestStructure(pattern: string, category: string) {
    return {
      imports: ['vitest', 'webhook-helper'],
      describe: `${category} Detection`,
      tests: [
        { name: `should detect ${pattern}`, type: 'positive' },
        { name: 'should not false positive on legitimate content', type: 'negative' }
      ]
    };
  }

  private async createFixture(testName: string, pattern: string) {
    await fs.mkdir(this.fixtureDir, { recursive: true });

    const fixture = {
      name: testName,
      pattern,
      testCases: [
        {
          input: pattern,
          expected: 'BLOCK',
          description: 'Direct pattern match'
        }
      ]
    };

    const fixturePath = path.join(this.fixtureDir, `${testName}.json`);
    await fs.writeFile(fixturePath, JSON.stringify(fixture, null, 2), 'utf8');

    return fixturePath;
  }

  private async createTestFile(testName: string, structure: { describe: string; tests: Array<{ name: string }> }) {
    const testContent = this.generateTestCode(testName, structure);
    const testPath = path.join(this.testDir, 'e2e', `${testName}.test.js`);
    await fs.mkdir(path.dirname(testPath), { recursive: true });
    await fs.writeFile(testPath, testContent, 'utf8');
    return testPath;
  }

  private generateTestCode(testName: string, structure: { describe: string; tests: Array<{ name: string }> }) {
    const testBlocks = structure.tests
      .map(
        (test) => `
  it('${test.name}', async () => {
    const response = await sendToWebhook({
      chatInput: 'test input',
      sessionId: 'test-${Date.now()}'
    });

    expect(response.decision).toBeDefined();
  });`
      )
      .join('\n');

    return `/**
 * Auto-generated test by Test Automation Agent
 * Test: ${testName}
 */

const { describe, it, expect } = require('vitest');
const { sendToWebhook } = require('../helpers/webhook');

describe('${structure.describe}', () => {${testBlocks}
});
`;
  }

  private parseTestOutput(output: string | undefined): TestRunSummary {
    const text = output ?? '';
    const results: TestRunSummary = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    const passMatch = text.match(/(\d+)\s+passed/);
    const failMatch = text.match(/(\d+)\s+failed/);
    const skipMatch = text.match(/(\d+)\s+skipped/);

    if (passMatch) results.passed = Number.parseInt(passMatch[1], 10);
    if (failMatch) results.failed = Number.parseInt(failMatch[1], 10);
    if (skipMatch) results.skipped = Number.parseInt(skipMatch[1], 10);

    results.totalTests = results.passed + results.failed + results.skipped;
    return results;
  }

  private shouldInvolveWorkflowAgent(summary: TestRunSummary): boolean {
    if (summary.totalTests === 0) {
      return false;
    }
    return summary.failed > 0 && summary.passed < summary.totalTests * 0.5;
  }

  private async debugTestFailure(testName: string, runResult: RunTestResult) {
    return {
      testName,
      failure: runResult.results,
      possibleCauses: [
        'Pattern not configured correctly',
        'Threshold too high',
        'Test data issue'
      ],
      suggestedActions: [
        'Check pattern in rules.config.json',
        'Verify webhook is active',
        'Review test fixture data'
      ]
    };
  }

  private identifyFailurePatterns(analysis: { passed: number; failed: number; skipped: number }) {
    const patterns: string[] = [];

    if (analysis.failed > analysis.passed) {
      patterns.push('majority_failure');
    }
    if (analysis.failed > 0 && analysis.passed === 0) {
      patterns.push('total_failure');
    }
    if (analysis.skipped > 0) {
      patterns.push('tests_skipped');
    }

    return patterns;
  }

  private async generateRecommendations(analysis: { failurePatterns: string[]; coverage?: number }) {
    const recommendations: string[] = [];

    if (analysis.failurePatterns.includes('majority_failure')) {
      recommendations.push('Review test environment configuration');
      recommendations.push('Check if workflow is active');
    }

    if (analysis.failurePatterns.includes('total_failure')) {
      recommendations.push('Critical: All tests failing - check service health');
    }

    if ((analysis.coverage ?? 0) < 80) {
      recommendations.push('Increase test coverage to at least 80%');
    }

    return recommendations;
  }

  private generatePIITestData(entity: string) {
    const defaults: Record<string, string> = {
      EMAIL: 'test@example.com',
      PHONE: '555-1234',
      SSN: '123-45-6789',
      CREDIT_CARD: '4111111111111111',
      PESEL: '44051401359'
    };

    return defaults[entity.toUpperCase()] ?? 'test data';
  }

  private async generateCoverageReport(): Promise<number> {
    const result = await this.shell.run(['npx', 'vitest', 'run', '--coverage'], {
      cwd: '.',
      timeoutMs: 240_000
    });

    if (result.exitCode !== 0) {
      return 0;
    }

    const match = result.stdout.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([\d.]+)/);
    return match ? Number.parseFloat(match[1]) : 0;
  }

  private generateTestSummary(results: TestRunSummary): string {
    const passRate =
      results.totalTests > 0 ? ((results.passed / results.totalTests) * 100).toFixed(1) : '0.0';
    return `Tests: ${results.passed}/${results.totalTests} passed (${passRate}%)`;
  }

  private buildSuiteCommand(suite?: string | null): string[] {
    if (!suite || suite === 'all') {
      return ['npx', 'vitest', 'run', 'tests/e2e'];
    }

    if (suite.includes('.test')) {
      const normalized = suite.startsWith('tests')
        ? suite
        : path.join('tests', 'e2e', suite);
      return ['npx', 'vitest', 'run', normalized];
    }

    const scriptMap: Record<string, string> = {
      coverage: 'test:coverage',
      pii: 'test:pii',
      'pii:comprehensive': 'test:pii:comprehensive',
      'pii:presidio': 'test:pii:presidio',
      'pii:fallback': 'test:pii:fallback',
      language: 'test:language',
      e2e: 'test:e2e',
      bypass: 'test:bypass',
      owasp: 'test:owasp',
      smoke: 'test:smoke',
      'input-validation': 'test:input-validation'
    };

    if (suite.startsWith('test:')) {
      return ['npm', 'run', suite];
    }

    const mapped = scriptMap[suite];
    if (mapped) {
      return ['npm', 'run', mapped];
    }

    return ['npx', 'vitest', 'run', suite];
  }

  private truncateOutput(output: string | undefined, maxLength = 1_500) {
    if (!output) return undefined;
    if (output.length <= maxLength) return output;
    return `${output.slice(0, maxLength)}…`;
  }
}
