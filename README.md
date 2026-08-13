# migo.nq

A single-user, offline-first futures trading journal with a Gruvbox theme. Built for tracking prop firm evaluations and funded accounts.


## Features

- **Theme**: Gruvbox Dark and Light themes.
- **PnL Calendar**: Monthly grid showing daily profit/loss, trade count, and net R-multiple. Click any day to inspect trades.
- **Prop Firm Tracking**: Tracks profit targets for evaluations and payout thresholds for funded accounts, along with max drawdown cushion limits.
- **Input Modes**:
  - **Balance Delta**: Input balance before and after trade to calculate net PnL (includes commissions, fees, and slippage).
  - **Contract & Price**: Input entry, exit, contracts, and fees. Auto-calculates point values for NQ ($20/pt), MNQ ($2/pt), ES ($50/pt), MES ($5/pt), YM ($5/pt), MYM ($0.50/pt), RTY ($50/pt), M2K ($5/pt), CL ($1000/pt), and GC ($100/pt).
- **Notes**: Pre-trade setup plan and post-trade review notes per entry.
- **Chart Attachments**: Attach chart screenshots stored locally in browser IndexedDB with a full-screen preview.
- **Risk Calculator**: Position sizing calculator for futures contracts based on account equity and stop loss points.
- **Data Privacy & Export**: All data is stored locally in browser IndexedDB. Supports JSON backup/restore and CSV export.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Recharts
- idb (IndexedDB)

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
npm run deploy
```
