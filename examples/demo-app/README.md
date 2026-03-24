# Stellar Wallet Connect — Demo App

A fully functional React demo application showcasing all features of [`stellar-wallet-connect`](../../). Built with Vite + TypeScript.

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 **Multi-wallet support** | Freighter, xBull, Lobstr, Albedo, Rabet |
| 💰 **XLM Balance** | Fetched live from Horizon API |
| 📤 **Send XLM** | Build, sign, and submit transactions |
| 📜 **Transaction History** | Last 10 txs with links to Stellar Expert |
| 🔔 **Toast notifications** | Loading, success, and error states |
| 🔄 **Auto-reconnect** | Restores session from `localStorage` |
| 📱 **Responsive design** | Works on desktop and mobile |

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) (used by this monorepo)
- A Stellar wallet browser extension (e.g., [Freighter](https://www.freighter.app/))

## 🚀 Getting Started

### 1. Install dependencies (from repo root)

```bash
pnpm install
```

### 2. Configure environment

```bash
cd examples/demo-app
cp .env.example .env
```

The default `.env` points to **testnet** — no changes needed for testing.

### 3. Run the dev server

```bash
# From the repo root:
pnpm --filter demo-app dev

# Or from examples/demo-app/:
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_STELLAR_NETWORK` | `testnet` | `testnet` or `public` |
| `VITE_HORIZON_URL` | testnet URL | Horizon API base URL |

> ⚠️ **Always use testnet for development.** Mainnet transactions use real XLM.

## 💡 Usage Walkthrough

1. **Connect** — Click "Connect Wallet" and select your installed extension
2. **View balance** — Your XLM balance loads automatically from Horizon
3. **Send XLM** — Fill in destination address and amount, then click Send
4. **Sign** — Your wallet extension will pop up to confirm and sign the transaction
5. **Confirm** — A toast notification confirms the transaction hash
6. **History** — The transaction history panel updates with your latest tx

## 🏗 Project Structure

```
examples/demo-app/
├── src/
│   ├── adapters.ts              # Wallet adapter bridges (Freighter, xBull, etc.)
│   ├── App.tsx                  # Root component with WalletProvider + Toaster
│   ├── index.css                # Global design system
│   ├── main.tsx                 # React entry point
│   ├── hooks/
│   │   └── useStellarClient.ts  # Memoized StellarClient hook
│   └── components/
│       ├── WalletConnect.tsx    # Connect/disconnect UI + wallet picker
│       ├── NetworkBadge.tsx     # Mainnet/Testnet indicator badge
│       ├── BalanceDisplay.tsx   # XLM balance from Horizon
│       ├── SendXLMForm.tsx      # Payment transaction builder
│       └── TransactionHistory.tsx # Recent transaction list
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

## 🔗 Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Horizon API](https://developers.stellar.org/api/horizon)
- [Stellar Laboratory (testnet faucet)](https://laboratory.stellar.org/)
- [Stellar Expert Explorer](https://stellar.expert/)
- [Freighter Wallet](https://www.freighter.app/)

## 🧪 Getting Testnet XLM

Visit the [Stellar Friendbot](https://laboratory.stellar.org/#account-creator?network=test) to fund a testnet account with 10,000 XLM.
