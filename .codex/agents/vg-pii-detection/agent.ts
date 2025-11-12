import { BaseAgent, type AgentTask } from '../../runtime/index.js';

interface PIIPayload {
  entity?: string;
  testData?: string;
  text?: string;
  languages?: string[];
  entities?: Record<string, { enabled?: boolean; confidence?: number }>;
  action?: 'enable' | 'disable' | 'update';
  description?: string;
}

type EntityConfig = {
  enabled: boolean;
  confidence: number;
  language: string;
};

export class PIIDetectionAgent extends BaseAgent {
  private readonly entityTypes: Record<string, EntityConfig>;
  private readonly supportedLanguages = ['en', 'pl'];

  constructor() {
    super({
      name: 'vg-pii-detection',
      version: '3.0.0',
      description: 'Autonomous PII detection and privacy protection agent',
      capabilities: [
        'analyze_entity',
        'detect_pii',
        'configure_entities',
        'test_detection',
        'analyze_language',
        'update_patterns'
      ],
      dependencies: ['vg-workflow-business-logic']
    });

    this.entityTypes = this.initializeEntityTypes();
  }

  protected async execute(task: AgentTask<PIIPayload>) {
    this.log(`Executing task: ${task.action ?? 'auto'}`);

    switch (task.action) {
      case 'analyze_entity':
        return this.analyzeEntity(task);
      case 'detect_pii':
        return this.detectPII(task);
      case 'configure_entities':
        return this.configureEntities(task);
      case 'test_detection':
        return this.testDetection(task);
      case 'analyze_language':
        return this.analyzeLanguage(task);
      case 'update_patterns':
        return this.updatePatterns(task);
      default:
        return this.handleAutonomously(task);
    }
  }

  private initializeEntityTypes(): Record<string, EntityConfig> {
    return {
      EMAIL: { enabled: true, confidence: 0.7, language: 'en' },
      PHONE_NUMBER: { enabled: true, confidence: 0.7, language: 'en' },
      CREDIT_CARD: { enabled: true, confidence: 0.8, language: 'en' },
      SSN: { enabled: true, confidence: 0.85, language: 'en' },
      PERSON: { enabled: true, confidence: 0.6, language: 'adaptive' },
      LOCATION: { enabled: true, confidence: 0.6, language: 'en' },
      ORGANIZATION: { enabled: true, confidence: 0.6, language: 'en' },
      PESEL: { enabled: true, confidence: 0.9, language: 'pl' },
      NIP: { enabled: true, confidence: 0.85, language: 'pl' },
      REGON: { enabled: true, confidence: 0.85, language: 'pl' },
      MEDICAL_LICENSE: { enabled: true, confidence: 0.8, language: 'en' },
      DISEASE: { enabled: true, confidence: 0.7, language: 'en' },
      IBAN: { enabled: true, confidence: 0.9, language: 'en' },
      BANK_ACCOUNT: { enabled: true, confidence: 0.8, language: 'en' }
    };
  }

  private async analyzeEntity(task: AgentTask<PIIPayload>) {
    const entity = task.payload?.entity ?? 'EMAIL';
    const config = this.entityTypes[entity];

    if (!config) {
      return { success: false, message: `Unknown entity type: ${entity}` };
    }

    const testResults = await this.testEntityDetection(entity, task.payload?.testData);
    const effectiveness = this.calculateEffectiveness(testResults);

    const recommendations: string[] = [];
    if (effectiveness < 0.7) {
      recommendations.push(`Increase confidence threshold for ${entity}`);
      recommendations.push('Add custom regex patterns for better detection');
    }

    if (effectiveness < 0.5 && config.enabled) {
      await this.updateEntityConfig(entity, { confidence: config.confidence * 0.8 });
    }

    return {
      success: true,
      entity,
      config,
      testResults,
      effectiveness,
      recommendations
    };
  }

  private async detectPII(task: AgentTask<PIIPayload>) {
    const text = task.payload?.text ?? '';
    const languages = task.payload?.languages ?? this.determineLanguages('en', text);

    const detectionResults = languages.map((language) =>
      this.runPresidioDetection(text, language)
    );

    const settled = await Promise.allSettled(detectionResults);
    const mergedEntities = this.mergeDetectionResults(settled);
    const regexEntities = await this.applyRegexDetection(text);
    const allEntities = this.deduplicateEntities([...mergedEntities, ...regexEntities]);

    const stats = this.calculateDetectionStats(allEntities, languages);

    if (this.hasHighRiskPII(allEntities)) {
      await this.invokeAgent('vg-workflow-business-logic', {
        action: 'update_config',
        configType: 'rules',
        updates: { pii_strict_mode: true }
      });
    }

    return {
      success: true,
      entities: allEntities,
      stats,
      detectionLanguages: languages,
      hasPII: allEntities.length > 0
    };
  }

  private async configureEntities(task: AgentTask<PIIPayload>) {
    const entities = task.payload?.entities ?? {};
    const action = task.payload?.action ?? 'update';

    const changes: Array<{ entity: string; previous: EntityConfig; updated: EntityConfig }> = [];

    for (const [entity, config] of Object.entries(entities)) {
      if (!this.entityTypes[entity]) continue;
      const previous = { ...this.entityTypes[entity] };

      if (action === 'enable') {
        this.entityTypes[entity].enabled = true;
      } else if (action === 'disable') {
        this.entityTypes[entity].enabled = false;
      } else {
        this.entityTypes[entity] = {
          ...this.entityTypes[entity],
          ...config
        };
      }

      changes.push({
        entity,
        previous,
        updated: { ...this.entityTypes[entity] }
      });
    }

    return {
      success: true,
      action,
      changes,
      totalEntities: Object.keys(this.entityTypes).length
    };
  }

  private async testDetection(task: AgentTask<PIIPayload>) {
    const text = task.payload?.text ?? 'Contact me at test@example.com or 555-1234';
    return this.detectPII({ action: 'detect_pii', payload: { text } });
  }

  private async analyzeLanguage(task: AgentTask<PIIPayload>) {
    const text = task.payload?.text ?? '';
    const computed = this.detectLanguage(text);

    return {
      success: true,
      language: computed.language,
      confidence: computed.confidence,
      supported: this.supportedLanguages.includes(computed.language)
    };
  }

  private async updatePatterns(task: AgentTask<PIIPayload>) {
    const entity = task.payload?.entity ?? 'EMAIL';
    return {
      success: true,
      entity,
      message: 'Pattern update stub completed'
    };
  }

  private async handleAutonomously(task: AgentTask<PIIPayload>) {
    const description = String(task.task ?? task.payload?.description ?? '');
    if (description.includes('detect')) return this.detectPII(task);
    if (description.includes('configure')) return this.configureEntities(task);
    if (description.includes('analyze')) return this.analyzeEntity(task);
    return this.testDetection(task);
  }

  private async testEntityDetection(entity: string, sample?: string) {
    const text = sample ?? this.generateSampleData(entity);
    const detection = await this.runPresidioDetection(text, this.entityTypes[entity]?.language ?? 'en');
    return detection;
  }

  private calculateEffectiveness(result: Array<Record<string, any>>) {
    if (!Array.isArray(result) || result.length === 0) {
      return 0;
    }
    const confidence = result.reduce((sum, entity) => sum + (entity.confidence ?? 0), 0);
    return confidence / result.length;
  }

  private async updateEntityConfig(entity: string, updates: Partial<EntityConfig>) {
    this.entityTypes[entity] = {
      ...this.entityTypes[entity],
      ...updates
    };
  }

  private detectLanguage(text: string) {
    if (!text) return { language: 'en', confidence: 0.5 };
    const hasPolishCharacters = /[ąćęłńóśźż]/i.test(text);
    return {
      language: hasPolishCharacters ? 'pl' : 'en',
      confidence: hasPolishCharacters ? 0.9 : 0.7
    };
  }

  private determineLanguages(primary: string, text: string) {
    const languages = new Set<string>([primary]);
    if (/[ąćęłńóśźż]/i.test(text)) {
      languages.add('pl');
    }
    return Array.from(languages);
  }

  private async runPresidioDetection(text: string, language: string) {
    // Stubbed response simulating Presidio
    const entities: Array<Record<string, any>> = [];
    if (language === 'en' && /\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
      entities.push({ entity: 'SSN', match: text.match(/\b\d{3}-\d{2}-\d{4}\b/)?.[0], confidence: 0.92 });
    }
    if (/\b\d{11}\b/.test(text)) {
      entities.push({ entity: 'PESEL', match: text.match(/\b\d{11}\b/)?.[0], confidence: 0.95 });
    }
    if (/[^\s]+@[^\s]+\.[^\s]+/.test(text)) {
      entities.push({ entity: 'EMAIL', match: text.match(/[^\s]+@[^\s]+\.[^\s]+/)?.[0], confidence: 0.88 });
    }
    return entities;
  }

  private mergeDetectionResults(
    results: Array<PromiseSettledResult<Array<Record<string, any>>>>
  ) {
    const merged: Array<Record<string, any>> = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        merged.push(...result.value);
      }
    }
    return merged;
  }

  private async applyRegexDetection(text: string) {
    const entities: Array<Record<string, any>> = [];
    const creditCardMatch = text.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/);
    if (creditCardMatch) {
      entities.push({ entity: 'CREDIT_CARD', match: creditCardMatch[0], confidence: 0.8 });
    }
    return entities;
  }

  private deduplicateEntities(entities: Array<Record<string, any>>) {
    const seen = new Set<string>();
    return entities.filter((entity) => {
      const key = `${entity.entity}:${entity.match}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateDetectionStats(entities: Array<Record<string, any>>, languages: string[]) {
    const perEntity: Record<string, number> = {};
    entities.forEach((entity) => {
      perEntity[entity.entity] = (perEntity[entity.entity] ?? 0) + 1;
    });

    return {
      total: entities.length,
      byEntity: perEntity,
      languages
    };
  }

  private hasHighRiskPII(entities: Array<Record<string, any>>) {
    const highRisk = ['SSN', 'CREDIT_CARD', 'PESEL', 'IBAN'];
    return entities.some((entity) => highRisk.includes(entity.entity));
  }

  private generateSampleData(entity: string) {
    switch (entity) {
      case 'EMAIL':
        return 'Contact me at sample@example.com';
      case 'PESEL':
        return 'PESEL: 44051401359';
      case 'CREDIT_CARD':
        return 'Card number 4111 1111 1111 1111';
      default:
        return 'Sample PII data';
    }
  }
}
