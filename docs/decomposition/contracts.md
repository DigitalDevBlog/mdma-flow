# Contracts as Synchronization Barriers

This is an old distributed-development technique that becomes extremely valuable with agents.

Agree the interface first:

```protobuf
service ImagingService {
    rpc ProcessImage(ProcessImageRequest)
        returns (ProcessImageResponse);
}
```

Once the contract is agreed, three streams of work can proceed independently:

```kroki-d2
direction: down

contract: "Contract\n(ImagingService)" {
  shape: document
  style.fill: "#fff9db"
}

client: "Client\nagent"
server: "Server\nagent"
tests: "Contract test\nagent"

contract -> client
contract -> server
contract -> tests

client -> verify: "conforms"
server -> verify: "conforms"
tests -> verify: "asserts"

verify: "Contract tests in CI" {
  shape: hexagon
  style.fill: "#e6fcf5"
}
```

The interface acts as the synchronization point. Nobody has to wait for anybody; they only have
to agree, once, up front.

This is essentially **contract-first agent development**. For large teams, I expect it to become
one of the dominant patterns.

## Why this works so well for agents specifically

A contract does three things at once that agents happen to need badly:

| It provides | Which solves |
|-------------|--------------|
| An unambiguous spec | Agents fill ambiguity with plausible invention; a schema leaves nothing to invent |
| A verification target | The agent can check its own work without a human, because conformance is testable |
| A blast radius | "Change the contract" becomes a distinct, visible, reviewable event |

That third point is the underrated one. Without a contract, an interface change looks like an
ordinary diff. With one, it is a change to a declared artefact that can trigger review,
regeneration and downstream notification automatically.

## Applies well beyond RPC

The mechanism is the *declared, testable boundary* — not the protobuf. The same technique works
with:

* OpenAPI / JSON Schema for HTTP services
* Header files and ABI checks in C++
* Trait / interface definitions plus conformance test suites
* Database migration contracts (expand → migrate → contract)
* Event schemas in a message bus, with a schema registry

!!! tip "Freeze the contract, then parallelize"
    In a DAG, the contract node is a barrier: nothing downstream starts until it merges, and
    everything downstream starts at once when it does. That single ordering rule buys most of the
    safety people try to get from elaborate agent coordination protocols.

!!! warning "A contract that changes weekly is not a barrier"
    If the interface keeps moving, the parallel work behind it keeps being invalidated, and you
    have simply relocated the collision. Treat contract changes as shared-kernel changes: strict
    ownership, human architecture review, their own change set.
