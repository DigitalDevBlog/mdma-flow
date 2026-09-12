# Multi-Developer, Multi-Agent

Documentation site on how to run a real engineering organisation where **many developers and
many coding agents** work on the same codebase: ownership boundaries, work decomposition,
integration control and governance.

Live site: <https://digitaldevblog.github.io/mdma-flow/latest/>

## Local development

Same setup as the `paul` docs repo: a project-local virtualenv, gitignored.

```bash
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/mkdocs serve          # http://127.0.0.1:8000
./.venv/bin/mkdocs build --strict # what CI runs
```

Diagrams are authored as code (D2 / PlantUML) and rendered at build time by
[Kroki](https://kroki.io), so the build needs a reachable Kroki server. For offline builds,
run one locally:

```bash
docker run --rm -p 8000:8000 yuzutech/kroki
export KROKI_SERVER_URL=http://localhost:8000
./.venv/bin/mkdocs build --strict
```

`docs/diagrams.md` is an authoring reference for the diagram fences; it is deliberately
unlinked from the navigation.

## Publishing

Pushing to `main` runs `.github/workflows/deploy-docs.yml`, which deploys a versioned build
with [mike](https://github.com/jimporter/mike) to the `gh-pages` branch. The version comes
from the `version` field in `package.json`; the deployed version is also aliased to `latest`.

First-time setup: enable GitHub Pages for the repository with **Source → Deploy from a
branch → `gh-pages` / root**.

## Licence

Content is published under CC BY 4.0.
