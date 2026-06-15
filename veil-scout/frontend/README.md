# Veil Scout Demo UI

Judge-ready frontend preview for the `htx-web3-hackathon` repository.

## What This Adds

- A standalone `Next.js` demo UI under `veil-scout/frontend`
- A dark Web3 / FinTech dashboard for hackathon presentation
- Mock wallet state, market cards, AI analysis, activity feed, risk rails, and demo flow
- A structure that can later be wired to `veil-scout/track-a-contracts/abi`

## Run Locally

```bash
cd veil-scout/frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Main Files

- `app/page.tsx`: home page entry
- `components/demo-preview.tsx`: main demo UI composition
- `lib/demo-data.ts`: mock data used by the preview
- `app/globals.css`: visual system, background, and panel styling

## Optional Live Incubation Read

The incubation panel can read a seeded `IncubationVault` when an injected wallet/provider is available:

```bash
export NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS=0x...
export NEXT_PUBLIC_INCUBATION_VAULT_ID=0
export NEXT_PUBLIC_INCUBATION_SELECTED_PROJECT=AgentPay
```

Without a configured address, without a provider, or when the network read fails, the panel falls back to clearly labeled demo data.

## Notes

- This UI is still demo-first and keeps the scout market flow intact.
- The incubation panel now supports a narrow live-read path with a deliberate mock fallback.
