import React, { useState, useEffect } from 'react';
import { useWallet } from '@stellar-wallet-connect/react';
import { WalletManager, WalletInfo } from '@stellar-wallet-connect/core';
import { WalletSelectionModal } from './WalletSelectionModal';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function WalletModal({ isOpen, onClose, className = '' }: WalletModalProps) {
  const { state, connect } = useWallet();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [connectingWalletType, setConnectingWalletType] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Get available wallets from the wallet manager
      const walletManager = new WalletManager();
      const availableWallets = walletManager.getAvailableWallets();
      setWallets(availableWallets);
    }
  }, [isOpen]);

  const handleWalletSelect = async (walletType: string) => {
    setConnectingWalletType(walletType);
    try {
      await connect(walletType as any);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnectingWalletType(null);
    }
  };

  return (
    <WalletSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onWalletSelect={handleWalletSelect}
      wallets={wallets}
      connectingWalletType={connectingWalletType}
      error={state.error}
      className={className}
    />
  );
}

interface WalletButtonProps {
  onOpen: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function WalletButton({ onOpen, className = '', children }: WalletButtonProps) {
  const { state } = useWallet();

  if (state.isConnected && state.account) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-sm">
          <div className="font-medium">Connected</div>
          <div className="text-gray-500">
            {state.account.publicKey.slice(0, 4)}...{state.account.publicKey.slice(-4)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${className}`}
    >
      {children || 'Connect Wallet'}
    </button>
  );
}
