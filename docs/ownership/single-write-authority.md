# Single Write Authority

At any point in time there should ideally be only **one active writer to a logical ownership
domain**.

For example:

```text
/src/acquisition/**        → Agent/Team A
/src/reconstruction/**     → Agent/Team B
/src/rendering/**          → Agent/Team C
/src/security/**           → Agent/Team D
```

Not permanently. Just while a change-set is active.

Conceptually:

```kroki-d2
repo: "Repository" {
  acq: "Acquisition\n\nWriter: A" {
    style.fill: "#e7f5ff"
  }
  recon: "Reconstruction\n\nWriter: B" {
    style.fill: "#e6fcf5"
  }
  ui: "UI / Rendering\n\nWriter: C" {
    style.fill: "#fff9db"
  }
  sec: "Security\n\nWriter: D" {
    style.fill: "#ffe8cc"
  }
}

readers: "Everyone else\n(humans and agents)" {
  shape: person
}

readers -> repo: "read"
```

Everyone can **read** everything. But write leases are scoped.

I still consider this one of the biggest missing pieces in mainstream agent tooling.

## The refinement that makes it workable

Stated bluntly, "one writer" sounds like it serializes the whole organisation. It doesn't, if you
scope it correctly:

> **Single Write Authority per architectural domain per integration epoch.**

Not:

> only one agent may change the repository.

So you can have several writers active at once, one per domain:

```kroki-d2
grid-columns: 3

a: "Domain A\n\nHuman + AI\nwriter" {
  style.fill: "#e7f5ff"
}
b: "Domain B\n\nAgent team\nwriter" {
  style.fill: "#e6fcf5"
}
c: "Domain C\n\nEngineer\n+ agent" {
  style.fill: "#fff9db"
}
```

The lease has three properties worth being precise about:

| Property | Why |
|----------|-----|
| **Scoped** to a domain, not the repo | Otherwise parallelism collapses to one |
| **Time-boxed** to an active change set | A lease that outlives its PR is a lock you forgot to release |
| **Explicit**: recorded, not implied | An agent can't respect a boundary it can't read |

!!! note "Per branch and per domain are two different rules"
    *One writer per branch* is the [isolation](../foundations/isolation.md) rule: no two agents
    share a checkout. *One writer per domain* is the ownership rule: no two branches write the
    same domain at once. You need both. A task's declared
    [change surface](../decomposition/dag.md#dependencies-arent-enough-change-surfaces) is finer
    still, and always sits inside the domain it holds the lease for.

## Leases behave like transactions

Concurrent agents modifying code resemble concurrent transactions modifying a database, and the
theory transfers remarkably well:

| Database concept | Agent equivalent |
|------------------|------------------|
| Lock | Write lease on an ownership domain |
| Transaction | Change set: begins with a lease, ends with a merge or an abort |
| Commit / rollback | Merge through the queue / discard the branch |
| Snapshot isolation (MVCC) | Each worktree starts from a fixed base commit |
| Serialization | A DAG edge between work items that write the same domain |
| Conflict detection | Change-surface overlap before work starts; validation against the latest base before merge |

Within a domain, the write path is **pessimistic**:

```kroki-d2
direction: down

acquire: "Acquire write lease\nsrc/imaging/**" {
  style.fill: "#fff9db"
}
modify: "Modify"
verify: "Verify"
pr: "Open PR → merge queue"
release: "Merge, release lease" {
  style.fill: "#e6fcf5"
}
b: "Agent B requests\nsrc/imaging/**" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}

acquire -> modify -> verify -> pr -> release
b -> acquire: "waits" {
  style.stroke-dash: 4
}
```

**Optimistic** concurrency still has a place: *between* domains. Two writers in different
domains both start from commit 123:

```kroki-d2
direction: down

base: "trunk @ 123" {
  shape: cylinder
}
a: "A: domain X\nproduces change set"
b: "B: domain Y\nproduces change set"
land: "A merges\ntrunk @ 124" {
  style.fill: "#e6fcf5"
}
reval: "B re-validated\nagainst 124" {
  shape: hexagon
  style.fill: "#fff9db"
}

base -> a
base -> b
a -> land
land -> reval
b -> reval: "base changed"
```

That re-validation is exactly what the [merge queue](../integration/merge-queue.md) does. So the
rule is:

> **Pessimistic within a domain, optimistic across domains, with the merge queue as the conflict
> detector.**

What the model does not allow is two writers in one domain, reconciled after the fact. That
reconciliation is precisely where [semantic conflicts](../foundations/semantic-conflicts.md)
hide.

## Cross-domain changes

Some changes genuinely cross domains. Those are not an exception to the model; they are a
first-class case with their own shape:

```kroki-d2
direction: down

change: "Cross-domain change"
plan: "Planning agent"
analysis: "Dependency analysis"

a: "Domain A change"
b: "Domain B change"
pra: "PR A"
prb: "PR B"
integ: "Integration PR" {
  style.fill: "#fff9db"
}

change -> plan -> analysis
analysis -> a
analysis -> b
a -> pra
b -> prb
pra -> integ
prb -> integ
```

That is very different from today's dominant model of:

> "give five agents the repository and hope Git sorts it out."

!!! tip "A practical starting point"
    You don't need a lease server to begin. Start by declaring domains in a file, requiring every
    agent task to name the domain it writes to, and refusing to start a second task in a domain
    that already has an open change set. That covers most of the value; the infrastructure can
    come later.
