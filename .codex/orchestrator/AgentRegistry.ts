import type { BaseAgent, AgentContext } from '../runtime/index.js';

export interface AgentDefinition {
  name: string;
  description?: string;
  capabilities?: string[];
  loader: () => Promise<BaseAgent>;
}

export class AgentRegistry {
  private readonly definitions = new Map<string, AgentDefinition>();
  private readonly instances = new Map<string, BaseAgent>();

  register(definition: AgentDefinition): void {
    this.definitions.set(definition.name, definition);
  }

  has(agentName: string): boolean {
    return this.definitions.has(agentName);
  }

  list(): AgentDefinition[] {
    return Array.from(this.definitions.values());
  }

  async initializeAgents(agentNames: string[], context: AgentContext): Promise<Map<string, BaseAgent>> {
    const initialized = new Map<string, BaseAgent>();

    for (const agentName of agentNames) {
      if (!this.definitions.has(agentName)) {
        throw new Error(`Agent not registered: ${agentName}`);
      }

      const instance = await this.ensureInstance(agentName, context);
      initialized.set(agentName, instance);
    }

    return initialized;
  }

  getInstance(agentName: string): BaseAgent | undefined {
    return this.instances.get(agentName);
  }

  async shutdownAll(): Promise<void> {
    for (const [name, instance] of this.instances) {
      await instance.shutdown();
      this.instances.delete(name);
    }
  }

  private async ensureInstance(agentName: string, context: AgentContext): Promise<BaseAgent> {
    if (this.instances.has(agentName)) {
      return this.instances.get(agentName)!;
    }

    const definition = this.definitions.get(agentName);
    if (!definition) {
      throw new Error(`Agent not registered: ${agentName}`);
    }

    const agent = await definition.loader();
    await agent.initialize(context);
    this.instances.set(agentName, agent);
    return agent;
  }
}
