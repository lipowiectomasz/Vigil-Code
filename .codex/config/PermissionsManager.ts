import path from 'node:path';
import permissionsConfig from './permissions.json' with { type: 'json' };

type ShellPermissionPattern = string;

interface ShellPermissions {
  allowed: ShellPermissionPattern[];
  workingDirectories?: string[];
}

interface AgentPermissions {
  shell?: ShellPermissions;
}

interface PermissionsConfig {
  agents: Record<string, AgentPermissions>;
}

function normalizeWorkingDirs(dirs: string[] | undefined): string[] {
  if (!dirs || dirs.length === 0) {
    return [process.cwd()];
  }
  return dirs.map((dir) => path.resolve(process.cwd(), dir));
}

function matchesPattern(pattern: string, command: string): boolean {
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return command.startsWith(prefix);
  }
  return command.startsWith(pattern);
}

export class PermissionsManager {
  private readonly permissions: PermissionsConfig;

  constructor(config: PermissionsConfig) {
    this.permissions = config;
  }

  ensureShellCommandAllowed(agentName: string, command: string[], cwd: string) {
    const agentPermissions = this.permissions.agents[agentName];
    if (!agentPermissions?.shell) {
      throw new Error(`Shell command execution is not permitted for agent ${agentName}`);
    }

    const commandString = command.join(' ').trim();
    const allowed = agentPermissions.shell.allowed ?? [];

    const isAllowed = allowed.some((pattern) => matchesPattern(pattern, commandString));
    if (!isAllowed) {
      throw new Error(
        `Command "${commandString}" is not permitted for agent ${agentName}. Allowed prefixes: ${allowed.join(
          ', '
        )}`
      );
    }

    const permittedDirs = normalizeWorkingDirs(agentPermissions.shell.workingDirectories);
    const normalizedCwd = path.resolve(cwd);

    const withinAllowedDir = permittedDirs.some((dir) => normalizedCwd.startsWith(dir));
    if (!withinAllowedDir) {
      throw new Error(
        `Working directory "${normalizedCwd}" is not permitted for agent ${agentName}. Allowed directories: ${permittedDirs.join(
          ', '
        )}`
      );
    }
  }
}

export const permissionsManager = new PermissionsManager(permissionsConfig as PermissionsConfig);
