# Multi-Developer, Multi-Agent

The important shift is to stop treating the AI agent as *"a very smart IDE autocomplete for one
developer"* and instead treat agents as **participants in the engineering system**.

The strongest practices emerging in 2026 are not new inventions. They are combinations of
well-proven software-engineering mechanisms — ownership boundaries, small changes, CI, merge
queues, isolated environments — with newer agent orchestration on top.

!!! quote "The principle everything here follows from"
    **Parallelize reasoning and implementation aggressively, but serialize mutation of shared
    state through controlled integration points.**

    That principle matters much more than which model you use.

The same shape repeats inside each agent: a probabilistic model proposes, and deterministic
machinery — permissions, ownership, isolation, tests, policy — decides what is allowed to stand.
See [Engineering Agents](agents/index.md#the-deepest-principle).

## What you'll find here

| Section | What it covers |
|---------|----------------|
| [Foundations](foundations/index.md) | The coordination architecture, isolated write contexts, and the semantic conflicts worktrees don't solve |
| [Ownership](ownership/index.md) | Single Write Authority, leases as transactions, and extending `CODEOWNERS` for agents |
| [Decomposition](decomposition/index.md) | Splitting work along architectural seams, work as a DAG, change surfaces, contracts as synchronization barriers |
| [Integration](integration/index.md) | Small PRs, merge queues, and stacked PRs as the serialization layer |
| [Governance](governance/index.md) | Review pipelines, progressive autonomy, executable architecture rules, repo-resident knowledge, agent identity and prompt injection |
| [Agents](agents/index.md) | Inside an engineering agent: the runtime, verification, memory and knowledge, evidence and uncertainty, roles |
| [Platform](platform/index.md) | The layered reference architecture, the orchestration landscape, the mature stack to reuse, and the five primitives |
| [Modernization](modernization/index.md) | Applying all of it to legacy, safety-critical software: capabilities, workflows, and a maturity path |

!!! tip "Start here if you're in a hurry"
    For coordinating many agents: [the coordination architecture](foundations/index.md), then
    [Single Write Authority](ownership/single-write-authority.md), then
    [Five Primitives](platform/primitives.md).

    For the agent platform: [Engineering Agents](agents/index.md), then
    [Reference Architecture](platform/reference-architecture.md), then
    [Modernization](modernization/index.md).

## Vocabulary

Sources, tools and the infographics on this site use overlapping words for the same things. On
this site, each term has exactly one meaning:

| Term | Meaning here | Also called elsewhere |
|------|--------------|-----------------------|
| **Work item** | The unit of planned work: objective, scope, dependencies, constraints, budget, required evidence, approval. One schema at task and programme scope — see [Five Primitives](platform/primitives.md#a-work-item-concretely) | task, goal, executable contract |
| **Change set** | The reviewable, revertible output of one work item: one branch, one PR | patch, diff |
| **Validation evidence** | The verifier outputs attached to a change set | verification results |
| **Ownership domain** | A set of paths matching an architectural boundary; the unit of write leases and review authority | module, component |
| **Write lease** | [Single Write Authority](ownership/single-write-authority.md) over one domain, held by one active change set | lock |
| **Change surface** | A work item's declared `writes` (inside its domain) and `reads` (dependencies, not permissions) | reads / writes |
| **Reasoning layer** | The probabilistic part — planner and agents. It proposes | "AI agent control plane" in the infographics |
| **Control plane** | The deterministic part — policy, orchestration, leases, budgets, audit. It disposes | policy layer, orchestration layer |
| **Orchestrator** | The deterministic scheduler inside the control plane; [deliberately dumb](agents/runtime.md#keep-the-orchestrator-dumb) | — |
| **Harness** | The program that runs an agent loop: tools, permissions, sandboxing, hooks, subagents. Claude Code, Codex, Copilot and OpenHands are harnesses — [compared here](platform/harness-capabilities.md) | agent runtime, coding agent, CLI |
| **Model** | The reasoning engine a harness calls. Named nowhere in a work item: tasks declare a [capability tier](agents/runtime.md#decoupling-from-the-model) and configuration maps it | LLM |
