# Codex Runtime Permissions

The Codex agents run outside repo control, so we manage shell access via `.codex/config/permissions.json`. Each agent has an allowlist of command prefixes and permitted working directories.

## Structure

```json
{
  "agents": {
    "agent-name": {
      "shell": {
        "allowed": ["command prefix", "another prefix*"],
        "workingDirectories": ["relative/path"]
      }
    }
  }
}
```

- `allowed` entries are prefix matches. Append `*` to allow variations (`"npm run test*"`).
- `workingDirectories` are relative to the repo root and are resolved to absolute paths.

## Enforcement

`ShellTool` checks permissions before every command. If a command or directory is outside the allowlist, it raises an error, blocking execution.

## Adding Commands

1. Add the new prefix under the relevant agent.
2. If the command requires a new working directory, add it to `workingDirectories`.
3. Rebuild (or rerun with `ts-node`) to pick up the changes.
