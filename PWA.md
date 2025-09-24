# GymFlow PWA Documentation

## Overview
GymFlow is now a fully functional Progressive Web App (PWA) with offline support, installability, and runtime caching capabilities.

## Features
- **Installable**: Users can install the app on their device home screen
- **Offline Support**: Static pages work offline, with a custom offline page for unavailable content
- **Update Notifications**: Users are prompted when app updates are available
- **Runtime Caching**: API responses and images are cached for better performance

## Testing the PWA

### Install Prompt
1. Open the app in Chrome/Edge on desktop or mobile
2. Look for the install banner that appears automatically
3. Or check Chrome's address bar for the install icon
4. Click "Install" to add the app to your device

### Offline Mode Testing
1. Open Chrome DevTools → Network tab
2. Check "Offline" checkbox
3. Navigate to previously visited pages (should load from cache)
4. Try visiting new pages (should show offline.html)
5. Refresh the page to test service worker cache

### Update Testing
1. Make changes to the app and rebuild
2. The update prompt should appear automatically
3. Click "Update" to install the new version
4. The app will reload with the latest changes

## Service Worker Management

### Updating the Service Worker
The service worker automatically updates when you deploy new versions. Users will see an update prompt when:
- New content is available
- The service worker detects changes
- Cache strategies have been modified

### Manual Service Worker Update
```javascript
// Force update the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.update();
    });
  });
}
```

## Cache Configuration

### Current Cache Strategies

#### API Cache (StaleWhileRevalidate)
- **Pattern**: Supabase API calls
- **Strategy**: Serves from cache immediately, updates cache in background
- **Max Entries**: 50
- **Max Age**: 60 seconds

#### Image Cache (CacheFirst)
- **Pattern**: All image requests
- **Strategy**: Serves from cache first, only fetches if not cached
- **Max Entries**: 60
- **Max Age**: 30 days (2,592,000 seconds)

### Adding New Cache Rules

To add new caching strategies, edit `vite.config.ts`:

```javascript
workbox: {
  runtimeCaching: [
    // Existing rules...
    {
      urlPattern: /^https:\/\/your-new-api\.com\/.*$/,
      handler: 'NetworkFirst', // or 'CacheFirst', 'StaleWhileRevalidate'
      options: {
        cacheName: 'new-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 300
        }
      }
    }
  ]
}
```

### Available Cache Strategies
- **NetworkFirst**: Try network first, fallback to cache
- **CacheFirst**: Try cache first, fallback to network
- **StaleWhileRevalidate**: Serve from cache, update cache in background
- **NetworkOnly**: Always use network
- **CacheOnly**: Always use cache

## Lighthouse PWA Audit

The app should pass all PWA requirements:
- ✅ Web App Manifest
- ✅ Service Worker
- ✅ Offline functionality
- ✅ Installable
- ✅ Themed (theme-color meta tag)
- ✅ Maskable icon
- ✅ Proper icon sizes

## Configuration Files

### Manifest (`public/manifest.webmanifest`)
Controls app metadata, icons, and display behavior when installed.

### Service Worker Configuration (`vite.config.ts`)
Manages caching strategies, offline behavior, and update mechanisms.

### Icons
Located in `public/icons/`:
- `icon-192.png` - Standard icon
- `icon-512.png` - High-resolution icon
- `maskable-icon-512.png` - Adaptive icon for various device shapes

## Troubleshooting

### PWA Not Installing
- Check that the app is served over HTTPS (or localhost)
- Verify manifest.webmanifest is accessible
- Ensure all required manifest fields are present
- Check Chrome DevTools → Application → Manifest for errors

### Offline Mode Not Working
- Verify service worker is registered (DevTools → Application → Service Workers)
- Check cache storage (DevTools → Application → Storage)
- Ensure pages are cached after first visit
- Test with DevTools Network tab set to "Offline"

### Updates Not Showing
- Service worker updates require code changes
- Check service worker registration in DevTools
- Verify update prompt component is included in the app
- Test with hard refresh (Ctrl+Shift+R) to bypass cache

## Best Practices

1. **Test on Multiple Devices**: PWA behavior can vary between browsers and platforms
2. **Monitor Cache Size**: Large caches can impact device storage
3. **Update Frequently**: Regular updates keep the app secure and performant
4. **Test Offline Scenarios**: Ensure critical features work without internet
5. **Optimize Assets**: Smaller assets cache faster and take less storage

## Browser Support
- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ✅ Firefox (partial support, no install prompt)
- ✅ Safari (partial support, iOS 11.3+)
- ✅ Samsung Internet (full support)
