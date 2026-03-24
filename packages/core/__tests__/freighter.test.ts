/**
 * Comprehensive tests for FreighterAdapter
 * All @stellar/freighter-api functions are mocked — no browser extension required.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FreighterAdapter } from '../src/adapters/freighter';
import { WalletError } from '../src/types';

// ─── Mock @stellar/freighter-api ─────────────────────────────────────────────
vi.mock('@stellar/freighter-api', () => ({
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
  getNetworkDetails: vi.fn(),
  isConnected: vi.fn(),
  isAllowed: vi.fn(),
  setAllowed: vi.fn(),
}));

import {
  getPublicKey,
  signTransaction as freighterSignTx,
  getNetwork,
  getNetworkDetails,
  isAllowed,
  setAllowed,
} from '@stellar/freighter-api';

const mockGetPublicKey = getPublicKey as ReturnType<typeof vi.fn>;
const mockSignTransaction = freighterSignTx as ReturnType<typeof vi.fn>;
const mockGetNetwork = getNetwork as ReturnType<typeof vi.fn>;
const mockGetNetworkDetails = getNetworkDetails as ReturnType<typeof vi.fn>;
const mockIsAllowed = isAllowed as ReturnType<typeof vi.fn>;
const mockSetAllowed = setAllowed as ReturnType<typeof vi.fn>;

// ─── Constants ────────────────────────────────────────────────────────────────
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const MOCK_PUBLIC_KEY = 'GD7SXDKFZJGJL7J4A7UXHQXZJ3DFHQ7XFPLUQYOQJFNAGFHWTLBZ4QM';
const MOCK_XDR = 'AAAAAQAAAA...base64xdr...';
const MOCK_SIGNED_XDR = 'AAAAAQAAAA...signed...';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mockInstalled(installed = true) {
  Object.defineProperty(window, 'freighter', {
    value: installed ? true : undefined,
    writable: true,
    configurable: true,
  });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('FreighterAdapter', () => {
  let adapter: FreighterAdapter;

  beforeEach(() => {
    adapter = new FreighterAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset window.freighter
    Object.defineProperty(window, 'freighter', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  // ─── Metadata ─────────────────────────────────────────────────────────────
  describe('metadata', () => {
    it('has correct type', () => {
      expect(adapter.type).toBe('freighter');
    });

    it('has correct name', () => {
      expect(adapter.name).toBe('Freighter');
    });

    it('has a url', () => {
      expect(adapter.url).toBe('https://www.freighter.app');
    });

    it('has an icon (base64 svg)', () => {
      expect(adapter.icon).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });

  // ─── isInstalled ──────────────────────────────────────────────────────────
  describe('isInstalled()', () => {
    it('returns true when window.freighter is truthy', () => {
      mockInstalled(true);
      expect(adapter.isInstalled()).toBe(true);
    });

    it('returns false when window.freighter is absent', () => {
      mockInstalled(false);
      expect(adapter.isInstalled()).toBe(false);
    });
  });

  // ─── connect() ────────────────────────────────────────────────────────────
  describe('connect()', () => {
    it('throws WALLET_NOT_INSTALLED when extension is absent', async () => {
      mockInstalled(false);
      await expect(adapter.connect()).rejects.toMatchObject({
        code: 'WALLET_NOT_INSTALLED',
        walletType: 'freighter',
      });
    });

    it('connects successfully when already allowed', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'TESTNET',
        networkUrl: 'https://horizon-testnet.stellar.org',
        networkPassphrase: TESTNET_PASSPHRASE,
      });
      mockGetNetwork.mockResolvedValue('TESTNET');

      const account = await adapter.connect();
      expect(account.publicKey).toBe(MOCK_PUBLIC_KEY);
      expect(account.network).toBe('testnet');
      expect(mockSetAllowed).not.toHaveBeenCalled();
    });

    it('calls setAllowed when not yet allowed', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(false);
      mockSetAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'PUBLIC',
        networkUrl: 'https://horizon.stellar.org',
        networkPassphrase: MAINNET_PASSPHRASE,
      });
      mockGetNetwork.mockResolvedValue('PUBLIC');

      const account = await adapter.connect();
      expect(mockSetAllowed).toHaveBeenCalledTimes(1);
      expect(account.network).toBe('public');
    });

    it('throws USER_REJECTED when setAllowed returns false', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(false);
      mockSetAllowed.mockResolvedValue(false);

      await expect(adapter.connect()).rejects.toMatchObject({
        code: 'USER_REJECTED',
        walletType: 'freighter',
      });
    });

    it('throws USER_REJECTED when getPublicKey returns empty string', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue('');

      await expect(adapter.connect()).rejects.toMatchObject({
        code: 'USER_REJECTED',
        walletType: 'freighter',
      });
    });

    it('throws USER_REJECTED when freighter throws "rejected"', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockRejectedValue(new Error('User rejected the request'));

      await expect(adapter.connect()).rejects.toMatchObject({
        code: 'USER_REJECTED',
        walletType: 'freighter',
      });
    });

    it('throws CONNECTION_FAILED on unexpected errors', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockRejectedValue(new Error('Extension internal error'));

      await expect(adapter.connect()).rejects.toMatchObject({
        code: 'CONNECTION_FAILED',
        walletType: 'freighter',
      });
    });

    it('returns testnet account when on testnet', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'TESTNET',
        networkUrl: '',
        networkPassphrase: TESTNET_PASSPHRASE,
      });
      mockGetNetwork.mockResolvedValue('TESTNET');

      const account = await adapter.connect();
      expect(account.network).toBe('testnet');
    });

    it('returns public account when on mainnet', async () => {
      mockInstalled(true);
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'PUBLIC',
        networkUrl: '',
        networkPassphrase: MAINNET_PASSPHRASE,
      });
      mockGetNetwork.mockResolvedValue('PUBLIC');

      const account = await adapter.connect();
      expect(account.network).toBe('public');
    });
  });

  // ─── disconnect() ─────────────────────────────────────────────────────────
  describe('disconnect()', () => {
    it('resolves without error (no-op)', async () => {
      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });
  });

  // ─── getPublicKey() ───────────────────────────────────────────────────────
  describe('getPublicKey()', () => {
    it('throws WALLET_NOT_INSTALLED when extension is absent', async () => {
      mockInstalled(false);
      await expect(adapter.getPublicKey()).rejects.toMatchObject({
        code: 'WALLET_NOT_INSTALLED',
      });
    });

    it('returns public key when installed and approved', async () => {
      mockInstalled(true);
      mockGetPublicKey.mockResolvedValue(MOCK_PUBLIC_KEY);
      expect(await adapter.getPublicKey()).toBe(MOCK_PUBLIC_KEY);
    });

    it('throws USER_REJECTED when getPublicKey returns empty string', async () => {
      mockInstalled(true);
      mockGetPublicKey.mockResolvedValue('');
      await expect(adapter.getPublicKey()).rejects.toMatchObject({
        code: 'USER_REJECTED',
      });
    });

    it('throws GET_PUBLIC_KEY_FAILED on unexpected error', async () => {
      mockInstalled(true);
      mockGetPublicKey.mockRejectedValue(new Error('Unexpected'));
      await expect(adapter.getPublicKey()).rejects.toMatchObject({
        code: 'GET_PUBLIC_KEY_FAILED',
      });
    });
  });

  // ─── signTransaction() ────────────────────────────────────────────────────
  describe('signTransaction()', () => {
    it('throws WALLET_NOT_INSTALLED when extension is absent', async () => {
      mockInstalled(false);
      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toMatchObject({
        code: 'WALLET_NOT_INSTALLED',
      });
    });

    it('signs transaction and returns signed XDR', async () => {
      mockInstalled(true);
      mockSignTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      const result = await adapter.signTransaction(MOCK_XDR);
      expect(result).toBe(MOCK_SIGNED_XDR);
      expect(mockSignTransaction).toHaveBeenCalledWith(MOCK_XDR, {});
    });

    it('passes testnet network passphrase when network=testnet', async () => {
      mockInstalled(true);
      mockSignTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      await adapter.signTransaction(MOCK_XDR, 'testnet');
      expect(mockSignTransaction).toHaveBeenCalledWith(MOCK_XDR, {
        networkPassphrase: TESTNET_PASSPHRASE,
      });
    });

    it('passes mainnet network passphrase when network=public', async () => {
      mockInstalled(true);
      mockSignTransaction.mockResolvedValue(MOCK_SIGNED_XDR);

      await adapter.signTransaction(MOCK_XDR, 'public');
      expect(mockSignTransaction).toHaveBeenCalledWith(MOCK_XDR, {
        networkPassphrase: MAINNET_PASSPHRASE,
      });
    });

    it('throws USER_REJECTED when user cancels signing', async () => {
      mockInstalled(true);
      mockSignTransaction.mockRejectedValue(new Error('User declined'));

      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toMatchObject({
        code: 'USER_REJECTED',
      });
    });

    it('throws USER_REJECTED when signTransaction returns empty string', async () => {
      mockInstalled(true);
      mockSignTransaction.mockResolvedValue('');

      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toMatchObject({
        code: 'USER_REJECTED',
      });
    });

    it('throws SIGN_TRANSACTION_FAILED on unexpected errors', async () => {
      mockInstalled(true);
      mockSignTransaction.mockRejectedValue(new Error('Network mismatch'));

      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toMatchObject({
        code: 'SIGN_TRANSACTION_FAILED',
      });
    });

    it('error is instance of WalletError', async () => {
      mockInstalled(false);
      await expect(adapter.signTransaction(MOCK_XDR)).rejects.toBeInstanceOf(WalletError);
    });
  });

  // ─── getNetwork() ─────────────────────────────────────────────────────────
  describe('getNetwork()', () => {
    it('throws WALLET_NOT_INSTALLED when extension is absent', async () => {
      mockInstalled(false);
      await expect(adapter.getNetwork()).rejects.toMatchObject({
        code: 'WALLET_NOT_INSTALLED',
      });
    });

    it('returns testnet from passphrase (authoritative)', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'TESTNET',
        networkUrl: '',
        networkPassphrase: TESTNET_PASSPHRASE,
      });

      expect(await adapter.getNetwork()).toBe('testnet');
    });

    it('returns public from passphrase (authoritative)', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'PUBLIC',
        networkUrl: '',
        networkPassphrase: MAINNET_PASSPHRASE,
      });

      expect(await adapter.getNetwork()).toBe('public');
    });

    it('falls back to getNetwork() string when passphrase unknown', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'FUTURENET',
        networkUrl: '',
        networkPassphrase: 'Future Network ; October 2025',
      });
      mockGetNetwork.mockResolvedValue('PUBLIC');

      expect(await adapter.getNetwork()).toBe('public');
    });

    it('maps PUBLIC string to public', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockResolvedValue({ network: 'PUBLIC', networkUrl: '', networkPassphrase: '' });
      mockGetNetwork.mockResolvedValue('PUBLIC');
      expect(await adapter.getNetwork()).toBe('public');
    });

    it('maps TESTNET string to testnet', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockResolvedValue({ network: 'TESTNET', networkUrl: '', networkPassphrase: '' });
      mockGetNetwork.mockResolvedValue('TESTNET');
      expect(await adapter.getNetwork()).toBe('testnet');
    });

    it('throws GET_NETWORK_FAILED on error', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockRejectedValue(new Error('API error'));
      await expect(adapter.getNetwork()).rejects.toMatchObject({
        code: 'GET_NETWORK_FAILED',
      });
    });
  });

  // ─── onAccountChanged() ───────────────────────────────────────────────────
  describe('onAccountChanged()', () => {
    it('returns no-op when extension not installed', () => {
      mockInstalled(false);
      const cleanup = adapter.onAccountChanged(vi.fn());
      expect(typeof cleanup).toBe('function');
      cleanup(); // should not throw
    });

    it('calls callback with new account on FREIGHTER_ACCOUNT_CHANGED message', async () => {
      mockInstalled(true);
      mockGetNetworkDetails.mockResolvedValue({
        network: 'TESTNET',
        networkUrl: '',
        networkPassphrase: TESTNET_PASSPHRASE,
      });
      mockGetNetwork.mockResolvedValue('TESTNET');

      const callback = vi.fn();
      const cleanup = adapter.onAccountChanged(callback);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'FREIGHTER_ACCOUNT_CHANGED', publicKey: MOCK_PUBLIC_KEY },
        })
      );

      // Wait for async handler
      await new Promise(r => setTimeout(r, 10));
      expect(callback).toHaveBeenCalledWith({ publicKey: MOCK_PUBLIC_KEY, network: 'testnet' });

      cleanup();
    });

    it('calls callback with null when publicKey is null', async () => {
      mockInstalled(true);
      const callback = vi.fn();
      const cleanup = adapter.onAccountChanged(callback);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'FREIGHTER_ACCOUNT_CHANGED', publicKey: null },
        })
      );

      await new Promise(r => setTimeout(r, 10));
      expect(callback).toHaveBeenCalledWith(null);
      cleanup();
    });

    it('ignores unrelated messages', async () => {
      mockInstalled(true);
      const callback = vi.fn();
      const cleanup = adapter.onAccountChanged(callback);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SOME_OTHER_EVENT', publicKey: MOCK_PUBLIC_KEY },
        })
      );

      await new Promise(r => setTimeout(r, 10));
      expect(callback).not.toHaveBeenCalled();
      cleanup();
    });

    it('cleanup removes the event listener', async () => {
      mockInstalled(true);
      const callback = vi.fn();
      const cleanup = adapter.onAccountChanged(callback);
      cleanup();

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'FREIGHTER_ACCOUNT_CHANGED', publicKey: MOCK_PUBLIC_KEY },
        })
      );

      await new Promise(r => setTimeout(r, 10));
      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ─── onNetworkChanged() ───────────────────────────────────────────────────
  describe('onNetworkChanged()', () => {
    it('returns no-op when extension not installed', () => {
      mockInstalled(false);
      const cleanup = adapter.onNetworkChanged(vi.fn());
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('calls callback with mapped network on FREIGHTER_NETWORK_CHANGED', () => {
      mockInstalled(true);
      const callback = vi.fn();
      const cleanup = adapter.onNetworkChanged(callback);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'FREIGHTER_NETWORK_CHANGED', network: 'TESTNET' },
        })
      );

      expect(callback).toHaveBeenCalledWith('testnet');
      cleanup();
    });

    it('maps PUBLIC to public', () => {
      mockInstalled(true);
      const callback = vi.fn();
      const cleanup = adapter.onNetworkChanged(callback);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'FREIGHTER_NETWORK_CHANGED', network: 'PUBLIC' },
        })
      );

      expect(callback).toHaveBeenCalledWith('public');
      cleanup();
    });

    it('cleanup removes the listener', () => {
      mockInstalled(true);
      const callback = vi.fn();
      const cleanup = adapter.onNetworkChanged(callback);
      cleanup();

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'FREIGHTER_NETWORK_CHANGED', network: 'TESTNET' },
        })
      );

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ─── WalletError shape ────────────────────────────────────────────────────
  describe('WalletError', () => {
    it('includes walletType freighter on all errors', async () => {
      mockInstalled(false);
      try {
        await adapter.connect();
      } catch (e) {
        expect((e as WalletError).walletType).toBe('freighter');
      }
    });

    it('is instance of Error', async () => {
      mockInstalled(false);
      await expect(adapter.connect()).rejects.toBeInstanceOf(Error);
    });
  });
});
