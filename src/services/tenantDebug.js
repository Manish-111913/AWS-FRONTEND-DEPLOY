// Debug helper to check tenant context
export function debugTenantContext() {
    const tenant = localStorage.getItem('businessId');
    const envTenant = process.env.REACT_APP_TENANT_ID;
    
    console.log('🔍 TENANT CONTEXT DEBUG:');
    console.log('  localStorage businessId:', tenant);
    console.log('  process.env.REACT_APP_TENANT_ID:', envTenant);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    
    // Force set tenant for development
    if (!tenant) {
        localStorage.setItem('businessId', '1');
        console.log('  ✅ Set tenant to "1" in localStorage');
    }
    
    return tenant || '1';
}

// Clear all cached data and reset tenant
export function resetTenantCache() {
    // Clear tenant cache
    localStorage.removeItem('businessId');
    
    // Clear API cache if any
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                if (name.includes('api')) {
                    caches.delete(name);
                }
            });
        });
    }
    
    // Set default tenant
    localStorage.setItem('businessId', '1');
    
    console.log('🔄 Tenant cache reset, set to tenant "1"');
    
    // Force page reload to pick up changes
    window.location.reload();
}

// Add this to window for easy debugging
if (typeof window !== 'undefined') {
    window.debugTenantContext = debugTenantContext;
    window.resetTenantCache = resetTenantCache;
}