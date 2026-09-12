# Merge Queue

Once you have lots of developers *and* lots of agents, trunk becomes a highly contested resource.
Don't let everyone merge arbitrarily.

```kroki-d2
direction: right

prs: "Open PRs" {
  a: "PR A"
  b: "PR B"
  c: "PR C"
  d: "PR D"
  e: "PR E"
}

queue: "Merge queue" {
  shape: queue
  style.fill: "#fff9db"
}

ci: "CI against\nlatest base" {
  shape: hexagon
}

trunk: "trunk" {
  shape: cylinder
  style.fill: "#e6fcf5"
}

prs.a -> queue
prs.b -> queue
prs.c -> queue
prs.d -> queue
prs.e -> queue
queue -> ci -> trunk
ci -> queue: "failure ejects\nthe PR" {
  style.stroke-dash: 4
}
```

GitHub's merge queue specifically addresses busy protected branches by validating changes against
the latest base before merging. GitHub rulesets can additionally enforce PRs, status checks, code
scanning, code quality, coverage constraints and code-owner reviews.

At higher throughput, [Graphite](https://graphite.com/docs/graphite-merge-queue) is worth looking
at, because its merge queue understands **stacked PRs** and can process parts of stacks
concurrently.

## Why this is the crux of the whole design

Everything else on this site is about going wide. The merge queue is the one place the system
deliberately goes narrow:

```kroki-d2
direction: down

a: "Parallel creation"
b: "Parallel validation"
c: "Controlled serialization"
d: "trunk" {
  style.fill: "#e6fcf5"
}

a -> b -> c -> d
```

This is the operational form of the principle the whole architecture follows: *parallelize
reasoning and implementation aggressively, serialize mutation of shared state.*

Without a queue, "green PR" means *green against a base that no longer exists*. With twenty
agents opening PRs against a moving trunk, that gap stops being theoretical and becomes the
normal case.

## Making the queue fast enough to trust

A merge queue only works if it isn't the thing everyone routes around:

| Pressure | Mitigation |
|----------|------------|
| Long CI | Split into a fast required suite and a slower post-merge suite; parallelize by domain |
| Batch failures | Bisect the batch automatically and eject only the offending PR |
| Flaky tests | Quarantine aggressively: a flaky required test converts the queue into a lottery |
| Queue depth | Smaller PRs (see [Integration](index.md)) and domain-scoped test selection |

!!! danger "Never grant agents merge rights to a protected branch"
    Agents create branches, commits and PRs. The queue merges. Keeping that boundary means a
    misbehaving agent produces a rejected PR rather than a broken trunk: see
    [Agent Identity & Permissions](../governance/agent-identity.md).
