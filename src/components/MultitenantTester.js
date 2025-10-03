import React, { useState, useEffect } from 'react';
import './MultitenantTester.css';
import { API_ORIGIN } from '../services/apiClient';

const MultitenantTester = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenantQRCodes, setTenantQRCodes] = useState([]);
    const [systemInfo, setSystemInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // New tenant creation form
    const [newTenant, setNewTenant] = useState({
        name: '',
        strategy: 'shared_schema',
        settings: {
            cuisine: '',
            tables: 10,
            currency: 'USD',
            timezone: 'UTC',
            language: 'en'
        }
    });

    const API_BASE = process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api';

    // Load system information and tenants
    useEffect(() => {
        loadSystemInfo();
        loadTenants();
    }, []);

    const loadSystemInfo = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/multitenant/info`);
            if (response.ok) {
                const data = await response.json();
                setSystemInfo(data);
            }
        } catch (error) {
            console.error('Failed to load system info:', error);
        }
    };

    const loadTenants = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/admin/tenants`);
            if (response.ok) {
                const data = await response.json();
                setTenants(data.tenants || []);
            } else {
                setError('Failed to load tenants');
            }
        } catch (error) {
            setError('Error connecting to server: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const createTenant = async () => {
        if (!newTenant.name.trim()) {
            setError('Tenant name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await fetch(`${API_BASE}/api/admin/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTenant)
            });

            if (response.ok) {
                const data = await response.json();
                setSuccess(`Tenant "${data.name}" created successfully!`);
                setNewTenant({
                    name: '',
                    strategy: 'shared_schema',
                    settings: { cuisine: '', tables: 10, currency: 'USD', timezone: 'UTC', language: 'en' }
                });
                loadTenants(); // Refresh tenant list
            } else {
                const error = await response.json();
                setError(error.error || 'Failed to create tenant');
            }
        } catch (error) {
            setError('Error creating tenant: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const selectTenant = async (tenant) => {
        setSelectedTenant(tenant);
        setTenantQRCodes([]);
        setError('');
        
        // Load QR codes for this tenant
        try {
            const response = await fetch(`${API_BASE}/api/qr/list`, {
                headers: {
                    'X-Tenant-ID': tenant.tenant_id,
                    'X-API-Key': tenant.api_key,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTenantQRCodes(data || []);
            } else {
                setError(`Failed to load QR codes for ${tenant.name}`);
            }
        } catch (error) {
            setError('Error loading QR codes: ' + error.message);
        }
    };

    const createQRCodesForTenant = async (tenant, tableCount = 5) => {
        if (!tenant) return;

        try {
            setLoading(true);
            setError('');

            // Create QR codes for the tenant
            const promises = [];
            for (let table = 1; table <= tableCount; table++) {
                const qrData = {
                    table_number: table,
                    restaurant_name: tenant.name
                };

                promises.push(
                    fetch(`${API_BASE}/api/qr/generate`, {
                        method: 'POST',
                        headers: {
                            'X-Tenant-ID': tenant.tenant_id,
                            'X-API-Key': tenant.api_key,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(qrData)
                    })
                );
            }

            const results = await Promise.all(promises);
            const successful = results.filter(r => r.ok).length;
            
            if (successful > 0) {
                setSuccess(`Created ${successful} QR codes for ${tenant.name}`);
                selectTenant(tenant); // Refresh QR codes
            } else {
                setError('Failed to create QR codes');
            }
        } catch (error) {
            setError('Error creating QR codes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const testTenantIsolation = async () => {
        if (tenants.length < 2) {
            setError('Need at least 2 tenants to test isolation');
            return;
        }

        const tenant1 = tenants[0];
        const tenant2 = tenants[1];

        try {
            setLoading(true);
            setError('');

            // Try to access tenant2's data using tenant1's credentials
            const response = await fetch(`${API_BASE}/api/qr/list`, {
                headers: {
                    'X-Tenant-ID': tenant2.tenant_id, // Different tenant ID
                    'X-API-Key': tenant1.api_key,     // Wrong API key
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                setSuccess('✅ Tenant isolation working! Cross-tenant access properly blocked.');
            } else {
                setError('⚠️ Potential security issue: Cross-tenant access not properly blocked');
            }
        } catch (error) {
            setError('Error testing isolation: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="multitenant-tester">
            <div className="header">
                <h1>🏢 Multitenant Architecture Tester</h1>
                <p>Test and verify your multitenant QR billing system</p>
            </div>

            {/* System Status */}
            <div className="system-status">
                <h2>📊 System Status</h2>
                {systemInfo ? (
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="label">Multitenant:</span>
                            <span className={`status ${systemInfo.multitenant?.enabled ? 'active' : 'inactive'}`}>
                                {systemInfo.multitenant?.enabled ? '✅ Enabled' : '❌ Disabled'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">Active Tenants:</span>
                            <span className="value">{systemInfo.multitenant?.tenantsLoaded || 0}</span>
                        </div>
                        <div className="status-item">
                            <span className="label">Server Status:</span>
                            <span className={`status ${systemInfo.status === 'healthy' ? 'active' : 'inactive'}`}>
                                {systemInfo.status === 'healthy' ? '✅ Healthy' : '⚠️ Issues'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p>Loading system information...</p>
                )}
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="message error">
                    <strong>❌ Error:</strong> {error}
                </div>
            )}
            {success && (
                <div className="message success">
                    <strong>✅ Success:</strong> {success}
                </div>
            )}

            {/* Create New Tenant */}
            <div className="create-tenant">
                <h2>🏪 Create New Tenant</h2>
                <div className="tenant-form">
                    <input
                        type="text"
                        placeholder="Restaurant Name"
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    />
                    <select
                        value={newTenant.strategy}
                        onChange={(e) => setNewTenant({...newTenant, strategy: e.target.value})}
                    >
                        <option value="shared_schema">Shared Schema (Fast, cost-effective)</option>
                        <option value="separate_schema">Separate Schema (Better isolation)</option>
                        <option value="separate_database">Separate Database (Maximum security)</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Cuisine Type"
                        value={newTenant.settings.cuisine}
                        onChange={(e) => setNewTenant({
                            ...newTenant, 
                            settings: {...newTenant.settings, cuisine: e.target.value}
                        })}
                    />
                    <input
                        type="number"
                        placeholder="Number of Tables"
                        value={newTenant.settings.tables}
                        onChange={(e) => setNewTenant({
                            ...newTenant, 
                            settings: {...newTenant.settings, tables: parseInt(e.target.value)}
                        })}
                    />
                    <button 
                        onClick={createTenant} 
                        disabled={loading}
                        className="create-btn"
                    >
                        {loading ? '⏳ Creating...' : '🏪 Create Tenant'}
                    </button>
                </div>
            </div>

            {/* Tenant List */}
            <div className="tenant-list">
                <h2>🏢 Active Tenants ({tenants.length})</h2>
                <div className="tenants-grid">
                    {tenants.map(tenant => (
                        <div 
                            key={tenant.tenant_id} 
                            className={`tenant-card ${selectedTenant?.tenant_id === tenant.tenant_id ? 'selected' : ''}`}
                            onClick={() => selectTenant(tenant)}
                        >
                            <h3>{tenant.name}</h3>
                            <div className="tenant-info">
                                <span className={`strategy ${tenant.tenant_strategy}`}>
                                    {tenant.tenant_strategy.replace('_', ' ')}
                                </span>
                                <span className="tenant-id">ID: {tenant.tenant_id.slice(-8)}</span>
                                <span className={`status ${tenant.status}`}>{tenant.status}</span>
                            </div>
                            <div className="tenant-actions">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        createQRCodesForTenant(tenant, 5);
                                    }}
                                    className="action-btn"
                                >
                                    📱 Generate QRs
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Tenant Details */}
            {selectedTenant && (
                <div className="tenant-details">
                    <h2>🔍 Tenant Details: {selectedTenant.name}</h2>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="label">Strategy:</span>
                            <span className="value">{selectedTenant.tenant_strategy}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Status:</span>
                            <span className={`status ${selectedTenant.status}`}>{selectedTenant.status}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">QR Codes:</span>
                            <span className="value">{tenantQRCodes.length}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">API Key:</span>
                            <span className="value api-key">{selectedTenant.api_key?.slice(0, 16)}...</span>
                        </div>
                    </div>

                    {/* QR Codes for Selected Tenant */}
                    {tenantQRCodes.length > 0 && (
                        <div className="qr-codes">
                            <h3>📱 QR Codes</h3>
                            <div className="qr-grid">
                                {tenantQRCodes.map(qr => (
                                    <div key={qr.id} className="qr-item">
                                        <span>Table {qr.table_number}</span>
                                        <span className="qr-id">{qr.qr_id}</span>
                                        <span className={`status ${qr.is_active ? 'active' : 'inactive'}`}>
                                            {qr.is_active ? '✅ Active' : '❌ Inactive'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Test Controls */}
            <div className="test-controls">
                <h2>🧪 Multitenant Tests</h2>
                <div className="test-buttons">
                    <button onClick={loadTenants} disabled={loading} className="test-btn">
                        🔄 Refresh Tenants
                    </button>
                    <button onClick={testTenantIsolation} disabled={loading} className="test-btn">
                        🔒 Test Tenant Isolation
                    </button>
                    <button onClick={() => {setError(''); setSuccess('');}} className="test-btn">
                        🧹 Clear Messages
                    </button>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner">⏳</div>
                    <p>Processing...</p>
                </div>
            )}
        </div>
    );
};

export default MultitenantTester;