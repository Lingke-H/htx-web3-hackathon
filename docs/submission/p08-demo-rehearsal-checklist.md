# Veil Scout Demo Rehearsal Checklist

## Pre-Demo Environment Checks

- `node -v` resolves to Node `24.16.0`
- `forge --version` and `anvil --version` are available from PATH
- Track B virtual environment is installed if Oracle commands may be shown
- port `3000` is free
- port `8545` is free
- no stale `deployment.json` or `incubation-demo.json` is being relied on

## Exact Startup Command

From the repository root:

```bash
bash veil-scout/scripts/run-live-demo.sh
```

## Expected Ready Banner

The script should print:

- `Live judge demo is ready.`
- frontend URL
- chain ID `31337`
- vault address
- vault ID `0`
- expected initial UI state summary

## Expected Initial On-Chain Values

- selected project: `AgentPay`
- vault status: `ACTIVE`
- milestone count: `3`
- milestone 0: released
- milestone 1: under review
- total sponsor budget: `12,000`
- released sponsor budget: `4,000`
- remaining sponsor budget: `8,000`

## English / Chinese Display Check

- default English view renders cleanly
- Chinese toggle renders correctly
- incubation labels remain honest in both languages

## Presentation Sequence

1. open the hero and frame the problem: ranking alone does not sustain projects
2. show the scout discovery layer and explain non-transferable credits
3. show AI Prior, crowd odds, and trusted oracle settlement
4. move to the incubation panel and explain the selected project
5. point out milestone 0 released, milestone 1 under review, and remaining budget
6. close with the post-hackathon funding-engine narrative

## Shutdown Command

Press `Ctrl-C` in the terminal that is running `run-live-demo.sh`.

## Recovery Procedure

### Fallback Level 1: Live RPC Contract Data

- keep the live demo running
- confirm the panel reads `Live contract data`
- continue the full story with real seeded local state

### Fallback Level 2: Local One-Command Demo Restart

- stop the existing process
- rerun:

```bash
bash veil-scout/scripts/run-live-demo.sh
```

- wait for the ready banner again

### Fallback Level 3: Labeled Built-In Demo Fallback

- if Anvil, RPC, or local browser state fails, show the frontend with its labeled fallback mode
- explicitly say that incubation values are demo fallback data
- continue the product story without claiming live contract reads
