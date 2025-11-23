import fs from 'node:fs/promises';
import path from 'node:path';
import { BaseAgent, type AgentTask } from '../../runtime/index.js';

interface FrontendPayload {
  name?: string;
  type?: 'functional' | 'class';
  props?: string[];
  features?: string[];
  component?: string;
  styles?: Record<string, string>;
  theme?: Record<string, unknown>;
  context?: Record<string, unknown>;
  endpoint?: string;
  method?: string;
  auth?: boolean;
  state?: Record<string, unknown>;
  form?: { fields: Array<{ name: string; type: string; label: string }> };
  route?: { path: string; component: string };
  description?: string;
}

export class FrontendUIAgent extends BaseAgent {
  private readonly frontendPath = path.join(process.cwd(), 'services', 'web-ui', 'frontend', 'src');
  private readonly componentsPath = path.join(this.frontendPath, 'components');

  constructor() {
    super({
      name: 'vg-frontend-ui',
      version: '3.0.0',
      description: 'Autonomous React UI development and Tailwind CSS styling agent',
      capabilities: [
        'create_component',
        'update_styles',
        'integrate_api',
        'manage_state',
        'optimize_performance',
        'fix_controlled_components',
        'create_form',
        'add_routing'
      ],
      dependencies: ['vg-backend-api']
    });
  }

  protected async execute(task: AgentTask<FrontendPayload>) {
    this.log(`Executing task: ${task.action ?? 'auto'}`);

    switch (task.action) {
      case 'create_component':
        return this.createComponent(task);
      case 'update_styles':
        return this.updateStyles(task);
      case 'integrate_api':
        return this.integrateAPI(task);
      case 'manage_state':
        return this.manageState(task);
      case 'optimize_performance':
        return this.optimizePerformance(task);
      case 'fix_controlled_components':
        return this.fixControlledComponents(task);
      case 'create_form':
        return this.createForm(task);
      case 'add_routing':
        return this.addRouting(task);
      default:
        return this.handleAutonomously(task);
    }
  }

  private async createComponent(task: AgentTask<FrontendPayload>) {
    const name = task.payload?.name ?? 'GeneratedComponent';
    const type = task.payload?.type ?? 'functional';
    const props = task.payload?.props ?? [];
    const features = task.payload?.features ?? [];

    const componentPath = path.join(this.componentsPath, `${name}.tsx`);
    await this.ensureDir(this.componentsPath);

    const componentCode =
      type === 'class'
        ? this.generateClassComponent(name, props, features)
        : this.generateFunctionalComponent(name, props, features);

    await fs.writeFile(componentPath, componentCode, 'utf8');

    let stylesFile: string | null = null;
    if (features.includes('styles')) {
      const stylesPath = path.join(this.componentsPath, `${name}.module.css`);
      await fs.writeFile(stylesPath, this.generateComponentStyles(name), 'utf8');
      stylesFile = path.basename(stylesPath);
    }

    let testFile: string | null = null;
    if (features.includes('tests')) {
      const testPath = path.join(this.componentsPath, `${name}.test.tsx`);
      await fs.writeFile(testPath, this.generateComponentTest(name), 'utf8');
      testFile = path.basename(testPath);
    }

    return {
      success: true,
      component: name,
      type,
      files: {
        component: path.basename(componentPath),
        styles: stylesFile,
        tests: testFile
      },
      features
    };
  }

  private async updateStyles(task: AgentTask<FrontendPayload>) {
    const component = task.payload?.component;
    const styles = task.payload?.styles ?? {};
    const theme = task.payload?.theme;

    const updates: string[] = [];

    if (component && Object.keys(styles).length > 0) {
      const componentFile = path.join(this.componentsPath, `${component}.tsx`);
      try {
        let content = await fs.readFile(componentFile, 'utf8');
        for (const [selector, newClasses] of Object.entries(styles)) {
          const regex = new RegExp(`className=["'\`]${selector}["'\`]`, 'g');
          content = content.replace(regex, `className="${newClasses}"`);
        }
        await fs.writeFile(componentFile, content, 'utf8');
        updates.push(`Updated ${component} styles`);
      } catch (error) {
        this.log(`Failed to update ${component}: ${(error as Error).message}`, 'error');
      }
    }

    if (theme) {
      const tailwindConfig = path.join(this.frontendPath, '..', 'tailwind.config.js');
      try {
        let config = await fs.readFile(tailwindConfig, 'utf8');
        const themeUpdates = this.generateThemeUpdates(theme);
        config = this.updateTailwindConfig(config, themeUpdates);
        await fs.writeFile(tailwindConfig, config, 'utf8');
        updates.push('Updated Tailwind theme');
      } catch (error) {
        this.log(`Failed to update Tailwind theme: ${(error as Error).message}`, 'warn');
      }
    }

    return {
      success: true,
      updates,
      tailwindClasses: this.suggestTailwindClasses(task.payload?.context)
    };
  }

  private async integrateAPI(task: AgentTask<FrontendPayload>) {
    const component = task.payload?.component;
    const endpoint = task.payload?.endpoint ?? '/api/example';
    const method = (task.payload?.method ?? 'GET').toUpperCase();
    const auth = task.payload?.auth ?? true;

    const hookName = `use${this.capitalize(this.sanitizeName(endpoint))}`;
    const hooksPath = path.join(this.frontendPath, 'hooks');
    await this.ensureDir(hooksPath);

    const hookCode = this.generateAPIHook(endpoint, method, auth);
    await fs.writeFile(path.join(hooksPath, `${hookName}.ts`), hookCode, 'utf8');

    if (component) {
      await this.updateComponentWithHook(component, hookName);
    }

    return {
      success: true,
      component,
      endpoint,
      hook: `${hookName}.ts`
    };
  }

  private async manageState(task: AgentTask<FrontendPayload>) {
    const component = task.payload?.component ?? 'Dashboard';
    const state = task.payload?.state ?? { loading: false };
    await this.updateComponentState(component, state);

    return {
      success: true,
      component,
      stateKeys: Object.keys(state)
    };
  }

  private async optimizePerformance(task: AgentTask<FrontendPayload>) {
    const component = task.payload?.component ?? 'Dashboard';
    return {
      success: true,
      component,
      recommendations: [
        'Use React.memo for memoizable child components',
        'Defer heavy computations with useMemo',
        'Batch state updates to reduce re-renders'
      ]
    };
  }

  private async fixControlledComponents(task: AgentTask<FrontendPayload>) {
    const component = task.payload?.component ?? 'Form';
    return {
      success: true,
      component,
      fixes: [
        'Ensure value and onChange props are provided',
        'Default undefined values to empty string',
        'Synchronize state updates before form submission'
      ]
    };
  }

  private async createForm(task: AgentTask<FrontendPayload>) {
    const name = task.payload?.name ?? 'GeneratedForm';
    const fields = task.payload?.form?.fields ?? [{ name: 'email', type: 'email', label: 'Email' }];

    const formComponent = this.generateFormComponent(name, fields);
    const componentPath = path.join(this.componentsPath, `${name}.tsx`);
    await this.ensureDir(this.componentsPath);
    await fs.writeFile(componentPath, formComponent, 'utf8');

    return {
      success: true,
      form: name,
      fields: fields.length,
      component: `${name}.tsx`
    };
  }

  private async addRouting(task: AgentTask<FrontendPayload>) {
    const routerFile = path.join(this.frontendPath, 'AppRoutes.tsx');
    let content: string;
    try {
      content = await fs.readFile(routerFile, 'utf8');
    } catch {
      content = this.generateRouterTemplate();
    }

    const route = task.payload?.route ?? { path: '/example', component: 'ExamplePage' };
    content = this.insertRoute(content, route);
    await fs.writeFile(routerFile, content, 'utf8');

    return {
      success: true,
      route,
      file: 'AppRoutes.tsx'
    };
  }

  private async handleAutonomously(task: AgentTask<FrontendPayload>) {
    const description = String(task.task ?? task.payload?.description ?? '');
    if (description.includes('component')) return this.createComponent(task);
    if (description.includes('styles')) return this.updateStyles(task);
    if (description.includes('api')) return this.integrateAPI(task);
    if (description.includes('form')) return this.createForm(task);
    return this.manageState(task);
  }

  private generateFunctionalComponent(name: string, props: string[], features: string[]) {
    const propList = props.length > 0 ? `{ ${props.join(', ')} }` : '';
    const useState = features.includes('state')
      ? "const [state, setState] = React.useState({ loading: false });\n"
      : '';

    return `import React from 'react';

interface ${name}Props {
${props.map((prop) => `  ${prop}?: any;`).join('\n')}
}

export const ${name}: React.FC<${name}Props> = (${propList}) => {
  ${useState}return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-2">${name}</h2>
      <p className="text-slate-400">Generated component ready for customization.</p>
    </div>
  );
};
`;
  }

  private generateClassComponent(name: string, props: string[], features: string[]) {
    const state = features.includes('state')
      ? '  state = { loading: false };\n\n'
      : '';
    return `import React, { Component } from 'react';

interface ${name}Props {
${props.map((prop) => `  ${prop}?: any;`).join('\n')}
}

export class ${name} extends Component<${name}Props> {
${state}  render() {
    return (
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-2">${name}</h2>
        <p className="text-slate-400">Generated class component ready for customization.</p>
      </div>
    );
  }
}
`;
  }

  private generateComponentStyles(name: string) {
    return `.${name.toLowerCase()} {
  @apply bg-slate-900 text-slate-100 rounded-lg shadow-lg p-6 transition-all;
}

.${name.toLowerCase()}-header {
  @apply text-2xl font-semibold mb-4;
}
`;
  }

  private generateComponentTest(name: string) {
    return `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });
});
`;
  }

  private generateAPIHook(endpoint: string, method: string, auth: boolean) {
    return `import { useCallback, useState } from 'react';

export function use${this.capitalize(this.sanitizeName(endpoint))}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (payload?: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('${endpoint}', {
        method: '${method}',
        headers: {
          'Content-Type': 'application/json'${auth ? ",\n          Authorization: `Bearer ${localStorage.getItem('token')}`" : ''}
        },
        ${method === 'GET' ? '' : 'body: JSON.stringify(payload ?? {}),'}
      });

      if (!response.ok) {
        throw new Error(\`Request failed with status \${response.status}\`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}
`;
  }

  private generateFormComponent(name: string, fields: Array<{ name: string; type: string; label: string }>) {
    return `import React from 'react';

interface ${name}FormState {
${fields.map((field) => `  ${field.name}: string;`).join('\n')}
}

export const ${name}: React.FC = () => {
  const [form, setForm] = React.useState<${name}FormState>({
${fields.map((field) => `    ${field.name}: '',`).join('\n')}
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Submitting form', form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
${fields
  .map(
    (field) => `      <div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="${field.name}">
          ${field.label}
        </label>
        <input
          id="${field.name}"
          name="${field.name}"
          type="${field.type}"
          value={form.${field.name}}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800 border border-slate-700 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>`
  )
  .join('\n')}
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Submit
      </button>
    </form>
  );
};
`;
  }

  private generateRouterTemplate() {
    return `import React from 'react';
import { Routes, Route } from 'react-router-dom';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<div>Home</div>} />
  </Routes>
);
`;
  }

  private insertRoute(content: string, route: { path: string; component: string }) {
    const routeLine = `    <Route path="${route.path}" element={<${route.component} />} />`;
    if (content.includes(routeLine)) {
      return content;
    }
    return content.replace('</Routes>', `${routeLine}\n  </Routes>`);
  }

  private async updateComponentWithHook(component: string, hookName: string) {
    const componentFile = path.join(this.componentsPath, `${component}.tsx`);
    try {
      let content = await fs.readFile(componentFile, 'utf8');
      if (!content.includes(`use${hookName}`)) {
        content = `import { ${hookName} } from '../hooks/${hookName}';\n${content}`;
      }
      await fs.writeFile(componentFile, content, 'utf8');
    } catch (error) {
      this.log(`Failed to update ${component} with hook: ${(error as Error).message}`, 'warn');
    }
  }

  private async updateComponentState(component: string, state: Record<string, unknown>) {
    const componentFile = path.join(this.componentsPath, `${component}.tsx`);
    try {
      let content = await fs.readFile(componentFile, 'utf8');
      if (!content.includes('useState')) {
        content = `import React from 'react';\n${content}`;
      }
      const stateDeclaration = `const [state, setState] = React.useState(${JSON.stringify(state, null, 2)});`;
      if (!content.includes('useState(')) {
        content = content.replace('export const', `${stateDeclaration}\n\nexport const`);
      }
      await fs.writeFile(componentFile, content, 'utf8');
    } catch (error) {
      this.log(`Failed to manage state for ${component}: ${(error as Error).message}`, 'warn');
    }
  }

  private updateTailwindConfig(config: string, updates: string) {
    if (config.includes('theme:')) {
      return config.replace('theme: {', `theme: {\n${updates}`);
    }
    return config;
  }

  private generateThemeUpdates(theme: Record<string, unknown>) {
    return `    extend: ${JSON.stringify(theme, null, 6)},\n`;
  }

  private suggestTailwindClasses(context?: Record<string, unknown>) {
    const base = ['bg-slate-900', 'text-slate-100', 'rounded-xl', 'shadow-lg', 'border border-slate-800'];
    if (context?.variant === 'primary') {
      base.push('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500');
    }
    return base;
  }

  private sanitizeName(name: string) {
    return name.replace(/[^a-z0-9]/gi, ' ').replace(/\s+/g, ' ');
  }

  private capitalize(value: string) {
    return value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private async ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }
}
