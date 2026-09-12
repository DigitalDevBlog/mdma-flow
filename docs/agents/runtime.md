# The Agent Runtime

A good generic agent platform starts looking less like a chatbot and more like a small operating
system.

## Think of the platform as an operating system

| OS concept | Agent equivalent |
|------------|------------------|
| Process | Agent / task |
| Scheduler | Orchestrator |
| Filesystem | Workspace and artefacts |
| Memory | Context + persistent memory |
| System calls | Tools |
| Permissions | Capability and security model |
| Process isolation | Sandboxes |
| Locks | [Write leases](../ownership/single-write-authority.md) |
| IPC | Agent communication |
| Audit log | Trace and history |
| Exit status | Verification result |
| Supervisor | Recovery and retry logic |

The analogy is surprisingly powerful. You don't want a model to have arbitrary authority over
everything, any more than you would want every Unix process running as root.

## Separate intelligence from capabilities

A generic agent should not inherently "know how to use GitHub". Give it capabilities:

```text
Agent
 ├── Reasoning model
 ├── Instructions
 ├── Context
 ├── Memory
 └── Tools
       ├── filesystem.read
       ├── filesystem.write
       ├── git.diff
       ├── git.commit
       ├── compiler.build
       ├── test.run
       ├── static_analysis.run
       ├── jira.search
       ├── documentation.search
       └── shell.execute
```

Then you can construct different agents from the same infrastructure:

| Agent | Capabilities |
|-------|--------------|
| Security agent | source search, SAST, dependency scanner, compiler, test runner |
| Test agent | source search, coverage, test runner, debugger |
| Architecture agent | source graph, Git history, dependency graph, documentation |
| Migration agent | source-product access, target-product access, build and test, architecture knowledge |

This is one of the main ingredients of genericity. Each capability is a service that holds its
own credentials; the model asks for an operation, it never handles the token. See
[Credentials never enter the model's context](../governance/agent-identity.md#credentials-never-enter-the-models-context).

## Tool design matters more than prompt design

A common mistake is spending enormous effort perfecting the system prompt. For serious engineering
agents, **tool design matters at least as much.**

Bad:

```text
shell(command: string)
```

The agent can do literally anything. Better:

```text
read_file(path)
search_code(query)
build(target)
run_tests(target)
get_coverage(target)
apply_patch(patch)
get_git_diff()
```

Now operations are observable, constrainable and auditable. You can still provide a shell, but
perhaps only inside a disposable sandbox.

## Explicit permissions per agent role

Every agent role should have explicit capabilities:

```yaml
agent: test-improvement

permissions:
  source:
    read:
      - "**"              # reads are never restricted
    write:
      - tests/**

  commands:
    - build
    - test
    - coverage

  git:
    commit: true
    push: agent/*         # its own branches only
    merge: false          # the merge queue merges

  network:
    enabled: false
```

Compare that with:

```yaml
agent: dependency-updater

permissions:
  source:
    read:
      - "**"
    write:
      - Cargo.toml
      - Cargo.lock

  git:
    commit: true
    push: agent/*
    merge: false

  network:
    domains:
      - crates.io
```

Three things to notice:

* **Reads are unrestricted.** Everyone, and every agent, can read the whole repository;
  [restricting reads makes agents dumber](../ownership/index.md). Permissions constrain writes,
  commands, network and Git operations.
* **Agents push branches, never merge.** That is what lets them open PRs, while trunk stays
  behind the [merge queue](../integration/merge-queue.md#making-the-queue-fast-enough-to-trust).
* **The role profile is an upper bound.** A work item narrows it further. The effective write
  scope of a running task is *role permission ∩ work item `scope.writes` ∩ the domain lease it
  holds*, and the runtime or a [policy engine](../platform/mature-stack.md#policy-as-code-opa)
  enforces that intersection, not the prompt.

### How this is enforced in practice

For that intersection to mean anything, the runtime needs three properties:

| Property | Why it matters |
|----------|----------------|
| Tool- and path-scoped rules | "May edit `tests/**`" has to be expressible, not merely "may edit" |
| A deterministic pre-execution block | Something must be able to say *no* before the write happens, without consulting a model |
| Enforcement outside the model's context | A rule the model can read is a rule the model can be argued out of |

!!! example "In the harnesses"
    * **Claude Code**: [permission rules](https://code.claude.com/docs/en/permissions) take
      tool-and-path patterns, such as `allow: Edit(src/**)` and `deny: Write(/etc/**)`. A
      [`PreToolUse` hook](https://code.claude.com/docs/en/hooks) blocks a call outright by
      returning `"permissionDecision": "deny"` or exiting 2. Path-scoped instructions live in
      `.claude/rules/*.md` behind a `paths:` frontmatter field.
    * **Codex**: [`sandbox_mode`](https://learn.chatgpt.com/docs/sandboxing) sets the technical
      ceiling, and a named [permissions profile](https://learn.chatgpt.com/docs/config-file/config-reference)
      maps path globs to `read`, `write` or `deny`, with `.git` and `.codex` read-only by default.
      [Hooks](https://learn.chatgpt.com/docs/hooks) in `.codex/hooks.json` block on `PreToolUse`
      with the same deny convention.
    * **GitHub Copilot**: the CLI takes [`--allow-tool` and `--deny-tool`](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools),
      where deny wins, and a write permission can be bound to a specific file. The cloud agent is
      constrained structurally instead: it pushes only to its own branch and cannot merge.
    * **OpenHands**: tool allowlists are whole-tool only. There is **no path-scoped permission
      and no deny construct**: its [security layer](https://docs.openhands.dev/sdk/api-reference/openhands.sdk.security)
      classifies risk to decide whether to *ask*, not whether to refuse, and headless runs always
      auto-approve. Its hooks can block on `PreToolUse` via exit code 2, but matchers key on tool
      name rather than path, so the path logic goes in your script.

Three of the four can therefore stop a write before it happens. **None of them knows what an
[ownership domain](../ownership/single-write-authority.md) or a
[change surface](../decomposition/dag.md#dependencies-arent-enough-change-surfaces) is.** So the
division of labour is:

> Your control plane computes the effective write scope for the active work item. The harness
> hook enforces it on every tool call.

A blocking hook is a small program, and the exit-code-2 convention is shared by Claude Code,
Codex and OpenHands, so one script ports across all three:

```bash
#!/usr/bin/env bash
# PreToolUse: refuse writes outside the active work item's change surface.
# Illustrative: `work-item` here is your own control-plane CLI.
path=$(jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0

if ! work-item current --matches-write "$path"; then
  echo "refused: $path is outside the change surface of $(work-item current --id)" >&2
  exit 2   # deterministic deny
fi
```

That is the whole mechanism. The interesting engineering is not in the hook; it is in
`work-item current`, which is the part no vendor builds for you.

## Budgets

Otherwise an agent can happily spend €300 trying to fix a typo. Each work item carries a budget:

```yaml
budget:
  tokens: 500000
  wall_time: 90m
  attempts: 12
  test_runs: 20
  compute: 30m
```

When a budget runs low, the orchestrator decides between:

* continue
* retry
* change model
* ask another agent
* escalate to a human
* abandon

Cost becomes part of planning. And, as [Agent Identity](../governance/agent-identity.md#budget-and-blast-radius)
notes, a blown budget is usually a sign of an under-specified work item, not of a lazy agent.

!!! example "In the harnesses"
    Budgets are the weakest link in every harness, and weakest exactly where you need them: per
    task.

    * **Codex**: enforced token caps: `rollout_budget.limit_tokens`, `tool_output_token_limit`,
      `model_auto_compact_token_limit`. No monetary cap.
    * **GitHub Copilot**: usage-based credits with budgets set at enterprise, cost-centre and
      user level, and the option to cap spend rather than allow overage.
    * **Claude Code**: spend limits at organisation level; per-run cost reported in JSON output.
      No hard per-session cap.
    * **OpenHands**: a hard monthly organisation budget in the commercial tiers, which can block
      new conversations at 100%. The open-source SDK tracks cost but enforces no ceiling.

    Notice the granularity: an organisation and a month, or raw tokens. None of them enforces
    *"this work item gets 90 minutes and 500k tokens."* That stays the orchestrator's job.

## Keep the orchestrator dumb

This sounds counterintuitive. Don't put all intelligence into a giant model-driven orchestrator.
The orchestration layer should enforce deterministic rules:

* Dependency satisfied?
* Resource available?
* Write lease available?
* Budget remaining?
* Verification passed?
* Approval required?

Use AI where ambiguity requires reasoning. Use software where rules can determine the answer.

!!! quote "The division of labour"
    **LLMs decide under ambiguity; conventional software enforces invariants.**

This is exactly what the site means by *control plane*: the deterministic layer. Planning a DAG
is ambiguous and belongs to the reasoning layer; deciding whether a ready node may start is not,
and belongs here.

## Route models dynamically

You don't need your most expensive reasoning model to grep the repository:

| Task | Model |
|------|-------|
| Classification, search | Small, cheap model |
| Code comprehension | Medium model |
| Architecture planning | Strong reasoning model |
| Complex debugging | Strong coding and reasoning model |

A mature agent system will look a lot like a compute scheduler, which is one more reason to keep
the model choice out of your [primitives](../platform/primitives.md).

## Decoupling from the model

Routing only works if nothing downstream names a model. Three rules keep it that way:

1. **Work items declare a capability tier, not a model.** "Strong reasoning" and "cheap
   classification" survive a model release; a specific model ID does not.
2. **The tier-to-model mapping lives in configuration**, next to the routing table above, and
   changes by pull request like anything else.
3. **The model and its version are recorded in the change set's evidence.** When behaviour shifts
   after an upgrade, [provenance](evidence.md#provenance) tells you which changes came from which
   model. That is what turns "models are swappable" from an aspiration into an operational fact.

All four harnesses let a role pin its own model (Claude Code and OpenHands in agent frontmatter,
Codex in the agent's TOML, Copilot per custom agent), so the tier mapping is expressible wherever
you happen to run.
