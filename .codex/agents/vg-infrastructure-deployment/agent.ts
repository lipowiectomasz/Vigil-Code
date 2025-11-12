import path from 'node:path';
import { BaseAgent, type AgentTask } from '../../runtime/index.js';
import { ShellTool } from '../tools/ShellTool.js';

interface DeploymentPayload {
  services?: string[];
  service?: string;
}

export class InfrastructureDeploymentAgent extends BaseAgent {
  private readonly shell = new ShellTool('vg-infrastructure-deployment', process.cwd());

  constructor() {
    super({
      name: 'vg-infrastructure-deployment',
      version: '3.0.0',
      description: 'Docker orchestration and service deployment agent',
      capabilities: ['build_containers', 'deploy_service', 'health_check', 'restart_services']
    });
  }

  protected async execute(task: AgentTask<DeploymentPayload>) {
    switch (task.action) {
      case 'build_containers':
        return this.buildContainers(task);
      case 'deploy_service':
        return this.deployService(task);
      case 'health_check':
        return this.healthCheck(task);
      case 'restart_services':
        return this.restartServices(task);
      default:
        return { success: true, message: 'Infrastructure action completed' };
    }
  }

  private async buildContainers(task: AgentTask<DeploymentPayload>) {
    const services = task.payload?.services ?? [];
    this.log(`Building containers for: ${services.join(', ') || 'all services'}`);

    const command = services.length > 0
      ? ['docker-compose', 'build', ...services]
      : ['docker-compose', 'build'];

    try {
      const result = await this.shell.run(command, { cwd: '.' });
      return {
        success: result.exitCode === 0,
        built: services,
        output: this.truncate(result.stdout || result.stderr)
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async deployService(task: AgentTask<DeploymentPayload>) {
    const service = task.payload?.service;
    if (!service) {
      throw new Error('deploy_service requires service name');
    }

    this.log(`Deploying service: ${service}`);

    try {
      const result = await this.shell.run(['docker-compose', 'up', '-d', service], { cwd: '.' });
      return {
        success: result.exitCode === 0,
        deployed: service,
        output: this.truncate(result.stdout || result.stderr)
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async healthCheck(task: AgentTask<DeploymentPayload>) {
    const services = task.payload?.services ?? [];
    this.log('Running health checks...');

    const health: Record<string, 'healthy' | 'unhealthy'> = {};

    for (const service of services) {
      try {
        const result = await this.shell.run(['docker-compose', 'ps', service], { cwd: '.' });
        health[service] = result.exitCode === 0 ? 'healthy' : 'unhealthy';
      } catch {
        health[service] = 'unhealthy';
      }
    }

    return { success: true, health };
  }

  private async restartServices(task: AgentTask<DeploymentPayload>) {
    const services = task.payload?.services ?? [];
    if (services.length === 0) {
      throw new Error('restart_services requires at least one service');
    }

    this.log(`Restarting services: ${services.join(', ')}`);

    try {
      const result = await this.shell.run(['docker-compose', 'restart', ...services], { cwd: '.' });
      return {
        success: result.exitCode === 0,
        restarted: services,
        output: this.truncate(result.stdout || result.stderr)
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private truncate(output: string | undefined, maxLength = 1_000) {
    if (!output) return undefined;
    return output.length > maxLength ? `${output.slice(0, maxLength)}…` : output;
  }
}
