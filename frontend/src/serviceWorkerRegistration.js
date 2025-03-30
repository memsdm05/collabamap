export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Use a relative path and include scope
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);
          
          // Add update handling
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('New service worker activated');
              }
            });
          });
        })
        .catch(err => {
          console.error('ServiceWorker registration failed:', err);
        });
    });
  }
}

// Add this function to handle service worker updates
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
} 