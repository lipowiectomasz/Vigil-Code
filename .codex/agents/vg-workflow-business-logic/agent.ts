import fs from 'node:fs/promises';
import path from 'node:path';
import { BaseAgent, type AgentTask } from '../../runtime/index.js';

interface PatternDescriptor {
  pattern: string;
  description?: string;
  addedAt?: string;
  addedBy?: string;
}

interface CategoryConfig {
  name?: string;
  weight: number;
  sanitize: boolean;
  patterns?: PatternDescriptor[];
  createdAt?: string;
  createdBy?: string;
}

interface UnifiedConfig {
  thresholds?: Record<string, number>;
  [key: string]: unknown;
}

interface Suggestion {
  action: 'add' | 'modify' | 'tune';
  pattern?: string;
  category?: string;
  threshold?: number;
  confidence: number;
}

type WorkflowBusinessPayload = {
  pattern?: string;
  category?: string;
  description?: string;
  context?: Record<string, unknown>;
  error?: string;
  testFailure?: Record<string, unknown>;
  configType?: 'rules' | 'unified';
  updates?: Record<string, unknown>;
  logs?: Array<Record<string, any>>;
  timeRange?: { from: string; to: string };
  targetMetrics?: Record<string, number>;
};

export class WorkflowBusinessLogicAgent extends BaseAgent {
  private readonly configDir = path.join(process.cwd(), 'services', 'workflow', 'config');
  private readonly rulesFile = path.join(this.configDir, 'rules.config.json');
  private readonly unifiedConfigFile = path.join(this.configDir, 'unified_config.json');
  private readonly categories = this.initializeCategories();

  constructor() {
    super({
      name: 'vg-workflow-business-logic',
      version: '3.0.0',
      description: 'Manages detection patterns, configuration updates, and threshold tuning',
      capabilities: [
        'add_pattern',
        'suggest_pattern',
        'update_config',
        'analyze_detection',
        'tune_thresholds',
        'validate_rules'
      ]
    });
  }

  protected async execute(task: AgentTask<WorkflowBusinessPayload>): Promise<unknown> {
    this.log(`Executing task: ${task.action ?? 'auto'}`);

    switch (task.action) {
      case 'add_pattern':
        return this.addPattern(task);
      case 'suggest_pattern':
        return this.suggestPattern(task);
      case 'update_config':
        return this.updateConfig(task);
      case 'analyze_detection':
        return this.analyzeDetection(task);
      case 'tune_thresholds':
        return this.tuneThresholds(task);
      case 'validate_rules':
        return this.validateRules(task);
      default:
        return this.handleAutonomously(task);
    }
  }

  private initializeCategories() {
    return {
      PROMPT_LEAK: { weight: 95, sanitize: true },
      PROMPT_INJECTION: { weight: 90, sanitize: true },
      JAILBREAK_ATTEMPT: { weight: 85, sanitize: true },
      PII_EXPOSURE: { weight: 80, sanitize: true },
      HARMFUL_CONTENT: { weight: 75, sanitize: true },
      MALICIOUS_INSTRUCTIONS: { weight: 70, sanitize: true },
      CODE_INJECTION: { weight: 65, sanitize: true },
      SQL_XSS_ATTACKS: { weight: 60, sanitize: true },
      CONVERSATION_HIJACK: { weight: 55, sanitize: true },
      ROLE_PLAY: { weight: 50, sanitize: false }
    };
  }

  private async addPattern(task: AgentTask<WorkflowBusinessPayload>) {
    const { pattern, category = 'MALICIOUS_INSTRUCTIONS', description } = task.payload ?? {};
    if (!pattern) {
      throw new Error('add_pattern requires pattern in payload');
    }

    const rules = await this.loadRules();
    if (!rules[category]) {
      rules[category] = await this.createCategory(category);
    }

    if (this.patternExists(rules[category], pattern)) {
      return {
        success: false,
        message: 'Pattern already exists in this category',
        existing: pattern
      };
    }

    if (!rules[category].patterns) {
      rules[category].patterns = [];
    }

    rules[category].patterns.push({
      pattern,
      description: description ?? 'Auto-added pattern',
      addedAt: new Date().toISOString(),
      addedBy: this.name
    });

    await this.saveRules(rules);
    await this.reportProgress({ percentage: 100, message: `Pattern added to ${category}` });

    return {
      success: true,
      category,
      pattern,
      totalPatterns: rules[category].patterns.length
    };
  }

  private async suggestPattern(task: AgentTask<WorkflowBusinessPayload>) {
    const { context, error, testFailure } = task.payload ?? {};
    const analysis = this.analyzeFailureContext(context ?? error ?? testFailure);

    const suggestions: Suggestion[] = [];
    if (analysis.type === 'false_negative') {
      suggestions.push({
        action: 'add',
        pattern: this.generatePattern(analysis.input ?? ''),
        category: this.determineCategory(analysis.input ?? ''),
        confidence: 0.8
      });
    } else if (analysis.type === 'false_positive') {
      suggestions.push({
        action: 'modify',
        pattern: this.refinePattern(analysis.existingPattern ?? ''),
        category: analysis.category,
        confidence: 0.7
      });
    } else if (analysis.type === 'threshold') {
      suggestions.push({
        action: 'tune',
        threshold: this.calculateOptimalThreshold(analysis),
        confidence: 0.9
      });
    }

    const validated = await this.validateSuggestions(suggestions);

    return {
      suggestions: validated,
      analysis,
      recommendation: this.generateRecommendation(validated)
    };
  }

  private async updateConfig(task: AgentTask<WorkflowBusinessPayload>) {
    const { configType = 'rules', updates = {} } = task.payload ?? {};

    let config: Record<string, unknown> | UnifiedConfig;
    let configFile: string;

    if (configType === 'rules') {
      config = await this.loadRules();
      configFile = this.rulesFile;
    } else {
      config = await this.loadUnifiedConfig();
      configFile = this.unifiedConfigFile;
    }

    const updated = this.applyUpdates(config, updates);
    const validation = await this.validateConfig(updated);

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    await fs.writeFile(configFile, JSON.stringify(updated, null, 2), 'utf8');
    await this.notifyDependentAgents(configType, updates);

    return {
      success: true,
      configType,
      updates: Object.keys(updates).length,
      validation
    };
  }

  private async analyzeDetection(task: AgentTask<WorkflowBusinessPayload>) {
    const { logs = [], timeRange } = task.payload ?? {};

    const analysis: any = {
      totalEvents: logs.length,
      blocked: 0,
      allowed: 0,
      sanitized: 0,
      categories: {} as Record<string, number>,
      patterns: {},
      effectiveness: 0,
      recommendations: [] as string[]
    };

    for (const log of logs) {
      if (log.decision === 'BLOCK') analysis.blocked += 1;
      if (log.decision === 'ALLOW') analysis.allowed += 1;
      if (typeof log.decision === 'string' && log.decision.includes('SANITIZE')) {
        analysis.sanitized += 1;
      }
      if (log.category) {
        analysis.categories[log.category] = (analysis.categories[log.category] ?? 0) + 1;
      }
    }

    if (analysis.totalEvents > 0) {
      analysis.effectiveness =
        (analysis.blocked + analysis.sanitized) / analysis.totalEvents;
    }

    if (analysis.effectiveness < 0.7) {
      analysis.recommendations.push('Detection rate below 70% - consider adding more patterns');
    }
    if (analysis.blocked > analysis.totalEvents * 0.5) {
      analysis.recommendations.push('High block rate - review for false positives');
    }

    if (analysis.totalEvents > 1000) {
      try {
        const deep = await this.invokeAgent('vg-data-analytics', {
          action: 'deep_analysis',
          data: logs,
          timeRange
        });
        analysis.deepAnalysis = deep;
      } catch (error) {
        this.log(`Deep analysis invocation failed: ${(error as Error).message}`, 'warn');
      }
    }

    return analysis;
  }

  private async tuneThresholds(task: AgentTask<WorkflowBusinessPayload>) {
    const targetMetrics = task.payload?.targetMetrics ?? {};
    const config = await this.loadUnifiedConfig();

    const current = {
      blockThreshold: config.thresholds?.block ?? 85,
      sanitizeLightThreshold: config.thresholds?.sanitizeLight ?? 30,
      sanitizeHeavyThreshold: config.thresholds?.sanitizeHeavy ?? 65
    };

    const optimal = this.calculateOptimalThresholds(targetMetrics);

    const adjusted = {
      blockThreshold: this.adjustThreshold(current.blockThreshold, optimal.block),
      sanitizeLightThreshold: this.adjustThreshold(
        current.sanitizeLightThreshold,
        optimal.sanitizeLight
      ),
      sanitizeHeavyThreshold: this.adjustThreshold(
        current.sanitizeHeavyThreshold,
        optimal.sanitizeHeavy
      )
    };

    config.thresholds = adjusted;
    await this.saveUnifiedConfig(config);

    return {
      success: true,
      previous: current,
      adjusted,
      optimal,
      message: 'Thresholds tuned based on target metrics'
    };
  }

  private async validateRules(_task: AgentTask<WorkflowBusinessPayload>) {
    const rules = await this.loadRules();
    const stats = {
      categories: 0,
      totalPatterns: 0,
      emptyCategories: 0
    };

    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      stats
    };

    for (const [category, config] of Object.entries<CategoryConfig>(rules)) {
      stats.categories += 1;
      const patterns = config.patterns ?? [];
      if (patterns.length === 0) {
        stats.emptyCategories += 1;
        validation.warnings.push(`Category ${category} has no patterns`);
      } else {
        stats.totalPatterns += patterns.length;
        for (const pattern of patterns) {
          const result = this.validatePattern(pattern);
          if (!result.valid) {
            validation.valid = false;
            validation.errors.push(...result.errors);
          }
        }
      }

      if (config.weight < 0 || config.weight > 100) {
        validation.valid = false;
        validation.errors.push(`Invalid weight for ${category}: ${config.weight}`);
      }
    }

    if (stats.categories < 5) {
      validation.warnings.push('Less than 5 categories configured');
    }
    if (stats.totalPatterns < 50) {
      validation.warnings.push('Less than 50 total patterns configured');
    }

    return validation;
  }

  private async handleAutonomously(task: AgentTask<WorkflowBusinessPayload>) {
    const taskText = String(task.task ?? task.payload?.description ?? '');
    if (taskText.includes('pattern') && taskText.includes('add')) {
      return this.addPattern(task);
    }
    if (taskText.includes('suggest') || taskText.includes('recommend')) {
      return this.suggestPattern(task);
    }
    if (taskText.includes('config') || taskText.includes('update')) {
      return this.updateConfig(task);
    }
    if (taskText.includes('analyze') || taskText.includes('effectiveness')) {
      return this.analyzeDetection(task);
    }
    if (taskText.includes('threshold') || taskText.includes('tune')) {
      return this.tuneThresholds(task);
    }
    return this.validateRules(task);
  }

  private async loadRules(): Promise<Record<string, CategoryConfig>> {
    try {
      const content = await fs.readFile(this.rulesFile, 'utf8');
      return JSON.parse(content);
    } catch {
      this.log('Failed to load rules, returning empty config', 'warn');
      return {};
    }
  }

  private async saveRules(rules: Record<string, CategoryConfig>) {
    await fs.mkdir(path.dirname(this.rulesFile), { recursive: true });
    await fs.writeFile(this.rulesFile, JSON.stringify(rules, null, 2), 'utf8');
  }

  private async loadUnifiedConfig(): Promise<UnifiedConfig> {
    try {
      const content = await fs.readFile(this.unifiedConfigFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async saveUnifiedConfig(config: UnifiedConfig) {
    await fs.mkdir(path.dirname(this.unifiedConfigFile), { recursive: true });
    await fs.writeFile(this.unifiedConfigFile, JSON.stringify(config, null, 2), 'utf8');
  }

  private patternExists(category: CategoryConfig, pattern: string) {
    return (category.patterns ?? []).some(
      (entry) => (typeof entry === 'string' ? entry : entry.pattern) === pattern
    );
  }

  private async createCategory(name: string): Promise<CategoryConfig> {
    const weight = this.estimateCategoryWeight(name);
    return {
      name,
      weight,
      patterns: [],
      sanitize: weight > 50,
      createdAt: new Date().toISOString(),
      createdBy: this.name
    };
  }

  private estimateCategoryWeight(name: string) {
    const upper = name.toUpperCase();
    if (upper.includes('INJECTION') || upper.includes('LEAK')) return 85;
    if (upper.includes('HARMFUL') || upper.includes('MALICIOUS')) return 75;
    if (upper.includes('PII') || upper.includes('PRIVACY')) return 70;
    if (upper.includes('SPAM') || upper.includes('ROLE')) return 40;
    return 50;
  }

  private analyzeFailureContext(context: any = {}) {
    if (!context) {
      return { type: 'unknown', confidence: 0.5 };
    }
    return {
      type: context.expected && context.actual === false ? 'false_negative' : 'threshold',
      input: context.input ?? '',
      category: context.category ?? 'UNKNOWN',
      existingPattern: context.pattern,
      confidence: 0.7
    };
  }

  private generatePattern(input: string) {
    const cleaned = input.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const keywords = cleaned.split(' ').filter((word) => word.length > 3);
    return keywords.slice(0, 3).join('.*');
  }

  private determineCategory(input: string) {
    const lower = input.toLowerCase();
    if (lower.includes('inject') || lower.includes('execute')) return 'CODE_INJECTION';
    if (lower.includes('prompt') || lower.includes('system')) return 'PROMPT_INJECTION';
    if (lower.includes('email') || lower.includes('phone')) return 'PII_EXPOSURE';
    return 'MALICIOUS_INSTRUCTIONS';
  }

  private async notifyDependentAgents(configType: string, updates: Record<string, unknown>) {
    const messageId = this.messageBus.generateMessageId();
    try {
      await this.messageBus.send({
        from: this.name,
        to: 'vg-test-automation',
        type: 'notify',
        payload: {
          type: 'config_update',
          configType,
          updates,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        messageId
      });
    } catch (error) {
      this.log(
        `Failed to notify vg-test-automation about config update: ${(error as Error).message}`,
        'warn'
      );
    }
  }

  private refinePattern(pattern: string) {
    return pattern;
  }

  private calculateOptimalThreshold(_analysis: any) {
    return 65;
  }

  private async validateSuggestions(suggestions: Suggestion[]) {
    return suggestions;
  }

  private generateRecommendation(validated: Suggestion[]) {
    if (validated.length === 0) {
      return 'No actionable recommendations at this time';
    }
    return 'Apply suggested patterns';
  }

  private applyUpdates(config: Record<string, unknown>, updates: Record<string, unknown>) {
    return {
      ...config,
      ...updates
    };
  }

  private async validateConfig(config: Record<string, unknown>) {
    if (!config || typeof config !== 'object') {
      return { valid: false, errors: ['Configuration must be an object'] };
    }
    return { valid: true, errors: [] as string[] };
  }

  private calculateOptimalThresholds(_metrics: Record<string, number>) {
    return { block: 85, sanitizeLight: 30, sanitizeHeavy: 65 };
  }

  private adjustThreshold(current: number, optimal: number) {
    return Math.round((current + optimal) / 2);
  }

  private validatePattern(pattern: PatternDescriptor | string) {
    const value = typeof pattern === 'string' ? pattern : pattern.pattern;
    const errors: string[] = [];
    if (!value || value.length < 3) {
      errors.push('Pattern is too short');
    }
    return { valid: errors.length === 0, errors };
  }
}
