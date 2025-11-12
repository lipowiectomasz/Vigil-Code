/**
 * Tech Docs Navigator Agent
 *
 * Centralny hub dokumentacji technicznej dla wszystkich technologii używanych w Vigil Guard.
 * Dostarcza kontekst techniczny innym agentom, wskazuje best practices, ostrzega przed pułapkami
 * i pomaga w rozwiązywaniu problemów związanych z konkretnymi technologiami.
 *
 * @version 1.0.0
 */

const BaseAgent = require('../../core/base-agent');
const fs = require('fs').promises;
const path = require('path');

class TechDocsNavigator extends BaseAgent {
  constructor() {
    super({
      name: 'vg-tech-docs-navigator',
      version: '1.0.0',
      description: 'Centralny hub dokumentacji technicznej dla wszystkich technologii używanych w Vigil Guard',
      capabilities: [
        'query_docs',           // Zapytania o dokumentację konkretnej technologii
        'get_best_practices',   // Dostarczanie best practices
        'check_pitfalls',       // Wykrywanie znanych problemów
        'find_examples',        // Wyszukiwanie przykładów z projektu
        'search_api',           // Wyszukiwanie w całej bazie API
        'get_tech_overview',    // Przegląd technologii
        'suggest_fix',          // Sugerowanie rozwiązań dla błędów
        'list_technologies'     // Lista wszystkich technologii
      ],
      dependencies: []
    });

    this.techStack = null;
    this.techStackPath = path.join(__dirname, 'tech-stack.json');
  }

  /**
   * Inicjalizacja agenta - załadowanie tech-stack.json
   */
  async onInitialize() {
    this.log('Initializing Tech Docs Navigator...');
    await this.loadTechStack();
    this.log(`Tech stack loaded: ${this.getTechCount()} technologies`);
  }

  /**
   * Główna metoda wykonawcza
   */
  async execute(task) {
    const { action, payload } = task;

    this.log(`Executing action: ${action}`);

    switch (action) {
      case 'query_docs':
        return await this.queryDocs(payload);

      case 'get_best_practices':
        return await this.getBestPractices(payload);

      case 'check_pitfalls':
        return await this.checkPitfalls(payload);

      case 'find_examples':
        return await this.findExamples(payload);

      case 'search_api':
        return await this.searchAPI(payload);

      case 'get_tech_overview':
        return await this.getTechOverview(payload);

      case 'suggest_fix':
        return await this.suggestFix(payload);

      case 'list_technologies':
        return await this.listTechnologies(payload);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Obsługa zapytań od innych agentów
   */
  async onQuery(query) {
    const { action, ...payload } = query;
    return await this.execute({ action, payload });
  }

  /**
   * 1. Zapytanie o dokumentację konkretnej technologii
   */
  async queryDocs(payload) {
    const { technology, topic } = payload;

    // Reload tech stack (może być zaktualizowany)
    await this.loadTechStack();

    const tech = this.getTechnology(technology);

    if (!tech) {
      return this.suggestSimilarTech(technology);
    }

    // Jeśli podano topic, szukamy w quick_links
    if (topic) {
      return this.findRelevantDocs(tech, topic);
    }

    // Zwróć pełny przegląd technologii
    return {
      found: true,
      technology: tech.name,
      version: tech.version,
      category: tech.category,
      documentation: tech.official_docs,
      quick_links: tech.quick_links,
      used_in: tech.used_in,
      summary: `${tech.name} (${tech.version}) - ${tech.category} technology used in ${tech.used_in.join(', ')}`
    };
  }

  /**
   * 2. Dostarczanie best practices
   */
  async getBestPractices(payload) {
    const { technology, context } = payload;

    const tech = this.getTechnology(technology);

    if (!tech) {
      return { found: false, error: `Technology '${technology}' not found` };
    }

    const result = {
      found: true,
      technology: tech.name,
      best_practices: tech.best_practices || [],
      vigil_guard_patterns: tech.vigil_guard_patterns || []
    };

    // Jeśli podano kontekst, filtrujemy relevantne practices
    if (context) {
      result.contextual_recommendations = this.getContextualRecommendations(tech, context);
    }

    return result;
  }

  /**
   * 3. Sprawdzanie znanych pułapek (pitfalls)
   */
  async checkPitfalls(payload) {
    const { technology, code, symptom } = payload;

    const tech = this.getTechnology(technology);

    if (!tech) {
      return { found: false, error: `Technology '${technology}' not found` };
    }

    const pitfalls = tech.known_pitfalls || [];

    // Jeśli podano symptom, filtrujemy po opisie
    let relevantPitfalls = pitfalls;

    if (symptom) {
      relevantPitfalls = this.matchPitfallsBySymptom(pitfalls, symptom);
    }

    // Jeśli podano kod, szukamy pattern matching
    if (code) {
      relevantPitfalls = this.matchPitfallsByCode(pitfalls, code);
    }

    return {
      found: relevantPitfalls.length > 0,
      technology: tech.name,
      pitfalls: relevantPitfalls,
      suggestions: relevantPitfalls.map(p => ({
        issue: p.issue,
        solution: p.solution,
        example: p.example,
        vigil_guard_fix: p.vigil_guard_fix
      }))
    };
  }

  /**
   * 4. Wyszukiwanie przykładów z projektu Vigil Guard
   */
  async findExamples(payload) {
    const { technology, pattern } = payload;

    const tech = this.getTechnology(technology);

    if (!tech) {
      return { found: false, error: `Technology '${technology}' not found` };
    }

    const allPatterns = tech.vigil_guard_patterns || [];

    // Filtruj po pattern name
    let examples = allPatterns;
    if (pattern) {
      const searchLower = pattern.toLowerCase();
      examples = allPatterns.filter(p =>
        p.pattern.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    return {
      found: examples.length > 0,
      technology: tech.name,
      pattern,
      examples: examples.map(e => ({
        pattern: e.pattern,
        file: e.file,
        lines: e.lines,
        description: e.description
      }))
    };
  }

  /**
   * 5. Wyszukiwanie API w całej bazie wiedzy
   */
  async searchAPI(payload) {
    const { query } = payload;

    if (!query || query.trim().length === 0) {
      return { found: false, error: 'Query string is required' };
    }

    const results = [];
    const searchLower = query.toLowerCase();

    for (const [techKey, tech] of Object.entries(this.techStack.technologies)) {
      const apis = tech.common_apis || [];

      const matchingAPIs = apis.filter(api =>
        api.name.toLowerCase().includes(searchLower) ||
        api.description.toLowerCase().includes(searchLower) ||
        (api.example && api.example.toLowerCase().includes(searchLower))
      );

      if (matchingAPIs.length > 0) {
        results.push({
          technology: tech.name,
          version: tech.version,
          documentation: tech.official_docs,
          apis: matchingAPIs
        });
      }
    }

    return {
      found: results.length > 0,
      query,
      total_results: results.length,
      results
    };
  }

  /**
   * 6. Przegląd technologii
   */
  async getTechOverview(payload) {
    const { technology } = payload;

    const tech = this.getTechnology(technology);

    if (!tech) {
      return { found: false, error: `Technology '${technology}' not found` };
    }

    return {
      found: true,
      name: tech.name,
      version: tech.version,
      category: tech.category,
      documentation: tech.official_docs,
      quick_links: tech.quick_links,
      used_in: tech.used_in,
      common_apis_count: (tech.common_apis || []).length,
      known_pitfalls_count: (tech.known_pitfalls || []).length,
      vigil_guard_patterns_count: (tech.vigil_guard_patterns || []).length,
      best_practices_count: (tech.best_practices || []).length,
      related_technologies: this.findRelatedTech(tech)
    };
  }

  /**
   * 7. Sugerowanie rozwiązań dla błędów
   */
  async suggestFix(payload) {
    const { error, technology, context } = payload;

    const tech = this.getTechnology(technology);

    if (!tech) {
      return { found: false, error: `Technology '${technology}' not found` };
    }

    const pitfalls = tech.known_pitfalls || [];

    // Match error message to known pitfalls
    const matchedPitfalls = this.matchErrorToPitfalls(error, pitfalls);

    if (matchedPitfalls.length > 0) {
      return {
        found: true,
        technology: tech.name,
        error_matched: true,
        solutions: matchedPitfalls.map(p => ({
          issue: p.issue,
          description: p.description,
          solution: p.solution,
          example: p.example,
          vigil_guard_fix: p.vigil_guard_fix
        }))
      };
    }

    // Jeśli brak dopasowania, zwróć ogólne best practices
    return {
      found: true,
      technology: tech.name,
      error_matched: false,
      message: 'No exact match found for this error',
      suggestions: [
        {
          type: 'documentation',
          message: `Check official documentation: ${tech.official_docs}`,
          links: tech.quick_links
        },
        {
          type: 'best_practices',
          message: 'Review best practices for this technology',
          practices: tech.best_practices
        }
      ]
    };
  }

  /**
   * 8. Lista wszystkich technologii
   */
  async listTechnologies(payload) {
    const { category } = payload;

    const technologies = Object.entries(this.techStack.technologies).map(([key, tech]) => ({
      key,
      name: tech.name,
      version: tech.version,
      category: tech.category,
      used_in: tech.used_in
    }));

    // Filtruj po kategorii jeśli podano
    const filtered = category
      ? technologies.filter(t => t.category === category)
      : technologies;

    return {
      total: filtered.length,
      category: category || 'all',
      categories: Object.keys(this.techStack.categories || {}),
      technologies: filtered
    };
  }

  /**
   * Helper: Załaduj tech-stack.json
   */
  async loadTechStack() {
    try {
      const content = await fs.readFile(this.techStackPath, 'utf-8');
      this.techStack = JSON.parse(content);
      this.log(`Tech stack loaded: ${this.techStack.stats.total_technologies} technologies`);
    } catch (error) {
      this.log(`Failed to load tech stack: ${error.message}`, 'error');
      throw new Error(`Could not load tech-stack.json: ${error.message}`);
    }
  }

  /**
   * Helper: Pobierz technologię (case-insensitive)
   */
  getTechnology(name) {
    if (!name) return null;

    const nameLower = name.toLowerCase();

    // Szukaj po kluczu
    if (this.techStack.technologies[nameLower]) {
      return this.techStack.technologies[nameLower];
    }

    // Szukaj po nazwie technologii
    for (const tech of Object.values(this.techStack.technologies)) {
      if (tech.name.toLowerCase() === nameLower) {
        return tech;
      }
    }

    return null;
  }

  /**
   * Helper: Sugeruj podobne technologie
   */
  suggestSimilarTech(name) {
    const allTechNames = Object.keys(this.techStack.technologies);

    // Proste similarity matching (można rozbudować o Levenshtein)
    const similar = allTechNames.filter(tech =>
      tech.includes(name.toLowerCase()) || name.toLowerCase().includes(tech)
    );

    return {
      found: false,
      error: `Technology '${name}' not found`,
      suggestions: similar.length > 0 ? similar : ['Check /vg-docs list for all technologies']
    };
  }

  /**
   * Helper: Znajdź relevantne linki do dokumentacji dla danego topic
   */
  findRelevantDocs(tech, topic) {
    const topicLower = topic.toLowerCase();
    const quickLinks = tech.quick_links || {};

    // Szukaj w quick_links
    const matchedLinks = Object.entries(quickLinks).filter(([key, url]) =>
      key.toLowerCase().includes(topicLower) || topicLower.includes(key.toLowerCase())
    );

    if (matchedLinks.length > 0) {
      return {
        found: true,
        technology: tech.name,
        topic,
        links: Object.fromEntries(matchedLinks),
        main_docs: tech.official_docs
      };
    }

    return {
      found: false,
      technology: tech.name,
      topic,
      message: `No specific documentation found for topic '${topic}'`,
      main_docs: tech.official_docs,
      available_topics: Object.keys(quickLinks)
    };
  }

  /**
   * Helper: Kontekstualne rekomendacje
   */
  getContextualRecommendations(tech, context) {
    const contextLower = context.toLowerCase();
    const practices = tech.best_practices || [];

    // Filtruj practices relevantne do kontekstu
    return practices.filter(practice =>
      practice.toLowerCase().includes(contextLower)
    );
  }

  /**
   * Helper: Match pitfalls by symptom description
   */
  matchPitfallsBySymptom(pitfalls, symptom) {
    const symptomLower = symptom.toLowerCase();

    return pitfalls.filter(p =>
      p.issue.toLowerCase().includes(symptomLower) ||
      p.description.toLowerCase().includes(symptomLower)
    );
  }

  /**
   * Helper: Match pitfalls by code pattern
   */
  matchPitfallsByCode(pitfalls, code) {
    const codeLower = code.toLowerCase();

    return pitfalls.filter(p => {
      if (!p.example) return false;

      // Szukaj wzorców z example w kodzie
      const exampleSnippets = p.example.toLowerCase().split(' ');
      return exampleSnippets.some(snippet => codeLower.includes(snippet));
    });
  }

  /**
   * Helper: Match error message to pitfalls
   */
  matchErrorToPitfalls(error, pitfalls) {
    const errorLower = error.toLowerCase();

    return pitfalls.filter(p =>
      errorLower.includes(p.issue.toLowerCase()) ||
      p.description.toLowerCase().includes(errorLower.substring(0, 50))
    );
  }

  /**
   * Helper: Znajdź powiązane technologie (ta sama kategoria)
   */
  findRelatedTech(tech) {
    const category = tech.category;
    const related = [];

    for (const [key, t] of Object.entries(this.techStack.technologies)) {
      if (t.category === category && t.name !== tech.name) {
        related.push({
          name: t.name,
          version: t.version
        });
      }
    }

    return related;
  }

  /**
   * Helper: Liczba technologii w bazie
   */
  getTechCount() {
    return Object.keys(this.techStack.technologies || {}).length;
  }
}

// Export dla użycia w innych modułach
module.exports = TechDocsNavigator;

// Standalone execution (dla testów)
if (require.main === module) {
  const agent = new TechDocsNavigator();

  // Mock runtime
  const mockRuntime = {
    messageBus: {
      register: () => {},
      send: () => Promise.resolve({ success: true }),
      sendAndWait: () => Promise.resolve({ success: true, result: {} })
    },
    stateManager: {
      loadAgentState: () => Promise.resolve(null),
      saveAgentState: () => Promise.resolve()
    },
    orchestrator: null
  };

  // Inicjalizacja i test
  (async () => {
    try {
      await agent.initialize(mockRuntime);

      // Parse command line arguments
      const args = process.argv.slice(2);
      const action = args[0] || 'list_technologies';
      const techParam = args[1];
      const topicParam = args[2];

      let payload = {};

      switch (action) {
        case 'query_docs':
          payload = { technology: techParam, topic: topicParam };
          break;
        case 'get_best_practices':
          payload = { technology: techParam };
          break;
        case 'check_pitfalls':
          payload = { technology: techParam, symptom: topicParam };
          break;
        case 'find_examples':
          payload = { technology: techParam, pattern: topicParam };
          break;
        case 'search_api':
          payload = { query: techParam };
          break;
        case 'get_tech_overview':
          payload = { technology: techParam };
          break;
        case 'list_technologies':
          payload = { category: techParam };
          break;
        default:
          console.log('Unknown action. Available: query_docs, get_best_practices, check_pitfalls, find_examples, search_api, get_tech_overview, list_technologies');
          process.exit(1);
      }

      const result = await agent.execute({ action, payload });
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
