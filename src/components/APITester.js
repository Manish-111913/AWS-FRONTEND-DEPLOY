import React, { useState, useEffect } from 'react';
import './APITester.css';
import { API_ORIGIN } from '../services/apiClient';

const APITester = ({ goTo }) => {
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState({});
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenants, setTenants] = useState([]);

    const API_BASE = process.env.REACT_APP_API_URL || API_ORIGIN;

    // Test API endpoints
    const testEndpoints = [
        {
            id: 'health',
            name: '🏥 Health Check',
            method: 'GET',
            url: '/health',
            description: 'Check if server is running'
        },
        {
            id: 'multitenant-info',
            name: '🏢 Multitenant Info',
            method: 'GET',
            url: '/api/multitenant/info',
            description: 'Get system multitenant status'
        },
        {
            id: 'admin-tenants',
            name: '👥 All Tenants',
            method: 'GET',
            url: '/api/admin/tenants',
            description: 'List all tenants (admin endpoint)'
        }
    ];

    // Load tenants on component mount
    useEffect(() => {
        testAPI('admin-tenants');
    }, []);

    // Update tenants list when admin-tenants result changes
    useEffect(() => {
        if (results['admin-tenants']?.success && results['admin-tenants']?.data?.tenants) {
            setTenants(results['admin-tenants'].data.tenants);
            if (!selectedTenant && results['admin-tenants'].data.tenants.length > 0) {
                setSelectedTenant(results['admin-tenants'].data.tenants[0]);
            }
        }
    }, [results['admin-tenants']]);

    const testAPI = async (endpointId, customHeaders = {}) => {
        const endpoint = testEndpoints.find(e => e.id === endpointId);
        if (!endpoint) return;

        setLoading(prev => ({ ...prev, [endpointId]: true }));

        try {
            const response = await fetch(`${API_BASE}${endpoint.url}`, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...customHeaders
                }
            });

            const data = await response.json();

            setResults(prev => ({
                ...prev,
                [endpointId]: {
                    success: response.ok,
                    status: response.status,
                    data: data,
                    timestamp: new Date().toLocaleTimeString()
                }
            }));

        } catch (error) {
            setResults(prev => ({
                ...prev,
                [endpointId]: {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toLocaleTimeString()
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [endpointId]: false }));
        }
    };

    const testTenantAPI = async (endpoint, tenantId, apiKey) => {
        if (!tenantId || !apiKey) {
            alert('Please select a tenant first');
            return;
        }

        const customEndpointId = `tenant-${endpoint}`;
        setLoading(prev => ({ ...prev, [customEndpointId]: true }));

        try {
            const response = await fetch(`${API_BASE}/api/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId,
                    'X-API-Key': apiKey
                }
            });

            const data = await response.json();

            setResults(prev => ({
                ...prev,
                [customEndpointId]: {
                    success: response.ok,
                    status: response.status,
                    data: data,
                    timestamp: new Date().toLocaleTimeString(),
                    tenantId: tenantId
                }
            }));

        } catch (error) {
            setResults(prev => ({
                ...prev,
                [customEndpointId]: {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toLocaleTimeString(),
                    tenantId: tenantId
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [customEndpointId]: false }));
        }
    };

    const createTestTenant = async () => {
        setLoading(prev => ({ ...prev, 'create-tenant': true }));

        const testTenant = {
            name: `Test Restaurant ${Date.now()}`,
            tenant_strategy: 'shared_schema',
            settings: {
                cuisine: 'Test',
                tables: 5,
                currency: 'USD'
            }
        };

        try {
            const response = await fetch(`${API_BASE}/api/admin/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testTenant)
            });

            const data = await response.json();

            setResults(prev => ({
                ...prev,
                'create-tenant': {
                    success: response.ok,
                    status: response.status,
                    data: data,
                    timestamp: new Date().toLocaleTimeString()
                }
            }));

            if (response.ok) {
                // Refresh tenant list
                testAPI('admin-tenants');
            }

        } catch (error) {
            setResults(prev => ({
                ...prev,
                'create-tenant': {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toLocaleTimeString()
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, 'create-tenant': false }));
        }
    };

    const renderResult = (result) => {
        if (!result) return null;

        return (
            <div className={`api-result ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                    <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
                        {result.status || 'ERROR'}
                    </span>
                    <span className="timestamp">{result.timestamp}</span>
                </div>
                {result.tenantId && (
                    <div className="tenant-info">Tenant: {result.tenantId}</div>
                )}
                <pre className="result-data">
                    {result.error ? result.error : JSON.stringify(result.data, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="api-tester">
            <div className="header">
                <button className="back-btn" onClick={() => goTo('dashboard')}>
                    ← Back to Dashboard
                </button>
                <h1>🧪 API Testing Interface</h1>
                <p>Test your multitenant backend APIs directly</p>
            </div>

            {/* System Tests */}
            <div className="test-section">
                <h2>🔧 System APIs</h2>
                <div className="api-grid">
                    {testEndpoints.map(endpoint => (
                        <div key={endpoint.id} className="api-card">
                            <h3>{endpoint.name}</h3>
                            <p>{endpoint.description}</p>
                            <code>{endpoint.method} {endpoint.url}</code>
                            <button 
                                onClick={() => testAPI(endpoint.id)}
                                disabled={loading[endpoint.id]}
                                className="test-btn"
                            >
                                {loading[endpoint.id] ? '⏳ Testing...' : '🧪 Test'}
                            </button>
                            {renderResult(results[endpoint.id])}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tenant Management */}
            <div className="test-section">
                <h2>🏢 Tenant Management</h2>
                <div className="tenant-actions">
                    <button 
                        onClick={createTestTenant}
                        disabled={loading['create-tenant']}
                        className="create-btn"
                    >
                        {loading['create-tenant'] ? '⏳ Creating...' : '🏪 Create Test Tenant'}
                    </button>
                    {renderResult(results['create-tenant'])}
                </div>
            </div>

            {/* Tenant Selection */}
            {tenants.length > 0 && (
                <div className="test-section">
                    <h2>🎯 Tenant-Specific APIs</h2>
                    <div className="tenant-selector">
                        <h3>Select Tenant:</h3>
                        <select 
                            value={selectedTenant?.tenant_id || ''} 
                            onChange={(e) => {
                                const tenant = tenants.find(t => t.tenant_id === e.target.value);
                                setSelectedTenant(tenant);
                            }}
                        >
                            <option value="">-- Select Tenant --</option>
                            {tenants.map(tenant => (
                                <option key={tenant.tenant_id} value={tenant.tenant_id}>
                                    {tenant.name} ({tenant.tenant_strategy})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedTenant && (
                        <div className="tenant-details">
                            <h4>Selected: {selectedTenant.name}</h4>
                            <div className="tenant-info">
                                <span>ID: {selectedTenant.tenant_id}</span>
                                <span>Strategy: {selectedTenant.tenant_strategy}</span>
                                <span>Status: {selectedTenant.status}</span>
                            </div>
                            
                            <div className="tenant-api-tests">
                                <button 
                                    onClick={() => testTenantAPI('qr/list', selectedTenant.tenant_id, selectedTenant.api_key)}
                                    disabled={loading['tenant-qr/list']}
                                    className="test-btn"
                                >
                                    {loading['tenant-qr/list'] ? '⏳ Loading...' : '📱 Get QR Codes'}
                                </button>
                                {renderResult(results['tenant-qr/list'])}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Connection Status */}
            <div className="test-section">
                <h2>📊 Connection Status</h2>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="label">Backend URL:</span>
                        <span className="value">{API_BASE}</span>
                    </div>
                    <div className="status-item">
                        <span className="label">Health Status:</span>
                        <span className={`status ${results.health?.success ? 'success' : 'error'}`}>
                            {results.health?.success ? '✅ Connected' : '❌ Disconnected'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="label">Multitenant:</span>
                        <span className={`status ${results['multitenant-info']?.data?.multitenant?.enabled ? 'success' : 'error'}`}>
                            {results['multitenant-info']?.data?.multitenant?.enabled ? '✅ Enabled' : '❌ Disabled'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="label">Active Tenants:</span>
                        <span className="value">
                            {results['multitenant-info']?.data?.multitenant?.tenantsLoaded || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APITester;