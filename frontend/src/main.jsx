import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from "./App"
import { register, unregister } from './serviceWorkerRegistration'

// Create a fallback div for error messages
const createErrorMessage = (message) => {
  const div = document.createElement('div');
  div.style.padding = '20px';
  div.style.textAlign = 'center';
  div.innerHTML = `
    <h1 style="color: #666;">Loading Error</h1>
    <p style="color: #666;">${message}</p>
    <button onclick="window.location.reload()" style="padding: 10px; margin-top: 10px; background: #4F46E5; color: white; border: none; border-radius: 4px;">
      Reload Page
    </button>
  `;
  return div;
};

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  // Register service worker
  register();
} catch (error) {
  console.error('Application failed to start:', error);
  // Unregister the service worker in case it's causing issues
  unregister();
  // Show error message to user
  document.body.appendChild(
    createErrorMessage('The application failed to load. Please check your connection and try again.')
  );
}