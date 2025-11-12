import { AgentRegistry } from '../orchestrator/AgentRegistry.js';

export async function createAgentRegistry(): Promise<AgentRegistry> {
  const registry = new AgentRegistry();

  registry.register({
    name: 'vg-test-automation',
    loader: async () => {
      const module = await import('./vg-test-automation/agent.js');
      return new module.TestAutomationAgent();
    }
  });

  registry.register({
    name: 'vg-workflow-business-logic',
    loader: async () => {
      const module = await import('./vg-workflow-business-logic/agent.js');
      return new module.WorkflowBusinessLogicAgent();
    }
  });

  registry.register({
    name: 'vg-infrastructure-deployment',
    loader: async () => {
      const module = await import('./vg-infrastructure-deployment/agent.js');
      return new module.InfrastructureDeploymentAgent();
    }
  });

  registry.register({
    name: 'vg-security-compliance',
    loader: async () => {
      const module = await import('./vg-security-compliance/agent.js');
      return new module.SecurityComplianceAgent();
    }
  });

  registry.register({
    name: 'vg-workflow-infrastructure',
    loader: async () => {
      const module = await import('./vg-workflow-infrastructure/agent.js');
      return new module.WorkflowInfrastructureAgent();
    }
  });

  registry.register({
    name: 'vg-backend-api',
    loader: async () => {
      const module = await import('./vg-backend-api/agent.js');
      return new module.BackendAPIAgent();
    }
  });

  registry.register({
    name: 'vg-frontend-ui',
    loader: async () => {
      const module = await import('./vg-frontend-ui/agent.js');
      return new module.FrontendUIAgent();
    }
  });

  registry.register({
    name: 'vg-data-analytics',
    loader: async () => {
      const module = await import('./vg-data-analytics/agent.js');
      return new module.DataAnalyticsAgent();
    }
  });

  registry.register({
    name: 'vg-pii-detection',
    loader: async () => {
      const module = await import('./vg-pii-detection/agent.js');
      return new module.PIIDetectionAgent();
    }
  });

  registry.register({
    name: 'vg-documentation',
    loader: async () => {
      const module = await import('./vg-documentation/agent.js');
      return new module.DocumentationAgent();
    }
  });

  return registry;
}
