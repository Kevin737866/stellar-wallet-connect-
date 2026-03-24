import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@stellar-wallet-connect/react';
import { useStellarClient } from '../hooks/useStellarClient';
import type { Network } from '@stellar-wallet-connect/react';

export function BalanceDisplay() {
  const { state } = useWallet();
  const network = (state.account?.network ?? 'testnet') as Network;
  const client = useStellarClient(network);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (pk: string) => {
    setLoading(true);
    setError(null);
    try {
      const bal = await client.getBalance(pk);
      setBalance(bal);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch balance');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (state.account?.publicKey) {
      void fetchBalance(state.account.publicKey);
    } else {
      setBalance(null);
    }
  }, [state.account?.publicKey, network, fetchBalance]);

  if (state.status !== 'connected') return null;

  return (
    <div className="card">
      <div className="status-row">
        <div className="section-label" style={{ marginBottom: 0 }}>XLM Balance</div>
        <button className="btn btn-secondary btn-sm"
          onClick={() => state.account && fetchBalance(state.account.publicKey)}
          disabled={loading}>
          {loading ? <><span className="spinner" /> Fetching…</> : '↻ Refresh'}
        </button>
      </div>

      {loading && !balance && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="skeleton" style={{ height: '2.8rem', width: '180px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '1rem', width: '100px' }} />
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {balance !== null && !error && (
        <div style={{ marginTop: '0.6rem' }}>
          <div className="balance-big">
            {parseFloat(balance).toFixed(4)}
            <span className="balance-unit"> XLM</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            ≈ ${(parseFloat(balance) * 0.11).toFixed(2)} USD
          </div>
        </div>
      )}
    </div>
  );
}
