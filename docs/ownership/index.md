# Ownership

Worktrees give you isolated *execution*. They say nothing about who is allowed to *change what*.
Ownership is the missing coordinate.

In a human-only organisation, ownership is mostly social: teams know their areas, and the
overlaps get negotiated in conversation. That mechanism does not survive contact with a dozen
agents working simultaneously — agents don't negotiate, and they don't know what they weren't
told.

So ownership has to become **explicit, scoped and machine-readable**.

## Three questions an ownership model has to answer

| Question | Answer mechanism |
|----------|------------------|
| What are the units of ownership? | **Ownership domains** — path sets that correspond to architectural boundaries |
| Who may write to a domain *right now*? | **Single Write Authority** — a lease held by exactly one active change set |
| Who must approve a change to a domain? | **Code owners** — the existing `CODEOWNERS` mechanism, extended |

Note that these are three different things, and tooling in 2026 tends to collapse them. GitHub's
`CODEOWNERS` answers the third well and the second not at all: it tells you who reviews
`src/reconstruction/`, but it happily lets four agents open four overlapping PRs against it
first.

!!! note "Ownership is about *write* scope, not *read* scope"
    Everyone — and every agent — should be able to read the whole repository. Restricting reads
    makes agents dumber. Restricting concurrent writes makes the system safer. These are
    opposite levers and it is worth being deliberate about pulling only one of them.

## Pages in this section

* [Single Write Authority](single-write-authority.md) — the core idea, and how to scope it so it
  doesn't just serialize your entire organisation
* [CODEOWNERS & Domain Metadata](codeowners.md) — what exists today, and the extension agents
  need
