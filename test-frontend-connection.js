// Simple API connectivity test for frontend
const API_BASE_URL = 'http://localhost:5001/api';

console.log('🔍 Testing Frontend API Connectivity');
console.log('===================================\n');

async function testBackendConnection() {
    console.log('1. Testing Backend Connection...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': '1'  // Add tenant ID
            }
        });
        
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
            const data = await response.text();
            console.log('   ✅ Backend is accessible');
            console.log(`   Response: ${data}`);
            return true;
        } else {
            console.log('   ❌ Backend responded with error');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
        return false;
    }
}

async function testMenuAPI() {
    console.log('\n2. Testing Menu API...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/menu/items`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': '1'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('   ✅ Menu API accessible');
            console.log(`   Full response:`, JSON.stringify(result, null, 2));
            
            // Handle different possible response structures
            const data = result.data || result || [];
            const dataArray = Array.isArray(data) ? data : [];
            
            console.log(`   Items found: ${dataArray.length}`);
            
            // Analyze categories
            const categories = {};
            dataArray.forEach(item => {
                const categoryName = item.category_name || item.category || 'Unknown';
                if (!categories[categoryName]) {
                    categories[categoryName] = 0;
                }
                categories[categoryName]++;
            });
            
            console.log('\n   📊 Categories Found:');
            Object.entries(categories).forEach(([cat, count]) => {
                console.log(`      ${cat}: ${count} items`);
            });
            
            // Check for missing categories
            const hasMainCourse = categories['Main Course'] > 0;
            const hasSnacks = categories['Snacks'] > 0;
            
            console.log('\n   🔍 Key Category Check:');
            console.log(`      Main Course: ${hasMainCourse ? '✅' : '❌'} (${categories['Main Course'] || 0} items)`);
            console.log(`      Snacks/Starters: ${hasSnacks ? '✅' : '❌'} (${categories['Snacks'] || 0} items)`);
            
            // Check image URLs
            console.log('\n   🖼️ Sample Image URLs:');
            dataArray.slice(0, 5).forEach(item => {
                console.log(`      ${item.name || item.item_name}: ${item.image_url || 'No image URL'}`);
            });
            
            return { success: true, data: dataArray, categories };
        } else {
            console.log('   ❌ Menu API failed');
            const errorText = await response.text();
            console.log(`   Error: ${errorText}`);
            return { success: false };
        }
    } catch (error) {
        console.log(`   ❌ Menu API error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testImageAPI(imageUrl) {
    console.log(`\n3. Testing Image API: ${imageUrl}`);
    
    try {
        const response = await fetch(`http://localhost:5001${imageUrl}`, {
            method: 'GET',
            headers: {
                'X-Tenant-Id': '1'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            console.log('   ✅ Image accessible');
            console.log(`   Content-Type: ${contentType}`);
            console.log(`   Content-Length: ${contentLength} bytes`);
            return true;
        } else {
            console.log('   ❌ Image not accessible');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Image request failed: ${error.message}`);
        return false;
    }
}

async function runFullTest() {
    try {
        // Test 1: Backend Connection
        const backendConnected = await testBackendConnection();
        
        if (!backendConnected) {
            console.log('\n❌ Backend server is not accessible. Please ensure:');
            console.log('   1. Backend server is running on port 5001');
            console.log('   2. CORS is properly configured');
            console.log('   3. No firewall blocking the connection');
            return;
        }
        
        // Test 2: Menu API
        const menuResult = await testMenuAPI();
        
        if (!menuResult.success) {
            console.log('\n❌ Menu API failed. This could be due to:');
            console.log('   1. Database connection issues');
            console.log('   2. Tenant context problems');
            console.log('   3. API route configuration');
            return;
        }
        
        // Test 3: Image API (if menu has images)
        if (menuResult.data && menuResult.data.length > 0) {
            const firstItemWithImage = menuResult.data.find(item => item.image_url);
            if (firstItemWithImage) {
                await testImageAPI(firstItemWithImage.image_url);
            } else {
                console.log('\n⚠️ No image URLs found in menu items');
            }
        }
        
        // Final Analysis
        console.log('\n🎯 ANALYSIS & RECOMMENDATIONS:');
        console.log('============================');
        
        if (menuResult.success) {
            const hasMainCourse = menuResult.categories['Main Course'] > 0;
            const hasStarters = menuResult.categories['Snacks'] > 0;
            
            if (!hasMainCourse) {
                console.log('❌ ISSUE: Main Course items missing');
                console.log('   → Check if items are categorized as "Main Course" in database');
            }
            
            if (!hasStarters) {
                console.log('❌ ISSUE: Starter items missing');
                console.log('   → Check if items are categorized as "Snacks" in database');
            }
            
            if (hasMainCourse && hasStarters) {
                console.log('✅ All required categories are present');
                console.log('   → Issue might be in frontend rendering or image serving');
            }
        }
        
        console.log('\n💡 NEXT STEPS:');
        console.log('   1. If categories are missing: Update database category names');
        console.log('   2. If images not loading: Check MongoDB GridFS connection');
        console.log('   3. If frontend not displaying: Check React component rendering');
        
    } catch (error) {
        console.error('\n💥 Test failed:', error);
    }
}

// Run the test
runFullTest();