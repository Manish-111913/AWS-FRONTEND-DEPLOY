// Centralized API client and configuration
import { getTenant } from './tenantContext';

// Circuit breaker and request throttling
const requestThrottler = {
  failureCount: 0,
  lastFailureTime: 0,
  isCircuitOpen: false,
  pendingRequests: new Map(),
  
  // Check if we should allow the request
  shouldAllowRequest(url) {
    const now = Date.now();
    
    // Circuit breaker logic
    if (this.isCircuitOpen) {
      const timeSinceFailure = now - this.lastFailureTime;
      // Open circuit for 30 seconds after 5 consecutive failures
      if (timeSinceFailure < 30000) {
        console.log(`Circuit breaker open - blocking request to ${url}`);
        return false;
      } else {
        // Reset circuit breaker after cooldown
        this.isCircuitOpen = false;
        this.failureCount = 0;
        console.log('Circuit breaker reset - allowing requests');
      }
    }
    
    return true;
  },
  
  // Record a successful request
  recordSuccess() {
    this.failureCount = 0;
    this.isCircuitOpen = false;
  },
  
  // Record a failed request
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= 5) {
      this.isCircuitOpen = true;
      console.warn(`Circuit breaker opened after ${this.failureCount} consecutive failures`);
    }
  },
  
  // Debounce identical requests
  getDebouncedRequest(url, options) {
    const key = `${url}:${JSON.stringify(options)}`;
    
    if (this.pendingRequests.has(key)) {
      console.log(`Debouncing duplicate request to ${url}`);
      return this.pendingRequests.get(key);
    }
    
    return null;
  },
  
  // Store pending request
  setPendingRequest(url, options, promise) {
    const key = `${url}:${JSON.stringify(options)}`;
    this.pendingRequests.set(key, promise);
    
    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
    
    return promise;
  }
};

// Normalize a base URL from env or overrides: trims, removes trailing slash, and ensures it ends with '/api'
// - If input is falsy/empty, returns undefined (so caller can apply a default)
// - If input already ends with '/api' (case-insensitive), keep as-is (without trailing slash)
// - If input contains '/api/' in the middle, leave unchanged to avoid breaking custom paths
// - Otherwise, append '/api'
function normalizeBase(input) {
  if (!input) return undefined;
  let base = String(input).trim();
  if (!base) return undefined;
  
  // Handle malformed URLs that might just be "base"
  if (base === 'base' || base.length < 8) {
    console.warn('Invalid API URL detected:', base);
    return undefined;
  }
  
  // remove trailing slashes
  base = base.replace(/\/+$/, '');
  if (/\/api$/i.test(base)) return base; // already '/api'
  if (/\/api\//i.test(base)) return base; // custom path that includes '/api/'
  return `${base}/api`;
}

// Optional: allow overriding API base via URL/localStorage
let OVERRIDE_API_BASE;
try {
  const sp = new URLSearchParams(window.location.search);
  const fromUrl = sp.get('sessionsApiBase') || sp.get('apiBase');
  if (fromUrl) {
    let norm = fromUrl.replace(/\/$/, '');
    // If targeting AWS API Gateway without a stage, default to /dev
    try {
      const u = new URL(norm);
      const isAws = /execute-api\.[^/]+\.amazonaws\.com$/i.test(u.host);
      const hasStage = /(\/dev\b|\/prod\b|\/stage\b)/i.test(u.pathname);
      if (isAws && !hasStage) norm = `${u.origin}/dev`;
    } catch(_) {}
    try { localStorage.setItem('qr.apiBaseOverride', norm); } catch(_){}
    OVERRIDE_API_BASE = normalizeBase(norm);
  } else {
    let fromLs = localStorage.getItem('qr.apiBaseOverride');
    if (fromLs) {
      // Apply same stage fix for stored value
      try {
        const u = new URL(fromLs);
        const isAws = /execute-api\.[^/]+\.amazonaws\.com$/i.test(u.host);
        const hasStage = /(\/dev\b|\/prod\b|\/stage\b)/i.test(u.pathname);
        if (isAws && !hasStage) fromLs = `${u.origin}/dev`;
      } catch(_) {}
      OVERRIDE_API_BASE = normalizeBase(fromLs);
    }
  }
} catch(_) {}

// Helper function to categorize and format errors for user display
export const categorizeError = (error) => {
  if (!error) return { type: 'unknown', message: 'An unknown error occurred', userFriendly: true };
  
  switch (error.name) {
    case 'CircuitBreakerError':
      return {
        type: 'circuit_breaker',
        message: error.message,
        userFriendly: true,
        retryAfter: error.retryAfter
      };
    
    case 'AbortError':
      return {
        type: 'cancelled',
        message: 'Request was cancelled',
        userFriendly: true,
        canRetry: true
      };
    
    case 'TimeoutError':
      return {
        type: 'timeout',
        message: 'Connection timeout - server is taking too long to respond',
        userFriendly: true,
        canRetry: true
      };
    
    default:
      if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
        return {
          type: 'connection',
          message: 'Cannot connect to server - please check if the backend is running',
          userFriendly: true,
          canRetry: true
        };
      }
      
      if (error.message && error.message.includes('fetch')) {
        return {
          type: 'network',
          message: 'Network error - please check your connection',
          userFriendly: true,
          canRetry: true
        };
      }
      
      return {
        type: 'api',
        message: error.message || 'Server error occurred',
        userFriendly: false,
        status: error.status,
        canRetry: error.status >= 500
      };
  }
};

// Default to API Gateway dev stage with /api prefix
// NOTE: If you promote to prod stage, set REACT_APP_API_URL accordingly or update the fallback.
export const API_BASE_URL = OVERRIDE_API_BASE || normalizeBase(process.env.REACT_APP_API_URL) || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/dev/api';

// Origin without the /api suffix (useful for static assets served at root)
// Safe replacement to prevent "base" errors
const calculateOrigin = (baseUrl) => {
  if (!baseUrl || typeof baseUrl !== 'string') {
    return 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/dev';
  }
  
  const result = baseUrl.replace(/\/?api$/i, '');
  
  // If the result is empty, too short, or just "base", use the fallback
  if (!result || result.length < 8 || result === 'base') {
    return 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/dev';
  }
  
  return result;
};

export const API_ORIGIN = calculateOrigin(API_BASE_URL);

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Configuration:');
  console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('  API_BASE_URL:', API_BASE_URL);
  console.log('  API_ORIGIN:', API_ORIGIN);
}

// Helper: build an absolute URL from a relative path
export const buildUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  // If an absolute URL is provided, return as-is
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL;
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  const right = path.startsWith('/') ? path : `/${path}`;
  return `${left}${right}`;
};

// Helper: append query params
export const withParams = (path, params = {}) => {
  const url = new URL(buildUrl(path));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
  });
  return url.toString();
};

// Core request with AbortController-based timeout + automatic tenant header injection
const coreRequest = async (url, { timeoutMs = 60000, signal: upstreamSignal, headers = {}, ...options } = {}) => {
  // Check circuit breaker
  if (!requestThrottler.shouldAllowRequest(url)) {
    const error = new Error('Backend server is temporarily unavailable. Please try again in a moment.');
    error.name = 'CircuitBreakerError';
    error.retryAfter = 30000; // 30 seconds
    throw error;
  }
  
  // Check for duplicate pending requests
  const existingRequest = requestThrottler.getDebouncedRequest(url, { headers, ...options });
  if (existingRequest) {
    return existingRequest;
  }
  
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort();
    else upstreamSignal.addEventListener('abort', onAbort, { once: true });
  }
  
  const requestPromise = (async () => {
    try {
      // Inject tenant header if available and not already provided
      const tenantId = getTenant?.();
      const finalHeaders = { ...(headers || {}) };
      if (tenantId && !finalHeaders['X-Tenant-Id'] && !finalHeaders['x-tenant-id']) {
        finalHeaders['X-Tenant-Id'] = String(tenantId);
      }
      
      let res;
      try {
        res = await fetch(url, { ...options, headers: finalHeaders, signal: controller.signal });
      } catch (fetchError) {
        // Handle network/connection errors specifically
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          requestThrottler.recordFailure();
          throw new Error('ERR_CONNECTION_REFUSED: Cannot connect to backend server');
        }
        throw fetchError;
      }
      
      let data = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      if (!res.ok) {
        requestThrottler.recordFailure();
        let msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        if (data && data.details) {
          const details = typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
          msg += `: ${details}`;
        }
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      
      // Record success
      requestThrottler.recordSuccess();
      return data;
    } catch (error) {
      // Handle AbortError specifically
      if (error.name === 'AbortError') {
        console.warn(`Request aborted: ${url}`);
        // Don't record this as a failure for circuit breaker - it's user-initiated
        const abortErr = new Error('Request was cancelled');
        abortErr.name = 'AbortError';
        abortErr.aborted = true;
        return null; // Return null instead of throwing to prevent uncaught promise
      }
      
      // Handle timeout errors
      if (error.message && error.message.includes('timeout')) {
        console.warn(`Request timeout: ${url}`);
        requestThrottler.recordFailure();
        const timeoutErr = new Error('timeout exceeded when trying to connect');
        timeoutErr.name = 'TimeoutError';
        timeoutErr.timeout = true;
        throw timeoutErr;
      }
      
      // Record failure for circuit breaker (except for circuit breaker errors)
      if (error.name !== 'CircuitBreakerError') {
        requestThrottler.recordFailure();
      }
      
      // Re-throw other errors
      throw error;
    } finally {
      clearTimeout(id);
      if (upstreamSignal) upstreamSignal.removeEventListener('abort', onAbort);
    }
  })();
  
  // Store the request for deduplication
  return requestThrottler.setPendingRequest(url, { headers, ...options }, requestPromise);
};

export const http = {
  request: coreRequest,
  get: (path, opts) => coreRequest(buildUrl(path), { method: 'GET', ...opts }),
  post: (path, body, opts = {}) => coreRequest(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...opts
  }),
  put: (path, body, opts = {}) => coreRequest(buildUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...opts
  }),
  patch: (path, body, opts = {}) => coreRequest(buildUrl(path), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...opts
  }),
  delete: (path, opts) => coreRequest(buildUrl(path), { method: 'DELETE', ...opts }),
  postForm: (path, formData, opts = {}) => coreRequest(buildUrl(path), {
    method: 'POST',
    body: formData,
    // Do not set Content-Type; browser will set proper boundary
    ...opts
  })
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  API_BASE_URL,
  API_ORIGIN,
  buildUrl,
  withParams,
  http,
  categorizeError
};
