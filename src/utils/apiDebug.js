// Debug utility to find "base" hostname issues
console.log('🔍 Debugging API Configuration Issues');

// Check environment variables
console.log('📊 Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Test URL construction patterns
const testPatterns = [
  { 
    name: 'Direct env var',
    value: process.env.REACT_APP_API_URL 
  },
  {
    name: 'Env var with fallback',
    value: process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api'
  },
  {
    name: 'Replace /api test',
    value: (process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api').replace('/api', '')
  }
];

console.log('🧪 URL Pattern Tests:');
testPatterns.forEach(test => {
  console.log(`  ${test.name}:`, test.value);
  
  // Check for problematic values
  if (!test.value || test.value === 'base' || test.value.length < 8) {
    console.error(`  ⚠️ PROBLEM: ${test.name} resolves to invalid value:`, test.value);
  }
});

// Test fetch URL construction
const testUrls = [
  `${process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api'}/health`,
  `https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api/health`,
];

console.log('🌐 URL Construction Tests:');
testUrls.forEach((url, index) => {
  console.log(`  Test ${index + 1}:`, url);
  
  // Check for "base" in URLs
  if (url.includes('/base/') || url.startsWith('base/') || url === 'base') {
    console.error(`  🚨 ERROR: URL contains "base":`, url);
  }
});

// Export for potential use in components
export const debugApiConfig = () => {
  return {
    envVar: process.env.REACT_APP_API_URL,
    fallback: 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api',
    finalUrl: process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api'
  };
};

console.log('✅ API Debug check complete. Check console for any PROBLEM or ERROR messages.');