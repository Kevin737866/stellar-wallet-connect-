<<<<<<< HEAD
# Stellar Wallet Connect

A comprehensive TypeScript React library that provides seamless wallet connection functionality for Stellar blockchain applications.

## 🚀 Features

- **Multi-Wallet Support**: Freighter, xBull, Lobstr, Albedo, Rabet
- **React Hooks**: `useWallet`, `useBalance`, `useSignTransaction`
- **UI Components**: Beautiful wallet selection modal
- **TypeScript**: Full type safety with strict mode
- **Vanilla JS SDK**: Use without React if needed
- **Auto-Detection**: Automatically detects installed wallets
- **Event Handling**: Listen for account/network changes
- **Error Handling**: Comprehensive error management

## 📦 Packages

- `@stellar-wallet-connect/core` - Vanilla JS SDK (wallet adapters, connection logic)
- `@stellar-wallet-connect/react` - React hooks and provider
- `@stellar-wallet-connect/ui` - Wallet selection modal component

## 🛠️ Installation

```bash
# Install the library
pnpm add @stellar-wallet-connect/react @stellar-wallet-connect/ui

# Install peer dependencies
pnpm add react react-dom
```

## ⚡ Quick Start

```tsx
import React from 'react';
import { WalletProvider, useWallet } from '@stellar-wallet-connect/react';
import { WalletModal, WalletButton } from '@stellar-wallet-connect/ui';

function App() {
  return (
    <WalletProvider>
      <YourApp />
      <WalletModal />
    </WalletProvider>
  );
}

function YourApp() {
  const { state, disconnect } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <WalletButton onOpen={() => setIsModalOpen(true)} />
      {state.isConnected && (
        <div>
          <p>Connected: {state.account?.publicKey}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
```

## 📚 API Reference

### Core Types

```typescript
interface WalletAdapter {
  type: WalletType;
  name: string;
  icon: string;
  url: string;
  isInstalled(): boolean;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: Network): Promise<string>;
  getNetwork(): Promise<Network>;
}

type WalletType = 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet';
type Network = 'public' | 'testnet';
```

### React Hooks

#### `useWallet()`

Main hook for wallet connection state and actions.

```typescript
const { state, connect, disconnect, signTransaction } = useWallet();
```

#### `useBalance(options?)`

Hook for fetching and managing account balance.

```typescript
const { balance, isLoading, error, refresh } = useBalance({
  assetCode: 'XLM',
  refreshInterval: 30000
});
```

#### `useSignTransaction()`

Hook for signing transactions with error handling.

```typescript
const { signTransaction, isLoading, error } = useSignTransaction();
```

### UI Components

#### `WalletModal`

Modal component for wallet selection.

```typescript
<WalletModal 
  isOpen={isOpen} 
  onClose={() => setIsModalOpen(false)}
  className="custom-modal-styles"
/>
```

#### `WalletButton`

Button component that shows connection state.

```typescript
<WalletButton onOpen={() => setIsModalOpen(true)}>
  Connect Wallet
</WalletButton>
```

## 🏗️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev

# Run example app
pnpm example

# Type checking
pnpm type-check

# Linting
pnpm lint

# Clean all
pnpm clean
```

## 📁 Project Structure

```
stellar-wallet-connect/
├── packages/
│   ├── core/          # Vanilla JS SDK
│   ├── react/         # React hooks and provider
│   └── ui/            # UI components
├── examples/
│   └── demo-app/      # Example application
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stellar](https://stellar.org/) for the amazing blockchain platform
- [Freighter](https://www.freighter.app/) for the excellent wallet
- All wallet providers for their support

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.
=======
# stellar-wallet-connect-
A decentralized utility payment platform (Pay electricity &amp; water bills using stellar)
>>>>>>> 73226992af4f7453d767a57cad4c6709133b93ea
