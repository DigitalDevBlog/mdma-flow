# Engineering Agents

The rest of this site treats agents as participants in an engineering system, and asks how many
of them can work in parallel without collision. This section looks inside the participant: what
an engineering agent is, and what a platform for building them needs.

## What "generic" should mean

A generic agent is one that is not hard-coded for a single narrow task, but can be given goals
such as:

* "Understand this unfamiliar codebase."
* "Increase automated test coverage."
* "Find and remediate vulnerabilities."
* "Extract the domain model from this legacy system."
* "Modularize this subsystem without changing behaviour."
* "Move feature X from product A to product B."
* "Modernize this C++ component while preserving its medical-device behaviour."

That is increasingly feasible. The important insight, though, is that **the generic part should
mostly be the agent infrastructure and reasoning loop, not an expectation that one giant agent
can autonomously do everything.**

!!! quote "A useful mental model"
    **Generic agent platform + specialized capabilities + explicit constraints + verifiable
    objectives + controlled execution environment.**

Each term has a home on this site:

| Term | Where it's covered |
|------|--------------------|
| Generic agent platform | [The Agent Runtime](runtime.md) |
| Specialized capabilities | [Capabilities](runtime.md#separate-intelligence-from-capabilities) and [Roles & Review](roles.md) |
| Explicit constraints, verifiable objectives | The [work item](../platform/primitives.md) as an [executable contract](verification.md) |
| Controlled execution environment | [Isolation](../foundations/isolation.md) and [Agent Identity](../governance/agent-identity.md) |

## What an agent actually is

A language model by itself is essentially *input → reasoning → output*. An agent adds a feedback
loop:

```kroki-d2
direction: down

goal: "Goal" {
  style.fill: "#fff9db"
}
understand: "Understand state"
decide: "Decide next action"
execute: "Execute action"
observe: "Observe result"

goal -> understand -> decide -> execute -> observe
observe -> understand: "new information" {
  style.stroke-dash: 4
}
```

For software engineering, the actions look like this:

| Understand | Change | Verify | Integrate |
|------------|--------|--------|-----------|
| search code | edit files | compile | commit |
| read files | create branch | run tests | open PR |
| inspect Git history | | run static analysis | |
| query issue tracker | | execute program, inspect logs | |
| | | compare outputs, run benchmarks | |

The critical difference is that **the result of an action becomes new information for the next
decision.** That feedback loop is where agency comes from.

## Don't build a giant `while(true)` loop

The naive implementation is surprisingly easy:

```python
while not finished:
    state = observe_environment()
    action = llm(goal, state)
    result = execute(action)
    memory.append(result)
```

You can build something impressive with this. You can also build something extremely
unreliable. Production agents need considerably more structure:

```kroki-d2
direction: down

goal: "Goal"
planner: "Planner" {
  style.fill: "#f3f0ff"
}
graph: "Task graph" {
  shape: hexagon
}
a: "Agent A\n+ tools"
b: "Agent B\n+ tools"
c: "Agent C\n+ tools"
verify: "Verification" {
  style.fill: "#fff9db"
}
accept: "Accept" {
  style.fill: "#e6fcf5"
}
reject: "Reject" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}

goal -> planner -> graph
graph -> a
graph -> b
graph -> c
a -> verify
b -> verify
c -> verify
verify -> accept
verify -> reject
reject -> planner: "repair / replan" {
  style.stroke-dash: 4
}
```

That distinction becomes extremely important once the agent can change millions of lines of
valuable source code. The task graph is the [DAG](../decomposition/dag.md); the verification step
is [its own page](verification.md).

## The deepest principle

If the whole section had to be boiled down to one sentence:

!!! quote "The principle behind the agent platform"
    **Don't try to build an AI that you can trust. Build a system in which an untrustworthy
    probabilistic intelligence can nevertheless produce trustworthy engineering outcomes.**

That means the model's intelligence is never your only safety mechanism:

```kroki-d2
direction: down

ai: "Probabilistic AI\nproposes • investigates" {
  style.fill: "#f3f0ff"
}
shell: "Deterministic shell" {
  style.fill: "#fff9db"
  grid-columns: 4
  p: "permissions"
  o: "ownership"
  i: "isolation"
  t: "tests"
  inv: "invariants"
  b: "budgets"
  v: "verification"
  a: "audit"
}
out: "Trusted outcome" {
  style.fill: "#e6fcf5"
}

ai -> shell -> out
```

It is the same idea as the principle on the [home page](../index.md): *parallelize reasoning,
serialize mutation of shared state*, applied inside a single agent instead of across many. In
both cases the model proposes and deterministic machinery disposes. That is the difference between
an impressive coding-agent demo and an industrial AI engineering system.

## Pages in this section

* [The Agent Runtime](runtime.md): the agent platform as an operating system: capabilities,
  tools, permissions, budgets, model routing
* [Verification](verification.md): work items as executable contracts, and verifier-driven
  development
* [Memory & Knowledge](knowledge.md): memory types, the software knowledge graph, context
  engineering
* [Evidence & Uncertainty](evidence.md): confidence, provenance, facts versus hypotheses, traces
* [Roles & Review](roles.md): specialized agents, proposer versus reviewer, and why to start
  with one agent
