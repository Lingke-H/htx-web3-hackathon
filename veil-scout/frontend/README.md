# Veil Scout Demo UI

Judge-ready frontend preview for the `htx-web3-hackathon` repository.

## What This Adds

- A standalone `Next.js` demo UI under `veil-scout/frontend`
- A dark Web3 / FinTech dashboard for hackathon presentation
- Mock wallet state, market cards, AI analysis, activity feed, risk rails, and demo flow
- A structure that can later be wired to `veil-scout/contracts/abi`

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

## Notes

- This UI is intentionally mock-data driven for fast hackathon demos.
- The next integration step is swapping `lib/demo-data.ts` for reads backed by `contracts/abi` and deployment addresses.
