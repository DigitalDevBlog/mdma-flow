# Modernization Workflows

Each workflow below is a DAG over the [modernization capabilities](index.md#capabilities-not-agents),
executed with the machinery described in the rest of this site. They differ in their objective,
not in their infrastructure.

## Characterize before you transform

Legacy modernization has one powerful trick. Before changing poorly understood code:

```kroki-d2
direction: down

legacy: "Legacy implementation" {
  shape: cylinder
}
corpus: "Generate input corpus"
capture: "Capture behaviour"
chars: "Create characterization tests" {
  style.fill: "#e6fcf5"
}
refactor: "Refactor"
compare: "Compare behaviour" {
  shape: hexagon
  style.fill: "#fff9db"
}

legacy -> corpus -> capture -> chars -> refactor -> compare
```

That allows:

> **Understand by observing before transforming.**

Agents are well suited to generating these characterization harnesses — it is exactly the kind of
careful, tedious, high-volume work humans postpone. For old C and C++ medical-device software it
can be enormously valuable, and it is why characterization sits near the root of the
[migration DAG](../decomposition/dag.md#characterization-tests-come-first-for-a-reason): it turns
every downstream node into something an agent can verify itself against. It is also the natural
way to settle the [hypotheses](../agents/evidence.md#separate-facts-hypotheses-and-decisions) an
agent forms while reading the code.

## Feature migration between codebases

Suppose the goal is:

> Transfer automatic vessel detection from ultrasound platform A to platform B.

A capable agent system decomposes that into:

```kroki-d2
direction: down

identify: "Identify feature"
reqs: "Find requirements"
impl: "Find implementation"
tests: "Find tests"
deps: "Find dependencies"
behaviour: "Extract domain behaviour" {
  style.fill: "#e6fcf5"
}
target: "Analyse target architecture"
gap: "Gap analysis"
design: "Migration design" {
  style.fill: "#fff9db"
}
build: "Implement"
diff: "Differential verification" {
  shape: hexagon
}

identify -> reqs
identify -> impl
identify -> tests
identify -> deps
reqs -> behaviour
impl -> behaviour
tests -> behaviour
deps -> behaviour
behaviour -> target -> gap -> design -> build -> diff
```

The key step is the middle one: **reconstruct the feature's semantics, not just its code.** The
reconstructed feature specification covers:

* observable behaviour, inputs and outputs, configuration
* algorithms and data structures
* hardware assumptions and timing constraints
* dependencies and failure behaviour
* safety implications and performance characteristics
* existing test evidence

Then differential testing makes "done" measurable:

```kroki-d2
direction: down

data: "Same input dataset" {
  shape: cylinder
}
a: "Platform A"
b: "Platform B"
oa: "Output A"
ob: "Output B"
cmp: "Compare behaviour" {
  shape: hexagon
  style.fill: "#e6fcf5"
}

data -> a -> oa
data -> b -> ob
oa -> cmp
ob -> cmp
```

This gives the agent a measurable objective rather than *"make B behave like A."* The comparison
belongs in the work item's `required_evidence`, with its tolerance in `constraints`.

## Vulnerability remediation

Automated, test-verified and behaviour-preserving. The goal is to eliminate CVE-X *without
changing externally observable behaviour*:

```kroki-d2
direction: down

sbom: "SBOM"
known: "Known vulnerabilities"
dep: "Dependency analysis"
cand: "Candidate update" {
  style.fill: "#fff9db"
}
api: "API break analysis"
src: "Source changes"
scan: "Build + security scan"
val: "Tests + behaviour validation" {
  style.fill: "#e6fcf5"
}

sbom -> known -> dep -> cand -> api -> src -> scan -> val
```

This is the canonical case for [verifier-driven development](../agents/verification.md#verifier-driven-development):
the scanner, the build and the tests define success, not the agent. At portfolio scale — the same
CVE across twenty repositories — it is also the canonical [end-to-end flow](../platform/reference-architecture.md#one-flow-end-to-end).

## Architecture recovery

Architecture recovery can itself be agentic. An agent can recursively discover:

```kroki-d2
direction: down

discover: "Discover" {
  grid-columns: 2
  repo: "Repository"
  build: "Build system"
  bins: "Executables\nand libraries"
  mods: "Modules"
}
derive: "Derive" {
  grid-columns: 2
  ifaces: "Public interfaces"
  graph: "Dependency graph"
  flows: "Runtime flows"
  concepts: "Domain concepts"
}
out: "Artefacts" {
  style.fill: "#e6fcf5"
  grid-columns: 3
  a: "architecture.json"
  d: "domain-model.json"
  g: "dependency graph"
  r: "requirement links"
  t: "test map"
}

discover -> derive -> out
```

Future agents then consume these artefacts instead of rediscovering everything. That is how the
system gradually acquires organisational intelligence — provided the artefacts follow the same
rules as any other [learned knowledge](../agents/knowledge.md#leave-the-world-smarter): committed
to the repository, reviewed, and re-derived when the code moves.

Two by-products are worth calling out:

* **Recovered module boundaries are the first draft of your ownership domains.** They are the
  natural input to [`domains.yml`](../ownership/codeowners.md#the-extension-agents-need).
* **The dependency graph is an honest modularity score.** It predicts how many agents can work in
  parallel before they do — see [Platform](../platform/index.md#agent-scalability-is-architecture-scalability).
