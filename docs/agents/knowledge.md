# Memory & Knowledge

[Knowledge in the Repo](../governance/repo-knowledge.md) is about *authored* knowledge: versioned
files that humans and agents both read, reviewed like code. This page is about *derived* and
*learned* knowledge — the indexes, graphs and memories an agent platform builds and queries.

The two have a strict relationship:

> **The repository stays the source of truth.** Everything on this page is either rebuildable
> from sources — code, history, trackers, repo-resident docs — or is a proposal on its way into
> the repository.

## Memory is not just conversation history

Generic agents need several kinds of memory:

| Memory | Holds | Lifetime |
|--------|-------|----------|
| Working memory | The current reasoning context | One step or session |
| Task memory | What happened during this work item | One work item |
| Repository memory | Learned architecture and domain knowledge | Long-lived |
| Organisational memory | Standards, decisions, policies | Long-lived |
| Episodic memory | Previous agent attempts and their results | Long-lived |

Repository memory, for example, might contain:

```text
"ImagePipeline uses a producer-consumer architecture."
"FrameBuffer ownership transfers to ReconstructionEngine."
"Never allocate memory inside the acquisition callback."
"Component X is IEC 62304 Class C."
"Algorithm Y originated from product generation Z."
```

That knowledge is dramatically more valuable than simply vectorizing the source code.

## Don't reduce memory to a vector database

Vector search is useful, but an engineering knowledge system needs several representations:

```kroki-d2
direction: down

repo: "Repository + history + trackers" {
  shape: cylinder
}
text: "Text" {
  e: "embeddings"
  d: "docs, ADRs"
  i: "issues"
}
graph: "Graph" {
  s: "symbols"
  c: "calls"
  dep: "dependencies"
  t: "types"
}
meta: "Metadata" {
  o: "ownership"
  sc: "safety class"
  ts: "test status"
  r: "requirements"
}

repo -> text
repo -> graph
repo -> meta
```

Different questions need different retrieval mechanisms:

| Question | Best answered by |
|----------|------------------|
| "What depends on `FrameProcessor`?" | The code graph |
| "Why was this architecture selected?" | ADRs, Git history, issues and documentation |
| "Who owns this, and how critical is it?" | Metadata — [domain metadata](../ownership/codeowners.md) and the [software catalog](../platform/mature-stack.md#backstage) |

## Make domain understanding first-class

This matters most in domains like medical imaging. Imagine the source contains:

```cpp
float x = (p - b) * c;
```

The model can understand the syntax. But semantically, perhaps:

```text
p = raw detector pixel value
b = detector offset calibration
c = gain correction coefficient
x = corrected detector intensity
```

and perhaps:

```text
REQ-IMG-124:
Detector gain correction shall occur before logarithmic conversion.
```

That is the knowledge that matters. So build an explicit domain model:

```yaml
domain_concept: Detector gain correction
meaning: Correct detector non-uniformity
implementation:
  - GainCorrection.cpp
requirements: [IMG-124, IMG-127]
tests: [TC-3381, TC-3384]
hazards: [HAZ-92]
products: [Platform A, Platform B]
```

Now agents can reason across **requirements → domain → code → tests → hazards**.

## A software knowledge graph

For large modernization programmes, this becomes one of the highest-value capabilities:

```kroki-d2
direction: down

req: "Requirement" {
  style.fill: "#e7f5ff"
}
cap: "Domain capability"
comp: "Component"
sym: "Source symbols"
tests: "Tests"
risk: "Risk / hazard" {
  style.fill: "#ffe8cc"
}

req -> cap: "implemented by"
cap -> comp: "realized by"
comp -> sym: "contains"
sym -> tests: "verified by"
tests -> risk: "evidence for\nrisk control"
```

Then add Git commits, tracker items, architecture decisions, owners, products, versions,
dependencies and CVEs. Suddenly the agent can answer questions like:

* *What would break if we remove this component?*
* *Which safety requirements are potentially affected if we migrate this algorithm?*

Those are much more interesting than code completion.

## Context engineering

Giving the model the whole repository is neither realistic nor desirable. The system has to
construct useful context for each step:

```kroki-d2
direction: down

task: "Work item" {
  style.fill: "#fff9db"
}
retrieve: "Retrieve" {
  grid-columns: 3
  dc: "domain concepts"
  ar: "architecture"
  sy: "symbols"
  de: "dependencies"
  te: "tests"
  rc: "recent changes"
}
rank: "Rank"
compress: "Compress"
ctx: "Model context" {
  style.fill: "#e6fcf5"
}

task -> retrieve -> rank -> compress -> ctx
```

This is considerably more sophisticated than retrieval over source files, and it is becoming an
engineering discipline of its own.

## Leave the world smarter

After a work item finishes, don't retain only the code change. Retain what was learned.

Suppose that during a vulnerability remediation the agent discovers:

> `OpenSSLWrapper` exists because the device historically had to support TLS 1.0
> interoperability.

Store that, with its evidence, and the next agent benefits. Repository understanding grows a
little with every task — a compounding effect that is arguably worth more than any single change.

!!! warning "Agent-written memory can lie too"
    The rule from [Knowledge in the Repo](../governance/repo-knowledge.md) — *documentation that
    lies is worse than none* — applies doubly to memory an agent wrote. So:

    * Every learned entry carries **provenance**: the files, lines, commits and documents it rests
      on — see [Evidence & Uncertainty](evidence.md#provenance).
    * It enters as a **hypothesis**, not a fact, until a human reviews it or a verifier confirms
      it.
    * Durable knowledge lands **in the repository, through a PR** — for example under
      `docs/domain/` — and the graph is rebuilt from it.
    * An entry is **re-verified when the code it cites changes.** A claim anchored to
      `TemporalFilter.cpp:42-193` is stale the moment those lines are.
