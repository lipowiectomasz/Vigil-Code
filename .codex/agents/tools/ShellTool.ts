import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { permissionsManager } from '../../config/PermissionsManager.js';

export interface ShellCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  input?: string;
}

export interface ShellCommandResult {
  command: string[];
  cwd: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ShellTool {
  private readonly baseDir: string;
  private readonly agentName: string;

  constructor(agentName: string, baseDir = process.cwd()) {
    this.agentName = agentName;
    this.baseDir = baseDir;
  }

  async run(command: string[], options: ShellCommandOptions = {}): Promise<ShellCommandResult> {
    if (command.length === 0) {
      throw new Error('ShellTool: command cannot be empty');
    }

    const cwd = options.cwd ? path.resolve(this.baseDir, options.cwd) : this.baseDir;
    permissionsManager.ensureShellCommandAllowed(this.agentName, command, cwd);

    const proc = spawn(command[0], command.slice(1), {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ...options.env
      },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    proc.stdout?.on('data', (chunk) => stdoutChunks.push(chunk));
    proc.stderr?.on('data', (chunk) => stderrChunks.push(chunk));

    if (options.input) {
      proc.stdin?.write(options.input);
    }
    proc.stdin?.end();

    let timeout: NodeJS.Timeout | undefined;
    if (options.timeoutMs) {
      timeout = setTimeout(() => {
        proc.kill('SIGKILL');
      }, options.timeoutMs);
    }

    const [code] = (await once(proc, 'close')) as [number | null];

    if (timeout) {
      clearTimeout(timeout);
    }

    const exitCode = code ?? -1;
    const stdout = Buffer.concat(stdoutChunks).toString('utf8');
    const stderr = Buffer.concat(stderrChunks).toString('utf8');

    return {
      command,
      cwd,
      stdout,
      stderr,
      exitCode
    };
  }
}
