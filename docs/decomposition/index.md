# Decomposition

Decompose work according to **architecture**, not according to prompts.

A poor agent decomposition is:

```text
Agent 1 → implement functionality
Agent 2 → write tests
Agent 3 → refactor
Agent 4 → optimize
```

They'll continually collide, because all four are defined over the *same* code. Every one of
them has a legitimate reason to edit the file the others are editing.

A much better decomposition follows **architectural seams**:

```kroki-d2
direction: down

feature: "Feature:\nnew ultrasound measurement capability" {
  style.fill: "#fff9db"
}

domain: "Domain model"
api: "API contract"
core: "Measurement core"
integration: "Integration"
ui: "UI"
storage: "Storage"
tests: "Tests"
docs: "Docs"

feature -> domain
feature -> api
domain -> core
api -> integration
core -> ui
core -> storage
integration -> tests
integration -> docs
```

Now agents have natural isolation boundaries: boundaries that already exist in the code, rather
than boundaries invented by whoever wrote the prompt.

## What this rewards

Good agentic development strongly rewards exactly the things good architecture already rewards:

* modular architectures
* bounded contexts
* clean interfaces
* dependency inversion
* contract tests
* APIs instead of shared implementation knowledge

Interestingly, agents expose architecture quality very quickly.

!!! quote "A useful diagnostic"
    A repo that humans describe as "modular" but where six agents constantly modify the same ten
    files probably isn't particularly modular.

    You can measure this. Take the last hundred change sets, count how often two of them touch
    the same file, and you have an empirical modularity score that no architecture diagram will
    give you. The idea is developed in [Parallelism and modularity](../platform/index.md).

## Pages in this section

* [Work as a DAG](dag.md): representing the decomposition so an orchestrator can act on it
* [Contracts as Barriers](contracts.md): the technique that lets separated work proceed
  simultaneously instead of merely separately
