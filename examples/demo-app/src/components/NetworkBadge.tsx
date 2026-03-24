import React from 'react';
import type { Network } from '@stellar-wallet-connect/react';

interface Props {
  network: Network;
}

export function NetworkBadge({ network }: Props) {
  const isMainnet = network === 'public';
  return (
    <span className={`badge ${isMainnet ? 'badge-success' : 'badge-warning'} badge-dot`}>
      {isMainnet ? 'Mainnet' : 'Testnet'}
    </span>
  );
}
