# Integration

Agents can generate enormous amounts of code. That is usually counterproductive.

You want:

```kroki-d2
direction: down

task: "Agent task"
diff: "Small coherent diff"
test: "Test"
review: "Review"
merge: "Merge" {
  style.fill: "#e6fcf5"
}

task -> diff -> test -> review -> merge
merge -> task: "next task" {
  style.stroke-dash: 4
}
```

rather than:

```kroki-d2
direction: down

work: "Agent works for 7 hours"
pr: "12,000-line PR" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
human: "Human reviewer cries" {
  shape: person
}

work -> pr -> human
```

## The unit of productivity

OpenAI's own agent-first engineering experience is instructive here: their harness-engineering
approach has agents review their own changes, ask additional agents to review them, and iterate
against CI and review feedback rather than producing one enormous artefact.

!!! quote "Measure the right thing"
    The **unit of agent productivity shouldn't be LOC**. It should be something closer to
    *independently verifiable changes*.

Lines of code is not merely a bad metric here; it is an actively inverted one. The cheapest
thing an agent can do is write more code; the expensive things are understanding the existing
system, changing the least necessary, and proving the change is correct. Counting output rewards
exactly the wrong half.

## Why small changes matter more with agents, not less

Small PRs were always good practice. Three things make them load-bearing once agents are
involved:

| Reason | Effect |
|--------|--------|
| Review capacity is now the bottleneck | Agents produce changes faster than humans can read them; the only lever left is making each change cheaper to read |
| Blame resolution | When a 12,000-line agent PR breaks production, nobody can tell which of its forty decisions did it |
| Rollback granularity | A small change is a revertible change; a giant one is a negotiation |
| Semantic conflict surface | A change set touching forty files across six domains conflicts with everything |

## Pages in this section

* [Merge Queue](merge-queue.md): the serialization point everything above funnels into
* [Stacked PRs](stacked-prs.md): how to keep changes small when the work genuinely is large
