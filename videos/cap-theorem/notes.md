# CAP Theorem — accuracy notes

**Definition.** In a distributed data store, when a network partition occurs, the system must choose
between consistency and availability; it cannot guarantee both. (Conjecture: Eric Brewer, PODC 2000.
Proof: Gilbert & Lynch, "Brewer's Conjecture and the Feasibility of Consistent, Available,
Partition-Tolerant Web Services", 2002.)

**The three properties (Gilbert & Lynch).**
- **Consistency** = linearizability (atomic consistency): every read returns the most recent write
  (or the operation fails). Not the same as the "C" in ACID (integrity constraints).
- **Availability**: every request received by a non-failing node must result in a (non-error) response.
  The response may be stale.
- **Partition tolerance**: the system keeps operating even when the network drops arbitrarily many
  messages between nodes.

**Problem it frames.** Replicas copy writes to each other over a network. If the link between two
replicas breaks, a write accepted on one side cannot reach the other. A read on the other side must
either (a) refuse / error / wait (keep consistency, lose availability) or (b) answer with the possibly
stale local value (keep availability, lose consistency).

**How it works / flows.**
- Normal operation: write on East replicates to West; reads anywhere see the new value.
- Partition: East <-x-> West.
- CP choice: the side that cannot confirm it is up to date (usually the minority, without quorum)
  rejects reads/writes. Clients get errors/timeouts. When the partition heals it catches up.
- AP choice: both sides keep accepting reads (and often writes). Reads can be stale; concurrent writes
  can conflict and must be reconciled after the partition heals (last-write-wins, vector clocks,
  CRDTs, app-level merge). Replicas converge = eventual consistency.

**Production examples.**
- Amazon Dynamo (2007 paper): designed to be "always writeable" for the shopping cart; it keeps
  conflicting versions (vector clocks) and merges them on read (e.g. union of cart items) — AP.
- ZooKeeper / etcd: quorum-based (ZAB / Raft). A minority partition cannot elect a leader or commit
  writes, so it stops serving writes — CP.
- Cassandra / DynamoDB: AP-leaning by default; consistency is tunable per request (quorum levels).

**Misconceptions.**
- "Pick any 2 of 3" is misleading: in a distributed system partitions will happen, so P is not
  optional; the real choice is C vs A *during a partition*. A "CA" system is effectively a single node
  (or assumes the network never fails).
- With no partition you can have both C and A. The everyday trade-off is then latency vs consistency
  (PACELC, Daniel Abadi 2010/2012).
- CAP's consistency is linearizability, not ACID's consistency.
- CAP is not a binary label for a whole product; many systems are tunable per operation.

**Interview points.**
1. Partitions are unavoidable -> choose CP or AP for each kind of data.
2. No partition -> latency vs consistency (PACELC).
3. CAP "C" = linearizability, not ACID "C".
4. Examples: carts/likes/feeds tolerate staleness (AP); locks, leader election, config, unique
   constraints need CP.
