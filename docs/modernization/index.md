# Modernization

[![AI agents for software modernization in medical devices: the challenge, the vision, a modernization control plane with specialized agents, an agent hierarchy, the transformation approach, a domain-knowledge example from an industrial control system, feature migration, vulnerability remediation, regulatory evidence, and what stays outside the generic agent](../images/medical-device-modernization-overview.png)](../images/medical-device-modernization-overview.png)

*Modernizing safety-critical software, on one page. Select the image to open it at full size.*

!!! note "Reading the infographic against this site"
    * Its **agent hierarchy** — a Modernization Director over understanding and transformation
      agents — is the *mature target*, not a starting configuration. Start with
      [one agent per work item](../agents/roles.md#dont-start-with-multi-agent) and grow along the
      [maturity path](maturity.md).
    * *Single writer per task/branch* is the [isolation](../foundations/isolation.md) rule.
      Ownership adds a second, independent one:
      [single writer per domain](../ownership/single-write-authority.md).
    * Its *modernization control plane* includes the reasoning agents. On this site, *control
      plane* means only the deterministic layer — see [Vocabulary](../index.md#vocabulary).

Software modernization is where everything on this site converges. Complex, long-lived,
safety-critical software typically combines accumulated legacy complexity, insufficient or
outdated tests, tightly coupled architecture, lost or implicit domain knowledge, vulnerabilities
in code and dependencies, the need to move features between code bases — and strict regulatory
requirements such as IEC 62304 and ISO 14971, with clinical behaviour and performance that must
not change. The result is high cost, high risk and slow delivery.

## A platform, not a product

A generic *Software Modernization Agent* probably shouldn't be the product. The product is better
thought of as a **Software Modernization Agent Platform**: reusable modernization capabilities
layered over a persistent software and domain [knowledge model](../agents/knowledge.md).

Test automation, modularization, domain recovery, vulnerability removal and cross-product feature
migration then become different workflows over the same underlying machinery.

## Capabilities, not agents

The capabilities I would develop fall into five groups:

| Understand | Verify | Transform | Migrate | Assure |
|------------|--------|-----------|---------|--------|
| repository discovery | test discovery | refactoring | feature identification | security analysis |
| architecture recovery | test generation | modularization | dependency extraction | static analysis |
| dependency analysis | characterization testing | API migration | behaviour specification | compliance evidence |
| domain concept extraction | coverage analysis | dependency upgrades | source/target gap analysis | traceability |
| requirement tracing | regression detection | language / framework migration | implementation | change-impact analysis |
| technical-debt analysis | differential testing | vulnerability remediation | equivalence verification | |

Notice that these aren't individual agents. **They are capabilities that agents compose** — the
same way the [runtime](../agents/runtime.md#separate-intelligence-from-capabilities) composes tools
into roles. A workflow is a [DAG](../decomposition/dag.md) over them.

## Small, verifiable steps — never free-running

Every modernization workflow has the same inner rhythm:

```kroki-d2
direction: down

u: "1. Understand\nbuild the knowledge model"
c: "2. Characterize\ncapture the behavioural envelope" {
  style.fill: "#e6fcf5"
}
t: "3. Transform\nsmall, safe changes"
v: "4. Verify\nautomated + human review" {
  style.fill: "#fff9db"
}

u -> c -> t -> v
v -> t: "5. iterate" {
  style.stroke-dash: 4
}
```

Never ask an agent to *"modernize subsystem X."* Ask it to **perform small, verifiable
transformations**, each one a [small change set](../integration/index.md) with its own evidence.

## What stays outside the generic agent

There is an important boundary. Don't attempt to encode:

```text
GenericAgent.modernizeAnything()
```

Instead, make the machinery generic and plug the domain in:

| Generic — the platform | Domain-specific — plugged in |
|------------------------|------------------------------|
| planning | domain ontology (e.g. ultrasound, product family) |
| tool invocation | capabilities and tooling (e.g. C++ toolchains) |
| task representation | modernization policies: allowed, requires approval, forbidden |
| knowledge retrieval | domain knowledge, product architecture, requirements database |
| sandboxing, permissions | regulatory rules (e.g. IEC 62304) |
| memory | |
| verification | verification strategies (e.g. pixel-level equivalence, SNR, latency; hardware simulators) |
| coordination, observability | regulatory evidence rules, specific to device and market |
| human approval | |

For medical imaging, that composition looks like:

```kroki-d2
direction: down

runtime: "Generic agent runtime" {
  style.fill: "#f3f0ff"
}
domain: "Medical-device plug-ins" {
  grid-columns: 3
  p: "Medical-device\npolicy"
  k: "Imaging domain\nknowledge"
  cpp: "C++ tooling"
  iec: "IEC 62304\nrules"
  arch: "Product\narchitecture"
  req: "Requirements\ndatabase"
  iq: "Image-quality\nverification"
  sim: "Hardware\nsimulator"
}
agent: "Medical-device modernization agent" {
  style.fill: "#e6fcf5"
}

runtime -> agent
domain -> agent
```

Change those plug-ins and the same platform could modernize automotive software.

## Regulatory evidence as a by-product

Because every change set already carries its [validation evidence](../governance/index.md#what-the-evidence-has-to-include)
and every claim its [provenance](../agents/evidence.md#provenance), the platform can assemble
regulatory evidence as it works rather than after the fact: code changes and their rationale,
affected requirements, risks and architecture, test changes and results, dependency changes,
security impact, and the traceability between them — aligned with IEC 62304 (software
lifecycle), ISO 14971 (risk management) and FDA cybersecurity guidance.

!!! quote "The deepest opportunity"
    The deepest opportunity isn't code generation. **It's an AI-maintained semantic model of the
    product that enables safe, continuous, evidence-backed evolution.**

## Pages in this section

* [Workflows](workflows.md) — characterization, feature migration, vulnerability remediation,
  architecture recovery
* [Maturity Path](maturity.md) — the order in which to build all of this
