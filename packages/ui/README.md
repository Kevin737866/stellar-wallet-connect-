# Wallet Selection Modal Component

A comprehensive, accessible, and feature-rich wallet selection modal for Stellar wallet connections.

## Features

### ✅ Core Functionality
- **Portal-based rendering** for proper z-index management
- **All 5 Stellar wallets supported**: Freighter, xBull, Lobstr, Albedo, Rabet
- **Real-time wallet detection** with installation status
- **Smart install links** that direct users to official wallet sources

### ✅ User Experience
- **Loading states** with animated spinners during connection
- **Error handling** with retry functionality
- **Smooth animations** and transitions
- **Click-outside-to-close** functionality
- **Escape key** support for closing modal
- **Focus management** for accessibility

### ✅ Accessibility
- **Full WCAG 2.1 AA compliance**
- **ARIA labels** and descriptions
- **Keyboard navigation** support (Tab, Enter, Space, Escape)
- **Screen reader** friendly
- **High contrast** mode support
- **Reduced motion** support

### ✅ Responsive Design
- **Mobile-first** design approach
- **Adaptive layouts** for all screen sizes
- **Touch-friendly** interactions
- **Optimized typography** for readability

### ✅ Theme Support
- **Light/Dark mode** support
- **CSS custom properties** for easy theming
- **Consistent design** across themes

## Installation

```bash
npm install @stellar-wallet-connect/ui
```

## Basic Usage

```tsx
import { WalletSelectionModal } from '@stellar-wallet-connect/ui';
import { WalletManager } from '@stellar-wallet-connect/core';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const walletManager = new WalletManager();
  const wallets = walletManager.getAvailableWallets();

  const handleWalletSelect = async (walletType: string) => {
    setConnectingWallet(walletType);
    setError(null);
    
    try {
      // Connect to wallet logic here
      await connectWallet(walletType);
      setIsOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <WalletSelectionModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onWalletSelect={handleWalletSelect}
      wallets={wallets}
      connectingWalletType={connectingWallet}
      error={error}
      darkMode={false} // Optional: enable dark mode
      title="Connect Your Wallet" // Optional: custom title
      showDescriptions={true} // Optional: show wallet descriptions
    />
  );
}
```

## Advanced Usage

### With Custom Styling

```tsx
<WalletSelectionModal
  isOpen={isOpen}
  onClose={handleClose}
  onWalletSelect={handleWalletSelect}
  wallets={wallets}
  className="my-custom-modal"
  darkMode={isDarkMode}
/>
```

### Controlled Component Pattern

```tsx
function WalletConnector() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    connectingWallet: null as string | null,
    error: null as string | null,
  });

  const handleWalletSelect = async (walletType: string) => {
    setModalState(prev => ({ ...prev, connectingWallet: walletType, error: null }));
    
    try {
      await connectWallet(walletType);
      setModalState(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      setModalState(prev => ({ ...prev, error: error.message }));
    } finally {
      setModalState(prev => ({ ...prev, connectingWallet: null }));
    }
  };

  return (
    <WalletSelectionModal
      isOpen={modalState.isOpen}
      onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      onWalletSelect={handleWalletSelect}
      wallets={wallets}
      connectingWalletType={modalState.connectingWallet}
      error={modalState.error}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Whether the modal is open |
| `onClose` | `() => void` | Required | Called when modal should close |
| `onWalletSelect` | `(walletType: WalletType) => Promise<void>` | Required | Called when wallet is selected |
| `wallets` | `WalletInfo[]` | Required | Array of available wallets |
| `connectingWalletType` | `WalletType \| null` | `null` | Currently connecting wallet |
| `error` | `string \| null` | `null` | Error message to display |
| `className` | `string` | `''` | Additional CSS classes |
| `darkMode` | `boolean` | `false` | Enable dark theme |
| `title` | `string` | `'Connect Wallet'` | Modal title |
| `showDescriptions` | `boolean` | `true` | Show wallet descriptions |

## Wallet Info Structure

```tsx
interface WalletInfo {
  type: WalletType; // 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet'
  name: string;
  icon: string; // Base64 encoded SVG or image URL
  url: string; // Official website
  downloadUrl?: string; // Direct download link
  isInstalled: boolean;
  supportsMobileDeepLink?: boolean;
  supportsWebFallback?: boolean;
}
```

## Styling

The component uses CSS Modules with the following class names:

### Main Containers
- `.modalBackdrop` - Modal overlay
- `.modal` - Modal container
- `.modalHeader` - Header section
- `.modalFooter` - Footer section

### Wallet Options
- `.walletOption` - Individual wallet item
- `.walletOptionIcon` - Wallet icon container
- `.walletOptionInfo` - Wallet information
- `.walletOptionAction` - Action buttons

### States
- `.walletOptionDisabled` - Disabled wallet state
- `.connectingSpinner` - Loading animation
- `.errorContainer` - Error display

### Dark Mode
- `.modalDark` - Dark mode modal
- `.walletOptionDark` - Dark mode wallet option
- `.errorContainerDark` - Dark mode error

## Customization

### CSS Variables

You can customize the appearance using CSS variables:

```css
:root {
  --wallet-modal-backdrop: rgba(0, 0, 0, 0.5);
  --wallet-modal-background: #ffffff;
  --wallet-modal-primary: #3b82f6;
  --wallet-modal-text: #111827;
  /* ... more variables */
}
```

### Theme Support

For dark mode, add the `[data-theme="dark"]` selector:

```css
[data-theme="dark"] {
  --wallet-modal-background: #1f2937;
  --wallet-modal-text: #f9fafb;
  /* ... dark mode variables */
}
```

## Accessibility Features

- **Keyboard Navigation**: Tab, Shift+Tab, Enter, Space, Escape
- **Screen Reader Support**: ARIA labels, descriptions, and live regions
- **Focus Management**: Proper focus trapping and restoration
- **High Contrast**: Supports high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Mobile Support

- Responsive design for all screen sizes
- Touch-optimized interactions
- Mobile wallet deep linking support
- Progressive enhancement for older browsers

## Examples

See the `/examples` directory for complete implementation examples:

- `examples/basic/` - Simple implementation
- `examples/demo-app/` - Full-featured demo

## Contributing

Please read the contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details.
