# Isolated Write Contexts

Give every unit of work an isolated write context. The most mature pattern today is still:

> **one task → one branch/worktree → one PR.**

Agents should not normally share a writable checkout.

Codex explicitly supports this model with built-in Git worktrees so several agents can work on
the same repository independently. GitHub Copilot's current agent tooling similarly runs
parallel agent sessions on separate branches.

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
different risk object from one that can reach a package mirror and nothing else — see
[Agent Identity & Permissions](../governance/agent-identity.md).

Isolation should also be **cheap and ephemeral**. For unattended agents the strongest shape is
agent → ephemeral VM or container → worktree, destroyed when the task finishes. Nothing an agent
installs, caches or leaves behind survives into the next task.

!!! warning "Isolation is necessary, not sufficient"
    Perfectly isolated agents can still produce changes that are individually correct and
    jointly broken. That is the [next page](semantic-conflicts.md).
