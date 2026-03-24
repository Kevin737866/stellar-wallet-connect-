/**
 * context.tsx
 *
 * Re-exports the WalletContext and all associated types that were previously
 * defined here. The canonical implementations now live in WalletProvider.tsx.
 *
 * This file exists for backward-compatibility with any imports that reference
 * `../src/context` directly.
 */

export {
    WalletContext,
    WalletProvider,
} from './WalletProvider';

export type {
    WalletType,
    Network,
    ConnectionStatus,
    WalletAccount,
    WalletAdapter,
    WalletState,
    WalletContextValue,
} from './WalletProvider';
