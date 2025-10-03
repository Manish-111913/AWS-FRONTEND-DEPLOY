import React, { useState, useEffect } from 'react';
import {
  HealthService,
  StockInService,
  MenuService,
  UsageService,
  UnitMappingService,
  UserService,
  OCRService,
  WastageService,
  InventoryService,
  ServiceHealthChecker
} from '../services';
import { API_BASE_URL } from '../services/apiClient';

const ServiceTester = ({ goTo }) => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedService, setSelectedService] = useState('all');

  const services = {
    health: {
      name: '🏥 Health Service',
      tests: {
        'Basic Health Check': () => HealthService.getHealth(),
        'Database Status': () => HealthService.getDatabaseStatus()
      }
    },
    stockIn: {
      name: '📦 Stock In Service',
      tests: {
        'Get Records': () => StockInService.getStockInRecords(1, 5),
        'Get Inventory Overview': () => StockInService.getInventoryOverview()
      }
    },
    menu: {
      name: '🍽️ Menu Service',
      tests: {
        'Get Menu Items': () => MenuService.getMenuItems(),
        'Get Categories': () => MenuService.getMenuCategories()
      }
    },
    usage: {
      name: '📤 Usage Service',
      tests: {
        'Get Usage Records': () => UsageService.getUsageRecords(1, 5),
        'Get Usage Summary': () => UsageService.getUsageSummary()
      }
    },
    unitMapping: {
      name: '📏 Unit Mapping Service',
      tests: {
        'Get Unit Options': () => UnitMappingService.getUnitOptions(),
        'Get Kitchen Units': () => UnitMappingService.getKitchenUnits(1),
        'Get Inventory Items': () => UnitMappingService.getInventoryItems(1)
      }
    },
    users: {
      name: '👥 User Service',
      tests: {
        'Get Users': () => UserService.getUsers(1)
      }
    },
    ocr: {
      name: '📄 OCR Service',
      tests: {
        'Get Uploaded Images': () => OCRService.getUploadedImages(1, null, 5)
      }
    },
    wastage: {
      name: '🗑️ Wastage Service',
      tests: {
        'Get Wastage Records': () => WastageService.getWastageRecords(1),
        'Get Wastage Reasons': () => WastageService.getWastageReasons(1)
      }
    },
    inventory: {
      name: '📋 Inventory Service',
      tests: {
        'Get Inventory Items': () => InventoryService.getInventoryItems(1, 5)
      }
    }
  };

  const runTest = async (serviceName, testName, testFunction) => {
    const testKey = `${serviceName}-${testName}`;
    
    setTestResults(prev => ({
      ...prev,
      [testKey]: { status: 'running', result: null, error: null }
    }));

    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testKey]: { 
          status: 'success', 
          result: result, 
          error: null,
          dataCount: result.data ? (Array.isArray(result.data) ? result.data.length : 'Object') : 'N/A'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testKey]: { status: 'error', result: null, error: error.message }
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});

    const servicesToTest = selectedService === 'all' ? Object.keys(services) : [selectedService];

    for (const serviceName of servicesToTest) {
      const service = services[serviceName];
      for (const [testName, testFunction] of Object.entries(service.tests)) {
        await runTest(serviceName, testName, testFunction);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#ffc107';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>🧪 Frontend Service Tester</h2>
        <p>Test all frontend services against the backend API</p>
      </div>

      {/* Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Test Service:</label>
          <select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="all">All Services</option>
            {Object.entries(services).map(([key, service]) => (
              <option key={key} value={key}>{service.name}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={runAllTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: isRunning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '▶️ Run Tests'}
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          API: {API_BASE_URL}
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {Object.entries(services).map(([serviceName, service]) => {
          if (selectedService !== 'all' && selectedService !== serviceName) return null;
          
          return (
            <div key={serviceName} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f1f3f4',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {service.name}
              </div>
              
              <div style={{ padding: '16px' }}>
                {Object.entries(service.tests).map(([testName, testFunction]) => {
                  const testKey = `${serviceName}-${testName}`;
                  const result = testResults[testKey];
                  
                  return (
                    <div key={testName} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      margin: '8px 0',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      borderLeft: `4px solid ${result ? getStatusColor(result.status) : '#6c757d'}`
                    }}>
                      <div>
                        <strong>{testName}</strong>
                        {result && result.error && (
                          <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                            Error: {result.error}
                          </div>
                        )}
                        {result && result.dataCount && (
                          <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
                            Data: {result.dataCount} items
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {result && (
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {result.status}
                          </span>
                        )}
                        <span style={{ fontSize: '20px' }}>
                          {result ? getStatusIcon(result.status) : '⏳'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {Object.keys(testResults).length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#e9ecef',
          borderRadius: '8px'
        }}>
          <h3>Test Summary</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>✅ Passed: {Object.values(testResults).filter(r => r.status === 'success').length}</div>
            <div>❌ Failed: {Object.values(testResults).filter(r => r.status === 'error').length}</div>
            <div>🔄 Running: {Object.values(testResults).filter(r => r.status === 'running').length}</div>
            <div>📊 Total: {Object.keys(testResults).length}</div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => goTo && goTo('overview')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Overview
        </button>
      </div>
    </div>
  );
};

export default ServiceTester;