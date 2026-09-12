# Governance

Agent review should **complement** human review, not replace it and not be replaced by it.

A naive pipeline looks like this:

```kroki-d2
direction: down
a: "Agent writes code"
b: "Human must inspect everything" {
  shape: person
  style.fill: "#ffe3e3"
}
a -> b
```

That does not scale past about three agents. What works is a layered pipeline where each
specialist review is itself automated, and human attention is spent where risk actually is:

```kroki-d2
direction: down

impl: "Implementation agent"
test: "Test agent"
sec: "Security agent"
arch: "Architecture agent"
human: "Human review\nwhere risk requires it" {
  shape: person
  style.fill: "#fff9db"
}

impl -> test -> sec -> arch -> human
```

Each reviewer in that chain is deliberately a different agent from the one that wrote the
change — see [Roles & Review](../agents/roles.md#separate-proposer-and-reviewer).

GitHub now provides agentic code review as part of its workflow, while explicitly noting that
agent-generated PRs still deserve proper review.

## Risk-based governance

For something such as medical device software, I'd structure it as a fan-out of specialist
reviews producing evidence, followed by a risk decision:

```kroki-plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName sans-serif
start
:Change;
fork
  :Correctness agent;
fork again
  :Security agent;
fork again
  :Architecture agent;
end fork
:CI evidence;
:Risk classification;
if (Risk level?) then (low)
  :Automated / peer review;
else (high)
  :Mandatory human approval;
endif
:Merge queue;
stop
@enduml
```

!!! quote "The framing that matters"
    The important thing is **risk-based governance**, not "AI versus humans."

A change to a build script and a change to a dose-calculation algorithm are not the same object,
and treating them identically is how organisations end up with review that is simultaneously too
slow and too shallow. In a regulated context the risk classification is not overhead you are
adding — it is something you are required to do anyway. Making it machine-readable lets it drive
the pipeline instead of sitting in a document.

## Progressive autonomy

Human-in-the-loop should not mean *a human reviews every line an agent generates*. That destroys
most of the value, and past a handful of agents it quietly stops happening anyway. Classify
**actions** by risk instead:

| Action | Approval |
|--------|----------|
| Search source | automatic |
| Run tests | automatic |
| Create test | automatic |
| Refactor private function | automatic |
| Change public API | review |
| Change architecture | review |
| Change safety requirement | mandatory human |
| Merge release branch | mandatory human |
| Deploy production | mandatory human |

Autonomy is then granted progressively: an action class moves up the table as evidence
accumulates that agents handle it well, and back down when they don't. The table is policy — it
belongs in a [policy engine](../platform/mature-stack.md#policy-as-code-opa), not in a prompt.

## What the evidence has to include

For every change, regardless of who wrote it:

| Evidence | Produced by |
|----------|-------------|
| Tests run and their results | CI |
| Architecture conformance | [Executable architecture rules](executable-architecture.md) |
| Security scan and dependency review | CI / security agent |
| Who or what authored the change, under which identity | [Agent identity](agent-identity.md) |
| Which spec or work item it satisfies | The work item primitive |

That last pair is what makes the whole thing auditable — and in a regulated environment,
auditability is not an add-on to the workflow, it *is* the workflow.

## Pages in this section

* [Executable Architecture](executable-architecture.md) — turning architecture rules into checks
* [Knowledge in the Repo](repo-knowledge.md) — moving intelligence out of prompts and into files
* [Agent Identity & Permissions](agent-identity.md) — treating agents like service accounts
