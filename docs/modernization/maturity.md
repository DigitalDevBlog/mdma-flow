# Maturity Path

I would build all of this in stages. Each stage adds one capability, and each stage's
verification is what makes the next one safe to attempt.

| Stage | Name | Adds | Covered in |
|-------|------|------|------------|
| 1 | Tool-using engineer | Human → agent → tools. The agent can understand, edit, build and test | [The Agent Runtime](../agents/runtime.md) |
| 2 | Closed-loop engineer | Goal → change → verify → repair → verify | [Verification](../agents/verification.md) |
| 3 | Planning | Goal → decomposition into work items → execute → verify the goal | [Work as a DAG](../decomposition/dag.md), [Five Primitives](../platform/primitives.md) |
| 4 | Persistent repository intelligence | Architecture, domain, requirement and historical memory | [Memory & Knowledge](../agents/knowledge.md) |
| 5 | Parallel execution | Task DAG + change surfaces + write leases + worktrees | [Ownership](../ownership/index.md), [Integration](../integration/index.md) |
| 6 | Specialized reasoning | Architecture, security, testing and domain agents | [Roles & Review](../agents/roles.md) |
| 7 | Portfolio-scale modernization | Many repositories, many objectives, central policy and knowledge, distributed execution | [Reference Architecture](../platform/reference-architecture.md) |

Stage 7 is where this becomes transformative:

```text
100 repositories
1,000 modernization objectives
hundreds of agents
central policy
central knowledge
distributed execution
```

## Reading the path

**Stages 1–2 are about one agent being trustworthy.** Nothing later works without a
closed verification loop; skipping to parallelism with an agent that can't verify its own work
just produces unverified work faster.

**Stage 3 is where the [work item](../platform/primitives.md) arrives.** It is the smallest
primitive and the one everything else attaches to — which is why it is the thing to
[build first](../platform/primitives.md#where-to-invest).

**Stage 5 is where the rest of this site becomes load-bearing.** Before it, one agent works at a
time and ownership is trivial. From it onwards, [semantic conflicts](../foundations/semantic-conflicts.md),
write leases and the merge queue decide whether parallelism helps or hurts — and your architecture
decides how much parallelism is available at all.

**Stage 6 comes late on purpose.** Splitting one agent into specialists is only worth it once you
can see a bottleneck the split removes — see
[Don't start with multi-agent](../agents/roles.md#dont-start-with-multi-agent). The agent hierarchy
in the [modernization overview](index.md) lives here, not at stage 1.

!!! tip "Stages are cumulative, not sequential projects"
    Stage 4's knowledge model makes stage 2's verification smarter; stage 5's leases make stage
    3's plans executable in parallel. Treat the path as an order of *adoption*, and keep investing
    in the earlier stages as you add later ones.
