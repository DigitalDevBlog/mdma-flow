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
change: see [Roles & Review](../agents/roles.md#separate-proposer-and-reviewer).

GitHub now provides agentic code review as part of its workflow, while explicitly noting that
agent-generated PRs still deserve proper review. That is now the norm rather than a
differentiator, and the implementations differ in ways that matter for pipeline design.

!!! example "In the harnesses"
    * **Claude Code**: [code review](https://code.claude.com/docs/en/code-review) runs several
      specialized agents over a diff in parallel, each looking for a different class of issue,
      then applies a verification step that filters false positives before ranking what survives.
    * **GitHub Copilot**: [automatic review](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-automatic-review)
      can be required by repository ruleset, and now gives a full agentic review to pull requests
      its own cloud agent opened.
    * **Codex**: [approval review](https://learn.chatgpt.com/docs/agent-approvals-security) routes
      risky actions to a reviewer sub-agent that scores them and fails closed when it cannot parse
      a result.
    * **OpenHands**: a critic scores work during execution and drives iterative refinement,
      though it is explicitly experimental.

Two things vary across that list, and both matter: **when** the review happens (during execution,
on the diff, or at an approval gate) and **whether a failed review blocks anything**. Only the
ruleset case is a gate. The rest produce advice, until your pipeline decides to treat it as more.

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
adding: it is something you are required to do anyway. Making it machine-readable lets it drive
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
accumulates that agents handle it well, and back down when they don't. The table is policy; it
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

That last pair is what makes the whole thing auditable. In a regulated environment,
auditability is not an add-on to the workflow, it *is* the workflow.

## Pages in this section

* [Executable Architecture](executable-architecture.md): turning architecture rules into checks
* [Knowledge in the Repo](repo-knowledge.md): moving intelligence out of prompts and into files
* [Agent Identity & Permissions](agent-identity.md): treating agents like service accounts
