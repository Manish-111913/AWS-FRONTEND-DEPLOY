// Simple frontend API test to verify configuration
const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
console.log('🔧 API Base URL:', API_BASE_URL);

async function testFrontendConfig() {
  try {
    console.log('🧪 Testing frontend API configuration...');
    console.log('📍 Expected URL:', `${API_BASE_URL}/health`);
    
    const response = await axios.get(`${API_BASE_URL}/health`, {
      headers: {
        'X-Business-Id': '9'
      }
    });
    
    console.log('✅ Frontend API configuration is correct!');
    console.log('📊 Response:', response.data);
    
    // Test kitchen queue
    const kitchenResponse = await axios.get(`${API_BASE_URL}/orders/kitchen-queue`, {
      headers: {
        'X-Business-Id': '9'
      }
    });
    
    console.log('✅ Kitchen queue API working!');
    console.log('🍽️ Kitchen queue:', kitchenResponse.data);
    
  } catch (error) {
    console.error('❌ Frontend config test failed:', error.message);
    if (error.response) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

testFrontendConfig();