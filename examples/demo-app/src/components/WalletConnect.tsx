import React, { useState } from 'react';
import { useWallet } from '@stellar-wallet-connect/react';
import type { WalletType } from '@stellar-wallet-connect/react';
import { WALLETS } from '../adapters';
import toast from 'react-hot-toast';

interface Props {
  onConnected?: () => void;
}

export function WalletConnect({ onConnected }: Props) {
  const { state, connect, disconnect, resetError } = useWallet();
  const [showPicker, setShowPicker] = useState(false);

  const handleConnect = async (id: WalletType) => {
    setShowPicker(false);
    try {
      await connect(id);
      toast.success(`${WALLETS.find(w => w.id === id)?.name ?? id} connected!`);
      onConnected?.();
    } catch {
      // error already in state
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    toast('Wallet disconnected', { icon: '👋' });
  };

  const truncate = (s: string) => `${s.slice(0, 6)}…${s.slice(-6)}`;

  const copyPk = async () => {
    const pk = state.account?.publicKey;
    if (!pk) return;
    await navigator.clipboard.writeText(pk);
    toast.success('Address copied!');
  };

  // Connected view
  if (state.status === 'connected' && state.account) {
    return (
      <div className="card">
        <div className="section-label">Connected Wallet</div>
        <div className="status-row" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>
            {WALLETS.find(w => w.id === state.walletId)?.name ?? state.walletId}
          </span>
          <span className="badge badge-success badge-dot">Connected</span>
        </div>

        <div className="pk-row">
          <span className="mono" title={state.account.publicKey}>
            {truncate(state.account.publicKey)}
          </span>
          <button className="copy-btn" onClick={copyPk} title="Copy full address">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>

        <button className="btn btn-danger btn-sm" onClick={handleDisconnect}
          disabled={state.status === 'disconnecting'}>
          {state.status === 'disconnecting'
            ? <><span className="spinner" /> Disconnecting…</>
            : 'Disconnect'}
        </button>
      </div>
    );
  }

  // Error view
  if (state.status === 'error') {
    return (
      <div className="card">
        <div className="section-label">Wallet</div>
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {state.error}
        </div>
        <div className="row">
          <button className="btn btn-secondary btn-sm" onClick={resetError}>Dismiss</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowPicker(true)}>Try Again</button>
        </div>
        {showPicker && <WalletPicker onSelect={handleConnect} onClose={() => setShowPicker(false)} />}
      </div>
    );
  }

  // Connecting view
  if (state.status === 'connecting') {
    return (
      <div className="card">
        <div className="section-label">Wallet</div>
        <div className="row" style={{ color: 'var(--text-muted)' }}>
          <span className="spinner" />
          <span>Connecting to {WALLETS.find(w => w.id === state.walletId)?.name}…</span>
        </div>
      </div>
    );
  }

  // Idle — show connect button  
  return (
    <div className="card">
      <div className="section-label">Wallet</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Connect your Stellar wallet to get started
      </p>
      <button className="btn btn-primary" onClick={() => setShowPicker(!showPicker)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>
        Connect Wallet
      </button>
      {showPicker && <WalletPicker onSelect={handleConnect} onClose={() => setShowPicker(false)} />}
    </div>
  );
}

function WalletPicker({ onSelect, onClose }: { onSelect: (id: WalletType) => void; onClose: () => void }) {
  return (
    <div>
      <div className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Choose a wallet</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
      </div>
      <div className="wallet-list">
        {WALLETS.map(w => {
          const installed = w.adapter.isInstalled();
          return (
            <button
              key={w.id}
              className="wallet-item"
              onClick={() => installed && onSelect(w.id as WalletType)}
              disabled={!installed}
              title={installed ? `Connect ${w.name}` : `${w.name} not detected — install it first`}
            >
              <img src={w.icon} alt={w.name} />
              <div className="wallet-item-info">
                <div className="wallet-item-name">{w.name}</div>
                <div className="wallet-item-status">
                  {installed ? '✓ Detected' : 'Not installed'}
                </div>
              </div>
              {!installed && (
                <a href={w.url} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>
                  Install →
                </a>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
