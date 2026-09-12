# Knowledge in the Repo

Another important transition: don't rely primarily on developer prompt knowledge. Put the
instructions **inside the repository**.

```text
repo/
│
├── AGENTS.md
│
├── ARCHITECTURE.md
│
├── CONTRIBUTING.md
│
├── docs/
│   ├── domain/
│   ├── architecture/
│   └── decisions/
│
├── .agents/
│   ├── build.md
│   ├── testing.md
│   ├── security.md
│   └── migration.md
│
└── scripts/
    ├── verify
    ├── lint
    ├── security-check
    └── architecture-check
```

GitHub now explicitly promotes `AGENTS.md` as a mechanism for keeping different agents aligned
with repository-specific practices. Codex Skills follow a similar philosophy: encode team
standards, scripts and workflows as reusable agent capabilities rather than relying on someone
remembering the right prompt.

I would go even further:

```kroki-d2
direction: down

heads: "Knowledge humans normally\nkeep in their heads" {
  shape: person
}
exec: "Executable knowledge"
repo: "Repo rules / skills / tests" {
  shape: document
  style.fill: "#e6fcf5"
}

heads -> exec -> repo
```

## Why the repository is the right home

A prompt is per-person, per-session and invisible. A file in the repository is versioned,
reviewed, diffable and shared by every agent and every human who clones it.

| Property | Prompt knowledge | Repo knowledge |
|----------|------------------|----------------|
| Discoverable by a new agent | No | Yes |
| Reviewed | No | Through PRs, like code |
| Versioned with the code it describes | No | Yes |
| Survives the person who wrote it | No | Yes |
| Works for humans too | Rarely | Yes |

That last row is worth dwelling on. The best test of a repository's agent documentation is
whether a new human engineer could onboard from it. If it isn't good enough for them, it isn't
good enough for an agent either — agents are just less likely to complain.

## The layering that works

* **`AGENTS.md`** — short, stable, and about *this repository*: how to build, how to test, what
  conventions are non-negotiable, what never to touch. Keep it short enough that it is always
  worth loading.
* **`.agents/*.md`** — task-shaped guides loaded on demand: how a migration is done here, how
  security review works here.
* **`docs/decisions/`** — ADRs. Agents reproduce decisions they can read and re-litigate ones
  they can't.
* **`scripts/`** — the executable layer. Anything a document *asks* someone to do is better as a
  script the agent can run and the CI can enforce.

!!! warning "Documentation that lies is worse than none"
    An agent will follow a stale instruction with complete confidence and no suspicion. Treat
    repo-resident agent docs as code: reviewed when the behaviour they describe changes, and
    ideally verified by a script that fails when they drift.
