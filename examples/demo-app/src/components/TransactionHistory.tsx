import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@stellar-wallet-connect/react';
import type { Network } from '@stellar-wallet-connect/react';
import { Horizon } from '@stellar/stellar-sdk';

type TxRecord = Horizon.ServerApi.TransactionRecord;

interface Props {
  refreshTrigger?: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function TransactionHistory({ refreshTrigger = 0 }: Props) {
  const { state } = useWallet();
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const network = (state.account?.network ?? 'testnet') as Network;
  const horizonUrl = network === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

  const fetchTxs = useCallback(async (pk: string) => {
    setLoading(true);
    setError(null);
    try {
      const server = new Horizon.Server(horizonUrl);
      const result = await server.transactions().forAccount(pk).limit(10).order('desc').call();
      setTxs(result.records);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [horizonUrl]);

  useEffect(() => {
    if (state.account?.publicKey) {
      void fetchTxs(state.account.publicKey);
    } else {
      setTxs([]);
    }
  }, [state.account?.publicKey, network, refreshTrigger, fetchTxs]);

  if (state.status !== 'connected') return null;

  const truncateHash = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="status-row" style={{ marginBottom: '1rem' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Transaction History</div>
        <button className="btn btn-secondary btn-sm"
          onClick={() => state.account && fetchTxs(state.account.publicKey)}
          disabled={loading}>
          {loading ? <><span className="spinner" /> Loading…</> : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {loading && txs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '44px' }} />
          ))}
        </div>
      )}

      {!loading && txs.length === 0 && !error && (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
          No transactions found for this account
        </div>
      )}

      {txs.length > 0 && (
        <div className="tx-list">
          {txs.map(tx => (
            <div key={tx.id} className="tx-item">
              <span className={`badge ${tx.successful ? 'badge-success' : 'badge-error'}`} style={{ flexShrink: 0 }}>
                {tx.successful ? '✓' : '✗'}
              </span>
              <a
                href={`https://stellar.expert/explorer/${network === 'public' ? 'public' : 'testnet'}/tx/${tx.hash}`}
                target="_blank"
                rel="noreferrer"
                className="tx-hash"
                title={tx.hash}
              >
                {truncateHash(tx.hash)}
              </a>
              <span className="tx-date">{formatDate(tx.created_at)}</span>
              <span className="badge badge-muted" style={{ flexShrink: 0 }}>
                {tx.operation_count} op{tx.operation_count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
