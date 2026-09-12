# Work as a DAG

Representing the work as a directed acyclic graph is where decomposition becomes actionable. It
is particularly useful for modernization programmes.

## What a DAG is

A **DAG** is a **Directed Acyclic Graph**, a way of representing tasks and the dependencies
between them.

**Directed** means the relationships have a direction. You cannot do the refactoring properly
until the earlier work is done:

```kroki-d2
direction: right

arch: "Understand\narchitecture"
bounds: "Define module\nboundaries"
refactor: "Refactor\nmodule"
integ: "Run integration\ntests"

arch -> bounds -> refactor -> integ
```

**Acyclic** means there are no loops. This is not a plan, because nothing in it could ever
start:

```kroki-d2
direction: right

a: "A" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
b: "B" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
c: "C" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}

a -> b: "depends on"
b -> c: "depends on"
c -> a: "depends on" {
  style.stroke: "#c92a2a"
  style.stroke-dash: 4
}
```

For agents, a DAG is useful because it tells the orchestrator **what must happen first and what
can happen in parallel**:

```kroki-d2
direction: right

analyze: "Analyse\ncodebase"
tests: "Analyse tests"
deps: "Analyse\ndependencies"
design: "Design\nrefactoring" {
  style.fill: "#fff9db"
}
ma: "Module A"
mb: "Module B"
mc: "Module C"
integ: "Integration\ntest" {
  style.fill: "#e6fcf5"
}

analyze -> tests
analyze -> deps
tests -> design
deps -> design
design -> ma
design -> mb
design -> mc
ma -> integ
mb -> integ
mc -> integ
```

Here Module A, B and C can potentially be worked on simultaneously by three agents. The
integration test cannot start until all three are finished.

!!! quote "A DAG, in one sentence"
    **A map of work showing dependencies — and therefore revealing safe opportunities for
    parallel execution.**

## A migration, as a DAG

Suppose you're migrating functionality from Legacy Platform A into Platform B. Instead of:

```text
Agent:
"Migrate feature X."
```

you create:

```kroki-d2
direction: down

capture: "Capture domain behaviour"
chars: "Characterization tests" {
  style.fill: "#e6fcf5"
}
extract: "Extract algorithm"
contract: "Define API contract"
port: "Port algorithm"
adapter: "Implement adapter"
integ: "Integration tests"
validation: "System validation" {
  style.fill: "#fff9db"
}

capture -> chars
chars -> extract
chars -> contract
extract -> port
contract -> adapter
port -> integ
adapter -> integ
integ -> validation
```

Now the orchestrator knows what may run concurrently and what may not: nodes without unmet
dependencies can run in parallel, everything else waits.

This is **much safer than "launch five agents."** Five agents launched at once against one
feature are five writers to an undefined set of files. Five agents launched against five ready
DAG nodes are five writers to five disjoint scopes.

In a mature setup, a planning agent derives this graph from the goal and a deterministic
orchestrator executes it — planning is where reasoning is needed, scheduling is not. See
[The Agent Runtime](../agents/runtime.md#keep-the-orchestrator-dumb).

## Dependencies aren't enough: change surfaces

One subtle but important point: **the DAG alone does not guarantee that parallel work is
safe.** Two logically independent nodes might both modify `src/common/utils.cpp`.

So each node should also declare a **change surface**: the paths it will write, and the paths
whose behaviour it depends on.

```yaml
work_item: Extract DICOM parser
scope:
  domain: io
  writes:
    - src/io/dicom/**
    - tests/dicom/**
  reads:
    - src/io/**
    - src/common/**
```

```yaml
work_item: Refactor network transport
scope:
  domain: network
  writes:
    - src/network/**
  reads:
    - src/network/**
    - src/common/**
```

`reads` is a declaration, not a permission. Every agent can still read the whole repository —
[restricting reads makes agents dumber](../ownership/index.md). The list tells the scheduler which
*other* changes would invalidate this one, so that when something it depends on lands, the task
is re-verified against the new base.

These two can run concurrently: their writes are disjoint and they only share a read. If both
declared a write to `src/common/**`, don't run them in parallel and reconcile afterwards — that
after-the-fact merge is exactly where [silent semantic conflicts](../foundations/semantic-conflicts.md)
slip through. Either serialize them with a DAG edge, or pull the `common` change out into its own
change set that lands first — the [shared-kernel rule](../ownership/codeowners.md#the-shared-model-problem).

A change surface is finer-grained than an ownership domain, not an alternative to it. Its
`writes` must fall inside the domain the task holds a
[write lease](../ownership/single-write-authority.md) for; a task whose writes span two domains
is a [cross-domain change](../ownership/single-write-authority.md#cross-domain-changes) and gets
split.

Three different kinds of conflict, three different mechanisms:

| Conflict | Handled by |
|----------|------------|
| Logical dependency — what must finish first | The DAG |
| Code conflict — who may write where, right now | Change surfaces and [Single Write Authority](../ownership/single-write-authority.md) |
| Semantic conflict — changes that are individually fine and jointly broken | [Contracts](contracts.md) and the [merge queue](../integration/merge-queue.md) |

The DAG handles *logical dependencies*; write ownership handles *code conflicts*. Neither handles
the third row on its own — that is the subject of
[Semantic Conflicts](../foundations/semantic-conflicts.md).

## What a node needs to carry

A DAG node is only useful if it is executable without re-interpretation. In practice that means
each node carries:

| Field | Purpose |
|-------|---------|
| Objective | What this node changes, in one sentence |
| Ownership domain | The write scope — see [Single Write Authority](../ownership/single-write-authority.md) |
| Change surface | Declared writes (inside the domain) and reads, so the scheduler can detect overlap before work starts |
| Dependencies | Node IDs that must complete first |
| Required evidence | The tests and checks that define "done" |
| Approval | Who signs off, if anyone |

That list is the seed of the [work item primitive](../platform/primitives.md).

## Characterization tests come first for a reason

Notice that the second node in the migration DAG above is *characterization tests*, and that
almost everything else depends on it.

That ordering is not stylistic. In a modernization context you are porting behaviour you do not
fully understand, and the only durable definition of "correct" is the behaviour of the system
you're replacing. Capturing it first turns every downstream node into something an agent can
verify itself against — which is what makes unattended execution safe enough to be worth doing.
The technique is developed further in
[Modernization Workflows](../modernization/workflows.md#characterize-before-you-transform).

!!! tip "Don't write the scheduler yourself"
    Executing a DAG of containerized jobs — dependencies, parallelism, retries, artefacts — is a
    solved problem. Mature workflow engines already do it; see
    [Building on the Mature Stack](../platform/mature-stack.md#argo-workflows).

!!! warning "The DAG is a plan, not a prophecy"
    Real migrations discover work. Treat the graph as living state that the planning phase
    updates as nodes complete, not as an upfront artefact that gets stale by week two. A
    workflow engine executes a *snapshot* of the graph; the living graph belongs to the planning
    layer — see [Replanning a living DAG](../platform/mature-stack.md#replanning-a-living-dag).
