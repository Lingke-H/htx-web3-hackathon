# Veil Scout

Implementation workspace for Veil Scout.

## Layout

```text
veil-scout/
├── track-a-contracts/   # Track A: P0 smart contracts
├── track-b-ai-oracle/   # Track B: AI analyst + oracle CLI
└── frontend/            # Track C: Next.js demo frontend
```

## Track A: Contracts

See `track-a-contracts/README.md`.

Useful commands after installing Foundry:

```bash
cd veil-scout/track-a-contracts
forge build
forge test --summary
forge script script/SeedIncubationDemo.s.sol:SeedIncubationDemo --rpc-url http://127.0.0.1:8545 --broadcast
```

## Track B: AI + Oracle

See `track-b-ai-oracle/README.md`.

Useful commands after creating the Python environment:

```bash
cd veil-scout/track-b-ai-oracle
python -m track_b.cli analyze --project data/projects/agentpay.json
python -m track_b.cli verify --project data/projects/agentpay.json --market-id 0
python -m track_b.cli assess-release --project data/projects/agentpay.json --market-id 0 --vault-id 0 --milestone-id 1
```

## Track C: Frontend

See `frontend/README.md`.

Useful commands after installing Node dependencies:

```bash
cd veil-scout/frontend
npm run build
npm run dev
```
