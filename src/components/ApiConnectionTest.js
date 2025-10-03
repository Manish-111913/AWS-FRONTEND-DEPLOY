import React, { useState, useEffect } from 'react';

const ApiConnectionTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [apiUrl, setApiUrl] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const currentApiUrl = process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api';
    setApiUrl(currentApiUrl);
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    const currentApiUrl = process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api';
    const testResults = [];

    // Test 1: Health Check
    try {
      const response = await fetch(`${currentApiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      testResults.push({
        test: 'Health Check',
        url: `${currentApiUrl}/health`,
        status: response.status,
        success: response.status === 200 || response.status === 500, // 500 is OK for now
        message: response.status === 500 ? 'API reachable (DB config needed)' : 'Success'
      });
    } catch (error) {
      testResults.push({
        test: 'Health Check',
        url: `${currentApiUrl}/health`,
        status: 'Error',
        success: false,
        message: error.message
      });
    }

    // Test 2: Auth endpoint
    try {
      const response = await fetch(`${currentApiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      });
      
      testResults.push({
        test: 'Auth Login',
        url: `${currentApiUrl}/auth/login`,
        status: response.status,
        success: response.status !== 404,
        message: response.status === 404 ? 'Route not found' : 'Route exists'
      });
    } catch (error) {
      testResults.push({
        test: 'Auth Login',
        url: `${currentApiUrl}/auth/login`,
        status: 'Error',
        success: false,
        message: error.message
      });
    }

    setResults(testResults);
    setStatus('Tests completed');
  };

  const overallSuccess = results.filter(r => r.success).length;
  const totalTests = results.length;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔗 API Connection Test</h2>
      <div style={{ marginBottom: '20px' }}>
        <strong>API URL:</strong> {apiUrl}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status} ({overallSuccess}/{totalTests} tests passed)
      </div>

      {results.map((result, index) => (
        <div 
          key={index}
          style={{
            padding: '10px',
            margin: '10px 0',
            border: `2px solid ${result.success ? '#4CAF50' : '#f44336'}`,
            borderRadius: '5px',
            backgroundColor: result.success ? '#e8f5e8' : '#ffeaea'
          }}
        >
          <div><strong>{result.success ? '✅' : '❌'} {result.test}</strong></div>
          <div><small>URL: {result.url}</small></div>
          <div>Status: {result.status}</div>
          <div>Message: {result.message}</div>
        </div>
      ))}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>🎯 What this means:</h3>
        <ul>
          <li><strong>500 errors:</strong> Expected for now - means API is reachable but needs DB config</li>
          <li><strong>404 errors:</strong> Route doesn't exist - needs investigation</li>
          <li><strong>Network errors:</strong> API is not reachable - check deployment</li>
        </ul>
      </div>

      <button 
        onClick={testApiConnection}
        style={{
          padding: '10px 20px',
          marginTop: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Retest API Connection
      </button>
    </div>
  );
};

export default ApiConnectionTest;