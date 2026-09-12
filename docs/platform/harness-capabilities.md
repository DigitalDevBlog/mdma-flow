# Harness Capabilities

Every argument on this site is stated as a requirement rather than a product feature, so that it
survives the harness being replaced. This page collects those requirements into one checklist, and
records how four harnesses answer it today.

The point is not to pick a winner. It is that **the requirements outlive the products** — and that
the last row is the same for all of them.

## The matrix

| Requirement | Claude Code | Codex | Copilot cloud agent | OpenHands |
|-------------|-------------|-------|---------------------|-----------|
| [Isolated write context per task](../foundations/isolation.md) | Worktree per session and per subagent | Worktree per chat (desktop app) | Ephemeral Actions environment, one branch | Docker sandbox; worktrees only for child conversations |
| Sandbox strength | Shell sandbox (Seatbelt / seccomp); not OS-level | `read-only` → `workspace-write` → `danger-full-access` | Managed environment you don't configure | Docker by default; process sandbox has none |
| Tool-scoped permissions | Yes, per tool and pattern | Yes, via sandbox mode and profiles | Yes, in the CLI (`--allow-tool` / `--deny-tool`) | Whole-tool allowlist only |
| [Path-scoped write rules](../decomposition/dag.md#dependencies-arent-enough-change-surfaces) | Yes — `Edit(src/**)` | Yes — filesystem globs to `read`/`write`/`deny` | Partial — a write bound to a named file | **No** |
| [Deterministic pre-execution deny](../agents/runtime.md#how-this-is-enforced-in-practice) | Yes — `PreToolUse` hook | Yes — `PreToolUse` hook | Structural — branch scope, cannot merge | Hooks yes; the security layer cannot deny |
| [Role separation with own context](../agents/roles.md) | Yes — subagents | Subagents **inherit** parent context | Custom agents, isolated execution | File-based agents; delegation is synchronous |
| [Per-work-item budget ceiling](../agents/runtime.md#budgets) | No — organisation spend limits | Token caps only | Credits, with org and user budgets | Org monthly (commercial); none in the OSS SDK |
| [Headless run with structured output](../platform/mature-stack.md#dont-throw-away-jenkins) | `-p --output-format json` | `codex exec --json` | `-p` in the CLI | `--headless --json` |
| [Repo-resident instructions](../governance/repo-knowledge.md) | `CLAUDE.md`, `AGENTS.md` by import | `AGENTS.md` | `copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md` | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` |
| [Audit trail](../governance/agent-identity.md) | Session transcripts | Rollout files | Enterprise audit events with session IDs | Conversation logs (commercial tiers) |
| [Ownership domains and write leases](../ownership/single-write-authority.md) | **No** | **No** | **No** | **No** |

Sources for every cell are in the [harness capabilities](../sources.md#harness-capabilities)
section, checked September 2026.

## How to read it

**The last row is the whole reason this site exists.** Not one harness has a concept of *who may
write to this part of the codebase right now*. They isolate execution superbly and say nothing
about allocation. That layer is yours to build, and it is the one that encodes how your
organisation actually works.

**The deny row is the one to check first when evaluating a new harness.** A harness that can
refuse a tool call before it executes can enforce any policy you can compute. One that can only
*ask a human* pushes every boundary back onto review, which is exactly the bottleneck agents were
supposed to relieve.

**Differences within a row matter more than the row's presence.** "Subagents: yes" hides that one
implementation gives each role a fresh context window while another inherits the parent's — which
decides whether role separation buys you anything.

## Scoring a harness you're considering

The same checklist, as questions to ask a vendor:

1. Can two tasks run against this repository at once without sharing a writable checkout?
2. Can I express "may write only under these paths" — and is it enforced by the runtime, not the
   prompt?
3. Can something deny a tool call before it runs, without a human in the loop?
4. Can a role be given its own context, its own tools and its own model?
5. Can I cap what a single task spends?
6. Can CI invoke it and parse the result?
7. Where do the instructions live, and are they the same files a human would read?
8. What does it record about what the agent did, and for how long?

Questions 1 to 4 are about whether the harness can hold a boundary. Questions 5 to 8 are about
whether you can operate it at scale. A harness that fails 3 is not disqualified — but you will be
building your enforcement somewhere else, and you should know that before you adopt it.

!!! warning "This is the fastest-dating page on the site"
    Harness capabilities changed substantially during 2026, including a product rename and one
    orchestration spec becoming an unmaintained preview. Treat the matrix as a snapshot with a
    date on it, and re-check before making a decision on the strength of a cell.
