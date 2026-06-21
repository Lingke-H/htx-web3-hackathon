# Demo Diagrams

Use these diagrams as the source material for slides or the frontend demo explanation.

## Mechanism Loop

```mermaid
flowchart LR
    A["Project milestone proposal"] --> B["Reviewer approves binary MarketSpec"]
    B --> C["Track B generates AI Prior report"]
    C --> D["Scouts trade YES/NO with non-transferable credits"]
    D --> E["Crowd Odds updates from stake ratio"]
    E --> F["Deadline reached"]
    F --> G["Track B oracle verifies GitHub/on-chain data"]
    G --> H["Market.settle(marketId, passed)"]
    H --> I["Credits redistributed to correct scouts"]
    I --> J["Leaderboard reputation updates"]
    J --> K["Sponsor selects builder for incubation"]
    K --> L["Oracle assesses new milestone evidence"]
    L --> M["Authorized reviewer releases fixed sponsor units"]
```

## Public Proof Data Flow

```mermaid
flowchart LR
    A["Veil Scout repo evidence"] --> B["GitHub 30-day snapshot"]
    B --> C["OpenAI AI Prior with provenance"]
    C --> D["Evidence manifest / SHA-256 digests"]
    D --> E["Base Sepolia market + vault reads"]
    E --> F["Public Proof panel"]
    F --> G["Guarded releaseMilestone action"]
```

The Public Proof panel must verify the manifest, artifact digests, chain ID `84532`, non-zero addresses, passing verification, active vault, unreleased milestone, connected chain, and `ORACLE_ROLE` before it enables release.

## Trust Boundary

```mermaid
flowchart TB
    subgraph Offchain["Off-chain P0 services"]
        A["AI analyst: AI Prior JSON"]
        B["GitHub / chain data adapters"]
        C["Trusted oracle runner"]
        D["Verification report JSON"]
    end

    subgraph Onchain["On-chain contracts"]
        E["MarketFactory.createMarket"]
        F["Market.takePosition"]
        G["Market.getYesOdds"]
        H["Market.settle"]
        I["Leaderboard"]
        J["IncubationVault milestone accounting"]
    end

    A --> F
    B --> C
    C --> D
    D --> H
    E --> F
    F --> G
    H --> I
    D --> R["Authorized reviewer: manual P0 release boundary"]
    R --> J

    T["Trust Boundary: P0 trusted oracle, P1 optimistic oracle roadmap"] -.-> C
    U["Accounting Boundary: sponsor units, no token custody"] -.-> J
```

## Judge-Facing Explanation

Veil Scout does not hide centralization in P0. The oracle runner is trusted for the demo, but every settlement is paired with a human-readable verification report. Incubation uses a separate authorized reviewer and demo sponsor-unit accounting; it does not custody tokens. The upgrade path is to move from trusted oracle to optimistic oracle, challenge period, report commitments, and an independently audited asset-flow design.
