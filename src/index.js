import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setTenant, getTenant } from './services/tenantContext';

// Bootstrap tenant (multi-tenancy) when no login flow exists yet.
// Priority: existing stored tenant -> REACT_APP_DEFAULT_TENANT_ID env -> none
try {
  if (!getTenant()) {
    const envDefault = process.env.REACT_APP_DEFAULT_TENANT_ID;
    if (envDefault) {
      const parsed = parseInt(envDefault, 10);
      if (Number.isFinite(parsed)) setTenant(parsed);
    }
  }
} catch (_) {}

// Suppress ResizeObserver errors globally
const resizeObserverErr = (e) => {
  if (e.message && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErrDiv) {
      resizeObserverErrDiv.style.display = 'none';
    }
    e.stopImmediatePropagation();
  }
};
window.addEventListener('error', resizeObserverErr);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
