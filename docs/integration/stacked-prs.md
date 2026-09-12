# Stacked PRs

Stacked PRs work surprisingly well with agents. Instead of one huge feature PR:

```kroki-d2
direction: down

p1: "PR 1: domain model"
p2: "PR 2: service"
p3: "PR 3: adapter"
p4: "PR 4: UI"

p1 -> p2 -> p3 -> p4
```

Each remains reviewable on its own, and each can merge as soon as it is ready rather than waiting
for the slowest part of the feature.

[Graphite](https://graphite.com/docs/graphite-merge-queue) is probably the most mature
purpose-built tool around this workflow right now.

## The structural insight

This maps directly onto agent DAGs:

```kroki-d2
direction: down

tasks: "Task DAG" {
  a: "A"
  b: "B"
  c: "C"
  d: "D"
  a -> b
  a -> c
  b -> d
  c -> d
}

prs: "PR dependency graph" {
  pa: "PR-A"
  pb: "PR-B"
  pc: "PR-C"
  pd: "PR-D"
  pa -> pb
  pa -> pc
  pb -> pd
  pc -> pd
}

tasks -> prs: "same shape" {
  style.stroke-dash: 4
}
```

There is a natural connection between **task planning** and **change integration**. The
dependency structure you needed anyway to schedule agents is the same structure the integration
system needs to order merges. Most setups discover it twice and represent it twice; they should
derive one from the other.

## When to stack and when not to

| Situation | Do |
|-----------|----|
| One feature, several layers, each independently testable | Stack |
| Work that crosses ownership domains | Stack, one PR per domain, with an integration PR on top |
| A shared-kernel change plus its consumers | Stack, with the kernel change at the bottom |
| Two genuinely unrelated tasks | Don't stack: separate branches, no false ordering |

!!! warning "Stacks have a rebase cost"
    Every stack is a bet that the bottom PR merges roughly as written. When it doesn't, everything
    above it rebases. Keep stacks shallow (four or five is usually the practical ceiling) and
    put the most contested change at the bottom, where it gets reviewed first.

!!! tip "Stacks are where agents beat humans"
    Splitting a finished change into a clean, individually-green stack is tedious work that
    humans skip and agents do cheerfully. If you adopt one agent workflow beyond code generation,
    make it this one.
