import { useState } from 'react';
import { WalletProvider, useWallet } from '@stellar-wallet-connect/react';
import { Toaster } from 'react-hot-toast';
import { WalletConnect } from './components/WalletConnect';
import { NetworkBadge } from './components/NetworkBadge';
import { BalanceDisplay } from './components/BalanceDisplay';
import { SendXLMForm } from './components/SendXLMForm';
import { TransactionHistory } from './components/TransactionHistory';
import { ADAPTER_MAP } from './adapters';
import './index.css';

// ─── Inner app (uses useWallet hook) ────────────────────────────────────────
function DemoApp() {
  const { state } = useWallet();
  const [txRefresh, setTxRefresh] = useState(0);
  const isConnected = state.status === 'connected' && !!state.account;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#grad)" />
            <path d="M12 20h16M20 12l8 8-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4e90ff"/>
                <stop offset="1" stopColor="#7c5cfc"/>
              </linearGradient>
            </defs>
          </svg>
          Stellar Wallet Connect
        </div>
        <p>Full-featured demo — connect, view balance, and send XLM on testnet</p>
      </header>

      {/* Status bar (shown when connected) */}
      {isConnected && state.account && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1.25rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Network</span>
          <NetworkBadge network={state.account.network} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {state.account.publicKey.slice(0, 8)}…{state.account.publicKey.slice(-8)}
          </span>
        </div>
      )}

      <div className="stack">
        {/* Top grid: connect + balance */}
        <div className="grid-2">
          <WalletConnect />
          <BalanceDisplay />
        </div>

        {/* Send form (only when connected) */}
        {isConnected && (
          <SendXLMForm onSent={() => setTxRefresh(n => n + 1)} />
        )}

        {/* Transaction history (full width) */}
        {isConnected && (
          <div className="grid-2">
            <TransactionHistory refreshTrigger={txRefresh} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <p>
          Built with{' '}
          <a href="https://github.com/Kevin737866/stellar-wallet-connect-" target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            stellar-wallet-connect
          </a>{' '}·{' '}
          <a href="https://laboratory.stellar.org/" target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Stellar Lab
          </a>{' '}·{' '}
          <a href="https://stellar.expert/" target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Stellar Expert
          </a>
        </p>
      </footer>
    </div>
  );
}

// ─── Root: provides WalletProvider + Toaster ─────────────────────────────────
export default function App() {
  return (
    <WalletProvider adapters={ADAPTER_MAP} autoReconnect={true}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2235',
            color: '#e8edf8',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0f1e' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0f1e' } },
        }}
      />
      <DemoApp />
    </WalletProvider>
  );
}
