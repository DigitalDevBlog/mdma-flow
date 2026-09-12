# CODEOWNERS & Domain Metadata

GitHub's [`CODEOWNERS`](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
mechanism is already very useful here. It lets directories and files have specific responsible
individuals or teams, and GitHub can require approval from those owners before merging.

```text
/src/reconstruction/   @reconstruction-team
/src/acquisition/      @acquisition-team
/src/security/         @security-team
/src/platform/         @platform-team
```

That solves *review authority*. It does not solve *write authority* — nothing stops four agents
opening four overlapping PRs against `/src/reconstruction/` at the same time, each of which will
eventually be reviewed by the same overloaded team.

## The extension agents need

I would extend the concept with domain metadata that an orchestrator can act on *before* work
starts, not just at merge time:

```yaml
domains:

  acquisition:
    paths:
      - src/acquisition/**
    owner: acquisition-team
    max_concurrent_writers: 1

  reconstruction:
    paths:
      - src/reconstruction/**
    owner: reconstruction-team
    max_concurrent_writers: 1

  shared-model:
    paths:
      - src/domain/**
    owner: architecture-team
    max_concurrent_writers: 1
    architecture_review: required
```

This isn't standard yet. But it is where I think enterprise agent orchestration needs to go.

## What each field buys you

| Field | Consumed by | Effect |
|-------|-------------|--------|
| `paths` | Orchestrator, agent sandbox | Defines the write scope an agent task is allowed to touch; violations fail fast instead of at review |
| `owner` | `CODEOWNERS` generation, review routing | Keeps review authority and write authority derived from one source |
| `max_concurrent_writers` | Orchestrator / lease manager | Implements [Single Write Authority](single-write-authority.md) |
| `architecture_review` | Review pipeline | Escalates shared-kernel changes to a human, automatically |

```kroki-d2
direction: right

domains: "domains.yml\n(single source of truth)" {
  shape: document
  style.fill: "#fff9db"
}

co: "CODEOWNERS\n(generated)"
lease: "Write leases\n(orchestrator)"
sandbox: "Agent write scope\n(work item scope.writes)"
policy: "Review routing\n& escalation"

domains -> co
domains -> lease
domains -> sandbox
domains -> policy
```

!!! note "Generate `CODEOWNERS`, don't hand-maintain it"
    Once domain metadata exists, `CODEOWNERS` should be a build artefact of it. Two files that
    describe ownership independently will disagree within a quarter, and the disagreement will
    surface as an agent doing something nobody authorised.

## The `shared-model` problem

Note the third entry above. Every codebase has a shared kernel — the domain model, the core
types, the cross-cutting interfaces — and that is exactly where agent parallelism hurts most,
because every task has a reason to touch it.

Two rules help:

1. **Shared domains get the strictest lease and mandatory human architecture review.** The cost
   is worth it; these are the changes that break everyone.
2. **Shared-kernel changes ship as their own change set, ahead of the work that needs them.**
   That is a [DAG edge](../decomposition/dag.md), not a merge problem.
