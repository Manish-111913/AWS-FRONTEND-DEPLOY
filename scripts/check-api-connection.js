const http = require('http');
const https = require('https');
const { URL } = require('url');

function checkApiConnection(apiUrl) {
  return new Promise((resolve) => {
    try {
      // If apiUrl already ends with /api, use /health instead of /api/health
      const healthEndpoint = apiUrl.endsWith('/api') ? '/health' : '/api/health';
      const url = new URL(apiUrl + healthEndpoint);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, { timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
    } catch (error) {
      resolve(false);
    }
  });
}

async function validateApiConnection() {
  // Read API URL from .env
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ Frontend .env file not found');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiUrlMatch = envContent.match(/^REACT_APP_API_URL=(.*)$/m);
  
  if (!apiUrlMatch) {
    console.log('⚠️ REACT_APP_API_URL not found in .env');
    return;
  }
  
  const apiUrl = apiUrlMatch[1].trim();
  console.log(`🔍 Checking API connection: ${apiUrl}`);
  
  const isConnected = await checkApiConnection(apiUrl);
  
  if (isConnected) {
    console.log('✅ Backend API is reachable');
    console.log(`📱 Mobile access: ${apiUrl.replace(':5000', ':3000')}`);
  } else {
    console.log('❌ Backend API is not reachable');
    console.log('💡 Make sure the backend server is running');
    console.log('💡 Check if the IP address in .env is correct');
  }
}

// Run if called directly
if (require.main === module) {
  validateApiConnection();
}

module.exports = { validateApiConnection };