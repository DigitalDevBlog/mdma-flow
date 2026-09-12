# Platform

Before looking at products, there is one lesson worth internalising, because it reframes what you
are actually buying.

## Agent scalability *is* architecture scalability

Imagine a system with 100 agents. But every meaningful change touches:

```text
src/application.cpp
src/global_state.cpp
src/config.cpp
```

You don't really have 100-way parallelism. You effectively have:

```text
parallelism ≈ 1
```

Now imagine a system with explicit contracts between:

```kroki-d2
direction: right

sys: "System" {
  grid-columns: 2
  acq: "Acquisition"
  recon: "Reconstruction"
  render: "Rendering"
  meas: "Measurements"
  patient: "Patient domain"
  persist: "Persistence"
  net: "Networking"
  sec: "Security"
}

p: "parallelism ≈ number of\nindependent architectural domains" {
  shape: hexagon
  style.fill: "#e6fcf5"
}

sys -> p
```

This leads to something I think will become increasingly important:

!!! quote "The measurement worth adopting"
    **Agent concurrency is an empirical measure of architectural modularity.**

If 20 agents cannot safely work independently on your application, that's valuable architectural
feedback, arguably more honest feedback than any architecture review will give you, because it
is measured rather than asserted.

It also reframes the investment question. "Should we spend on agent tooling or on modularisation?"
is a false choice: modularisation *is* the agent-throughput investment. Tooling buys you the
ability to use parallelism your architecture already permits, and not one agent more.

## The stack I would consider today

For this sort of engineering environment, I'd separate concerns rather than look for one magic
framework. This is the site's one stack table, grouped by the layers of the
[reference architecture](reference-architecture.md):

| Layer | Problem | Mechanism / tool |
|-------|---------|------------------|
| **Reasoning** | Agent execution | Codex / Claude Code / OpenHands SDK |
| | Stateful agent workflows | LangGraph / Microsoft Agent Framework |
| | Agent guidance | AGENTS.md + Skills |
| | Agent SDK / embedding | Claude Agent SDK / Codex SDK / Copilot SDK / OpenHands SDK |
| | Tool interoperability | MCP |
| **Work & ownership** | Task source | Jira / Linear / GitHub Issues |
| | Organisational orchestration | Symphony / OpenHands |
| | Work dependency | DAG of work items |
| | Architecture ownership | CODEOWNERS + custom domain metadata |
| | Software catalog | Backstage |
| **Control plane** | Policy enforcement | OPA |
| | In-harness enforcement | Permission rules + blocking hooks: see [Harness Capabilities](harness-capabilities.md) |
| | DAG execution | Argo Workflows (Tekton where the job is CI-shaped) |
| | Guardrails | GitHub rulesets |
| | Governance | audit trail + policy control |
| **Execution** | Parallel isolation | Git worktrees / containers |
| | Compute isolation | Kubernetes |
| | Security | sandbox + scoped credentials |
| | Secrets | Vault / cloud-native secrets |
| | Infrastructure | Terraform / Ansible |
| **Verification** | Existing CI/CD | Jenkins / GitHub Actions / GitLab CI |
| | Agent invocation from CI | Headless mode with structured output |
| | Quality | native test frameworks + characterization/contract tests |
| | Architecture validation | executable architecture tests |
| | Security scanning | existing SAST / SCA / SBOM tooling |
| | Review | specialist review agents + humans |
| **Integration** | Change representation | small PRs |
| | Dependent work | stacked PRs / Graphite |
| | Integration | GitHub merge queue / Graphite |
| **Observability** | Traces, metrics, cost | OpenTelemetry + existing monitoring |

No one product does all of this well yet. **And that's the important point.**

Notice also how little of the table is AI technology. Only the first group is genuinely new;
everything below it has years, sometimes decades, of operational history. The pages that follow
look at the layering, at what exists in the new part, at what to reuse from the mature part, and
at what to design around instead.

## Pages in this section

* [Reference Architecture](reference-architecture.md): the layered platform, and one flow through
  it end to end
* [Orchestration Landscape](landscape.md): Codex and Symphony, OpenHands, Claude Code, Copilot,
  LangGraph, Microsoft Agent Framework, GitButler
* [Harness Capabilities](harness-capabilities.md): the requirements checklist, and how four
  harnesses answer it
* [Building on the Mature Stack](mature-stack.md): Argo, Tekton, Jenkins, OPA, Backstage, and
  the test frameworks you already have
* [Five Primitives](primitives.md): the abstraction that makes all of them replaceable
