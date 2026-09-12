# Isolated Write Contexts

Give every unit of work an isolated write context. The most mature pattern today is still:

> **one task → one branch/worktree → one PR.**

Agents should not normally share a writable checkout.

Every serious harness now implements some form of this. They differ in *what* they isolate. And
that difference decides how much you still have to build yourself.

!!! example "In the harnesses"
    * **Claude Code**: a git worktree per session (`--worktree`) and per
      [subagent](https://code.claude.com/docs/en/sub-agents) (`isolation: worktree`). Shell
      commands additionally run in a [sandbox](https://code.claude.com/docs/en/sandboxing)
      (Seatbelt on macOS, seccomp on Linux and WSL2) restricting which files and network domains
      they can reach: explicitly not OS-level isolation.
    * **Codex**: a [worktree per chat](https://learn.chatgpt.com/docs/environments/git-worktrees)
      in the desktop app, with automatic cleanup. Cloud tasks run in a managed container in two
      phases: setup has network access, the agent phase is offline by default. Locally,
      [`sandbox_mode`](https://learn.chatgpt.com/docs/sandboxing) is `read-only`,
      `workspace-write` or `danger-full-access`.
    * **GitHub Copilot**: the [cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
      runs in an ephemeral GitHub Actions environment, capped at 59 minutes, pushing to a single
      `copilot/` branch. Worktrees and cloud sandboxes belong to the desktop app, not the cloud
      agent. Its egress firewall is on by default but does not cover MCP servers or setup steps.
    * **OpenHands**: a [Docker sandbox](https://docs.openhands.dev/openhands/usage/sandboxes/docker)
      is the default; a process sandbox with *no* isolation is opt-in. Worktrees appear only for
      parent/child conversation delegation. In the enterprise product a conversation is not a
      security boundary: conversations sharing a sandbox share filesystem, credentials and
      failure domain.

Two things are worth noticing there. Every one of them isolates the *execution environment*, and
none of them knows what an [ownership domain](../ownership/index.md) is. And the strength of the
boundary ranges from kernel-enforced to none at all, which is why the level you pick matters
more than the brand.

So you might have:

```kroki-d2
direction: right

repo: "repo/" {
  shape: package
}

auth: "worktree-auth/\nEngineer A + Agent A"
dicom: "worktree-dicom/\nEngineer B + Agent B"
sec: "worktree-security-fix/\nAgent C"
tests: "worktree-tests/\nAgent D"

repo -> auth
repo -> dicom
repo -> sec
repo -> tests
```

These are parallel **execution environments**, rather than parallel writers to one filesystem.
That eliminates an enormous class of race conditions: no half-written files another agent reads,
no interleaved edits to the same buffer, no test run poisoned by someone else's in-flight change.

## What "isolated" should actually mean

Worktrees are the minimum. For agents running unattended, isolation should extend further:

| Level | Isolates | Notes |
|-------|----------|-------|
| Git worktree | The working tree | Cheap, shares the object store; good default for a developer's machine |
| Container | Filesystem, processes, installed toolchain | Reproducible; required if agents run `npm install` or equivalent |
| VM / remote sandbox | Kernel, network | What you want for unattended agents with credentials |

Network scope belongs in this table too. An agent that can reach the whole internet is a very
different risk object from one that can reach a package mirror and nothing else: see
[Agent Identity & Permissions](../governance/agent-identity.md).

Isolation should also be **cheap and ephemeral**. For unattended agents the strongest shape is
agent → ephemeral VM or container → worktree, destroyed when the task finishes. Nothing an agent
installs, caches or leaves behind survives into the next task.

!!! warning "Isolation is necessary, not sufficient"
    Perfectly isolated agents can still produce changes that are individually correct and
    jointly broken. That is the [next page](semantic-conflicts.md).
