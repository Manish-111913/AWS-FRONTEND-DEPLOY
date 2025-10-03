// tenantContext.js
// Centralized tenant (business) ID management for multi-tenancy header injection.
// Strategy:
// - Prefer an explicit setter (e.g., after login or organization switch)
// - Fallback to localStorage key 'businessId'
// - Allow query param override (?tenant= or ?businessId=) for debug
// - Expose subscribe() for reactive UI pieces if needed later

const STORAGE_KEY = 'businessId';
let currentTenant = null;
const listeners = new Set();

function notify() { listeners.forEach(fn => { try { fn(currentTenant); } catch(_){} }); }

export function setTenant(id) {
  if (id === undefined || id === null || id === '') return;
  
  // For multitenant system, handle both string and number tenant IDs
  let tenantId;
  if (typeof id === 'number') {
    tenantId = String(id);
  } else {
    tenantId = String(id).trim();
  }
  
  if (!tenantId) return;
  
  currentTenant = tenantId;
  try { localStorage.setItem(STORAGE_KEY, tenantId); } catch(_) {}
  notify();
}

export function getTenant() {
  if (currentTenant) return currentTenant;
  
  // For development, always default to tenant '1' if no tenant is set
  if (process.env.NODE_ENV === 'development' || !process.env.REACT_APP_TENANT_ID) {
    currentTenant = '1'; // Use legacy string ID that should exist in multitenant setup
    return currentTenant;
  }
  
  // URL param override (useful for deep link testing)
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('tenant') || params.get('businessId');
    if (qp) {
      const parsed = qp.toString(); // Keep as string for multitenant system
      if (parsed) {
        currentTenant = parsed;
        return currentTenant;
      }
    }
  } catch(_) {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // For multitenant system, use stored value as string
      currentTenant = stored;
      return currentTenant;
    }
  } catch(_) {}
  
  // Fallback to default tenant for development
  return '1';
}

export function clearTenant() {
  currentTenant = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch(_) {}
  notify();
}

export function subscribe(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Initialize from storage immediately
getTenant();

export default { setTenant, getTenant, clearTenant, subscribe };
