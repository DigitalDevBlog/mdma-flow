# Diagrams

Diagrams on this site are authored **as code** and rendered at build time by
[Kroki](https://kroki.io) via the `mkdocs-kroki-plugin`. You write a fenced code block with a
`kroki-<engine>` info string, and the build turns it into an SVG image.

!!! info "How rendering works"
    The plugin sends the diagram source to a Kroki server (default `https://kroki.io`,
    overridable with the `KROKI_SERVER_URL` environment variable — e.g. a local Docker Kroki for
    fully offline builds) and embeds the returned SVG. A network-reachable Kroki server is
    required at build time.

## D2

Used for most diagrams here: boxes, containers, dependency graphs, pipelines.

````markdown
```kroki-d2
direction: right
plan: "PLAN"
apply: "APPLY"
unify: "UNIFY"
plan -> apply -> unify
unify -> plan: "next"
```
````

Renders as:

```kroki-d2
direction: right
plan: "PLAN"
apply: "APPLY"
unify: "UNIFY"
plan -> apply -> unify
unify -> plan: "next"
```

### House conventions

| Intent | Style |
|--------|-------|
| Neutral node | default |
| Highlighted / outcome | `style.fill: "#e6fcf5"` |
| Decision or control point | `style.fill: "#fff9db"` |
| Problem / forbidden | `style.fill: "#ffe3e3"`, `style.stroke: "#c92a2a"` |
| Implicit or forbidden edge | `style.stroke-dash: 4` |

Keep labels quoted, use `\n` for line breaks, and prefer `direction: down` for pipelines,
`direction: right` for fan-outs.

## PlantUML

Used where the diagram is really a *flow* with forks and branches — activity diagrams need no
extra layout engine and read well.

````markdown
```kroki-plantuml
@startuml
skinparam backgroundColor #FFFFFF
start
:Change;
if (Risk level?) then (low)
  :Automated review;
else (high)
  :Human approval;
endif
stop
@enduml
```
````

Renders as:

```kroki-plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName sans-serif
start
:Change;
if (Risk level?) then (low)
  :Automated review;
else (high)
  :Human approval;
endif
stop
@enduml
```

## When *not* to use a diagram

File trees, directory layouts and configuration snippets stay as plain fenced `text` / `yaml`
blocks. They are already the clearest representation of themselves, and rendering them as boxes
adds nothing.
