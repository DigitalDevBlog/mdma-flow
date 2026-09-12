# Executable Architecture

Making architecture rules executable becomes incredibly valuable once agents are writing code.

Say the intended layering is:

```kroki-d2
direction: down

ui: "UI"
app: "Application"
domain: "Domain"
infra: "Infrastructure"

ui -> app -> domain -> infra

ui -> infra: "forbidden" {
  style.stroke: "#c92a2a"
  style.stroke-dash: 4
}
domain -> infra: "forbidden" {
  style.stroke: "#c92a2a"
  style.stroke-dash: 4
}
```

Then enforce it:

```text
Domain MUST NOT depend on Infrastructure.
UI MUST NOT access Persistence directly.
```

Using tools such as:

* ArchUnit
* dependency-cruiser
* clang tooling
* custom dependency graph checks
* Rust crate boundaries
* Bazel visibility
* Nx module boundaries

Agents then get immediate feedback:

```text
Architecture violation:

src/domain/patient.cpp

may not depend on:

src/persistence/sqlite_repository.h
```

Instead of needing an architect to catch it during review.

## Why this changes the economics

An architecture rule that lives in a document is advisory. An architecture rule that fails the
build is a boundary.

That distinction always mattered; with agents it becomes decisive, for a simple reason: **an
agent will cheerfully satisfy your test suite by violating your architecture.** It has no career
stake in the design, no memory of the meeting where the boundary was agreed, and no discomfort
about reaching through a layer if that makes the test pass. The only thing that reliably stops it
is a check that says no.

| Rule lives in | Agent behaviour |
|---------------|-----------------|
| An architecture document | Ignored unless it happens to be in context |
| A review convention | Caught late, after the work is done, by a scarce human |
| `AGENTS.md` | Usually respected, but not guaranteed |
| A failing check | Fixed by the agent itself, before anyone looks |

This is exactly the kind of **machine-legible environment** that current agent-first engineering
practices increasingly emphasise. OpenAI, for example, describes exposing tests, application
state, logs, metrics and observability directly to agents so they can verify their own work.

!!! tip "Self-correction is the real prize"
    A violation caught by a check is not a review finding; it is an input to the agent's next
    iteration. Every rule you make executable moves work from the reviewer's queue into the
    agent's inner loop, which is the only place where extra iterations are cheap.

## Where to start

You do not need a complete architecture description to benefit. Encode, in this order:

1. **Layering**: the dependency direction rules you already believe in
2. **Module boundaries**: which packages may import which
3. **Forbidden dependencies**: specific known-bad edges, including third-party ones
4. **Public API surface**: what is allowed to be referenced from outside a module
5. **Ownership conformance**: changes stay inside the declared [domain paths](../ownership/codeowners.md)

Each one converts a class of review comment into a build failure.
