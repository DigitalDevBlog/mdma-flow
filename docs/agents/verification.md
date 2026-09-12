# Verification

This may be the single most important page in the section.

## Work items are contracts, not prompts

Don't make tasks merely prompts. Instead of:

> "Please modernize the ultrasound reconstruction module."

represent the work structurally. This is the [work item](../platform/primitives.md) — the same
schema — one level up, at programme scope:

```yaml
work_item:
  id: MOD-212
  objective: Eliminate the deprecated imaging API and improve modularity of reconstruction

scope:
  repository: ultrasound-platform
  domain: image-reconstruction
  writes:
    - reconstruction/**

constraints:
  - preserve functional behaviour
  - no public API changes
  - no numerical regression > 0.1%
  - no performance regression > 5%

required_evidence:
  - build
  - unit-tests
  - integration-tests
  - golden-image-comparison
  - performance-benchmark

approval:
  architecture_change: human
  release_merge: human
```

A planner decomposes it into child work items — like `US-18432` on
[Five Primitives](../platform/primitives.md#a-work-item-concretely) — each inheriting these
constraints and narrowing the scope.

Now the agent has something much more powerful than natural-language instructions: **an
executable contract.** `constraints` say what must stay true. `required_evidence` says how
anyone — agent, reviewer or auditor — will know.

## Verification is the heart of autonomous engineering

Don't ask:

> How can I make the AI intelligent enough that I can trust its answer?

Ask:

> How can I make the environment capable of proving that the AI's change satisfies the
> requirements?

For software, that is a pipeline:

```kroki-d2
direction: down

propose: "Model proposes change" {
  style.fill: "#f3f0ff"
}
build: "Build" {
  grid-columns: 2
  compile: "Compiler"
  static: "Static analysis"
}
tests: "Tests" {
  grid-columns: 3
  unit: "Unit"
  integ: "Integration"
  system: "System"
}
compare: "Comparison" {
  grid-columns: 3
  behav: "Behaviour"
  perf: "Performance"
  sec: "Security"
}
accept: "Acceptance criteria" {
  style.fill: "#e6fcf5"
}

propose -> build -> tests -> compare -> accept
```

The model is probabilistic. **The verification pipeline should be as deterministic as possible.**

This is why software engineering is an unusually attractive domain for agents. We already have
compilers, type systems, linters, tests, simulators, static analysers, model checkers, coverage
tools and version control — and [architecture rules can be made executable](../governance/executable-architecture.md)
too.

## Verifier-driven development

Suppose the goal is *"Remove this CVE."* The agent shouldn't decide when it has succeeded.
Success is defined externally:

```text
dependency scanner:  CVE absent
build:               PASS
unit tests:          PASS
integration tests:   PASS
API compatibility:   PASS
performance:         within tolerance
```

Then the agent iterates against the verifiers, not against its own judgement:

```kroki-d2
direction: down

a1: "Attempt 1"
r1: "scanner PASS\nbuild FAIL" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
a2: "Attempt 2"
r2: "build PASS\ntests FAIL" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
a3: "Attempt 3"
r3: "ALL PASS" {
  style.fill: "#e6fcf5"
}

a1 -> r1
r1 -> a2: "observes compiler error"
a2 -> r2
r2 -> a3: "investigates failing test"
a3 -> r3
```

Now autonomous iteration becomes much safer. Every failure is an input to the next attempt, not a
review finding — the same economics as
[executable architecture](../governance/executable-architecture.md#why-this-changes-the-economics).

## Wiring verifiers into the harness

Three mechanisms do most of the work, and each exists in more than one harness:

!!! example "In the harnesses"
    * **Run the verifier automatically.** Claude Code and
      [OpenHands](https://docs.openhands.dev/sdk/guides/hooks) can run checks from `Stop` hooks —
      OpenHands explicitly recommends migrating pre-commit style checks to them — and Codex hooks
      act on `Stop` and `SubagentStop`, able to refuse to let a turn end.
    * **Protect the verifier from the agent.** Claude Code's `deny: Edit(tests/golden/**)`, Codex's
      filesystem `deny` globs and Copilot's `--deny-tool` all express "not this path". OpenHands
      cannot: with no path-scoped rules, that check has to live inside a hook script.
    * **Return a machine-readable verdict.** `claude -p --output-format json`,
      `codex exec --json --output-schema`, `openhands --headless --json` and Copilot's `-p` each
      give a pipeline something to parse instead of prose to interpret.

    One caveat for CI: OpenHands' headless mode always auto-approves, so there its confirmation
    policy is not a control at all — the sandbox and the hooks are what remain.

The third mechanism is what makes an agent a step in a pipeline rather than a person at a keyboard.

!!! tip "Evidence is attached, not asserted"
    The verifier outputs *are* the work item's `required_evidence`. Attached to the change set,
    they become the [validation evidence](../platform/primitives.md) a reviewer or auditor reads
    — instead of trusting a model's self-report, which is optimistic by construction.

!!! warning "Verifiers must be outside the agent's write scope"
    An agent that can edit the tests it is judged by will, eventually, pass by editing the tests.
    Keep verification code, golden data and thresholds outside the change surface of the work
    item being verified — or require a human to approve any change to them.
