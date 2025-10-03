import React, { useState, useEffect } from 'react';
import UnitMappingService from '../services/unitMappingService';
import { API_BASE_URL } from '../services/apiClient';

const TestUnitMapping = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    runTests();
  }, []);

  const addResult = (test, success, data) => {
    setTestResults(prev => [...prev, { test, success, data }]);
  };

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);

    try {
      // Test 1: Get unit options
      console.log('Testing getUnitOptions...');
      const units = await UnitMappingService.getUnitOptions();
      addResult('Get Unit Options', true, `Kitchen: ${units.kitchen.length}, Supplier: ${units.supplier.length}, Container: ${units.container.length}`);

      // Test 2: Get kitchen units
      console.log('Testing getKitchenUnits...');
      const kitchenUnits = await UnitMappingService.getKitchenUnits(1);
      addResult('Get Kitchen Units', true, `Found: ${Object.keys(kitchenUnits).length} units`);

      // Test 3: Get inventory items
      console.log('Testing getInventoryItems...');
      const inventoryItems = await UnitMappingService.getInventoryItems(1);
      addResult('Get Inventory Items', true, `Found: ${inventoryItems.length} items`);

      // Test 4: Get supplier conversions
      console.log('Testing getSupplierConversions...');
      const supplierConversions = await UnitMappingService.getSupplierConversions(1);
      addResult('Get Supplier Conversions', true, `Found: ${supplierConversions.length} conversions`);

    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
      addResult('Connection Test', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Unit Mapping Integration Test</h2>
      
      {loading && <p>🧪 Running tests...</p>}
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>❌ Test Failed:</strong> {error}
        </div>
      )}

      <div>
        {testResults.map((result, index) => (
          <div key={index} style={{
            padding: '10px',
            margin: '5px 0',
            borderRadius: '8px',
            backgroundColor: result.success ? '#e8f5e8' : '#ffebee',
            color: result.success ? '#2e7d32' : '#c62828'
          }}>
            <strong>{result.success ? '✅' : '❌'} {result.test}:</strong> {result.data}
          </div>
        ))}
      </div>

      <button 
        onClick={runTests}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Run Tests Again
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
  <p><strong>API URL:</strong> {API_BASE_URL}</p>
        <p><strong>Business ID:</strong> {UnitMappingService.getBusinessId()}</p>
      </div>
    </div>
  );
};

export default TestUnitMapping;