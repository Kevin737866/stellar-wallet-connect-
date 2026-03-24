/**
 * Comprehensive tests for XbullAdapter
 * Tests both extension and mobile wallet connect functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { XbullAdapter } from '../src/adapters/xbull';
import { WalletError, WalletErrorCode } from '../src/types';

// ─── Mock xBull wallet connect ─────────────────────────────────────────────
const mockXBullConnect = {
  isConnected: vi.fn(),
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  onAccountChanged: vi.fn(),
  onNetworkChanged: vi.fn(),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const MOCK_PUBLIC_KEY = 'GD7SXDKFZJGJL7J4A7UXHQXZJ3DFHQ7XFPLUQYOQJFNAGFHWTLBZ4QM';
const MOCK_XDR = 'AAAAAQAAAA...base64xdr...';
const MOCK_SIGNED_XDR = 'AAAAAQAAAA...signed...';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mockExtensionInstalled(installed = true) {
  Object.defineProperty(window, 'xBull', {
    value: installed ? mockXBullConnect : undefined,
    writable: true,
    configurable: true,
  });
}

function mockMobileWalletConnect(installed = true) {
  Object.defineProperty(window, 'xBullWalletConnect', {
    value: installed ? mockXBullConnect : undefined,
    writable: true,
    configurable: true,
  });
}

function mockUserAgent(userAgent: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    writable: true,
    configurable: true,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('XbullAdapter', () => {
  let adapter: XbullAdapter;

  beforeEach(() => {
    adapter = new XbullAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).xBull;
    delete (window as any).xBullWalletConnect;
  });

  describe('Basic Properties', () => {
    it('should have correct wallet properties', () => {
      expect(adapter.type).toBe('xbull');
      expect(adapter.name).toBe('xBull');
      expect(adapter.url).toBe('https://xbull.app');
      expect(adapter.downloadUrl).toBe('https://chrome.google.com/webstore/detail/xbull-wallet/jfbapfmkmnpdjobgmljepjnpfoabobbf');
      expect(adapter.icon).toContain('data:image/svg+xml;base64');
    });
  });

  describe('Installation Detection', () => {
    it('should detect extension is installed', () => {
      mockExtensionInstalled(true);
      expect(adapter.isInstalled()).toBe(true);
    });

    it('should detect mobile wallet connect is available', () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(true);
      expect(adapter.isInstalled()).toBe(true);
    });

    it('should detect no wallet is installed', () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);
      expect(adapter.isInstalled()).toBe(false);
    });

    it('should prefer extension over mobile wallet connect', () => {
      mockExtensionInstalled(true);
      mockMobileWalletConnect(true);
      expect(adapter.isInstalled()).toBe(true);
    });

    it('should handle undefined window', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      expect(adapter.isInstalled()).toBe(false);
      global.window = originalWindow;
    });
  });

  describe('Connection', () => {
    it('should connect successfully with extension', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.connect.mockResolvedValue({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public' as const,
      });

      const result = await adapter.connect();

      expect(result).toEqual({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });
      expect(mockXBullConnect.connect).toHaveBeenCalledTimes(1);
    });

    it('should connect successfully with mobile wallet connect', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(true);
      mockXBullConnect.connect.mockResolvedValue({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'testnet' as const,
      });

      const result = await adapter.connect();

      expect(result).toEqual({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'testnet',
      });
      expect(mockXBullConnect.connect).toHaveBeenCalledTimes(1);
    });

    it('should throw error when wallet not installed on desktop', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      await expect(adapter.connect()).rejects.toThrow(WalletError);
      await expect(adapter.connect()).rejects.toMatchObject({
        code: WalletErrorCode.WALLET_NOT_INSTALLED,
        walletType: 'xbull',
        message: 'xBull extension not installed. Please install from Chrome Web Store.',
      });
    });

    it('should throw error when wallet not installed on mobile', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');

      await expect(adapter.connect()).rejects.toThrow(WalletError);
      await expect(adapter.connect()).rejects.toMatchObject({
        code: WalletErrorCode.WALLET_NOT_INSTALLED,
        walletType: 'xbull',
        message: 'xBull mobile app not detected. Please install xBull from app store.',
      });
    });

    it('should handle connection errors', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(adapter.connect()).rejects.toThrow(WalletError);
      await expect(adapter.connect()).rejects.toMatchObject({
        code: WalletErrorCode.CONNECTION_FAILED,
        walletType: 'xbull',
        message: 'Failed to connect to xBull: Connection failed',
      });
    });

    it('should preserve WalletError instances', async () => {
      mockExtensionInstalled(true);
      const originalError = new WalletError('Custom error', 'CUSTOM_ERROR', 'xbull');
      mockXBullConnect.connect.mockRejectedValue(originalError);

      await expect(adapter.connect()).rejects.toThrow(originalError);
    });
  });

  describe('Disconnection', () => {
    it('should disconnect successfully', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.disconnect.mockResolvedValue(undefined);

      await expect(adapter.disconnect()).resolves.toBeUndefined();
      expect(mockXBullConnect.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect when wallet not installed', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);

      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });

    it('should handle disconnect errors', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(adapter.disconnect()).rejects.toThrow(WalletError);
      await expect(adapter.disconnect()).rejects.toMatchObject({
        code: WalletErrorCode.DISCONNECT_FAILED,
        walletType: 'xbull',
        message: 'Failed to disconnect from xBull: Disconnect failed',
      });
    });
  });

  describe('Get Public Key', () => {
    it('should get public key successfully', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.getPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);

      const result = await adapter.getPublicKey();

      expect(result).toBe(MOCK_PUBLIC_KEY);
      expect(mockXBullConnect.getPublicKey).toHaveBeenCalledTimes(1);
    });

    it('should throw error when wallet not installed', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);

      await expect(adapter.getPublicKey()).rejects.toThrow(WalletError);
      await expect(adapter.getPublicKey()).rejects.toMatchObject({
        code: WalletErrorCode.WALLET_NOT_INSTALLED,
        walletType: 'xbull',
      });
    });

    it('should handle get public key errors', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.getPublicKey.mockRejectedValue(new Error('Failed to get public key'));

      await expect(adapter.getPublicKey()).rejects.toThrow(WalletError);
      await expect(adapter.getPublicKey()).rejects.toMatchObject({
        code: WalletErrorCode.GET_PUBLIC_KEY_FAILED,
        walletType: 'xbull',
      });
    });
  });

  describe('Sign Transaction', () => {
    it('should sign transaction successfully', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.signTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      const result = await adapter.signTransaction(MOCK_XDR, 'public');

      expect(result).toBe(MOCK_SIGNED_XDR);
      expect(mockXBullConnect.signTransaction).toHaveBeenCalledWith(MOCK_XDR, 'public');
    });

    it('should sign transaction without network', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.signTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      const result = await adapter.signTransaction(MOCK_XDR);

      expect(result).toBe(MOCK_SIGNED_XDR);
      expect(mockXBullConnect.signTransaction).toHaveBeenCalledWith(MOCK_XDR, undefined);
    });

    it('should throw error when wallet not installed', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);

      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toThrow(WalletError);
      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toMatchObject({
        code: WalletErrorCode.WALLET_NOT_INSTALLED,
        walletType: 'xbull',
      });
    });

    it('should handle sign transaction errors', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.signTransaction.mockRejectedValue(new Error('Failed to sign'));

      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toThrow(WalletError);
      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toMatchObject({
        code: WalletErrorCode.SIGN_TRANSACTION_FAILED,
        walletType: 'xbull',
      });
    });
  });

  describe('Get Network', () => {
    it('should get network successfully', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.getNetwork.mockResolvedValue('testnet');

      const result = await adapter.getNetwork();

      expect(result).toBe('testnet');
      expect(mockXBullConnect.getNetwork).toHaveBeenCalledTimes(1);
    });

    it('should throw error when wallet not installed', async () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);

      await expect(adapter.getNetwork()).rejects.toThrow(WalletError);
      await expect(adapter.getNetwork()).rejects.toMatchObject({
        code: WalletErrorCode.WALLET_NOT_INSTALLED,
        walletType: 'xbull',
      });
    });

    it('should handle get network errors', async () => {
      mockExtensionInstalled(true);
      mockXBullConnect.getNetwork.mockRejectedValue(new Error('Failed to get network'));

      await expect(adapter.getNetwork()).rejects.toThrow(WalletError);
      await expect(adapter.getNetwork()).rejects.toMatchObject({
        code: WalletErrorCode.GET_NETWORK_FAILED,
        walletType: 'xbull',
      });
    });
  });

  describe('Event Listeners', () => {
    it('should set up account changed listener', () => {
      mockExtensionInstalled(true);
      const mockCallback = vi.fn();
      const mockCleanup = vi.fn();
      mockXBullConnect.onAccountChanged.mockReturnValue(mockCleanup);

      const cleanup = adapter.onAccountChanged(mockCallback);

      expect(mockXBullConnect.onAccountChanged).toHaveBeenCalledTimes(1);
      expect(typeof cleanup).toBe('function');
      expect(cleanup).toBe(mockCleanup);
    });

    it('should handle account changed callback with account', () => {
      mockExtensionInstalled(true);
      const mockCallback = vi.fn();
      const mockCleanup = vi.fn();
      mockXBullConnect.onAccountChanged.mockReturnValue(mockCleanup);

      adapter.onAccountChanged(mockCallback);

      const accountCallback = mockXBullConnect.onAccountChanged.mock.calls[0][0];
      accountCallback({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });

      expect(mockCallback).toHaveBeenCalledWith({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });
    });

    it('should handle account changed callback with null', () => {
      mockExtensionInstalled(true);
      const mockCallback = vi.fn();
      const mockCleanup = vi.fn();
      mockXBullConnect.onAccountChanged.mockReturnValue(mockCleanup);

      adapter.onAccountChanged(mockCallback);

      const accountCallback = mockXBullConnect.onAccountChanged.mock.calls[0][0];
      accountCallback(null);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should return no-op cleanup when wallet not installed', () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);
      const mockCallback = vi.fn();

      const cleanup = adapter.onAccountChanged(mockCallback);

      expect(typeof cleanup).toBe('function');
      expect(cleanup).not.toThrow();
    });

    it('should set up network changed listener', () => {
      mockExtensionInstalled(true);
      const mockCallback = vi.fn();
      const mockCleanup = vi.fn();
      mockXBullConnect.onNetworkChanged.mockReturnValue(mockCleanup);

      const cleanup = adapter.onNetworkChanged(mockCallback);

      expect(mockXBullConnect.onNetworkChanged).toHaveBeenCalledTimes(1);
      expect(typeof cleanup).toBe('function');
      expect(cleanup).toBe(mockCleanup);
    });

    it('should handle network changed callback', () => {
      mockExtensionInstalled(true);
      const mockCallback = vi.fn();
      const mockCleanup = vi.fn();
      mockXBullConnect.onNetworkChanged.mockReturnValue(mockCleanup);

      adapter.onNetworkChanged(mockCallback);

      const networkCallback = mockXBullConnect.onNetworkChanged.mock.calls[0][0];
      networkCallback('testnet');

      expect(mockCallback).toHaveBeenCalledWith('testnet');
    });

    it('should return no-op cleanup for network changed when wallet not installed', () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);
      const mockCallback = vi.fn();

      const cleanup = adapter.onNetworkChanged(mockCallback);

      expect(typeof cleanup).toBe('function');
      expect(cleanup).not.toThrow();
    });
  });

  describe('Instance Management', () => {
    it('should cache extension instance', () => {
      mockExtensionInstalled(true);
      mockMobileWalletConnect(true);

      const instance1 = (adapter as any).getXBullInstance();
      const instance2 = (adapter as any).getXBullInstance();

      expect(instance1).toBe(mockXBullConnect);
      expect(instance2).toBe(instance1);
    });

    it('should prefer extension over mobile wallet connect', () => {
      mockExtensionInstalled(true);
      mockMobileWalletConnect(true);

      const instance = (adapter as any).getXBullInstance();

      expect(instance).toBe(mockXBullConnect);
    });

    it('should use mobile wallet connect when extension not available', () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(true);

      const instance = (adapter as any).getXBullInstance();

      expect(instance).toBe(mockXBullConnect);
    });

    it('should return null when no wallet available', () => {
      mockExtensionInstalled(false);
      mockMobileWalletConnect(false);

      const instance = (adapter as any).getXBullInstance();

      expect(instance).toBeNull();
    });
  });
});
