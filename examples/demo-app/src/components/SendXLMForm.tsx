import React, { useState } from 'react';
import { useWallet } from '@stellar-wallet-connect/react';
import type { Network } from '@stellar-wallet-connect/react';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import toast from 'react-hot-toast';

const TESTNET_PASSPHRASE = Networks.TESTNET;
const MAINNET_PASSPHRASE = Networks.PUBLIC;

function getPassphrase(network: Network) {
  return network === 'public' ? MAINNET_PASSPHRASE : TESTNET_PASSPHRASE;
}

interface Props {
  onSent?: () => void;
}

export function SendXLMForm({ onSent }: Props) {
  const { state, signTransaction } = useWallet();
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  if (state.status !== 'connected' || !state.account) return null;

  const network = (state.account.network ?? 'testnet') as Network;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!destination.trim()) { toast.error('Enter a destination address'); return; }
    if (!destination.startsWith('G') || destination.length !== 56) {
      toast.error('Invalid Stellar address (must start with G, 56 chars)'); return;
    }
    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) { toast.error('Enter a positive amount'); return; }

    setLoading(true);
    const toastId = toast.loading('Building transaction…');

    try {
      // 1. Load sender account from Horizon
      const horizonUrl = network === 'public'
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org';

      const server = new Horizon.Server(horizonUrl);
      const senderAccount = await server.loadAccount(state.account!.publicKey);

      // 2. Build transaction
      const txBuilder = new TransactionBuilder(senderAccount, {
        fee: BASE_FEE,
        networkPassphrase: getPassphrase(network),
      })
        .addOperation(
          Operation.payment({
            destination: destination.trim(),
            asset: Asset.native(),
            amount: amtNum.toFixed(7),
          })
        )
        .setTimeout(30);

      if (memo.trim()) {
        txBuilder.addMemo(Memo.text(memo.trim().slice(0, 28)));
      }

      const tx = txBuilder.build();
      const xdr = tx.toXDR();

      toast.loading('Waiting for wallet signature…', { id: toastId });

      // 3. Sign with wallet
      const signedXdr = await signTransaction(xdr);

      toast.loading('Submitting to network…', { id: toastId });

      // 4. Submit
      await server.submitTransaction(
        TransactionBuilder.fromXDR(signedXdr, getPassphrase(network)) as any
      );

      toast.success('Transaction submitted! 🚀', { id: toastId, duration: 5000 });
      setDestination('');
      setAmount('');
      setMemo('');
      onSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="section-label">Send XLM</div>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label" htmlFor="destination">Destination Address</label>
          <input
            id="destination"
            className="input"
            placeholder="G…"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="amount">Amount (XLM)</label>
          <input
            id="amount"
            className="input"
            type="number"
            min="0.0000001"
            step="any"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="memo">Memo (optional, max 28 chars)</label>
          <input
            id="memo"
            className="input"
            placeholder="Optional memo"
            maxLength={28}
            value={memo}
            onChange={e => setMemo(e.target.value)}
            disabled={loading}
          />
        </div>

        {network === 'testnet' && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            You are on <strong>Testnet</strong>. Transactions use test XLM only.
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading
            ? <><span className="spinner" /> Processing…</>
            : <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send XLM
              </>
          }
        </button>
      </form>
    </div>
  );
}
