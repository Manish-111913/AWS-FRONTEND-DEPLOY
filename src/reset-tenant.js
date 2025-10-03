// Clear tenant cache and set proper tenant for development
// This script should be run in browser console or added to the app temporarily

import { setTenant } from './services/tenantContext.js';

// Clear any cached tenant data
localStorage.removeItem('businessId');

// Set the demo tenant 
setTenant('demo-tenant-1');

console.log('✅ Tenant context reset to demo-tenant-1');

// You can also run this in browser console:
// localStorage.removeItem('businessId');
// localStorage.setItem('businessId', 'demo-tenant-1');
// location.reload();