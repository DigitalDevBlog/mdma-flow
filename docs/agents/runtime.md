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
own credentials — the model asks for an operation, it never handles the token. See
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

Now operations are observable, constrainable and auditable. You can still provide a shell — but
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

* **Reads are unrestricted.** Everyone — and every agent — can read the whole repository;
  [restricting reads makes agents dumber](../ownership/index.md). Permissions constrain writes,
  commands, network and Git operations.
* **Agents push branches, never merge.** That is what lets them open PRs, while trunk stays
  behind the [merge queue](../integration/merge-queue.md#making-the-queue-fast-enough-to-trust).
* **The role profile is an upper bound.** A work item narrows it further. The effective write
  scope of a running task is *role permission ∩ work item `scope.writes` ∩ the domain lease it
  holds* — and the runtime or a [policy engine](../platform/mature-stack.md#policy-as-code-opa)
  enforces that intersection, not the prompt.

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

A mature agent system will look a lot like a compute scheduler — which is one more reason to keep
the model choice out of your [primitives](../platform/primitives.md).
