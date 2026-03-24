import {
    createContext,
    useReducer,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    type ReactNode,
} from 'react';

export type WalletType = 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet';
export type Network = 'public' | 'testnet';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnecting';

export interface WalletAccount {
    publicKey: string;
    network: Network;
}

export interface WalletState {
    status: ConnectionStatus;
    walletId: WalletType | null;
    account: WalletAccount | null;
    error: string | null;
}

export interface WalletAdapter {
    isInstalled(): boolean;
    connect(): Promise<WalletAccount>;
    disconnect(): Promise<void>;
    getPublicKey(): Promise<string>;
    getNetwork(): Promise<Network>;
    signTransaction(xdr: string, network?: Network): Promise<string>;
    onAccountChanged?: (callback: (account: WalletAccount | null) => void) => () => void;
    onNetworkChanged?: (callback: (network: Network) => void) => () => void;
}

export interface WalletContextValue {
    state: WalletState;
    connect: (walletId: WalletType) => Promise<void>;
    disconnect: () => Promise<void>;
    signTransaction: (xdr: string) => Promise<string>;
    resetError: () => void;
    isConnected: boolean;
}

const LS_KEY = 'stellar-wallet-connect';
const DEBOUNCE_MS = 300;

export interface WalletProviderProps {
    children: ReactNode;
    adapters: Partial<Record<WalletType, WalletAdapter>>;
    autoReconnect?: boolean;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

type Action =
    | { type: 'CONNECT_START'; walletId: WalletType }
    | { type: 'CONNECT_SUCCESS'; account: WalletAccount; walletId: WalletType }
    | { type: 'CONNECT_FAILURE'; error: string }
    | { type: 'DISCONNECT_START' }
    | { type: 'DISCONNECT_SUCCESS' }
    | { type: 'ACCOUNT_CHANGED'; publicKey: string }
    | { type: 'NETWORK_CHANGED'; network: Network }
    | { type: 'RESET_ERROR' };

const initialState: WalletState = {
    status: 'idle',
    walletId: null,
    account: null,
    error: null,
};

function reducer(state: WalletState, action: Action): WalletState {
    switch (action.type) {
        case 'CONNECT_START':
            return { ...state, status: 'connecting', walletId: action.walletId, error: null };
        case 'CONNECT_SUCCESS':
            return { status: 'connected', walletId: action.walletId, account: action.account, error: null };
        case 'CONNECT_FAILURE':
            return { ...state, status: 'error', error: action.error };
        case 'DISCONNECT_START':
            return { ...state, status: 'disconnecting' };
        case 'DISCONNECT_SUCCESS':
            return { ...initialState };
        case 'ACCOUNT_CHANGED':
            return state.account ? { ...state, account: { ...state.account, publicKey: action.publicKey } } : state;
        case 'NETWORK_CHANGED':
            return state.account ? { ...state, account: { ...state.account, network: action.network } } : state;
        case 'RESET_ERROR':
            return { ...state, status: 'idle', error: null };
        default:
            return state;
    }
}

export function WalletProvider({ children, adapters, autoReconnect = true }: WalletProviderProps) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const adapterRef = useRef<WalletAdapter | null>(null);
    const unsubs = useRef<(() => void)[]>([]);
    const timers = useRef<{ acc?: any; net?: any }>({});

    const detach = useCallback(() => {
        unsubs.current.forEach(u => u());
        unsubs.current = [];
        if (timers.current.acc) clearTimeout(timers.current.acc);
        if (timers.current.net) clearTimeout(timers.current.net);
    }, []);

    const attach = useCallback((adapter: WalletAdapter, handleDisconnect: () => void) => {
        detach();
        if (adapter.onAccountChanged) {
            unsubs.current.push(
                adapter.onAccountChanged((account) => {
                    clearTimeout(timers.current.acc);
                    timers.current.acc = setTimeout(() => {
                        if (account?.publicKey) dispatch({ type: 'ACCOUNT_CHANGED', publicKey: account.publicKey });
                        else void handleDisconnect();
                    }, DEBOUNCE_MS);
                })
            );
        }
        if (adapter.onNetworkChanged) {
            unsubs.current.push(
                adapter.onNetworkChanged((net) => {
                    clearTimeout(timers.current.net);
                    timers.current.net = setTimeout(() => dispatch({ type: 'NETWORK_CHANGED', network: net }), DEBOUNCE_MS);
                })
            );
        }
    }, [detach]);

    const connect = useCallback(async (id: WalletType) => {
        dispatch({ type: 'CONNECT_START', walletId: id });
        const adp = adapters[id];
        if (!adp?.isInstalled()) {
            dispatch({ type: 'CONNECT_FAILURE', error: `${id} not installed` });
            return;
        }
        try {
            const acc = await adp.connect();
            adapterRef.current = adp;
            attach(adp, () => {
                void disconnect();
            });
            localStorage.setItem(LS_KEY, JSON.stringify({ walletId: id }));
            dispatch({ type: 'CONNECT_SUCCESS', walletId: id, account: acc });
        } catch (e: unknown) {
            dispatch({ type: 'CONNECT_FAILURE', error: e instanceof Error ? e.message : 'Failed to connect wallet' });
        }
    }, [adapters, attach]);

    const disconnect = useCallback(async () => {
        dispatch({ type: 'DISCONNECT_START' });
        detach();
        if (adapterRef.current) await adapterRef.current.disconnect().catch(() => { });
        adapterRef.current = null;
        localStorage.removeItem(LS_KEY);
        dispatch({ type: 'DISCONNECT_SUCCESS' });
    }, [detach]);

    useEffect(() => {
        if (!autoReconnect) return;

        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as { walletId?: WalletType };
            if (parsed.walletId && adapters[parsed.walletId]) {
                void connect(parsed.walletId);
            }
        } catch {
            localStorage.removeItem(LS_KEY);
        }
    }, [adapters, autoReconnect, connect]);

    useEffect(() => () => {
        detach();
    }, [detach]);

    const value = useMemo(() => ({
        state,
        connect,
        disconnect,
        resetError: () => dispatch({ type: 'RESET_ERROR' }),
        signTransaction: async (xdr: string) => {
            if (!adapterRef.current) throw new Error('No wallet connected');
            return adapterRef.current.signTransaction(xdr, state.account?.network);
        },
        isConnected: state.status === 'connected',
    }), [state, connect, disconnect]);

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
