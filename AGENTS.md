# Working on this repository

Instructions for anyone, human or agent, editing this documentation site.

## Writing style

**Never use an em dash (U+2014) in prose, headings, tables, diagram labels or commit messages.**
They read as machine-generated and they are the single most obvious tell in this site's text. Use
whichever of these fits the sentence:

| Instead of an em dash | Use |
|-----------------------|-----|
| A parenthetical aside | Commas, or brackets if the aside is genuinely optional |
| Introducing an explanation or a list | A colon |
| Joining two independent clauses | A semicolon, or split into two sentences |
| A label and its qualifier, such as in a diagram node | A colon, or brackets |
| An abrupt turn or afterthought | Start a new sentence |

The same applies to en dashes (U+2013) used as punctuation. Hyphens in compound words are fine, and
so are dashes inside code blocks, command flags and URLs, where they are syntax rather than
punctuation.

The rule is mechanically checkable, so check it before you commit. This must return nothing:

```bash
grep -rnP '\x{2014}|\x{2013}' docs/ *.md *.yml
```

Other conventions the site already follows:

* British spelling: organisation, behaviour, artefact. Keep the `-ize` forms that are already in
  use, such as modernization and characterization.
* Product names, not company names: Claude Code, Codex, GitHub Copilot, OpenHands.
* Vendor specifics belong in a clearly scoped block, so the surrounding argument stays independent
  of any harness or model.

## Diagrams

Read `docs/diagrams.md` before adding or editing one. The short version: Kroki's D2 output has no
intrinsic size, so **aspect ratio is the only thing that controls how large a diagram looks**. Aim
for wider than tall.

## Checks before committing

```bash
./.venv/bin/mkdocs build --strict     # what CI runs
```

Diagrams are rendered by Kroki at page-load time, so a broken diagram will not fail the build. To
verify one, POST its source to `https://kroki.io/d2/svg` and check for a 200 and a `<svg` in the
response.
