/**
 * Stellar wallet connection library types
 * @fileoverview Core types and interfaces for wallet adapters
 */

/**
 * Supported wallet types
 */
export type WalletType = 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet';

/**
 * Stellar network types
 */
export type Network = 'public' | 'testnet';

/**
 * Mobile platform types
 */
export type MobilePlatform = 'ios' | 'android' | 'unknown';

/**
 * Deep link action types for mobile wallets
 */
export type DeepLinkAction = 'connect' | 'signTransaction' | 'getPublicKey' | 'getNetwork';

/**
 * Mobile deep link configuration
 */
export interface MobileDeepLinkConfig {
  /** Deep link URL scheme */
  scheme: string;
  /** Action to perform */
  action: DeepLinkAction;
  /** Parameters for the action */
  params: Record<string, string>;
  /** Callback URL for response */
  callbackUrl?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Mobile deep link response
 */
export interface DeepLinkResponse {
  /** Action that was performed */
  action: DeepLinkAction;
  /** Response data */
  data: {
    publicKey?: string;
    signedXDR?: string;
    network?: Network;
    error?: string;
  };
  /** Success status */
  success: boolean;
  /** Timestamp of response */
  timestamp: number;
}

/**
 * Wallet account information
 */
export interface WalletAccount {
  /** Stellar public key */
  readonly publicKey: string;
  /** Current network */
  readonly network: Network;
}

/**
 * Wallet adapter interface for Stellar wallets
 */
export interface WalletAdapter {
  /** Wallet type identifier */
  readonly type: WalletType;
  /** Human-readable wallet name */
  readonly name: string;
  /** Base64 encoded wallet icon */
  readonly icon: string;
  /** Official wallet website URL */
  readonly url: string;
  /** Download URL for wallet installation */
  readonly downloadUrl?: string;

  /**
   * Check if wallet is installed and available
   * @returns True if wallet is installed
   */
  isInstalled(): boolean;

  /**
   * Connect to wallet and get account information
   * @returns Promise resolving to wallet account details
   * @throws WalletError if connection fails
   */
  connect(): Promise<WalletAccount>;

  /**
   * Disconnect from wallet
   * @returns Promise resolving when disconnected
   */
  disconnect(): Promise<void>;

  /**
   * Get current public key from connected wallet
   * @returns Promise resolving to public key string
   * @throws WalletError if not connected or retrieval fails
   */
  getPublicKey(): Promise<string>;

  /**
   * Sign a Stellar transaction
   * @param xdr - Transaction XDR string to sign
   * @param network - Target network (optional, defaults to current network)
   * @returns Promise resolving to signed transaction XDR
   * @throws WalletError if signing fails
   */
  signTransaction(xdr: string, network?: Network): Promise<string>;

  /**
   * Get current network from wallet
   * @returns Promise resolving to network type
   */
  getNetwork(): Promise<Network>;

  /**
   * Listen for account changes
   * @param callback - Function called when account changes
   * @returns Cleanup function to remove listener
   */
  onAccountChanged?(callback: (account: WalletAccount | null) => void): () => void;

  /**
   * Listen for network changes
   * @param callback - Function called when network changes
   * @returns Cleanup function to remove listener
   */
  onNetworkChanged?(callback: (network: Network) => void): () => void;

  /**
   * Check if wallet supports mobile deep linking
   * @returns True if mobile deep linking is supported
   */
  supportsMobileDeepLink?(): boolean;

  /**
   * Check if wallet supports web fallback
   * @returns True if web fallback is supported
   */
  supportsWebFallback?(): boolean;
}

/**
 * Wallet configuration options
 */
export interface StellarWalletConnectOptions {
  /** Default network to use */
  network?: Network;
  /** Auto-connect on initialization */
  autoConnect?: boolean;
}

/**
 * Wallet connection state
 */
export interface WalletState {
  /** Whether wallet is connected */
  readonly isConnected: boolean;
  /** Current wallet adapter */
  readonly wallet: WalletAdapter | null;
  /** Current account information */
  readonly account: WalletAccount | null;
  /** Connection in progress */
  readonly isConnecting: boolean;
  /** Last error message */
  readonly error: string | null;
}

/**
 * Transaction signing options
 */
export interface SignTransactionOptions {
  /** Transaction XDR to sign */
  readonly xdr: string;
  /** Target network */
  readonly network?: Network;
  /** Submit transaction after signing */
  readonly submit?: boolean;
}

/**
 * Wallet error class
 */
export class WalletError extends Error {
  /** Error code for categorization */
  readonly code: string;
  /** Wallet type that caused the error */
  readonly walletType?: WalletType;
  /** Additional error context */
  readonly context?: Record<string, any>;

  constructor(message: string, code: string, walletType?: WalletType, context?: Record<string, any>) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.walletType = walletType;
    this.context = context;
  }
}

/**
 * Common wallet error codes
 */
export const WalletErrorCode = {
  // General errors
  WALLET_NOT_INSTALLED: 'WALLET_NOT_INSTALLED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  DISCONNECT_FAILED: 'DISCONNECT_FAILED',
  GET_PUBLIC_KEY_FAILED: 'GET_PUBLIC_KEY_FAILED',
  SIGN_TRANSACTION_FAILED: 'SIGN_TRANSACTION_FAILED',
  GET_NETWORK_FAILED: 'GET_NETWORK_FAILED',
  
  // Mobile-specific errors
  MOBILE_CONNECT_FAILED: 'MOBILE_CONNECT_FAILED',
  MOBILE_GET_PUBLIC_KEY_FAILED: 'MOBILE_GET_PUBLIC_KEY_FAILED',
  MOBILE_SIGN_TRANSACTION_FAILED: 'MOBILE_SIGN_TRANSACTION_FAILED',
  MOBILE_GET_NETWORK_FAILED: 'MOBILE_GET_NETWORK_FAILED',
  DEEP_LINK_TIMEOUT: 'DEEP_LINK_TIMEOUT',
  DEEP_LINK_UNSUPPORTED: 'DEEP_LINK_UNSUPPORTED',
  
  // Web fallback errors
  WEB_FALLBACK_FAILED: 'WEB_FALLBACK_FAILED',
  WEB_FALLBACK_NOT_SUPPORTED: 'WEB_FALLBACK_NOT_SUPPORTED',
  
  // Network errors
  NETWORK_NOT_SUPPORTED: 'NETWORK_NOT_SUPPORTED',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  
  // Transaction errors
  INVALID_TRANSACTION: 'INVALID_TRANSACTION',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  
  // User errors
  USER_REJECTED: 'USER_REJECTED',
  USER_CANCELLED: 'USER_CANCELLED',
} as const;

/**
 * Account balance information
 */
export interface Balance {
  /** Balance amount as string */
  readonly balance: string;
  /** Asset code (e.g., 'XLM', 'USDC') */
  readonly assetCode: string;
  /** Asset issuer (for custom assets) */
  readonly assetIssuer?: string;
  /** Asset type */
  readonly assetType: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}

/**
 * Detailed account information from Stellar
 */
export interface AccountDetails {
  /** Account ID (public key) */
  readonly accountId: string;
  /** Account sequence number */
  readonly sequence: string;
  /** Account balances */
  readonly balances: readonly Balance[];
  /** Account thresholds */
  readonly thresholds: {
    readonly lowThreshold: number;
    readonly medThreshold: number;
    readonly highThreshold: number;
  };
  /** Account signers */
  readonly signers: readonly {
    readonly key: string;
    readonly weight: number;
    readonly type: string;
  }[];
}

/**
 * Wallet information for UI display
 */
export interface WalletInfo {
  /** Wallet type */
  readonly type: WalletType;
  /** Wallet name */
  readonly name: string;
  /** Wallet icon */
  readonly icon: string;
  /** Wallet website */
  readonly url: string;
  /** Download URL for wallet installation */
  readonly downloadUrl?: string;
  /** Installation status */
  readonly isInstalled: boolean;
  /** Mobile deep linking support */
  readonly supportsMobileDeepLink?: boolean;
  /** Web fallback support */
  readonly supportsWebFallback?: boolean;
}

/**
 * Mobile platform detection utilities
 */
export const MobilePlatform = {
  /** Check if running on iOS */
  isIOS: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  /** Check if running on Android */
  isAndroid: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  },
  
  /** Check if running on mobile device */
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },
  
  /** Get current mobile platform */
  getPlatform: (): MobilePlatform => {
    if (MobilePlatform.isIOS()) return 'ios';
    if (MobilePlatform.isAndroid()) return 'android';
    return 'unknown';
  }
} as const;
