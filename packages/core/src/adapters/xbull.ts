/**
 * xBull wallet adapter implementation
 * @fileoverview Enhanced adapter for xBull wallet with extension detection and mobile support
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

// xBull wallet connect types
interface XBullWalletConnect {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: Network): Promise<string>;
  getNetwork(): Promise<Network>;
  connect(): Promise<{ publicKey: string; network: Network }>;
  disconnect(): Promise<void>;
  onAccountChanged(callback: (account: { publicKey: string; network: Network } | null) => void): () => void;
  onNetworkChanged(callback: (network: Network) => void): () => void;
}

declare global {
  interface Window {
    xBull?: XBullWalletConnect;
    xBullWalletConnect?: XBullWalletConnect;
  }
}

/**
 * xBull wallet adapter
 * @see https://xbull.app/
 * @see https://www.npmjs.com/package/@creit.tech/xbull-wallet-connect
 */
export class XbullAdapter implements WalletAdapter {
  readonly type: WalletType = 'xbull';
  readonly name = 'xBull';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTAgMjBMMjAgMTBMMzAgMjBMMjAgMzBMMTAgMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  readonly url = 'https://xbull.app';
  readonly downloadUrl = 'https://chrome.google.com/webstore/detail/xbull-wallet/jfbapfmkmnpdjobgmljepjnpfoabobbf';

  private xbullInstance: XBullWalletConnect | null = null;

  /**
   * Check if xBull is installed (extension or mobile)
   * @returns True if xBull API is available
   */
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for extension first
    if (window.xBull) return true;
    
    // Check for mobile wallet connect
    if (window.xBullWalletConnect) return true;
    
    return false;
  }

  /**
   * Get the xBull instance (extension or mobile)
   * @returns xBull instance or null
   */
  private getXBullInstance(): XBullWalletConnect | null {
    if (this.xbullInstance) return this.xbullInstance;
    
    // Prefer extension over mobile
    this.xbullInstance = window.xBull || window.xBullWalletConnect || null;
    return this.xbullInstance;
  }

  /**
   * Detect if running on mobile device
   * @returns True if mobile device
   */
  private isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Connect to xBull wallet
   * @returns Promise resolving to account information
   * @throws WalletError if connection fails
   */
  async connect(): Promise<WalletAccount> {
    try {
      const xbull = this.getXBullInstance();
      if (!xbull) {
        const errorMessage = this.isMobile() 
          ? 'xBull mobile app not detected. Please install xBull from app store.'
          : 'xBull extension not installed. Please install from Chrome Web Store.';
        
        throw new WalletError(errorMessage, 'WALLET_NOT_INSTALLED', 'xbull');
      }

      const account = await xbull.connect();
      return {
        publicKey: account.publicKey,
        network: account.network,
      };
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to connect to xBull: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Disconnect from xBull
   * @returns Promise resolving when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      const xbull = this.getXBullInstance();
      if (xbull) {
        await xbull.disconnect();
      }
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from xBull: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Get public key from connected wallet
   * @returns Promise resolving to public key
   * @throws WalletError if retrieval fails
   */
  async getPublicKey(): Promise<string> {
    try {
      const xbull = this.getXBullInstance();
      if (!xbull) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      return await xbull.getPublicKey();
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Sign a Stellar transaction
   * @param xdr - Transaction XDR to sign
   * @param network - Target network
   * @returns Promise resolving to signed transaction XDR
   * @throws WalletError if signing fails
   */
  async signTransaction(xdr: string, network?: Network): Promise<string> {
    try {
      const xbull = this.getXBullInstance();
      if (!xbull) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      return await xbull.signTransaction(xdr, network);
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Get current network from wallet
   * @returns Promise resolving to network type
   * @throws WalletError if retrieval fails
   */
  async getNetwork(): Promise<Network> {
    try {
      const xbull = this.getXBullInstance();
      if (!xbull) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      return await xbull.getNetwork();
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Listen for account changes
   * @param callback - Function called when account changes
   * @returns Cleanup function to remove listener
   */
  onAccountChanged(callback: (account: WalletAccount | null) => void): () => void {
    const xbull = this.getXBullInstance();
    if (!xbull) {
      return () => {};
    }

    return xbull.onAccountChanged((account: { publicKey: string; network: Network } | null) => {
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

  /**
   * Listen for network changes
   * @param callback - Function called when network changes
   * @returns Cleanup function to remove listener
   */
  onNetworkChanged(callback: (network: Network) => void): () => void {
    const xbull = this.getXBullInstance();
    if (!xbull) {
      return () => {};
    }

    return xbull.onNetworkChanged(callback);
  }
}
