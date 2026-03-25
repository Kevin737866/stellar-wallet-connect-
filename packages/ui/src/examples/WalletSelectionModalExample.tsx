import React from 'react';
import { WalletSelectionModal } from '../WalletSelectionModal';
import { WalletInfo, WalletType } from '@stellar-wallet-connect/core';

// Mock wallet data for testing
const mockWallets: WalletInfo[] = [
  {
    type: 'freighter',
    name: 'Freighter',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY3NjJEMCIvPgo8cGF0aCBkPSJNMjAgMTJMMjYgMjBIMjBMMjAgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    url: 'https://www.freighter.app',
    downloadUrl: 'https://www.freighter.app/download',
    isInstalled: true,
  },
  {
    type: 'xbull',
    name: 'xBull',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0ZGNkIzUiLz4KPHBhdGggZD0iTTEwIDIwTDIwIDEwTDMwIDIwTDIwIDMwTDEwIDIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    url: 'https://xbull.app',
    downloadUrl: 'https://chrome.google.com/webstore/detail/xbull-wallet/jfbapfmkmnpdjobgmljepjnpfoabobbf',
    isInstalled: false,
  },
  {
    type: 'lobstr',
    name: 'Lobstr',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwQjQ1QiIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    url: 'https://lobstr.co',
    downloadUrl: 'https://lobstr.co/download',
    isInstalled: false,
  },
  {
    type: 'albedo',
    name: 'Albedo',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY2NjZGRiIvPgo8cGF0aCBkPSJNMjAgOEwzMjAyMEwyMCAzMjhMOiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    url: 'https://albedo.link',
    isInstalled: true, // Albedo is web-based
  },
  {
    type: 'rabet',
    name: 'Rabet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y1OTUwQiIvPgo8cGF0aCBkPSJNMTAgMTBIMzBWMzBIMTBWMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    url: 'https://rabet.io',
    downloadUrl: 'https://chrome.google.com/webstore/detail/rabet-wallet/dmkapckfbcgbkdjpempkeliobhfcgbd',
    isInstalled: false,
  },
];

export const WalletSelectionModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [connectingWallet, setConnectingWallet] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleWalletSelect = async (walletType: WalletType) => {
    setConnectingWallet(walletType);
    setError(null);
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random error for testing
      if (Math.random() > 0.7) {
        throw new Error(`Failed to connect to ${walletType}`);
      }
      
      console.log(`Connected to ${walletType}`);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Wallet Selection Modal Example</h2>
      
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Open Wallet Modal
      </button>

      <WalletSelectionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onWalletSelect={handleWalletSelect}
        wallets={mockWallets}
        connectingWalletType={connectingWallet}
        error={error}
        title="Connect Your Stellar Wallet"
        showDescriptions={true}
      />

      {connectingWallet && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
          Connecting to {connectingWallet}...
        </div>
      )}

      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default WalletSelectionModalExample;
