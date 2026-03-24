/**
 * Comprehensive tests for LobstrAdapter
 * Tests extension, mobile deep linking, and web fallback functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LobstrAdapter } from '../src/adapters/lobstr';
import { WalletError, WalletErrorCode } from '../src/types';

// Mock Lobstr wallet connect
const mockLobstrConnect = {
  isConnected: vi.fn(),
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  onAccountChanged: vi.fn(),
  onNetworkChanged: vi.fn(),
};

// Mock Lobstr web signer
const mockLobstrSigner = {
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
};

// Constants
const MOCK_PUBLIC_KEY = 'GD7SXDKFZJGJL7J4A7UXHQXZJ3DFHQ7XFPLUQYOQJFNAGFHWTLBZ4QM';
const MOCK_XDR = 'AAAAAQAAAA...base64xdr...';
const MOCK_SIGNED_XDR = 'AAAAAQAAAA...signed...';

// Helpers
function mockExtensionInstalled(installed = true) {
  Object.defineProperty(window, 'lobstr', {
    value: installed ? mockLobstrConnect : undefined,
    writable: true,
    configurable: true,
  });
}

function mockWebFallback(available = true) {
  Object.defineProperty(window, 'lobstrSigner', {
    value: available ? mockLobstrSigner : undefined,
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

function mockWindowLocation(href: string) {
  Object.defineProperty(window, 'location', {
    value: { href },
    writable: true,
    configurable: true,
  });
}

describe('LobstrAdapter', () => {
  let adapter: LobstrAdapter;

  beforeEach(() => {
    adapter = new LobstrAdapter();
    vi.clearAllMocks();
    mockWindowLocation('https://example.com');
  });

  afterEach(() => {
    delete (window as any).lobstr;
    delete (window as any).lobstrSigner;
  });

  describe('Basic Properties', () => {
    it('should have correct wallet properties', () => {
      expect(adapter.type).toBe('lobstr');
      expect(adapter.name).toBe('Lobstr');
      expect(adapter.url).toBe('https://lobstr.co');
      expect(adapter.downloadUrl).toBe('https://lobstr.co/download');
    });
  });

  describe('Installation Detection', () => {
    it('should detect extension is installed', () => {
      mockExtensionInstalled(true);
      expect(adapter.isInstalled()).toBe(true);
    });

    it('should detect web fallback is available', () => {
      mockExtensionInstalled(false);
      mockWebFallback(true);
      expect(adapter.isInstalled()).toBe(true);
    });

    it('should detect no wallet is available', () => {
      mockExtensionInstalled(false);
      mockWebFallback(false);
      expect(adapter.isInstalled()).toBe(false);
    });
  });

  describe('Mobile Detection', () => {
    it('should detect iOS device', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      expect((adapter as any).isMobile()).toBe(true);
      expect((adapter as any).isIOS()).toBe(true);
    });

    it('should detect Android device', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F)');
      expect((adapter as any).isMobile()).toBe(true);
      expect((adapter as any).isIOS()).toBe(false);
    });

    it('should detect desktop', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      expect((adapter as any).isMobile()).toBe(false);
      expect((adapter as any).isIOS()).toBe(false);
    });
  });

  describe('Connection - Desktop Extension', () => {
    it('should connect successfully with extension', async () => {
      mockExtensionInstalled(true);
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      mockLobstrConnect.connect.mockResolvedValue({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });

      const result = await adapter.connect();

      expect(result).toEqual({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });
    });
  });

  describe('Connection - Web Fallback', () => {
    it('should connect with web fallback when extension not available', async () => {
      mockExtensionInstalled(false);
      mockWebFallback(true);
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      mockLobstrSigner.getPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);

      const result = await adapter.connect();

      expect(result).toEqual({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });
    });
  });

  describe('Connection - Mobile Deep Link', () => {
    it('should use mobile deep linking on mobile device', async () => {
      mockExtensionInstalled(false);
      mockWebFallback(false);
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      
      const mockHandleResponse = vi.spyOn(adapter as any, 'handleDeepLinkResponse');
      mockHandleResponse.mockResolvedValue({
        publicKey: MOCK_PUBLIC_KEY,
        network: 'public',
      });

      // Mock window.location.href assignment
      const mockLocationAssign = vi.fn();
      Object.defineProperty(window.location, 'href', {
        set: mockLocationAssign,
        get: () => 'https://example.com',
        configurable: true,
      });

      await adapter.connect();

      expect(mockLocationAssign).toHaveBeenCalledWith(
        expect.stringContaining('lobstr://connect')
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate error when no wallet available on desktop', async () => {
      mockExtensionInstalled(false);
      mockWebFallback(false);
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

      await expect(adapter.connect()).rejects.toMatchObject({
        code: WalletErrorCode.WALLET_NOT_INSTALLED,
        walletType: 'lobstr',
      });
    });

    it('should handle connection errors', async () => {
      mockExtensionInstalled(true);
      mockLobstrConnect.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(adapter.connect()).rejects.toMatchObject({
        code: WalletErrorCode.CONNECTION_FAILED,
        walletType: 'lobstr',
      });
    });
  });

  describe('Sign Transaction', () => {
    it('should sign with extension', async () => {
      mockExtensionInstalled(true);
      mockLobstrConnect.signTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      const result = await adapter.signTransaction(MOCK_XDR, 'public');

      expect(result).toBe(MOCK_SIGNED_XDR);
    });

    it('should sign with web fallback', async () => {
      mockExtensionInstalled(false);
      mockWebFallback(true);
      mockLobstrSigner.signTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      const result = await adapter.signTransaction(MOCK_XDR, 'public');

      expect(result).toBe(MOCK_SIGNED_XDR);
    });
  });

  describe('Event Listeners', () => {
    it('should set up account changed listener with extension', () => {
      mockExtensionInstalled(true);
      const mockCallback = vi.fn();
      const mockCleanup = vi.fn();
      mockLobstrConnect.onAccountChanged.mockReturnValue(mockCleanup);

      const cleanup = adapter.onAccountChanged(mockCallback);

      expect(typeof cleanup).toBe('function');
    });

    it('should return no-op when no wallet available', () => {
      mockExtensionInstalled(false);
      mockWebFallback(false);
      const mockCallback = vi.fn();

      const cleanup = adapter.onAccountChanged(mockCallback);

      expect(typeof cleanup).toBe('function');
      expect(cleanup).not.toThrow();
    });
  });
});
