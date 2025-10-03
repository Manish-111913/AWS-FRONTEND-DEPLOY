import React, { useState, useEffect } from 'react';
import OCRService from '../services/ocrService';

const OCRTest = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [usageStats, setUsageStats] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    checkAPIStatus();
    getUsageStats();
  }, []);

  const checkAPIStatus = async () => {
    try {
      const result = await OCRService.validateAPIKey();
      setApiStatus(result.success ? 'valid' : 'invalid');
    } catch (error) {
      setApiStatus('error');
      console.error('API validation error:', error);
    }
  };

  const getUsageStats = async () => {
    try {
      const result = await OCRService.getUsageStats();
      if (result.success) {
        setUsageStats(result.data);
      }
    } catch (error) {
      console.error('Usage stats error:', error);
    }
  };

  const runTest = async (testName, testFunction) => {
    const startTime = Date.now();
    try {
      const result = await testFunction();
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        result,
        duration: endTime - startTime,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        error: error.message,
        duration: endTime - startTime,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const testBase64Processing = () => {
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return OCRService.processBase64Image(testImage);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return '#28a745';
      case 'invalid': return '#dc3545';
      case 'checking': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid': return '✅ API Key Valid';
      case 'invalid': return '❌ API Key Invalid';
      case 'checking': return '🔄 Checking...';
      default: return '❓ Unknown Status';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 OCR Integration Test Dashboard</h2>
      
      {/* API Status */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '20px' 
      }}>
        <h3>API Status</h3>
        <div style={{ 
          color: getStatusColor(apiStatus), 
          fontSize: '18px', 
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          {getStatusText(apiStatus)}
        </div>
        
        {usageStats && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p><strong>API Key:</strong> {usageStats.apiKey}</p>
            <p><strong>Timestamp:</strong> {usageStats.timestamp}</p>
            {usageStats.monthlyStats && (
              <div>
                <p><strong>Monthly Stats:</strong></p>
                <ul>
                  <li>Total Processed: {usageStats.monthlyStats.total_processed || 0}</li>
                  <li>Avg Items per Image: {parseFloat(usageStats.monthlyStats.avg_items_per_image || 0).toFixed(1)}</li>
                  <li>Avg Confidence: {parseFloat(usageStats.monthlyStats.avg_confidence || 0).toFixed(2)}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '20px' 
      }}>
        <h3>Test Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => runTest('Base64 Processing', testBase64Processing)}
            style={{ 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Test Base64 Processing
          </button>
          
          <button 
            onClick={() => runTest('API Validation', () => OCRService.validateAPIKey())}
            style={{ 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Test API Validation
          </button>
          
          <button 
            onClick={() => runTest('Usage Stats', () => OCRService.getUsageStats())}
            style={{ 
              background: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Test Usage Stats
          </button>
          
          <button 
            onClick={clearResults}
            style={{ 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px' 
      }}>
        <h3>Test Results ({testResults.length})</h3>
        
        {testResults.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No tests run yet. Click a test button above to start.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{ 
                  border: '1px solid #eee', 
                  borderRadius: '5px', 
                  padding: '15px', 
                  marginBottom: '10px',
                  background: result.status === 'success' ? '#f8f9fa' : '#fff5f5'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: result.status === 'success' ? '#28a745' : '#dc3545' 
                  }}>
                    {result.status === 'success' ? '✅' : '❌'} {result.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {result.timestamp} • {result.duration}ms
                  </div>
                </div>
                
                {result.status === 'success' ? (
                  <div style={{ fontSize: '14px' }}>
                    <strong>Success:</strong>
                    <pre style={{ 
                      background: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '3px', 
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#dc3545' }}>
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        background: '#e9ecef', 
        border: '1px solid #ced4da', 
        borderRadius: '8px', 
        padding: '20px',
        marginTop: '20px'
      }}>
        <h3>📋 Instructions</h3>
        <ol>
          <li><strong>Check API Status:</strong> Ensure the API key is valid before running tests</li>
          <li><strong>Run Tests:</strong> Click the test buttons to verify different OCR functionalities</li>
          <li><strong>Review Results:</strong> Check the test results for success/failure status</li>
          <li><strong>Integration:</strong> If all tests pass, the OCR integration is working correctly</li>
        </ol>
        
        <h4>🔧 Troubleshooting</h4>
        <ul>
          <li><strong>API Key Invalid:</strong> Check your backend .env and ensure GOOGLE_VISION_API_KEY is set and the Vision API is enabled</li>
          <li><strong>Network Errors:</strong> Ensure the backend server is running on port 5000</li>
          <li><strong>CORS Issues:</strong> Verify CORS is properly configured in the backend</li>
          <li><strong>File Upload Errors:</strong> Check file size limits and supported formats</li>
        </ul>
      </div>
    </div>
  );
};

export default OCRTest;