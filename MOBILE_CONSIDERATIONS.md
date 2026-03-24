# Mobile Wallet Integration Considerations

This document outlines mobile-specific considerations and best practices for integrating with xBull and Lobstr wallets on mobile devices.

## Overview

The enhanced wallet adapters now support multiple connection methods:
- **Browser Extension**: Desktop browser extensions
- **Mobile Deep Linking**: Native mobile apps via URL schemes
- **Web Fallback**: Web-based wallet interfaces

## xBull Mobile Integration

### Deep Link Scheme
- **Scheme**: `xbull://`
- **Actions**: `connect`, `signTransaction`, `getPublicKey`, `getNetwork`

### Mobile Detection
```typescript
// xBull automatically detects mobile vs desktop
const adapter = new XbullAdapter();
if (adapter.isInstalled()) {
  // Will use mobile wallet connect if available
  await adapter.connect();
}
```

### Setup Requirements
1. Install xBull mobile app from App Store/Play Store
2. Ensure app is properly configured to handle deep links
3. Configure callback URLs in your application

### iOS Considerations
- Uses Universal Links for better user experience
- Requires iOS 9.0+
- Deep links open in xBull app if installed

### Android Considerations
- Uses App Links for better user experience
- Requires Android 6.0+
- Deep links open in xBull app if installed

## Lobstr Mobile Integration

### Deep Link Scheme
- **Scheme**: `lobstr://`
- **Actions**: `connect`, `signTransaction`, `getPublicKey`, `getNetwork`

### Mobile Detection
```typescript
const adapter = new LobstrAdapter();
if (adapter.isMobile()) {
  // Automatically uses mobile deep linking
  const account = await adapter.connect();
}
```

### Setup Requirements
1. Install Lobstr mobile app from App Store/Play Store
2. Configure deep link handling in your app
3. Set up proper callback URL handling

### iOS Implementation
```typescript
// iOS-specific deep link handling
const deepLink = `lobstr://connect?callback_url=${encodeURIComponent(window.location.href)}&network=public`;
window.location.href = deepLink;

// Listen for response
window.addEventListener('message', (event) => {
  if (event.data.type === 'LOBSTR_DEEP_LINK_RESPONSE') {
    handleResponse(event.data.payload);
  }
});
```

### Android Implementation
```typescript
// Android-specific deep link handling
const deepLink = `lobstr://connect?callback_url=${encodeURIComponent(window.location.href)}&network=public`;
window.location.href = deepLink;

// Similar response handling as iOS
```

## Web Fallback

### When to Use
- Desktop browsers without extension
- Unsupported mobile browsers
- Fallback when deep linking fails

### Lobstr Web Fallback
```typescript
// Automatically falls back to web interface
const adapter = new LobstrAdapter();
if (!adapter.isInstalled()) {
  // Will attempt web fallback if available
  try {
    await adapter.connect();
  } catch (error) {
    // Handle web fallback failure
  }
}
```

## Error Handling

### Mobile-Specific Errors
- `DEEP_LINK_TIMEOUT`: Deep link response timeout
- `DEEP_LINK_UNSUPPORTED`: Platform doesn't support deep linking
- `MOBILE_CONNECT_FAILED`: Mobile connection failed
- `WEB_FALLBACK_FAILED`: Web fallback failed

### Best Practices
```typescript
try {
  const account = await adapter.connect();
} catch (error) {
  if (error.code === WalletErrorCode.DEEP_LINK_TIMEOUT) {
    // Handle timeout - prompt user to try again
  } else if (error.code === WalletErrorCode.WALLET_NOT_INSTALLED) {
    // Redirect to app store
    window.location.href = adapter.downloadUrl;
  }
}
```

## Security Considerations

### Deep Link Security
1. **Validate Callback URLs**: Always validate callback URLs
2. **Use HTTPS**: Ensure callback URLs use HTTPS
3. **Verify Origin**: Check message origin in response handling
4. **Timeout Handling**: Implement reasonable timeouts for deep link responses

### Code Example
```typescript
// Secure deep link response handling
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  
  if (event.data.type === 'LOBSTR_DEEP_LINK_RESPONSE') {
    const response = event.data.payload;
    
    // Validate response structure
    if (response.publicKey && response.success) {
      // Process valid response
    }
  }
});
```

## Testing

### Mobile Testing
1. **Real Devices**: Test on actual iOS/Android devices
2. **Simulators**: Test in iOS Simulator and Android Emulator
3. **Deep Link Testing**: Verify deep links open correct app
4. **Response Handling**: Test response handling and timeouts

### Browser Testing
1. **Extension Testing**: Test with browser extensions
2. **Web Fallback**: Test web fallback functionality
3. **Error Scenarios**: Test various error conditions

## Performance Considerations

### Deep Link Performance
- **Timeout Duration**: Use 30-second timeout for deep links
- **Retry Logic**: Implement retry mechanism for failed deep links
- **User Feedback**: Provide clear loading indicators

### Memory Management
- **Event Cleanup**: Properly clean up event listeners
- **Promise Management**: Cancel pending promises on component unmount
- **Resource Cleanup**: Clean up resources when done

## User Experience

### Loading States
```typescript
// Show loading indicator during deep link operations
const [loading, setLoading] = useState(false);

const connect = async () => {
  setLoading(true);
  try {
    const account = await adapter.connect();
    // Handle success
  } finally {
    setLoading(false);
  }
};
```

### Error Messages
- Provide clear, actionable error messages
- Include download links for wallet apps
- Offer retry options for temporary failures

### Progressive Enhancement
1. **Detect Capabilities**: Check available connection methods
2. **Graceful Degradation**: Fall back to web when mobile fails
3. **User Choice**: Allow users to choose connection method

## Platform-Specific Notes

### iOS
- **Universal Links**: Prefer Universal Links over custom schemes
- **App Store**: Deep link to App Store if app not installed
- **Safari**: Test thoroughly in Safari browser

### Android
- **App Links**: Use App Links for better integration
- **Play Store**: Deep link to Play Store if app not installed
- **Chrome**: Test in Chrome browser

### Cross-Platform
- **Consistent UX**: Maintain consistent user experience
- **Error Handling**: Handle platform-specific errors
- **Performance**: Optimize for mobile performance

## Troubleshooting

### Common Issues
1. **Deep Links Not Working**: Check app installation and URL scheme registration
2. **Timeout Errors**: Increase timeout duration or check network connectivity
3. **Response Handling**: Verify message event listeners are properly set up
4. **Browser Compatibility**: Test in target mobile browsers

### Debug Tools
- **Mobile DevTools**: Use browser developer tools on mobile
- **Network Monitoring**: Monitor network requests and responses
- **Console Logging**: Add comprehensive logging for debugging

## Future Enhancements

### Planned Features
1. **Biometric Authentication**: Support for biometric authentication
2. **Multi-Account Support**: Handle multiple wallet accounts
3. **Transaction History**: Access to transaction history
4. **Push Notifications**: Transaction status notifications

### API Evolution
- Stay updated with wallet API changes
- Maintain backward compatibility
- Implement new features as they become available
