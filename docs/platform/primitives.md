# Five Primitives

Rather than committing heavily to Codex, Claude Code, OpenHands or anything else, define these
first:

```kroki-d2
direction: down

p1: "1. WORK ITEM" {
  style.fill: "#e7f5ff"
}
p2: "2. OWNERSHIP DOMAIN" {
  style.fill: "#e6fcf5"
}
p3: "3. EXECUTION ENVIRONMENT" {
  style.fill: "#fff9db"
}
p4: "4. CHANGE SET" {
  style.fill: "#ffe8cc"
}
p5: "5. VALIDATION EVIDENCE" {
  style.fill: "#f3f0ff"
}

p1 -> p2: "scoped to"
p2 -> p3: "executed in"
p3 -> p4: "produces"
p4 -> p5: "verified by"
```

Then agents become replaceable executors.

## A work item, concretely

```yaml
work_item:
  id: US-18432
  objective: Remove the deprecated imaging API from reconstruction
  goal: MOD-212                   # programme-level goal this item was planned from

scope:
  domain: image-reconstruction    # the write lease this item needs
  writes:                         # change surface; must sit inside the domain
    - reconstruction/**
    - tests/reconstruction/**
  reads:                          # declared dependencies, not a permission
    - common/imaging/**

dependencies:
  - US-18429

constraints:
  - no public API changes
  - no numerical regression > 0.1%
  - no performance regression > 5%

execution:
  sandbox: container
  branch: agent/US-18432

budget:
  tokens: 500000
  wall_time: 90m
  attempts: 12

required_evidence:
  - unit-tests
  - regression-tests
  - golden-image-comparison
  - performance-benchmark
  - architecture-check
  - security-scan

approval:
  code_owner: reconstruction-team
  architecture_change: human
```

Codex could execute it today. OpenHands tomorrow. Claude Code next week. **A human developer
could execute exactly the same work item.**

`scope.writes` is also the field that becomes enforceable: it is what a harness permission rule or
a blocking hook checks on every tool call — see
[How this is enforced in practice](../agents/runtime.md#how-this-is-enforced-in-practice).

That's a much more durable abstraction than any framework you could adopt instead.

### Two scales, one schema

The same shape works one level up. A programme-level goal — *modernize the reconstruction
module* — is a work item with a wide scope, programme-wide constraints, and evidence that is the
union of its children's. A planner decomposes it into items like the one above, each inheriting
the parent's constraints and narrowing its scope to one domain.

`constraints` and `required_evidence` are the fields that turn a work item from a description
into an **executable contract** — see [Verification](../agents/verification.md).

## What each primitive is load-bearing for

| Primitive | Carries | Without it |
|-----------|---------|------------|
| **Work item** | Intent, constraints, dependencies, budget, definition of done | Prompts, which are unversioned and unreviewable |
| **Ownership domain** | Write scope and review authority | [Semantic conflicts](../foundations/semantic-conflicts.md) you find at merge time |
| **Execution environment** | Isolation, credentials, network; enforces the budget | Agents interfering with each other and with production |
| **Change set** | The reviewable, revertible unit | 12,000-line PRs nobody can assess |
| **Validation evidence** | The proof, attached to the change | Trust in a model's self-report, which is optimistic by construction |

Notice that none of the five names a vendor, and none of them names a model. That is the test:
if a primitive can't survive swapping the agent for a person, it isn't a primitive — it's a
product feature.

## Single Write Authority at the centre

The idea that ties the five together is the one from
[Ownership](../ownership/single-write-authority.md), refined:

> **Single Write Authority per architectural domain per integration epoch.**

Not "only one agent may change the repository" — that would destroy the parallelism you are
building all of this for. One writer *per domain*, *while a change set is active*.

## Where to invest

Given the kind of modernization platform this is aimed at — domain discovery, characterization
testing, modularization, feature migration, vulnerability removal — I'd make the **work
allocation / ownership / dependency-control layer** a first-class part of the architecture,
rather than treating it as a Git implementation detail.

Be precise about what "build" means here. It does not mean building a DAG scheduler, a CI
system or a policy engine — those exist and are mature; see
[Building on the Mature Stack](mature-stack.md). It means the thin layer that decides *what*
runs and *who may write where*: work items, ownership domains, leases and the living DAG. A
workflow engine can execute the graph; only you can say which domain a task may write to.

That is the part no vendor is building for you, the part that encodes how your organisation
actually works, and the part that will still be true after the current generation of agent tools
has been replaced twice.

!!! tip "If you build one thing first"
    Build the work item. It is the smallest primitive, it forces you to name your domains and
    your evidence, and everything else — leases, sandboxes, review routing, audit — attaches to
    it later without rework.
