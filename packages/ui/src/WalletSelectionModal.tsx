import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WalletInfo, WalletType } from '@stellar-wallet-connect/core';
import styles from './WalletSelectionModal.module.css';

// Wallet descriptions for user guidance
const getWalletDescription = (walletType: WalletType): string => {
  const descriptions = {
    freighter: 'Popular browser extension for Stellar with simple interface',
    xbull: 'Advanced wallet with multi-device support and enhanced security',
    lobstr: 'User-friendly mobile wallet with built-in exchange features',
    albedo: 'Web-based wallet requiring no installation - connect instantly',
    rabet: 'Lightweight browser extension focused on security and speed',
  };
  return descriptions[walletType] || 'Connect your Stellar wallet';
};

interface WalletSelectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal is closed */
  onClose: () => void;
  /** Called when a wallet is selected */
  onWalletSelect: (walletType: WalletType) => Promise<void>;
  /** List of available wallets */
  wallets: WalletInfo[];
  /** Currently connecting wallet type */
  connectingWalletType?: WalletType | null;
  /** Error message to display */
  error?: string | null;
  /** Custom className for additional styling */
  className?: string;
  /** Enable dark mode */
  darkMode?: boolean;
  /** Modal title */
  title?: string;
  /** Show wallet descriptions */
  showDescriptions?: boolean;
}

interface WalletOptionProps {
  wallet: WalletInfo;
  isConnecting: boolean;
  onSelect: () => void;
  darkMode?: boolean;
}

const WalletOption: React.FC<WalletOptionProps> = ({ 
  wallet, 
  isConnecting, 
  onSelect, 
  darkMode = false 
}) => {
  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const installUrl = wallet.downloadUrl || wallet.url;
    window.open(installUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`${styles.walletOption} ${!wallet.isInstalled ? styles.walletOptionDisabled : ''} ${darkMode ? styles.walletOptionDark : ''}`}
      role="button"
      tabIndex={wallet.isInstalled ? 0 : -1}
      onClick={wallet.isInstalled ? onSelect : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (wallet.isInstalled) {
            onSelect();
          }
        }
      }}
      aria-label={`${wallet.name} ${wallet.isInstalled ? 'Connect' : 'Not installed'}`}
      aria-disabled={!wallet.isInstalled}
    >
      <div className={styles.walletOptionIcon}>
        <img 
          src={wallet.icon} 
          alt={`${wallet.name} icon`}
          className={styles.walletIcon}
          onError={(e) => {
            // Fallback for broken images
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove(styles.hidden);
          }}
        />
        <div className={`${styles.walletIconFallback} ${styles.hidden}`}>
          {wallet.name.charAt(0)}
        </div>
      </div>
      
      <div className={styles.walletOptionInfo}>
        <div className={styles.walletOptionName}>
          {wallet.name}
        </div>
        <div className={styles.walletOptionStatus}>
          {wallet.isInstalled ? (
            <span className={styles.statusInstalled}>✓ Installed</span>
          ) : (
            <span className={styles.statusNotInstalled}>Not installed</span>
          )}
        </div>
        {showDescriptions && (
          <div className={styles.walletOptionDescription}>
            {getWalletDescription(wallet.type)}
          </div>
        )}
      </div>

      <div className={styles.walletOptionAction}>
        {isConnecting ? (
          <div className={styles.connectingSpinner}>
            <div className={styles.spinner} />
            <span>Connecting...</span>
          </div>
        ) : wallet.isInstalled ? (
          <button 
            className={styles.connectButton}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            aria-label={`Connect to ${wallet.name}`}
          >
            Connect
          </button>
        ) : (
          <button 
            className={styles.installButton}
            onClick={handleInstallClick}
            aria-label={`Install ${wallet.name}`}
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
};

export const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  isOpen,
  onClose,
  onWalletSelect,
  wallets,
  connectingWalletType = null,
  error = null,
  className = '',
  darkMode = false,
  title = 'Connect Wallet',
  showDescriptions = true,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      handleClose();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, []);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose, isClosing]);

  // Handle wallet selection
  const handleWalletSelect = useCallback(async (walletType: WalletType) => {
    try {
      await onWalletSelect(walletType);
    } catch (error) {
      // Error is handled by parent component
      console.error('Failed to connect wallet:', error);
    }
  }, [onWalletSelect]);

  // Handle retry with clear error state
  const handleRetry = useCallback(() => {
    // Clear error and let parent handle retry
    if (error) {
      onWalletSelect(connectingWalletType || 'freighter'); // Retry last attempted wallet
    }
  }, [error, connectingWalletType, onWalletSelect]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus modal after a short delay to ensure it's rendered
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  // Filter wallets based on search query
  const filteredWallets = wallets.filter(wallet => 
    wallet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getWalletDescription(wallet.type).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalContent = (
    <div 
      className={`${styles.modalBackdrop} ${isClosing ? styles.modalBackdropClosing : ''} ${darkMode ? styles.modalBackdropDark : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      aria-describedby="wallet-modal-description"
    >
      <div 
        ref={modalRef}
        className={`${styles.modal} ${isClosing ? styles.modalClosing : ''} ${darkMode ? styles.modalDark : ''} ${className}`}
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h2 id="wallet-modal-title" className={styles.modalTitle}>
            {title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${styles.searchInput} ${darkMode ? styles.searchInputDark : ''}`}
            aria-label="Search wallets"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchButton}
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Modal Description */}
        {showDescriptions && (
          <p id="wallet-modal-description" className={styles.modalDescription}>
            Choose your Stellar wallet to connect to this application
          </p>
        )}

        {/* Error Display */}
        {error && (
          <div className={`${styles.errorContainer} ${darkMode ? styles.errorContainerDark : ''}`}>
            <div className={styles.errorIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className={styles.errorContent}>
              <div className={styles.errorTitle}>Connection Failed</div>
              <div className={styles.errorMessage}>{error}</div>
            </div>
            <button 
              className={styles.retryButton}
              onClick={handleRetry}
              aria-label="Retry connection"
            >
              Retry
            </button>
          </div>
        )}

        {/* Wallet List */}
        <div className={styles.walletList}>
          {filteredWallets.map((wallet) => (
            <WalletOption
              key={wallet.type}
              wallet={wallet}
              isConnecting={connectingWalletType === wallet.type}
              onSelect={() => handleWalletSelect(wallet.type)}
              darkMode={darkMode}
            />
          ))}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerText}>
            {wallets.filter(w => w.isInstalled).length === 0 && (
              <span className={styles.noWalletsMessage}>
                No wallets detected. Install a wallet to get started.
              </span>
            )}
          </div>
          <div className={styles.footerLinks}>
            <a 
              href="https://github.com/stellar/stellar-protocol" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              About Stellar
            </a>
            <a 
              href="https://stellar.org/learn" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal for proper z-index management
  return createPortal(modalContent, document.body);
};

export default WalletSelectionModal;
