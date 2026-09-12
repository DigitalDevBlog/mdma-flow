# Evidence & Uncertainty

[Verification](verification.md) proves *changes*. But agents produce a second kind of output as
well: *claims* — about what code does, why it exists, what depends on it. In regulated
engineering, claims need the same discipline as changes.

## Agents must be allowed to say "unknown"

One dangerous agent behaviour is confident guessing. An agent should be able to return:

```text
UNKNOWN
```

or:

```yaml
confidence: 0.54

missing_information:
  - original algorithm specification
  - calibration assumptions

recommended_action:
  - request domain expert review
```

This is especially important in regulated engineering. **A good agent knows when the evidence is
insufficient** — and a good platform treats that answer as a success, not a failure to complete.

## Provenance

Every significant conclusion should be traceable. Instead of:

> This component performs temporal filtering.

you want:

```yaml
claim: Component X performs temporal filtering.

evidence:
  - TemporalFilter.cpp:42-193
  - Architecture.pdf §7.4
  - requirement IMG-342
  - commit 83fa212

confidence: 0.96
```

AI-generated understanding then becomes **reviewable engineering evidence** rather than
mysterious model knowledge. Provenance is also what lets
[learned knowledge](knowledge.md#leave-the-world-smarter) be re-verified when the evidence it
cites changes.

## Separate facts, hypotheses and decisions

Make the epistemic status of every statement explicit:

| Type | Meaning |
|------|---------|
| **Fact** | Observed directly from evidence |
| **Inference** | Derived from evidence |
| **Hypothesis** | Possible explanation that still needs validation |
| **Assumption** | Temporarily accepted as true |
| **Decision** | Chosen engineering action |

For example:

```text
FACT:        Function A calls function B.
INFERENCE:   A appears responsible for detector calibration.
HYPOTHESIS:  This ordering is required for image quality.
ASSUMPTION:  Ordering must remain unchanged during refactoring.
```

The agent can then go looking for evidence — and a reviewer can see at a glance which parts of a
proposal rest on observation and which on belief. Hypotheses are also natural targets for
[characterization tests](../modernization/workflows.md#characterize-before-you-transform): a
test either confirms the ordering matters or shows that it doesn't.

## Observability is mandatory

You need to be able to answer: *why did the agent do that?* Store a trace for every work item:

```text
Work item 8321

Goal
 → Plan v1
 → Search architecture
 → Read 17 files
 → Hypothesis H1
 → Run test
 → H1 rejected
 → Plan v2
 → Modify A.cpp
 → Build failed
 → Repair
 → Build passed
 → Tests passed
 → Reviewer found issue
 → Repair
 → Verification passed
 → PR #4821
```

That trace is invaluable for debugging the agent system itself, and in a regulated environment it
is part of the audit trail — the "what did they actually do?" row in
[Agent Identity & Permissions](../governance/agent-identity.md#identity-is-what-makes-the-audit-trail-real).
Emit it with the same tooling as the rest of your systems — OpenTelemetry and existing
monitoring — rather than a bespoke agent log.
