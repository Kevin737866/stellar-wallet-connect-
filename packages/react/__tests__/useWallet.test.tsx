import React from 'react';
import { render, screen, act, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { WalletProvider, type WalletAdapter, type Network, type WalletAccount } from '../src/WalletProvider';
import { useWallet } from '../src/useWallet';

const LS_KEY = 'stellar-wallet-connect';

function makeMockAdapter(overrides: Partial<WalletAdapter> = {}): WalletAdapter {
  return {
    isInstalled: vi.fn(() => true),
    connect: vi.fn(async () => ({ publicKey: 'G123', network: 'testnet' as Network })),
    disconnect: vi.fn(async () => {}),
    getPublicKey: vi.fn(async () => 'G123'),
    getNetwork: vi.fn(async () => 'testnet' as Network),
    signTransaction: vi.fn(async (xdr: string) => `signed:${xdr}`),
    onAccountChanged: vi.fn(() => () => {}),
    onNetworkChanged: vi.fn(() => () => {}),
    ...overrides,
  };
}

function TestComp() {
  const { state, connect, disconnect, signTransaction, resetError } = useWallet();

  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="wallet-id">{state.walletId ?? 'none'}</span>
      <span data-testid="pk">{state.account?.publicKey ?? 'none'}</span>
      <span data-testid="network">{state.account?.network ?? 'none'}</span>
      <span data-testid="error">{state.error ?? 'none'}</span>
      <button onClick={() => connect('freighter')}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={() => signTransaction('sample-xdr')}>Sign</button>
      <button onClick={resetError}>Reset Error</button>
    </div>
  );
}

describe('useWallet', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('supports connect and disconnect state transitions', async () => {
    const adp = makeMockAdapter();

    render(
      <WalletProvider adapters={{ freighter: adp }}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));
    expect(screen.getByTestId('wallet-id')).toHaveTextContent('freighter');
    expect(screen.getByTestId('pk')).toHaveTextContent('G123');
    expect(localStorage.getItem(LS_KEY)).toBe(JSON.stringify({ walletId: 'freighter' }));

    fireEvent.click(screen.getByText('Disconnect'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));
    expect(screen.getByTestId('wallet-id')).toHaveTextContent('none');
    expect(screen.getByTestId('pk')).toHaveTextContent('none');
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it('auto-reconnects on mount using localStorage', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ walletId: 'freighter' }));
    const adp = makeMockAdapter();

    render(
      <WalletProvider adapters={{ freighter: adp }} autoReconnect={true}>
        <TestComp />
      </WalletProvider>
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));
    expect(adp.connect).toHaveBeenCalledTimes(1);
  });

  it('handles connection failures and resetError', async () => {
    const adp = makeMockAdapter({
      connect: vi.fn(async () => {
        throw new Error('boom');
      }),
    });

    render(
      <WalletProvider adapters={{ freighter: adp }}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('error')).toHaveTextContent('boom');

    fireEvent.click(screen.getByText('Reset Error'));
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('debounces account changes from the adapter', async () => {
    vi.useFakeTimers();

    let triggerAccountChanged: ((account: WalletAccount | null) => void) | undefined;
    const adp = makeMockAdapter({
      onAccountChanged: vi.fn((callback: (account: WalletAccount | null) => void) => {
        triggerAccountChanged = callback;
        return () => {};
      }),
    });

    render(
      <WalletProvider adapters={{ freighter: adp }} autoReconnect={false}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));

    act(() => {
      triggerAccountChanged?.({ publicKey: 'G_NEW', network: 'testnet' });
      vi.advanceTimersByTime(299);
    });

    expect(screen.getByTestId('pk')).toHaveTextContent('G123');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId('pk')).toHaveTextContent('G_NEW');
  });

  it('debounces network changes from the adapter', async () => {
    vi.useFakeTimers();

    let triggerNetworkChanged: ((network: Network) => void) | undefined;
    const adp = makeMockAdapter({
      onNetworkChanged: vi.fn((callback: (network: Network) => void) => {
        triggerNetworkChanged = callback;
        return () => {};
      }),
    });

    render(
      <WalletProvider adapters={{ freighter: adp }} autoReconnect={false}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));

    act(() => {
      triggerNetworkChanged?.('public');
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('network')).toHaveTextContent('public');
  });

  it('disconnects when account change emits null', async () => {
    vi.useFakeTimers();

    let triggerAccountChanged: ((account: WalletAccount | null) => void) | undefined;
    const adp = makeMockAdapter({
      onAccountChanged: vi.fn((callback: (account: WalletAccount | null) => void) => {
        triggerAccountChanged = callback;
        return () => {};
      }),
    });

    render(
      <WalletProvider adapters={{ freighter: adp }} autoReconnect={false}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));

    act(() => {
      triggerAccountChanged?.(null);
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));
  });

  it('signs transactions with the active adapter', async () => {
    const adp = makeMockAdapter();

    render(
      <WalletProvider adapters={{ freighter: adp }}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));

    fireEvent.click(screen.getByText('Sign'));

    await waitFor(() => expect(adp.signTransaction).toHaveBeenCalledWith('sample-xdr', 'testnet'));
  });

  it('cleans up listeners on unmount', async () => {
    const accountCleanup = vi.fn();
    const networkCleanup = vi.fn();

    const adp = makeMockAdapter({
      onAccountChanged: vi.fn(() => accountCleanup),
      onNetworkChanged: vi.fn(() => networkCleanup),
    });

    const { unmount } = render(
      <WalletProvider adapters={{ freighter: adp }}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));

    unmount();

    expect(accountCleanup).toHaveBeenCalledTimes(1);
    expect(networkCleanup).toHaveBeenCalledTimes(1);
  });
});
