import { WalletAdapter, WalletInfo, WalletType, WalletError } from './types';
import { FreighterAdapter, XbullAdapter, LobstrAdapter, AlbedoAdapter, RabetAdapter } from './adapters';

export class WalletManager {
  private adapters: Map<WalletType, WalletAdapter> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    const adapters = [
      new FreighterAdapter(),
      new XbullAdapter(),
      new LobstrAdapter(),
      new AlbedoAdapter(),
      new RabetAdapter(),
    ];

    adapters.forEach((adapter) => {
      this.adapters.set(adapter.type, adapter);
    });
  }

  getAvailableWallets(): WalletInfo[] {
    return Array.from(this.adapters.values()).map((adapter) => ({
      type: adapter.type,
      name: adapter.name,
      icon: adapter.icon,
      url: adapter.url,
      downloadUrl: adapter.downloadUrl,
      isInstalled: adapter.isInstalled(),
    }));
  }

  getInstalledWallets(): WalletInfo[] {
    return this.getAvailableWallets().filter((wallet) => wallet.isInstalled);
  }

  getAdapter(type: WalletType): WalletAdapter | null {
    return this.adapters.get(type) || null;
  }

  async connectWallet(type: WalletType): Promise<WalletAdapter> {
    const adapter = this.getAdapter(type);
    if (!adapter) {
      throw new WalletError(`Wallet ${type} is not supported`, 'WALLET_NOT_SUPPORTED');
    }

    if (!adapter.isInstalled()) {
      throw new WalletError(`Wallet ${adapter.name} is not installed`, 'WALLET_NOT_INSTALLED', type);
    }

    try {
      const account = await adapter.connect();
      this.setupEventListeners(adapter);
      this.emit('walletConnected', { adapter, account });
      return adapter;
    } catch (error) {
      throw new WalletError(
        `Failed to connect to ${adapter.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        type
      );
    }
  }

  async disconnectWallet(type: WalletType): Promise<void> {
    const adapter = this.getAdapter(type);
    if (!adapter) {
      return;
    }

    try {
      await adapter.disconnect();
      this.removeEventListeners(adapter);
      this.emit('walletDisconnected', { adapter });
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from ${adapter.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        type
      );
    }
  }

  private setupEventListeners(adapter: WalletAdapter): void {
    if (adapter.onAccountChanged) {
      const unsubscribe = adapter.onAccountChanged((account) => {
        this.emit('accountChanged', { adapter, account });
      });
      this.storeUnsubscribe(adapter.type, 'accountChanged', unsubscribe);
    }

    if (adapter.onNetworkChanged) {
      const unsubscribe = adapter.onNetworkChanged((network) => {
        this.emit('networkChanged', { adapter, network });
      });
      this.storeUnsubscribe(adapter.type, 'networkChanged', unsubscribe);
    }
  }

  private removeEventListeners(adapter: WalletAdapter): void {
    const unsubscribes = this.getUnsubscribes(adapter.type);
    unsubscribes.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Failed to unsubscribe from wallet event:', error);
      }
    });
    this.clearUnsubscribes(adapter.type);
  }

  private storeUnsubscribe(walletType: WalletType, eventType: string, unsubscribe: () => void): void {
    const key = `${walletType}-${eventType}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    this.eventListeners.get(key)!.add(unsubscribe);
  }

  private getUnsubscribes(walletType: WalletType): Set<() => void> {
    const unsubscribes = new Set<() => void>();
    this.eventListeners.forEach((listeners, key) => {
      if (key.startsWith(walletType.toString())) {
        listeners.forEach((unsubscribe) => unsubscribes.add(unsubscribe));
      }
    });
    return unsubscribes;
  }

  private clearUnsubscribes(walletType: WalletType): void {
    const keysToDelete: string[] = [];
    this.eventListeners.forEach((_, key) => {
      if (key.startsWith(walletType.toString())) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.eventListeners.delete(key));
  }

  on(event: string, listener: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  destroy(): void {
    this.adapters.forEach((adapter) => {
      this.removeEventListeners(adapter);
    });
    this.eventListeners.clear();
  }
}
