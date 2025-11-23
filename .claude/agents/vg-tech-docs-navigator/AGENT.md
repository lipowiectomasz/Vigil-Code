# vg-tech-docs-navigator

**Version:** 1.0.0
**Type:** Helper Agent
**Status:** Production Ready

## Overview

Tech Docs Navigator is a centralized documentation hub for all 41+ technologies used in Vigil Guard. This agent provides technical context to other agents, points to best practices, warns about known pitfalls, and helps solve technology-specific problems.

### Unique Value Proposition

Unlike `vg-documentation` (which synchronizes .md files), Tech Docs Navigator is a **LIVING KNOWLEDGE BASE** about technologies - it answers questions, suggests solutions, and provides examples from the Vigil Guard codebase.

## Capabilities

The agent supports 8 primary actions:

1. **query_docs** - Query documentation for specific technology
2. **get_best_practices** - Get best practices and Vigil Guard patterns
3. **check_pitfalls** - Check for known issues and pitfalls
4. **find_examples** - Find code examples from Vigil Guard project
5. **search_api** - Search across all technologies' APIs
6. **get_tech_overview** - Get comprehensive technology overview
7. **suggest_fix** - Suggest fixes for error messages
8. **list_technologies** - List all technologies (with optional category filter)

## Supported Technologies (15 Core + 26 Pending)

### Currently Implemented (15)

#### Backend (3)
- **Express.js** (^4.19.2) - Web framework
- **bcryptjs** (^2.4.3) - Password hashing
- **jsonwebtoken** (^9.0.2) - JWT authentication

#### Frontend (3)
- **React** (^18.3.1) - UI library
- **Vite** (^5.4.0) - Build tool
- **Tailwind CSS** (^4.0.0) - Styling framework

#### Testing (1)
- **Vitest** (^1.6.1) - Test framework

#### Database & Monitoring (2)
- **ClickHouse** (25.10.1) - Analytics database
- **Grafana** (12.2.1) - Monitoring dashboards

#### AI & PII (2)
- **Microsoft Presidio** (2.2.355) - PII detection
- **spaCy** (>=3.7.0) - NLP engine

#### Infrastructure (3)
- **Docker** (latest) - Containerization
- **n8n** (1.118.2) - Workflow engine
- **Caddy** (2-alpine) - Reverse proxy

#### Language (1)
- **TypeScript** (^5.5.4) - Type-safe JavaScript

### Planned for Etap 3 (26 Additional)

- Node.js, better-sqlite3, express-rate-limit, express-session, cors, dotenv, tsx, axios
- React DOM, React Router, @tailwindcss/vite, lightningcss, lucide-react, react-hot-toast
- react-markdown, @radix-ui/react-tabs, focus-trap-react, fuse.js
- langdetect, transformers, pl_core_news_lg, en_core_web_lg
- @vitest/coverage-v8, Docker Compose, nginx
- Chrome Manifest v3, Flask, FastAPI

## Usage Examples

### For Other Agents (via Message Bus)

```javascript
// Example 1: Frontend UI Agent needs help with React
const help = await messageBus.send({
  to: 'vg-tech-docs-navigator',
  type: 'query',
  payload: {
    action: 'check_pitfalls',
    technology: 'react',
    symptom: 'controlled component not updating visually'
  }
});

// Response:
{
  found: true,
  technology: 'React',
  pitfalls: [{
    issue: 'Controlled components not updating visually',
    solution: 'Use getCurrentValue() helper to merge original + pending state',
    vigil_guard_fix: 'services/web-ui/frontend/src/components/ConfigSection.tsx:59-72'
  }]
}
```

```javascript
// Example 2: Backend API Agent needs Express best practices
const practices = await messageBus.send({
  to: 'vg-tech-docs-navigator',
  type: 'query',
  payload: {
    action: 'get_best_practices',
    technology: 'express'
  }
});

// Response:
{
  found: true,
  technology: 'Express.js',
  best_practices: [
    'Always use async error wrapper for async route handlers',
    'Implement proper CORS configuration',
    // ... more
  ],
  vigil_guard_patterns: [
    {
      pattern: 'JWT Authentication Middleware',
      file: 'services/web-ui/backend/src/auth.ts',
      lines: '99-111'
    }
  ]
}
```

```javascript
// Example 3: Search for API across all technologies
const apiResults = await messageBus.send({
  to: 'vg-tech-docs-navigator',
  type: 'query',
  payload: {
    action: 'search_api',
    query: 'hash password'
  }
});

// Response:
{
  found: true,
  query: 'hash password',
  total_results: 1,
  results: [{
    technology: 'bcryptjs',
    version: '^2.4.3',
    apis: [
      {
        name: 'bcrypt.hash(password, rounds)',
        description: 'Hash password asynchronously',
        example: "const hash = await bcrypt.hash('password123', 12)"
      }
    ]
  }]
}
```

### For Users (via Slash Commands)

```bash
# Get Express documentation overview
/vg-docs express

# Specific topic
/vg-docs react hooks

# Search for API
/vg-docs search "rate limiting"

# List all technologies
/vg-docs list

# List by category
/vg-docs list frontend
```

### Standalone CLI (for testing)

```bash
# Navigate to agent directory
cd .claude/agents/vg-tech-docs-navigator

# Query documentation
node agent.js query_docs express

# Get best practices
node agent.js get_best_practices react

# Check pitfalls
node agent.js check_pitfalls react "component not updating"

# Find examples
node agent.js find_examples express "JWT"

# Search API
node agent.js search_api "hash"

# Get overview
node agent.js get_tech_overview vitest

# List all technologies
node agent.js list_technologies

# List by category
node agent.js list_technologies frontend
```

## Integration with Master Orchestrator

The Master Orchestrator automatically invokes Tech Docs Navigator when:

1. **Agent encounters an error** - Orchestrator asks Tech Docs for suggestions
2. **User query mentions technology** - Task classifier routes to Tech Docs
3. **Best practices needed** - During code review or implementation

### Workflow Integration Example

```javascript
// workflow-executor.js (Master Orchestrator)
async executeWithTechDocs(step, context) {
  // 1. Agent executes task
  const result = await this.executeStep(step, context);

  // 2. If error, ask Tech Docs for help
  if (result.status === 'error') {
    const techHelp = await messageBus.send({
      to: 'vg-tech-docs-navigator',
      type: 'query',
      payload: {
        action: 'suggest_fix',
        error: result.error.message,
        technology: this.detectTechnology(step),
        context: { step, previousSteps: context.completed }
      }
    });

    result.techSuggestion = techHelp;
  }

  return result;
}
```

## Tech Stack Structure

### tech-stack.json Schema

Each technology in `tech-stack.json` contains:

```json
{
  "express": {
    "name": "Express.js",
    "version": "^4.19.2",
    "category": "backend",
    "official_docs": "https://expressjs.com/en/5x/api.html",
    "quick_links": {
      "routing": "https://...",
      "middleware": "https://..."
    },
    "used_in": ["services/web-ui/backend"],
    "common_apis": [
      {
        "name": "app.use(middleware)",
        "description": "Mount middleware",
        "example": "app.use(express.json())"
      }
    ],
    "known_pitfalls": [
      {
        "issue": "Middleware order matters",
        "description": "express.json() must be before routes",
        "solution": "Place body parsers before route definitions",
        "example": "app.use(express.json()); // MUST come before routes"
      }
    ],
    "vigil_guard_patterns": [
      {
        "pattern": "JWT Authentication Middleware",
        "file": "services/web-ui/backend/src/auth.ts",
        "lines": "99-111",
        "description": "authMiddleware implementation"
      }
    ],
    "best_practices": [
      "Always use async error wrapper",
      "Implement proper CORS configuration"
    ]
  }
}
```

## Known Patterns and Pitfalls Coverage

### Top Pitfalls by Technology

1. **React** - Controlled components not updating (getCurrentValue() pattern)
2. **Express** - Middleware order, error handler arity, headers after sent
3. **Vitest** - Webhook timeout in sequential mode
4. **Docker** - Port conflicts, volume permissions
5. **ClickHouse** - Map type handling, TTL configuration
6. **n8n** - Workflow changes not persisted, flags lost in Code nodes
7. **Presidio** - Entity deduplication, AnalysisExplanation serialization
8. **Vite** - Base path for deployment
9. **Tailwind v4** - CSS-first configuration (@theme directive)
10. **JWT** - Weak secret, no expiration

### Vigil Guard-Specific Patterns

- **getCurrentValue() Helper** (React) - ConfigSection.tsx:59-72
- **JWT Auth Middleware** (Express) - auth.ts:99-111
- **Dual-Language PII Detection** (Presidio) - piiAnalyzer.ts
- **Flag Preservation** (n8n) - Vigil-Guard-v1.8.1.json
- **Webhook Testing** (Vitest) - tests/helpers/webhook.js

## Performance Characteristics

- **Response Time:** <100ms (in-memory JSON lookup)
- **Memory Footprint:** ~5 MB (tech-stack.json fully loaded)
- **Cache:** No caching (reload on each query for fresh data)
- **Concurrency:** Fully stateless, supports parallel queries

## Maintenance

### Updating tech-stack.json

```bash
# Manual update (when dependency versions change)
nano .claude/agents/vg-tech-docs-navigator/tech-stack.json

# Update version field
"version": "^4.20.0"  # Example: Express updated

# Add new technology
{
  "new-tech": {
    "name": "New Technology",
    "version": "1.0.0",
    // ... rest of schema
  }
}
```

### Validation

```bash
# Test after changes
node agent.js list_technologies

# Verify specific technology
node agent.js get_tech_overview new-tech
```

## Roadmap

### Etap 2 (Current) - Integration
- [ ] Slash command `/vg-docs`
- [ ] Task classifier integration
- [ ] Master Orchestrator integration
- [ ] Inter-agent testing

### Etap 3 (Next) - Expansion
- [ ] Add 26 remaining technologies
- [ ] Complete all known_pitfalls
- [ ] Complete all vigil_guard_patterns
- [ ] Implement advanced search

### Etap 4 (Future) - Advanced Features
- [ ] Semantic search with embeddings
- [ ] Live docs fetching from official sources
- [ ] Code analysis for anti-pattern detection
- [ ] Interactive tutorials generation

## Dependencies

- **Node.js** (>=18.0.0) - Runtime
- **fs/promises** - File system access
- **path** - Path manipulation
- **BaseAgent** - Core agent functionality

## Environment

No environment variables required. All data is in `tech-stack.json`.

## Error Handling

```javascript
// Technology not found
{
  found: false,
  error: "Technology 'unknown' not found",
  suggestions: ['express', 'react'] // Similar technologies
}

// Empty query
{
  found: false,
  error: "Query string is required"
}

// No matches found
{
  found: false,
  message: "No results found",
  suggestions: [/* alternative approaches */]
}
```

## Contributing

When adding new technology to Vigil Guard:

1. **Update package.json** - Add dependency
2. **Update tech-stack.json** - Add technology entry with:
   - Official documentation link
   - Quick links (3-5 most important sections)
   - Common APIs (5-10 most used)
   - Known pitfalls (from experience or research)
   - Vigil Guard patterns (file locations)
   - Best practices (5-10 items)
3. **Test** - `node agent.js get_tech_overview new-tech`
4. **Commit** - Include tech-stack.json in commit

## FAQ

**Q: How is this different from vg-documentation agent?**
A: `vg-documentation` manages .md files and documentation generation. `vg-tech-docs-navigator` is a QUERY-ABLE knowledge base about technologies - it answers questions, suggests fixes, and provides examples.

**Q: Do I need to update this agent when adding new code?**
A: Only when adding NEW technologies or discovering NEW pitfalls/patterns. Existing patterns are already documented.

**Q: Can I add my own technology?**
A: Yes! Edit `tech-stack.json` and follow the schema. All technologies used in Vigil Guard should be documented.

**Q: What if I find a bug in tech-stack.json?**
A: File an issue or create PR with fix. The agent loads JSON on each query, so changes take effect immediately.

**Q: How do I test changes to tech-stack.json?**
A: Run `node agent.js list_technologies` to verify JSON is valid, then test specific technology with `node agent.js get_tech_overview <tech>`.

## License

MIT License - Same as Vigil Guard project

## Changelog

### v1.0.0 (2025-11-09)
- Initial release
- 15 core technologies documented
- 8 primary capabilities
- Full integration with BaseAgent
- Standalone CLI support
- Message bus integration ready
- 95+ best practices documented
- 17+ known pitfalls documented
- 20+ Vigil Guard patterns documented

---

**Last Updated:** 2025-11-09
**Maintained By:** Vigil Guard Team
**Agent Status:** ✅ Production Ready
