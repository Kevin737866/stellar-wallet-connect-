/**
 * Wallet adapters for the demo app.
 * Uses (window as any) casts instead of Window augmentation to avoid
 * TypeScript merge conflicts with declarations in @stellar-wallet-connect/core.
 */
import type { WalletAdapter, WalletAccount, Network, WalletType } from '@stellar-wallet-connect/react';

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = () => (typeof window !== 'undefined' ? (window as any) : {});

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

function getPassphrase(network?: Network): string {
  return network === 'public' ? MAINNET_PASSPHRASE : TESTNET_PASSPHRASE;
}

function mapNetwork(networkStr: string): Network {
  return networkStr.toUpperCase() === 'PUBLIC' ? 'public' : 'testnet';
}

// ─── Freighter ────────────────────────────────────────────────────────────────
export const freighterAdapter: WalletAdapter = {
  isInstalled: () => !!w().freighterApi,

  async connect(): Promise<WalletAccount> {
    const api = w().freighterApi;
    if (!api) throw new Error('Freighter not installed');
    const pk: string = await api.getPublicKey();
    const { network }: { network: string } = await api.getNetwork();
    return { publicKey: pk, network: mapNetwork(network) };
  },

  async disconnect(): Promise<void> {
    await w().freighterApi?.disconnect?.();
  },

  async getPublicKey(): Promise<string> {
    const api = w().freighterApi;
    if (!api) throw new Error('Freighter not installed');
    return api.getPublicKey();
  },

  async getNetwork(): Promise<Network> {
    const api = w().freighterApi;
    if (!api) throw new Error('Freighter not installed');
    const { network }: { network: string } = await api.getNetwork();
    return mapNetwork(network);
  },

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    const api = w().freighterApi;
    if (!api) throw new Error('Freighter not installed');
    return api.signTransaction(xdr, { networkPassphrase: getPassphrase(network) });
  },

  onAccountChanged(cb: (account: WalletAccount | null) => void): () => void {
    const api = w().freighterApi;
    if (!api?.onAccountChanged) return () => {};
    return api.onAccountChanged(async (pk: string | null) => {
      if (!pk) { cb(null); return; }
      try {
        const { network } = await api.getNetwork();
        cb({ publicKey: pk, network: mapNetwork(network) });
      } catch { cb(null); }
    });
  },

  onNetworkChanged(cb: (network: Network) => void): () => void {
    const api = w().freighterApi;
    if (!api?.onNetworkChanged) return () => {};
    return api.onNetworkChanged((net: string) => cb(mapNetwork(net)));
  },
};

// ─── xBull ────────────────────────────────────────────────────────────────────
export const xbullAdapter: WalletAdapter = {
  isInstalled: () => !!w().xBullSDK,

  async connect(): Promise<WalletAccount> {
    const api = w().xBullSDK;
    if (!api) throw new Error('xBull not installed');
    const { publicKey }: { publicKey: string } = await api.connect();
    return { publicKey, network: 'testnet' };
  },

  async disconnect(): Promise<void> { /* xBull has no explicit disconnect */ },

  async getPublicKey(): Promise<string> {
    const api = w().xBullSDK;
    if (!api) throw new Error('xBull not installed');
    return api.getPublicKey();
  },

  async getNetwork(): Promise<Network> { return 'testnet'; },

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    const api = w().xBullSDK;
    if (!api) throw new Error('xBull not installed');
    const pk: string = await api.getPublicKey();
    const result: { signedXDR: string } = await api.sign({
      xdr,
      publicKey: pk,
      network: { passphrase: getPassphrase(network) },
    });
    return result.signedXDR;
  },
};

// ─── Albedo ───────────────────────────────────────────────────────────────────
export const albedoAdapter: WalletAdapter = {
  isInstalled: () => !!w().albedo,

  async connect(): Promise<WalletAccount> {
    const api = w().albedo;
    if (!api) throw new Error('Albedo not installed');
    const { pubkey }: { pubkey: string } = await api.publicKey();
    return { publicKey: pubkey, network: 'testnet' };
  },

  async disconnect(): Promise<void> { /* Albedo is web-based */ },

  async getPublicKey(): Promise<string> {
    const api = w().albedo;
    if (!api) throw new Error('Albedo not installed');
    const { pubkey }: { pubkey: string } = await api.publicKey();
    return pubkey;
  },

  async getNetwork(): Promise<Network> { return 'testnet'; },

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    const api = w().albedo;
    if (!api) throw new Error('Albedo not installed');
    const net = network === 'public' ? 'public' : 'testnet';
    const result: { signed_envelope_xdr: string } = await api.tx({ xdr, network: net });
    return result.signed_envelope_xdr;
  },
};

// ─── Rabet ────────────────────────────────────────────────────────────────────
export const rabetAdapter: WalletAdapter = {
  isInstalled: () => !!w().rabet,

  async connect(): Promise<WalletAccount> {
    const api = w().rabet;
    if (!api) throw new Error('Rabet not installed');
    const { publicKey }: { publicKey: string } = await api.connect();
    return { publicKey, network: 'testnet' };
  },

  async disconnect(): Promise<void> { /* no disconnect API */ },

  async getPublicKey(): Promise<string> {
    const api = w().rabet;
    if (!api) throw new Error('Rabet not installed');
    const { publicKey }: { publicKey: string } = await api.connect();
    return publicKey;
  },

  async getNetwork(): Promise<Network> { return 'testnet'; },

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    const api = w().rabet;
    if (!api) throw new Error('Rabet not installed');
    const net = network === 'public' ? 'MAINNET' : 'TESTNET';
    const result: { xdr: string } = await api.sign(xdr, net);
    return result.xdr;
  },
};

// ─── Lobstr ───────────────────────────────────────────────────────────────────
export const lobstrAdapter: WalletAdapter = {
  isInstalled: () => !!w().lobstr,

  async connect(): Promise<WalletAccount> {
    const api = w().lobstr;
    if (!api) throw new Error('Lobstr not installed');
    const { publicKey, network }: { publicKey: string; network: string } = await api.connect();
    return { publicKey, network: mapNetwork(network) };
  },

  async disconnect(): Promise<void> { await w().lobstr?.disconnect?.(); },

  async getPublicKey(): Promise<string> {
    const api = w().lobstr;
    if (!api) throw new Error('Lobstr not installed');
    const { publicKey }: { publicKey: string } = await api.connect();
    return publicKey;
  },

  async getNetwork(): Promise<Network> { return 'testnet'; },

  async signTransaction(xdr: string, _network?: Network): Promise<string> {
    const api = w().lobstr;
    if (!api) throw new Error('Lobstr not installed');
    const { signedXDR }: { signedXDR: string } = await api.signXDR(xdr);
    return signedXDR;
  },
};

// ─── Wallet metadata for UI ───────────────────────────────────────────────────
export interface WalletMeta {
  id: WalletType;
  name: string;
  icon: string;
  url: string;
  adapter: WalletAdapter;
}

export const WALLETS: WalletMeta[] = [
  {
    id: 'freighter',
    name: 'Freighter',
    url: 'https://www.freighter.app',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNjc2MkQwIi8+PHBhdGggZD0iTTIwIDEyTDI2IDIwSDIwTDIwIDEyWiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMjAgMTJMMTQgMjBIMjBMMjAgMTJaIiBmaWxsPSIjQUFBN0U4Ii8+PHBhdGggZD0iTTIwIDI4TDE0IDIwSDIwTDIwIDI4WiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9Ii43Ii8+PC9zdmc+',
    adapter: freighterAdapter,
  },
  {
    id: 'xbull',
    name: 'xBull',
    url: 'https://xbull.app',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+WDwvdGV4dD48L3N2Zz4=',
    adapter: xbullAdapter,
  },
  {
    id: 'lobstr',
    name: 'Lobstr',
    url: 'https://lobstr.co',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMUE5OUZGIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TDwvdGV4dD48L3N2Zz4=',
    adapter: lobstrAdapter,
  },
  {
    id: 'albedo',
    name: 'Albedo',
    url: 'https://albedo.link',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cuczMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNjY2NkZGIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==',
    adapter: albedoAdapter,
  },
  {
    id: 'rabet',
    name: 'Rabet',
    url: 'https://rabet.io',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMkQyRDJEIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZDNzAwIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5SPC90ZXh0Pjwvc3ZnPg==',
    adapter: rabetAdapter,
  },
];

export const ADAPTER_MAP: Partial<Record<WalletType, WalletAdapter>> = Object.fromEntries(
  WALLETS.map((w) => [w.id, w.adapter])
);
