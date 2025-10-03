const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('🔍 Testing frontend API connection...');
console.log('API_BASE_URL:', API_BASE_URL);

// Test if we can reach the API
fetch(`${API_BASE_URL}/api/health`)
  .then(response => {
    console.log('✅ API Health Check - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Health data:', data);
    
    // Test menu items endpoint
    return fetch(`${API_BASE_URL}/api/menu/items`);
  })
  .then(response => {
    console.log('✅ Menu Items API - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Menu items count:', data.data?.length);
    if (data.data && data.data.length > 0) {
      console.log('Sample item:', data.data[0]);
      
      // Test image URL
      const imageUrl = data.data[0].img;
      console.log('Testing image URL:', imageUrl);
      
      return fetch(imageUrl, { method: 'HEAD' });
    }
  })
  .then(response => {
    if (response) {
      console.log('✅ Image URL test - Status:', response.status);
      if (response.ok) {
        console.log('🎉 All tests passed! Images should be loading.');
      } else {
        console.log('❌ Image URL not accessible');
      }
    }
  })
  .catch(error => {
    console.error('❌ API connection failed:', error.message);
    console.log('💡 Possible solutions:');
    console.log('1. Make sure backend server is running: cd backend && npm start');
    console.log('2. Check if API_BASE_URL is correct in .env file');
    console.log('3. Try updating .env to: REACT_APP_API_URL=http://localhost:5000');
  });