import { useMemo } from 'react';
import { StellarClient } from '@stellar-wallet-connect/core';
import type { Network } from '@stellar-wallet-connect/react';

export function useStellarClient(network: Network = 'testnet'): StellarClient {
  return useMemo(() => new StellarClient(network), [network]);
}
