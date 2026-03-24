/**
 * Freighter wallet adapter implementation
 * @fileoverview Adapter for Freighter Stellar wallet using @stellar/freighter-api
 * @see https://www.freighter.app/
 */

import {
  getPublicKey,
  signTransaction as freighterSignTransaction,
  getNetwork,
  getNetworkDetails,
  isConnected,
  isAllowed,
  setAllowed,
} from '@stellar/freighter-api';

import type { WalletAdapter, WalletAccount, Network, WalletType } from '../types';
import { WalletError } from '../types';

/**
 * Network passphrase constants
 */
const NETWORK_PASSPHRASES: Record<string, Network> = {
  'Public Global Stellar Network ; September 2015': 'public',
  'Test SDF Network ; September 2015': 'testnet',
};

const NETWORK_PASSPHRASE_MAP: Record<Network, string> = {
  public: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
};

/**
 * Map a network string (from Freighter) to the canonical Network type.
 * Handles: 'PUBLIC', 'TESTNET', 'FUTURENET', passphrase strings, etc.
 */
function mapNetwork(networkStr: string): Network {
  const upper = networkStr.toUpperCase();
  if (upper === 'PUBLIC' || upper === 'MAINNET') return 'public';
  if (upper === 'TESTNET') return 'testnet';
  // Check by passphrase
  const byPassphrase = NETWORK_PASSPHRASES[networkStr];
  if (byPassphrase) return byPassphrase;
  // Default: unknown networks treated as public for safety
  return 'public';
}

/**
 * FreighterAdapter — complete wallet adapter for the Freighter browser extension.
 *
 * Uses the official `@stellar/freighter-api` npm package rather than
 * accessing `window.freighter` directly, ensuring compatibility with
 * Freighter's versioned API surface.
 *
 * @example
 * ```ts
 * const adapter = new FreighterAdapter();
 * if (adapter.isInstalled()) {
 *   const account = await adapter.connect();
 *   const signedXdr = await adapter.signTransaction(xdr);
 * }
 * ```
 */
export class FreighterAdapter implements WalletAdapter {
  readonly type: WalletType = 'freighter';
  readonly name = 'Freighter';
  readonly icon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY3NjJEMCIvPgo8cGF0aCBkPSJNMjAgMTJMMjYgMjBIMjBMMjAgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjAgMTJMMTQgMjBIMjBMMjAgMTJaIiBmaWxsPSIjQUFBN0U4Ii8+CjxwYXRoIGQ9Ik0yMCAyOEwxNCAyMEgyMEwyMCAyOFoiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjciLz4KPC9zdmc+Cg==';
  readonly url = 'https://www.freighter.app';

  // ─── Installation check ────────────────────────────────────────────────────

  /**
   * Check whether the Freighter extension is installed in this browser.
   * Uses window.freighter (set by the extension) as a fast synchronous check.
   */
  isInstalled(): boolean {
    return (
      typeof window !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window as any).freighter
    );
  }

  // ─── Connect ──────────────────────────────────────────────────────────────

  /**
   * Connect to Freighter and obtain the user's public key and network.
   * Requests permission via setAllowed() if not already granted.
   *
   * @throws {WalletError} WALLET_NOT_INSTALLED — extension not detected
   * @throws {WalletError} USER_REJECTED — user denied the connection request
   * @throws {WalletError} CONNECTION_FAILED — any other connection error
   */
  async connect(): Promise<WalletAccount> {
    if (!this.isInstalled()) {
      throw new WalletError(
        'Freighter is not installed. Please install it from https://www.freighter.app',
        'WALLET_NOT_INSTALLED',
        'freighter'
      );
    }

    try {
      // Ensure we have permission
      const allowed = await isAllowed();
      if (!allowed) {
        const granted = await setAllowed();
        if (!granted) {
          throw new WalletError(
            'User rejected the connection request',
            'USER_REJECTED',
            'freighter'
          );
        }
      }

      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new WalletError(
          'User rejected the connection request',
          'USER_REJECTED',
          'freighter'
        );
      }

      const network = await this.getNetwork();
      return { publicKey, network };
    } catch (error) {
      // Re-throw WalletErrors as-is
      if (error instanceof WalletError) throw error;

      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('cancel')
      ) {
        throw new WalletError(
          'User rejected the connection request',
          'USER_REJECTED',
          'freighter'
        );
      }

      throw new WalletError(
        `Failed to connect to Freighter: ${msg}`,
        'CONNECTION_FAILED',
        'freighter'
      );
    }
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────

  /**
   * Freighter does not expose a disconnect API — this is a no-op.
   * The user disconnects by revoking site access inside the extension UI.
   */
  async disconnect(): Promise<void> {
    // No disconnect API in @stellar/freighter-api
  }

  // ─── Public key ───────────────────────────────────────────────────────────

  /**
   * Get the user's Stellar public key from Freighter.
   *
   * @throws {WalletError} WALLET_NOT_INSTALLED — extension not detected
   * @throws {WalletError} USER_REJECTED — user denied the request
   * @throws {WalletError} GET_PUBLIC_KEY_FAILED — any other failure
   */
  async getPublicKey(): Promise<string> {
    if (!this.isInstalled()) {
      throw new WalletError(
        'Freighter is not installed',
        'WALLET_NOT_INSTALLED',
        'freighter'
      );
    }

    try {
      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new WalletError(
          'User rejected the request',
          'USER_REJECTED',
          'freighter'
        );
      }
      return publicKey;
    } catch (error) {
      if (error instanceof WalletError) throw error;
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : String(error)}`,
        'GET_PUBLIC_KEY_FAILED',
        'freighter'
      );
    }
  }

  // ─── Sign transaction ─────────────────────────────────────────────────────

  /**
   * Sign a Stellar transaction XDR envelope with Freighter.
   *
   * @param xdr - Base64-encoded transaction XDR string
   * @param network - Target network ('public' | 'testnet'). Defaults to current Freighter network.
   * @returns Signed transaction XDR string
   *
   * @throws {WalletError} WALLET_NOT_INSTALLED — extension not detected
   * @throws {WalletError} USER_REJECTED — user cancelled the signing dialog
   * @throws {WalletError} SIGN_TRANSACTION_FAILED — any other signing failure
   */
  async signTransaction(xdr: string, network?: Network): Promise<string> {
    if (!this.isInstalled()) {
      throw new WalletError(
        'Freighter is not installed',
        'WALLET_NOT_INSTALLED',
        'freighter'
      );
    }

    try {
      const opts: { networkPassphrase?: string } = {};
      if (network) {
        opts.networkPassphrase = NETWORK_PASSPHRASE_MAP[network];
      }

      const signedXdr = await freighterSignTransaction(xdr, opts);
      if (!signedXdr) {
        throw new WalletError(
          'User rejected the signing request',
          'USER_REJECTED',
          'freighter'
        );
      }
      return signedXdr;
    } catch (error) {
      if (error instanceof WalletError) throw error;

      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('declined')
      ) {
        throw new WalletError(
          'User rejected the signing request',
          'USER_REJECTED',
          'freighter'
        );
      }

      throw new WalletError(
        `Failed to sign transaction: ${msg}`,
        'SIGN_TRANSACTION_FAILED',
        'freighter'
      );
    }
  }

  // ─── Network ─────────────────────────────────────────────────────────────

  /**
   * Get the current network selected in Freighter.
   * Uses getNetworkDetails() for the passphrase when available (more precise),
   * falls back to getNetwork() string matching.
   *
   * @throws {WalletError} WALLET_NOT_INSTALLED — extension not detected
   * @throws {WalletError} GET_NETWORK_FAILED — any other failure
   */
  async getNetwork(): Promise<Network> {
    if (!this.isInstalled()) {
      throw new WalletError(
        'Freighter is not installed',
        'WALLET_NOT_INSTALLED',
        'freighter'
      );
    }

    try {
      // getNetworkDetails gives us the passphrase which is authoritative
      const details = await getNetworkDetails();
      if (details.networkPassphrase) {
        const mapped = NETWORK_PASSPHRASES[details.networkPassphrase];
        if (mapped) return mapped;
      }
      // Fall back to the plain network string
      const networkStr = await getNetwork();
      return mapNetwork(networkStr);
    } catch (error) {
      if (error instanceof WalletError) throw error;
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : String(error)}`,
        'GET_NETWORK_FAILED',
        'freighter'
      );
    }
  }

  // ─── Event listeners ─────────────────────────────────────────────────────

  /**
   * Register a listener for account changes.
   *
   * Note: @stellar/freighter-api v1.x does not expose a direct event for
   * account changes. This implementation attaches to the `message` event
   * emitted by the extension via window.postMessage.
   *
   * @param callback - Called with the new WalletAccount, or null on disconnect
   * @returns Cleanup function to remove the listener
   */
  onAccountChanged(callback: (account: WalletAccount | null) => void): () => void {
    if (!this.isInstalled()) return () => {};

    const handler = async (event: MessageEvent) => {
      if (event.data?.type === 'FREIGHTER_ACCOUNT_CHANGED') {
        const publicKey: string | null = event.data?.publicKey ?? null;
        if (publicKey) {
          try {
            const network = await this.getNetwork();
            callback({ publicKey, network });
          } catch {
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }

  /**
   * Register a listener for network changes.
   *
   * Note: Uses window.postMessage events from the Freighter extension.
   *
   * @param callback - Called with the new Network value
   * @returns Cleanup function to remove the listener
   */
  onNetworkChanged(callback: (network: Network) => void): () => void {
    if (!this.isInstalled()) return () => {};

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'FREIGHTER_NETWORK_CHANGED') {
        const networkStr: string = event.data?.network ?? '';
        callback(mapNetwork(networkStr));
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }
}
