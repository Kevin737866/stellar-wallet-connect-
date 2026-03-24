/**
 * Lobstr wallet adapter implementation
 * @fileoverview Enhanced adapter for Lobstr wallet with mobile deep linking and web fallback
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

// Lobstr wallet types
interface LobstrWalletConnect {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: Network): Promise<string>;
  getNetwork(): Promise<Network>;
  connect(): Promise<{ publicKey: string; network: Network }>;
  disconnect(): Promise<void>;
  onAccountChanged(callback: (account: { publicKey: string; network: Network } | null) => void): () => void;
  onNetworkChanged(callback: (network: Network) => void): () => void;
}

// Mobile deep link response types
interface LobstrDeepLinkResponse {
  publicKey?: string;
  signedXDR?: string;
  network?: Network;
  error?: string;
}

declare global {
  interface Window {
    lobstr?: LobstrWalletConnect;
    lobstrSigner?: any; // @lobstrco/signer
  }
}

/**
 * Lobstr wallet adapter
 * @see https://lobstr.co/
 * @see https://www.npmjs.com/package/@lobstrco/signer
 */
export class LobstrAdapter implements WalletAdapter {
  readonly type: WalletType = 'lobstr';
  readonly name = 'Lobstr';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwQjQ1QiIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  readonly url = 'https://lobstr.co';
  readonly downloadUrl = 'https://lobstr.co/download';

  private lobstrInstance: LobstrWalletConnect | null = null;
  private pendingDeepLinkPromise: Promise<any> | null = null;

  /**
   * Check if Lobstr is installed (extension, mobile, or web fallback)
   * @returns True if Lobstr API is available
   */
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for extension
    if (window.lobstr) return true;
    
    // Check for web signer fallback
    if (window.lobstrSigner) return true;
    
    return false;
  }

  /**
   * Get the Lobstr instance (extension or web fallback)
   * @returns Lobstr instance or null
   */
  private getLobstrInstance(): LobstrWalletConnect | null {
    if (this.lobstrInstance) return this.lobstrInstance;
    
    // Prefer extension over web fallback
    this.lobstrInstance = window.lobstr || null;
    return this.lobstrInstance;
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
   * Detect if running on iOS
   * @returns True if iOS device
   */
  private isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Create Lobstr deep link for mobile
   * @param action - Action to perform (connect, sign)
   * @param params - Parameters for the action
   * @returns Deep link URL
   */
  private createDeepLink(action: string, params: Record<string, string> = {}): string {
    const baseUrl = 'lobstr://';
    const queryString = new URLSearchParams(params).toString();
    return `${baseUrl}${action}${queryString ? '?' + queryString : ''}`;
  }

  /**
   * Handle mobile deep link response
   * @param timeout - Timeout in milliseconds
   * @returns Promise resolving to deep link response
   */
  private handleDeepLinkResponse(timeout = 30000): Promise<LobstrDeepLinkResponse> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new WalletError('Deep link timeout', 'DEEP_LINK_TIMEOUT', 'lobstr'));
      }, timeout);

      // Listen for message from mobile app
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data && event.data.type === 'LOBSTR_DEEP_LINK_RESPONSE') {
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleMessage);
          resolve(event.data.payload);
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  /**
   * Connect to Lobstr wallet
   * @returns Promise resolving to account information
   * @throws WalletError if connection fails
   */
  async connect(): Promise<WalletAccount> {
    try {
      // Handle mobile deep linking
      if (this.isMobile()) {
        return this.connectMobile();
      }

      // Handle desktop/web connection
      const lobstr = this.getLobstrInstance();
      if (!lobstr) {
        // Try web fallback
        if (window.lobstrSigner) {
          return this.connectWebFallback();
        }
        
        throw new WalletError(
          'Lobstr extension not installed. Please install from Chrome Web Store.',
          'WALLET_NOT_INSTALLED',
          'lobstr'
        );
      }

      const account = await lobstr.connect();
      return {
        publicKey: account.publicKey,
        network: account.network,
      };
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to connect to Lobstr: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'lobstr'
      );
    }
  }

  /**
   * Connect using mobile deep linking
   * @returns Promise resolving to account information
   */
  private async connectMobile(): Promise<WalletAccount> {
    const deepLink = this.createDeepLink('connect', {
      callback_url: window.location.href,
      network: 'public' // Default to public network
    });

    // Open deep link
    window.location.href = deepLink;

    // Wait for response
    const response = await this.handleDeepLinkResponse();
    
    if (response.error) {
      throw new WalletError(response.error, 'MOBILE_CONNECT_FAILED', 'lobstr');
    }

    if (!response.publicKey) {
      throw new WalletError('No public key received from mobile app', 'MOBILE_CONNECT_FAILED', 'lobstr');
    }

    return {
      publicKey: response.publicKey,
      network: response.network || 'public'
    };
  }

  /**
   * Connect using web fallback
   * @returns Promise resolving to account information
   */
  private async connectWebFallback(): Promise<WalletAccount> {
    try {
      // Use @lobstrco/signer for web fallback
      const signer = window.lobstrSigner;
      if (!signer) {
        throw new WalletError('Web signer not available', 'WEB_FALLBACK_FAILED', 'lobstr');
      }

      const publicKey = await signer.getPublicKey();
      return {
        publicKey,
        network: 'public' // Default to public network for web fallback
      };
    } catch (error) {
      throw new WalletError(
        `Web fallback connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WEB_FALLBACK_FAILED',
        'lobstr'
      );
    }
  }

  /**
   * Disconnect from Lobstr
   * @returns Promise resolving when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      const lobstr = this.getLobstrInstance();
      if (lobstr) {
        await lobstr.disconnect();
      }
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from Lobstr: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        'lobstr'
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
      // Handle mobile deep linking
      if (this.isMobile()) {
        return this.getPublicKeyMobile();
      }

      // Handle desktop/web connection
      const lobstr = this.getLobstrInstance();
      if (!lobstr) {
        // Try web fallback
        if (window.lobstrSigner) {
          return this.getPublicKeyWebFallback();
        }
        
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      return await lobstr.getPublicKey();
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'lobstr'
      );
    }
  }

  /**
   * Get public key using mobile deep linking
   * @returns Promise resolving to public key
   */
  private async getPublicKeyMobile(): Promise<string> {
    const deepLink = this.createDeepLink('getPublicKey', {
      callback_url: window.location.href
    });

    // Open deep link
    window.location.href = deepLink;

    // Wait for response
    const response = await this.handleDeepLinkResponse();
    
    if (response.error) {
      throw new WalletError(response.error, 'MOBILE_GET_PUBLIC_KEY_FAILED', 'lobstr');
    }

    if (!response.publicKey) {
      throw new WalletError('No public key received from mobile app', 'MOBILE_GET_PUBLIC_KEY_FAILED', 'lobstr');
    }

    return response.publicKey;
  }

  /**
   * Get public key using web fallback
   * @returns Promise resolving to public key
   */
  private async getPublicKeyWebFallback(): Promise<string> {
    try {
      const signer = window.lobstrSigner;
      if (!signer) {
        throw new WalletError('Web signer not available', 'WEB_FALLBACK_FAILED', 'lobstr');
      }

      return await signer.getPublicKey();
    } catch (error) {
      throw new WalletError(
        `Web fallback get public key failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WEB_FALLBACK_FAILED',
        'lobstr'
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
      // Handle mobile deep linking
      if (this.isMobile()) {
        return this.signTransactionMobile(xdr, network);
      }

      // Handle desktop/web connection
      const lobstr = this.getLobstrInstance();
      if (!lobstr) {
        // Try web fallback
        if (window.lobstrSigner) {
          return this.signTransactionWebFallback(xdr, network);
        }
        
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      return await lobstr.signTransaction(xdr, network);
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'lobstr'
      );
    }
  }

  /**
   * Sign transaction using mobile deep linking
   * @param xdr - Transaction XDR to sign
   * @param network - Target network
   * @returns Promise resolving to signed transaction XDR
   */
  private async signTransactionMobile(xdr: string, network?: Network): Promise<string> {
    const deepLink = this.createDeepLink('signTransaction', {
      xdr,
      network: network || 'public',
      callback_url: window.location.href
    });

    // Open deep link
    window.location.href = deepLink;

    // Wait for response
    const response = await this.handleDeepLinkResponse();
    
    if (response.error) {
      throw new WalletError(response.error, 'MOBILE_SIGN_TRANSACTION_FAILED', 'lobstr');
    }

    if (!response.signedXDR) {
      throw new WalletError('No signed transaction received from mobile app', 'MOBILE_SIGN_TRANSACTION_FAILED', 'lobstr');
    }

    return response.signedXDR;
  }

  /**
   * Sign transaction using web fallback
   * @param xdr - Transaction XDR to sign
   * @param network - Target network
   * @returns Promise resolving to signed transaction XDR
   */
  private async signTransactionWebFallback(xdr: string, network?: Network): Promise<string> {
    try {
      const signer = window.lobstrSigner;
      if (!signer) {
        throw new WalletError('Web signer not available', 'WEB_FALLBACK_FAILED', 'lobstr');
      }

      return await signer.signTransaction(xdr, network);
    } catch (error) {
      throw new WalletError(
        `Web fallback sign transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WEB_FALLBACK_FAILED',
        'lobstr'
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
      // Handle mobile deep linking
      if (this.isMobile()) {
        return this.getNetworkMobile();
      }

      // Handle desktop/web connection
      const lobstr = this.getLobstrInstance();
      if (!lobstr) {
        // Try web fallback
        if (window.lobstrSigner) {
          return this.getNetworkWebFallback();
        }
        
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      return await lobstr.getNetwork();
    } catch (error) {
      if (error instanceof WalletError) throw error;
      
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'lobstr'
      );
    }
  }

  /**
   * Get network using mobile deep linking
   * @returns Promise resolving to network type
   */
  private async getNetworkMobile(): Promise<Network> {
    const deepLink = this.createDeepLink('getNetwork', {
      callback_url: window.location.href
    });

    // Open deep link
    window.location.href = deepLink;

    // Wait for response
    const response = await this.handleDeepLinkResponse();
    
    if (response.error) {
      throw new WalletError(response.error, 'MOBILE_GET_NETWORK_FAILED', 'lobstr');
    }

    return response.network || 'public';
  }

  /**
   * Get network using web fallback
   * @returns Promise resolving to network type
   */
  private async getNetworkWebFallback(): Promise<Network> {
    try {
      const signer = window.lobstrSigner;
      if (!signer) {
        throw new WalletError('Web signer not available', 'WEB_FALLBACK_FAILED', 'lobstr');
      }

      return await signer.getNetwork();
    } catch (error) {
      throw new WalletError(
        `Web fallback get network failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WEB_FALLBACK_FAILED',
        'lobstr'
      );
    }
  }

  /**
   * Listen for account changes
   * @param callback - Function called when account changes
   * @returns Cleanup function to remove listener
   */
  onAccountChanged(callback: (account: WalletAccount | null) => void): () => void {
    const lobstr = this.getLobstrInstance();
    if (!lobstr) {
      return () => {};
    }

    return lobstr.onAccountChanged((account: { publicKey: string; network: Network } | null) => {
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
    const lobstr = this.getLobstrInstance();
    if (!lobstr) {
      return () => {};
    }

    return lobstr.onNetworkChanged(callback);
  }
}
