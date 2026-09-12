# Orchestration Landscape

There are now credible orchestration systems. This space has changed considerably even during
2026.

One caveat up front: there is not yet one mature, generic software-engineering agent framework
with years of proven use behind it. The agent layer is young. What sits underneath it is not —
see [Building on the Mature Stack](mature-stack.md).

## Codex + Symphony

OpenAI's [Codex](https://openai.com/codex/) now explicitly supports multi-agent workflows and
worktrees.

More interesting for an organisational use case is **Symphony**, an
[open orchestration specification](https://openai.com/index/open-source-codex-orchestration-symphony/)
OpenAI published this year. The basic model is:

```kroki-d2
direction: down

pm: "Linear / project system" {
  shape: document
}
sym: "Symphony" {
  style.fill: "#fff9db"
}
a1: "Agent"
a2: "Agent"
a3: "Agent"
p1: "PR"
p2: "PR"
p3: "PR"

pm -> sym
sym -> a1
sym -> a2
sym -> a3
a1 -> p1
a2 -> p2
a3 -> p3
```

OpenAI describes Symphony as turning the project-management board into a control plane: open
tasks get agents, agents execute continuously, humans review outcomes.

That's substantially closer to an organisational model than the traditional single-developer
coding session — the board becomes the queue, and the review becomes the interface.

## OpenHands

[OpenHands](https://www.openhands.dev/) has evolved beyond a single-agent coding UI. Its SDK
explicitly supports major tasks involving multiple agents and remote execution.

It is also the project most directly relevant to software modernization, because it is not an
abstract orchestration framework: it is designed around agents that actually work with software.
The [SDK](https://docs.openhands.dev/sdk) provides Python and REST interfaces for building
software agents, with sandboxed execution locally or at scale, and the
[original research](https://arxiv.org/abs/2407.16741) frames it as an open platform for agents
that edit code, use a command line, execute programs, browse for information, operate inside
sandboxes, coordinate, and are evaluated against software-engineering benchmarks.

If I were prototyping a modernization platform tomorrow, OpenHands would be one of the first
codebases I would dissect — without necessarily making it the platform's control plane.

The more interesting recent development is its **Agent Control Plane**:

```kroki-d2
direction: right

acp: "Agent Control Plane" {
  style.fill: "#fff9db"
}

policy: "Policy" {
  a: "permissions"
  b: "credentials"
  c: "repositories"
}
exec: "Execution" {
  a: "sandbox"
  b: "compute"
  c: "network"
}
obs: "Observability" {
  a: "audit"
  b: "costs"
  c: "history"
}

acp -> policy
acp -> exec
acp -> obs
```

OpenHands describes this specifically as moving from isolated agent tools toward
organisational-scale agent systems. Its current platform also claims dependency mapping and
ordered orchestration of changes across large codebases, which is directly relevant to
parallel-agent modernization.

!!! note "Why the control plane matters more than the model"
    For regulated software, the differentiating capability is not code quality — it is policy,
    isolation and auditability. Models improve every few months and are swappable. A control
    plane is where your compliance story lives.

## Agent frameworks: LangGraph and Microsoft Agent Framework

[LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) is probably the closest
match if you are looking for the agent-orchestration layer specifically. It deliberately focuses
on durable execution, state, human-in-the-loop controls and orchestration, rather than trying to
be an all-encompassing application framework. A remediation graph can look like:

```kroki-d2
direction: down

understand: "Understand repository"
identify: "Identify vulnerability"
plan: "Plan remediation"
patch: "Patch"
tests: "Tests"
verify: "Security verification"
human: "Human approval" {
  shape: person
  style.fill: "#fff9db"
}

understand -> identify -> plan
plan -> patch
plan -> tests
patch -> verify
tests -> verify
verify -> human
```

Its strength for this kind of work is that **state transitions are explicit rather than buried in
agent conversations** — which is what makes them inspectable, resumable and auditable.

[Microsoft Agent Framework](https://github.com/microsoft/agent-framework) is the other serious
candidate, particularly in an enterprise environment. One important 2026 detail: don't start a
new architecture on AutoGen. Microsoft has put [AutoGen](https://github.com/microsoft/autogen)
into maintenance mode and directs new users to Microsoft Agent Framework, which combines ideas
from AutoGen with [Semantic Kernel](https://github.com/microsoft/semantic-kernel)'s enterprise
capabilities.

It is particularly interesting where the environment already contains a lot of C#, Azure,
Microsoft services, enterprise identity and existing .NET infrastructure. In a large enterprise,
that makes it worth a serious evaluation rather than treating it as merely another Python agent
library.

!!! note "Agent frameworks are reasoning-layer tools"
    LangGraph and Microsoft Agent Framework structure how agents reason and hand off state.
    Neither is a control plane in the sense used on this site: they don't hold write leases,
    enforce policy or gate trunk. **Your architecture should survive replacing the agent
    framework** — see [Reference Architecture](reference-architecture.md).

## GitButler

[GitButler](https://docs.gitbutler.com/features/branch-management/virtual-branches) attacks a
different part of the problem. Instead of one worktree per agent, it maintains multiple *virtual
branches* within one working directory, and its agent support separates parallel agents' changes
into branches and commits.

```kroki-d2
direction: down

wt: "Working tree" {
  style.fill: "#fff9db"
}
ca: "A changes"
cb: "B changes"
cc: "C changes"
ba: "branch A"
bb: "branch B"
bc: "branch C"

wt -> ca -> ba
wt -> cb -> bb
wt -> cc -> bc
```

That's clever, although for large enterprise agent farms I'd still personally favour **hard
environment isolation via worktrees, containers or VMs**. It's nevertheless worth watching.

## How to read the landscape

| System | Strongest at | Weakest at |
|--------|--------------|------------|
| Codex + worktrees | Execution and isolation on a developer's machine | Organisational allocation and policy |
| Symphony | Turning a task board into a control plane | Ownership boundaries and semantic conflict |
| OpenHands Enterprise | Policy, sandboxing, audit — the control plane | Being young; a larger commitment |
| LangGraph | Explicit, durable, resumable agent state | Ownership, policy and integration — it is a library, not a platform |
| Microsoft Agent Framework | Enterprise integration: identity, .NET, Azure | Ownership, policy and integration, as with LangGraph |
| GitButler | Ergonomics of parallel change in one tree | Hard isolation at scale |

Every one of them is strong on part of the problem and silent on ownership. That gap is why the
[five primitives](primitives.md) matter more than the choice between them.
