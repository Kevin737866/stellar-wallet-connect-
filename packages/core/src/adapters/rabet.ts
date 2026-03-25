/**
 * Rabet wallet adapter implementation
 * @fileoverview Adapter for Rabet wallet
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

declare global {
  interface Window {
    rabet?: {
      isConnected(): Promise<boolean>;
      getPublicKey(): Promise<string>;
      signTransaction(xdr: string, network?: Network): Promise<string>;
      getNetwork(): Promise<Network>;
      connect(): Promise<{ publicKey: string; network: Network }>;
      disconnect(): Promise<void>;
      onAccountChanged(callback: (account: { publicKey: string; network: Network } | null) => void): () => void;
      onNetworkChanged(callback: (network: Network) => void): () => void;
    };
  }
}

/**
 * Rabet wallet adapter
 * @see https://rabet.io/
 */
export class RabetAdapter implements WalletAdapter {
  readonly type: WalletType = 'rabet';
  readonly name = 'Rabet';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y1OTUwQiIvPgo8cGF0aCBkPSJNMTAgMTBIMzBWMzBIMTBWMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  readonly url = 'https://rabet.io';
  readonly downloadUrl = 'https://chrome.google.com/webstore/detail/rabet-wallet/dmkapckfbcgbkdjpempkeliobhfcgbd';

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.rabet;
  }

  async connect(): Promise<WalletAccount> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Rabet is not installed', 'WALLET_NOT_INSTALLED', 'rabet');
      }

      const account = await window.rabet!.connect();
      return {
        publicKey: account.publicKey,
        network: account.network,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to connect to Rabet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'rabet'
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isInstalled()) {
        await window.rabet!.disconnect();
      }
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from Rabet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        'rabet'
      );
    }
  }

  async getPublicKey(): Promise<string> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Rabet is not installed', 'WALLET_NOT_INSTALLED', 'rabet');
      }

      return await window.rabet!.getPublicKey();
    } catch (error) {
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'rabet'
      );
    }
  }

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Rabet is not installed', 'WALLET_NOT_INSTALLED', 'rabet');
      }

      return await window.rabet!.signTransaction(xdr, network);
    } catch (error) {
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'rabet'
      );
    }
  }

  async getNetwork(): Promise<Network> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Rabet is not installed', 'WALLET_NOT_INSTALLED', 'rabet');
      }

      return await window.rabet!.getNetwork();
    } catch (error) {
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'rabet'
      );
    }
  }

  onAccountChanged(callback: (account: WalletAccount | null) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    return window.rabet!.onAccountChanged((account: { publicKey: string; network: Network } | null) => {
      if (account) {
        callback({
          publicKey: account.publicKey,
          network: account.network,
        });
      } else {
        callback(null);
      }
    });
  }

  onNetworkChanged(callback: (network: Network) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    return window.rabet!.onNetworkChanged(callback);
  }
}
