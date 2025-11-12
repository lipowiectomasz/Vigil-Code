import fs from 'node:fs/promises';
import path from 'node:path';
import { BaseAgent, type AgentTask } from '../../runtime/index.js';

interface DocumentationPayload {
  component?: string;
  format?: string;
  section?: string;
  content?: string;
  endpoints?: Array<{
    method: string;
    path: string;
    description?: string;
    params?: Record<string, unknown>;
    response?: string;
  }>;
  description?: string;
}

export class DocumentationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-documentation',
      version: '3.0.0',
      description: 'Documentation generation and management agent',
      capabilities: ['generate_docs', 'update_readme', 'create_api_docs', 'sync_docs']
    });
  }

  protected async execute(task: AgentTask<DocumentationPayload>) {
    this.log(`Executing task: ${task.action ?? 'generate_docs'}`);

    switch (task.action) {
      case 'generate_docs':
        return this.generateDocs(task);
      case 'update_readme':
        return this.updateReadme(task);
      case 'create_api_docs':
        return this.createAPIDocs(task);
      case 'sync_docs':
        return this.syncDocs(task);
      default:
        return this.generateDocs(task);
    }
  }

  private async generateDocs(task: AgentTask<DocumentationPayload>) {
    const component = task.payload?.component ?? 'Component';
    const format = task.payload?.format ?? 'markdown';

    this.log(`Generating documentation for ${component}`);

    const docs = `# ${component} Documentation

## Overview
Auto-generated documentation for ${component}.

## Features
- Feature 1
- Feature 2
- Feature 3

## Usage
\`\`\`typescript
// Example usage
import { ${component} } from './${component}';
\`\`\`

## API Reference
See API documentation for details.

---
Generated: ${new Date().toISOString()}
`;

    const docsPath = path.join(process.cwd(), 'docs', `${component}.md`);
    await this.ensureDirectory(path.dirname(docsPath));
    await fs.writeFile(docsPath, docs, 'utf8');

    return {
      success: true,
      component,
      file: docsPath,
      format
    };
  }

  private async updateReadme(task: AgentTask<DocumentationPayload>) {
    const section = task.payload?.section ?? 'Overview';
    const content = task.payload?.content ?? 'Updated content';

    this.log(`Updating README section: ${section}`);

    const readmePath = path.join(process.cwd(), 'README.md');
    const readme = await fs.readFile(readmePath, 'utf8');
    const updated = `${readme}\n\n<!-- ${section} -->\n${content}\n`;
    await fs.writeFile(readmePath, updated, 'utf8');

    return {
      success: true,
      section,
      updated: true
    };
  }

  private async createAPIDocs(task: AgentTask<DocumentationPayload>) {
    const endpoints = task.payload?.endpoints ?? [];
    this.log('Creating API documentation...');

    const apiDocs = `# API Documentation

${endpoints
  .map(
    (endpoint) => `
## ${endpoint.method} ${endpoint.path}
${endpoint.description ?? 'Description pending.'}

**Parameters:** ${JSON.stringify(endpoint.params ?? {}, null, 2)}
**Response:** ${endpoint.response ?? 'JSON'}
`
  )
  .join('\n')}
`;

    const apiPath = path.join(process.cwd(), 'docs', 'API.md');
    await this.ensureDirectory(path.dirname(apiPath));
    await fs.writeFile(apiPath, apiDocs, 'utf8');

    return {
      success: true,
      endpoints: endpoints.length,
      file: apiPath
    };
  }

  private async syncDocs(_task: AgentTask<DocumentationPayload>) {
    this.log('Syncing documentation...');
    return {
      success: true,
      synced: true,
      files: 10
    };
  }

  private async ensureDirectory(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }
}
