# Saga Pattern — accuracy notes

**Definition.** A saga is a sequence of local transactions, one per service. Each local transaction
commits in its own service's database and then triggers the next step (via an event or a command).
Every step that can be undone has a *compensating transaction*. If a step fails, the saga executes the
compensating transactions of the already-completed steps, in reverse order.
(Origin: Garcia-Molina & Salem, "Sagas", 1987; popularised for microservices by Chris Richardson,
microservices.io.)

**Problem it solves.** With database-per-service, one ACID transaction cannot span services.
Distributed transactions (2PC / XA) are blocking, need every participant to support them, hurt
availability, and most modern stores/brokers don't support them. Without coordination, a failure
midway leaves partial state (e.g. card charged, no stock, order stuck).

**How it works.**
- Forward: T1 create order (PENDING) -> T2 charge payment -> T3 reserve stock -> order APPROVED.
- Failure at T3 (out of stock): run C2 refund payment, then C1 cancel/reject order.
- Compensations are *new* transactions that semantically undo the effect (a refund, not a DB rollback).
  The charge really happened and is visible until refunded.
- The failing step itself rolled back locally, so it needs no compensation.

**Coordination styles.**
- Choreography: no central coordinator; each service publishes domain events and the others subscribe
  and react. Simple for few steps; harder to follow/debug as flows grow, risk of cyclic dependencies.
- Orchestration: an orchestrator (a saga state machine) sends commands to each participant and decides
  the next step / compensation from the replies. Easier to reason about for complex flows. Workflow
  engines such as Temporal or AWS Step Functions are commonly used to implement orchestrated sagas.

**States/flows.** Order: PENDING -> APPROVED, or PENDING -> REJECTED/CANCELLED after compensation.

**Production example.** E-commerce checkout: Order, Payment, Inventory services, each with its own DB,
communicating over a message broker. Out-of-stock after payment -> refund + cancel order.

**Misconceptions.**
- A saga is not ACID: it gives eventual consistency and lacks isolation — other transactions can see
  intermediate state (e.g. PENDING order, charged card). Countermeasures: semantic locks (PENDING flags),
  commutative updates, reordering steps (pivot transaction), re-reading values.
- Compensation is not "rollback"; some actions can't be undone (sent email) — put them after the pivot
  or make them retriable.
- Steps and compensations must be idempotent and retryable, because messages can be delivered more than once
  and compensations must eventually succeed.

**Interview points.**
1. Eventual consistency, no isolation — explain how you handle intermediate states.
2. Compensations must be idempotent and safe to retry.
3. Choreography vs orchestration trade-off (simple flows vs complex flows).
4. Why not 2PC: blocking, availability, lack of support.
