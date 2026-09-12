# Roles & Review

Generic infrastructure does not imply identical agents.

## Specialized agents still make sense

From the same runtime you can build distinct roles:

```kroki-d2
direction: down

orch: "Orchestrator\n(deterministic)" {
  style.fill: "#fff9db"
}
arch: "Architecture agent"
dev: "Developer agent"
ver: "Verification agent"
sec: "Security agent"
dom: "Domain agent"

orch -> arch
orch -> dev
orch -> ver
orch -> sec
orch -> dom
```

Each role can use a different:

* system instruction
* model
* context
* toolset
* permission set
* budget
* verification policy

You might even use different model providers for different roles — which is one more argument for
keeping the model out of your [primitives](../platform/primitives.md).

## Separate proposer and reviewer

Don't let the same agent be the only judge of its own work:

```kroki-d2
direction: down

dev: "Developer agent" {
  style.fill: "#f3f0ff"
}
cs: "Change set" {
  shape: document
}
rev: "Reviewer agent" {
  style.fill: "#f3f0ff"
  c: "correctness?"
  a: "architecture?"
  m: "maintainability?"
  s: "suspicious assumptions?"
}
ver: "Verification\ndeterministic tests" {
  style.fill: "#fff9db"
}

dev -> cs -> rev -> ver
```

The reviewer shouldn't merely ask *"does this look good?"* Give it an adversarial role:

> **Find reasons this implementation could be wrong.**

That tends to work considerably better. The general form of the rule is
**planner ≠ implementer ≠ verifier**: the agent that decomposes the work, the agent that changes
the code, and the thing that decides whether the change is acceptable should never be the same
actor. The last one should preferably not be an agent at all — see [Verification](verification.md).

## Don't start with multi-agent

This is a trap. It is tempting to begin with a planner agent, an architect agent, a developer
agent, a test agent, a security agent, a manager agent, a reviewer agent… You quickly end up with
agents talking endlessly to other agents.

Start with:

```kroki-d2
direction: down

one: "ONE AGENT" {
  style.fill: "#f3f0ff"
}
parts: "" {
  grid-columns: 4
  t: "good tools"
  v: "excellent verification"
  s: "sandbox"
  w: "structured work item"
}

one -> parts: "+"
```

Then identify genuine bottlenecks, and only split roles where the separation provides value.
There are two obvious cases:

* **Reviewer versus implementer** — for the reasons above.
* **Parallel independent work** — separate work items in separate domains.

!!! note "One agent per work item — many work items in parallel"
    This doesn't contradict the rest of the site. *Many agents*, elsewhere on this site, means
    many independent work items running in parallel, each handled by one agent in its own
    [isolated context](../foundations/isolation.md). What to avoid early is many agents *per work
    item* — a committee of role-agents negotiating over one change.

    The agent hierarchy in the [modernization overview](../modernization/index.md) is a mature
    target — stage 6 of the [maturity path](../modernization/maturity.md) — not a starting
    configuration.
