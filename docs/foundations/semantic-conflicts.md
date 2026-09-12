# Semantic Conflicts

This is where many frameworks stop.

Two agents can be perfectly isolated and still make **semantically incompatible changes**.

```kroki-d2
direction: right

a: "Agent A"
b: "Agent B"
c: "Agent C"
d: "Agent D"

proc: "ImagingService::process()" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
iface: "IImagingService" {
  style.fill: "#ffe3e3"
  style.stroke: "#c92a2a"
}
tests: "integration tests"

a -> proc: "rewrites body"
b -> proc: "changes error handling"
c -> iface: "changes signature"
d -> tests: "updates fixtures"

proc -> iface: "implements" {
  style.stroke-dash: 4
}
```

There may be no textual Git conflict at all. Every diff applies cleanly. Every branch is green in
isolation. And trunk is broken the moment two of them land.

## Why Git can't see it

Git's merge algorithm is a **textual** one. It reasons about lines, not meaning. It has no model
of:

* an interface contract that two implementations must satisfy
* an invariant that two call sites both rely on
* a behaviour that a test asserts and a refactor quietly relaxes
* an assumption about *when* something is called, not just how

Agents make this worse for a specific reason: they are fast, confident, and — unlike a human
teammate — they don't overhear anything. Two engineers changing `process()` in the same week
usually find out at standup. Two agents never do.

!!! danger "The failure mode to design against"
    Not *merge conflicts*. Merge conflicts are loud and Git already handles them. The failure
    mode is **silent semantic divergence**: a green build made of pieces nobody validated
    together.

## Three ways out

There are only three real answers, and a mature setup uses all three:

| Answer | Mechanism | Page |
|--------|-----------|------|
| Don't let two writers touch one domain at once | Single Write Authority | [Ownership](../ownership/single-write-authority.md) |
| Split work so their outputs *can't* overlap | Decomposition along architectural seams | [Decomposition](../decomposition/index.md) |
| Catch it at the gate with real evidence | Contract tests, architecture checks, merge queue | [Integration](../integration/index.md) |

The rest of this site is essentially those three answers, in detail.
