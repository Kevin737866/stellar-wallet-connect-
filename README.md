# Stellar Wallet Connect

A comprehensive TypeScript library that provides seamless wallet connection functionality for Stellar blockchain applications with enhanced mobile support.

## 🚀 Features

- **Multi-Wallet Support**: Freighter, xBull, Lobstr, Albedo, Rabet
- **Mobile Deep Linking**: Native mobile app integration for xBull and Lobstr
- **Web Fallback**: Browser-based wallet interfaces when extensions aren't available
- **React Hooks**: `useWallet`, `useBalance`, `useSignTransaction`
- **UI Components**: Beautiful wallet selection modal
- **TypeScript**: Full type safety with strict mode
- **Vanilla JS SDK**: Use without React if needed
- **Auto-Detection**: Automatically detects installed wallets and mobile apps
- **Event Handling**: Listen for account/network changes
- **Error Handling**: Comprehensive error management with mobile-specific error codes

## 📦 Packages

- `@stellar-wallet-connect/core` - Vanilla JS SDK (wallet adapters, connection logic)
- `@stellar-wallet-connect/react` - React hooks and provider
- `@stellar-wallet-connect/ui` - Wallet selection modal component

## 🛠️ Installation

```bash
# Install library
npm install @stellar-wallet-connect/react @stellar-wallet-connect/ui

# Install peer dependencies
npm install react react-dom
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

## 📱 Mobile Support

### xBull Mobile Integration
- **Deep Link Scheme**: `xbull://`
- **Actions**: connect, signTransaction, getPublicKey, getNetwork
- **Auto-detection**: Automatically detects mobile vs desktop environments

### Lobstr Mobile Integration  
- **Deep Link Scheme**: `lobstr://`
- **Actions**: connect, signTransaction, getPublicKey, getNetwork
- **Web Fallback**: Uses @lobstrco/signer when extension not available

### Mobile Usage Example
```typescript
import { XbullAdapter, LobstrAdapter } from '@stellar-wallet-connect/core';

// Mobile-ready adapters
const xbull = new XbullAdapter();
const lobstr = new LobstrAdapter();

// Automatically handles mobile deep linking
if (xbull.isInstalled()) {
  const account = await xbull.connect();
} else if (lobstr.isInstalled()) {
  const account = await lobstr.connect();
}
```

## 📚 API Reference

### Enhanced Wallet Types

```typescript
interface WalletAdapter {
  type: WalletType;
  name: string;
  icon: string;
  url: string;
  downloadUrl?: string;
  isInstalled(): boolean;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: Network): Promise<string>;
  getNetwork(): Promise<Network>;
  onAccountChanged?(callback: (account: WalletAccount | null) => void): () => void;
  onNetworkChanged?(callback: (network: Network) => void): () => void;
  supportsMobileDeepLink?(): boolean;
  supportsWebFallback?(): boolean;
}

type WalletType = 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet';
type Network = 'public' | 'testnet';
```

### Mobile-Specific Types

```typescript
interface MobileDeepLinkConfig {
  scheme: string;
  action: 'connect' | 'signTransaction' | 'getPublicKey' | 'getNetwork';
  params: Record<string, string>;
  callbackUrl?: string;
  timeout?: number;
}

interface DeepLinkResponse {
  action: string;
  data: {
    publicKey?: string;
    signedXDR?: string;
    network?: Network;
    error?: string;
  };
  success: boolean;
  timestamp: number;
}
```

### Error Codes

```typescript
const WalletErrorCode = {
  // General errors
  WALLET_NOT_INSTALLED: 'WALLET_NOT_INSTALLED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  
  // Mobile-specific errors
  MOBILE_CONNECT_FAILED: 'MOBILE_CONNECT_FAILED',
  DEEP_LINK_TIMEOUT: 'DEEP_LINK_TIMEOUT',
  DEEP_LINK_UNSUPPORTED: 'DEEP_LINK_UNSUPPORTED',
  
  // Web fallback errors
  WEB_FALLBACK_FAILED: 'WEB_FALLBACK_FAILED',
  WEB_FALLBACK_NOT_SUPPORTED: 'WEB_FALLBACK_NOT_SUPPORTED',
  
  // ... and more
} as const;
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
stellar-wallet-connect/
├── packages/
│   ├── core/          # Vanilla JS SDK with enhanced adapters
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── xbull.ts      # Enhanced xBull adapter
│   │   │   │   ├── lobstr.ts     # Enhanced Lobstr adapter
│   │   │   │   ├── freighter.ts  # Freighter adapter
│   │   │   │   ├── albedo.ts     # Albedo adapter
│   │   │   │   └── rabet.ts      # Rabet adapter
│   │   │   └── types.ts          # Enhanced type definitions
│   │   └── __tests__/            # Comprehensive test suite
│   ├── react/         # React hooks and provider
│   └── ui/            # UI components
├── examples/
│   └── demo-app/      # Example application
├── MOBILE_CONSIDERATIONS.md  # Mobile integration guide
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stellar](https://stellar.org/) for amazing blockchain platform
- [xBull](https://xbull.app/) for mobile wallet integration
- [Lobstr](https://lobstr.co/) for mobile and web wallet support
- [Freighter](https://www.freighter.app/) for excellent wallet
- All wallet providers for their support

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or check the [Mobile Considerations](./MOBILE_CONSIDERATIONS.md) guide for mobile-specific integration details.
