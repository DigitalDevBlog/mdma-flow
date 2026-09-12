# Building on the Mature Stack

There is not yet one mature, generic software-engineering agent framework with a decade of proven
DevOps, DevSecOps or test-automation use behind it. The agent layer is still young. But there is a
very mature ecosystem underneath it, and I would reuse it rather than rebuild it.

The division of labour is simple:

> **Let the AI decide *what* needs doing. Let the mature systems execute and enforce it.**

Where each of these sits in the whole is shown in the
[reference architecture](reference-architecture.md); the consolidated tool list is the
[stack table](index.md#the-stack-i-would-consider-today).

## Argo Workflows

There are already very mature systems whose whole purpose is, essentially: *give me a DAG of jobs,
their dependencies, resources and execution environments, and I'll execute it reliably.*

[Argo Workflows](https://argoproj.github.io/workflows/) is one of them. It is Kubernetes-native,
represents workflows explicitly as DAGs, runs each job as a container, and uses the dependency
graph to decide which jobs can execute concurrently — exactly the model on
[Work as a DAG](../decomposition/dag.md).

Argo already handles most of the unglamorous infrastructure work:

* dependencies and parallel jobs
* execution state, failure and retry
* containers and resource allocation
* job lifecycle
* artefacts passed between steps

That's exactly why I would **not implement my own DAG scheduler**, at least initially.

[Tekton](https://tekton.dev/) is the other mature Kubernetes-native option, oriented specifically
towards CI/CD: it describes itself as building blocks for constructing CI/CD systems.

| Engine | Shape |
|--------|-------|
| Argo Workflows | Broader, general-purpose workflow orchestration |
| Tekton | More specifically CI/CD-oriented |

For a generic modernization factory I lean towards Argo, because the jobs extend well beyond
CI/CD: architecture recovery, characterization runs, differential testing, migration waves.

### Replanning a living DAG

There is a tension to resolve here. [The DAG is a plan, not a prophecy](../decomposition/dag.md)
— real work discovers work. But an Argo workflow is submitted as a fixed graph.

The resolution is to keep the two roles apart:

```kroki-d2
direction: down

planner: "Planning layer\nowns the living DAG\n(work items + dependencies)" {
  style.fill: "#f3f0ff"
}
snap: "Snapshot:\nthe ready frontier" {
  shape: document
}
argo: "Argo run" {
  style.fill: "#fff9db"
}
out: "Results, failures,\ndiscovered work"

planner -> snap: "submit"
snap -> argo -> out
out -> planner: "replan" {
  style.stroke-dash: 4
}
```

* **The planning layer owns the graph.** The living DAG is state, stored alongside the work
  items, versioned like any other artefact.
* **Each Argo run executes a snapshot** — the currently ready frontier, or one wave of it.
* **Results feed back.** When nodes complete, fail or report discovered work, the planner adds,
  splits or re-orders work items and submits the next snapshot. Argo can fan out dynamically
  within a run, but *structural* change — new work, new dependencies, a different decomposition —
  belongs to the planner.
* **Leases belong to work items, not to runs.** A replan never silently hands a domain to a
  second writer, because the write lease survives from one snapshot to the next — see
  [Single Write Authority](../ownership/single-write-authority.md).

## Don't throw away Jenkins

Jenkins may feel old-fashioned next to AI agents, but that is part of its value. A
[Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/) already represents the automated
process that takes software from source control through build, test and deployment.

So when an agent concludes *"to verify that this modernization is safe, I need to run the existing
regression suite"*, it should not recreate that test environment. It should call it:

```python
jenkins.run(
    pipeline="ultrasound-system-regression",
    commit="agent/modernization-1837",
)
```

and consume the result.

!!! quote "A central idea of the whole architecture"
    **Agents should orchestrate existing engineering knowledge rather than replace it.**

    That pipeline may contain ten years of institutional knowledge about how the product
    actually builds and gets verified. It is incredibly valuable to the agent — and it is already
    trusted by the people who will review the agent's work.

The same applies to GitHub Actions, GitLab CI or whatever else already gates your releases.

### The other direction: CI invoking the agent

The boundary works in reverse too. A pipeline step can run an agent non-interactively and consume a
structured result:

!!! example "In the harnesses"
    * **Claude Code** — [`claude -p --bare --output-format json`](https://code.claude.com/docs/en/headless),
      where `--bare` skips auto-discovery of hooks, skills and instruction files so the run is
      reproducible, and `--allowedTools` pins what it may do.
    * **Codex** — [`codex exec --json`](https://learn.chatgpt.com/docs/cli/reference), with
      `--output-schema` to constrain the final message and `--ephemeral` to avoid persisting
      session files on a shared runner.
    * **OpenHands** — [`--headless --json`](https://docs.openhands.dev/openhands/usage/cli/headless),
      one JSON object per event — but headless always auto-approves, so the sandbox and hooks are
      the only remaining controls.
    * **GitHub Copilot** — [`-p` in the CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference)
      for a single non-interactive run.

Two rules keep this safe: run the agent in the pipeline's own sandbox with a scoped token, and
treat its output as a *proposal* that the same pipeline then verifies. An agent step that both
writes and judges its own work has removed the gate the pipeline exists for.

## Policy as code: OPA

[Open Policy Agent](https://openpolicyagent.org/) lets you express rules as policy-as-code and
evaluate them deterministically. It is already used for policy enforcement in CI/CD, Kubernetes,
applications and API gateways — and it maps directly onto the deterministic shell around the agent
described in [Engineering Agents](../agents/index.md#the-deepest-principle).

Policies can look like:

```text
Agent may write:        tests/**
Agent may NOT write:    safety/**
Agent may run:          build, test, clang-tidy
Agent may NOT:          deploy production
Architecture change:    requires human approval
Safety-related code:    requires a second reviewer
CVE remediation:        SAST must pass before commit
```

Note that these are all about **writes and actions**, never reads — consistent with
[Ownership](../ownership/index.md): every agent may read the whole repository. In Rego, the
write-scope rule is the work item's change surface checked against the domain metadata:

```rego
package agent.write

default allow := false

# A write is allowed only inside the change surface of the agent's
# active work item, and only while that item holds the domain lease.
allow if {
    some pattern in input.work_item.scope.writes
    glob.match(pattern, ["/"], input.path)
    data.leases[input.work_item.scope.domain] == input.work_item.id
}
```

A harness hook is where that decision lands in practice: a `PreToolUse` hook queries OPA and denies
the call when the answer is no — see
[How this is enforced in practice](../agents/runtime.md#how-this-is-enforced-in-practice).

Notice what that means: **the AI doesn't enforce these rules. OPA does.** Even if the agent
concludes *"I think I'm allowed to change this"*, the answer is simply `DENIED`. The
[progressive-autonomy table](../governance/index.md#progressive-autonomy) belongs here too — it is
policy, not prose.

## Backstage

[Backstage](https://backstage.io/) is an open-source framework for developer portals and software
catalogs. Its catalog represents components, services, libraries, data pipelines and similar
engineering entities, and its templates standardize how new ones are created.

That makes it part of the **world model available to agents**:

```text
Agent asks: "What is ReconstructionEngine?"

Backstage catalog →
  Component:    ReconstructionEngine
  Owner:        imaging-platform-team
  Repository:   ...
  Language:     C++
  Criticality:  ...
  CI pipeline:  ...
  Dependencies: ...
  Docs:         ...
```

That is more robust than asking a model to rediscover everything from Git on every task. It is
also consistent with [keeping knowledge in the repository](../governance/repo-knowledge.md):
catalog entries are normally declared in `catalog-info.yaml` files that live in the repositories
they describe, so the catalog is an index over repo-resident knowledge rather than a rival to it.
Enrich it with the domain knowledge model described in
[Memory & Knowledge](../agents/knowledge.md).

## Testing: reuse, don't reinvent

I wouldn't invent an "AI test execution framework". Let agents invoke whatever already exists:

| Area | Existing frameworks |
|------|---------------------|
| C / C++ | GoogleTest, CTest, Catch2 |
| Python | pytest |
| Java | JUnit |
| Web / UI | Playwright, Cypress |
| BDD | Cucumber |
| API | existing integration frameworks |
| Performance | existing benchmark harnesses |
| Medical imaging | existing image-quality and algorithm-verification tools |

That gives a very clean separation of responsibilities:

| The agent reasons | The framework determines |
|-------------------|--------------------------|
| What is poorly tested? | Pass / fail |
| Which behaviour needs characterizing? | Expected vs actual |
| Which boundary conditions matter? | Coverage |
| Which tests should be generated? | Performance |
| Why did this test fail? | |
| Which test gives more evidence? | |

The model proposes; the test framework is the source of truth. That is
[verifier-driven development](../agents/verification.md#verifier-driven-development) with
infrastructure you already trust.

## MCP is an interoperability layer, not the architecture

The [Model Context Protocol](https://modelcontextprotocol.io/) is useful for standardizing how
agents reach tools and external systems — GitHub, Jira, the filesystem, documentation, build
infrastructure — through one protocol instead of bespoke integrations.

It was created by Anthropic and has since been adopted across harnesses: Claude Code, Codex,
Copilot's cloud agent and CLI, and OpenHands all act as MCP clients. That cross-vendor adoption is
what makes it worth using — a tool you expose once stays reachable from whichever harness you run
next year.

But MCP does not solve:

* planning
* concurrency and ownership
* verification
* memory architecture
* task scheduling
* safety policy
* recovery

It is closer to an interoperability layer. Treat MCP servers as one way of implementing the
[capability layer](../agents/runtime.md#separate-intelligence-from-capabilities) — with the
credentials held by the server, never by the model.

## What stays custom

Reuse is not the same as building nothing. The line runs like this:

| Reuse | Build |
|-------|-------|
| DAG execution — Argo / Tekton | Work items and the living DAG |
| CI and test execution — Jenkins, native frameworks | Ownership domains, leases, change surfaces |
| Policy evaluation — OPA | The policies themselves, derived from domains and risk classes |
| Software catalog — Backstage | The domain knowledge model on top of it |
| Isolation — worktrees, containers, Kubernetes | The reasoning layer: planning, agents, review |

The left column has an operational history. The right column is the part that encodes how *your*
organisation works — which is why [Five Primitives](primitives.md#where-to-invest) argues for
making it first-class.
