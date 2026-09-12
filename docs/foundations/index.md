# Foundations

The architecture I would recommend for a real engineering organisation looks roughly like this.

```kroki-d2
direction: down

intent: "Work / intent layer" {
  grid-columns: 3
  tracker: "Tracker\n(Jira / Linear / Issues)"
  decompose: "Task decomposition"
  dag: "Dependency graph (DAG)" {
    shape: hexagon
  }
}

allocation: "Work allocation" {
  shape: diamond
}

execution: "Isolated execution" {
  a: "Engineer + agent"
  b: "Engineer + agent"
  c: "Agent team"
  wa: "isolated branch / worktree"
  wb: "isolated branch / worktree"
  wc: "isolated branch / worktree"
  a -> wa
  b -> wb
  c -> wc
}

prs: "Pull requests"

validation: "Validation" {
  tests: "Unit, integration and\ncontract tests"
  policy: "Static / security /\narchitecture policy"
  review: "Agent review,\nhuman review where needed"
}

queue: "Merge queue" {
  shape: queue
}

trunk: "trunk" {
  shape: cylinder
}

intent -> allocation
allocation -> execution.a
allocation -> execution.b
allocation -> execution.c
execution.wa -> prs
execution.wb -> prs
execution.wc -> prs
prs -> validation.tests
prs -> validation.policy
prs -> validation.review
validation.tests -> queue
validation.policy -> queue
validation.review -> queue
queue -> trunk
```

Read top to bottom, the shape of the system is: intent becomes a dependency graph, the graph is
allocated to isolated execution contexts, those contexts produce reviewable change sets, and a
single controlled gate lets change into trunk.

The fan-out is deliberate and so is the fan-in. Everything above the merge queue is parallel;
everything at and below it is serial.

## The two halves of the problem

| Half | Mechanism | Where it's covered |
|------|-----------|--------------------|
| Parallel *without collision* | Isolated environments, ownership domains, architectural decomposition | [Isolation](isolation.md), [Ownership](../ownership/index.md), [Decomposition](../decomposition/index.md) |
| Serial *without becoming a bottleneck* | Small PRs, automated evidence, merge queue | [Integration](../integration/index.md) |

Most tooling in 2026 is strong on the first half and thin on the second, and thinnest of all on
the part between them: deciding *who is allowed to write what, right now*. That gap is the
subject of the [Ownership](../ownership/index.md) section.

!!! note "Nothing here is model-specific"
    Every mechanism on this site works the same whether the writer is Codex, Claude Code,
    OpenHands, or a human being with an IDE. That is the point: see
    [Five Primitives](../platform/primitives.md).
