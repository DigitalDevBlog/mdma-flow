# Diagrams

Diagrams on this site are authored **as code** and rendered at build time by
[Kroki](https://kroki.io) via the `mkdocs-kroki-plugin`. You write a fenced code block with a
`kroki-<engine>` info string, and the build turns it into an SVG image.

!!! info "How rendering works"
    The plugin sends the diagram source to a Kroki server (default `https://kroki.io`,
    overridable with the `KROKI_SERVER_URL` environment variable, e.g. a local Docker Kroki for
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

Keep labels quoted and use `\n` for line breaks. Use `direction: down` for short pipelines and
fan-ins, and `direction: right` for anything longer than about four steps: see below for why that
choice matters more than it looks.

### Keeping diagrams proportional

> **Aspect ratio is the only thing that matters. Aim for wider than tall.**

Kroki's D2 output carries a `viewBox` and no `width` or `height`, so the SVG has **no intrinsic
pixel size**. It always stretches to the full width of the content column, and its height follows
from the aspect ratio. The numbers in `viewBox="0 0 1045 284"` describe proportions, not pixels; no
diagram is ever "1,045px wide" to a reader.

At a content column of roughly 830px:

| Aspect (width ÷ height) | Rendered height | Reads as |
|-------------------------|-----------------|----------|
| 3.7 | ~225px | a banner |
| 1.0 | ~830px | a full screen |
| 0.3 | ~2,700px | three screens of a single diagram |

So a ten-step vertical pipeline is not "a big diagram"; it is a diagram whose aspect ratio is 0.3,
and it will fill several screens however short its labels are. Lay the chain out with
`direction: right`, or group its steps into `grid-columns` stages.

Two D2 behaviours make that harder than it sounds, both found by measuring rather than by reading:

| Behaviour | Consequence |
|-----------|-------------|
| `direction:` inside a container is ignored | Nested `direction: right` does nothing: use `grid-columns: N` to place children side by side |
| Edges *between children of a grid container* inflate the layout badly | A three-cell grid with internal arrows came out 2,309 × 388; the same grid without them, 761 × 1,292 |

So group related steps with `grid-columns`, draw edges **between containers** rather than between
their children, and let the grid convey ordering within a stage.

Two backstops in the theme cover diagrams that are legitimately tall:

* `stylesheets/extra.css` caps every diagram at 70% of the viewport height, so none can take over
  the page.
* `javascripts/enlarge.js` wraps each one in a link to the full-size image, so capping loses
  nothing.

To check a diagram before committing it, POST the source to Kroki and read the `viewBox`: width ÷
height is the aspect, and roughly 830 ÷ aspect is the height a reader will actually see.

## PlantUML

Used where the diagram is really a *flow* with forks and branches; activity diagrams need no
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
