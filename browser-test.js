// Simple test to verify frontend can reach backend API
// Run this in browser console at http://localhost:3000

console.log('🧪 Testing frontend-to-backend connectivity...');

// Test 1: Menu API call
fetch('/api/menu/items', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': '1'
    }
})
.then(response => {
    console.log('📋 Menu API Response:', response.status, response.statusText);
    return response.json();
})
.then(data => {
    console.log('📊 Menu Data:', {
        success: data.success,
        count: data.count,
        firstItem: data.data?.[0]
    });
    
    // Test 2: Image blob fetch
    if (data.data?.[0]?.image_url) {
        const imageUrl = data.data[0].image_url;
        console.log('🖼️ Testing image fetch for:', imageUrl);
        
        return fetch(imageUrl, {
            method: 'GET',
            headers: { 'X-Tenant-Id': '1' }
        });
    }
    return null;
})
.then(imageResponse => {
    if (imageResponse) {
        console.log('📸 Image Response:', imageResponse.status, imageResponse.statusText);
        if (imageResponse.ok) {
            return imageResponse.blob();
        }
    }
    return null;
})
.then(blob => {
    if (blob) {
        console.log('✅ Blob created:', {
            size: blob.size,
            type: blob.type
        });
        
        // Create object URL and test
        const objectUrl = URL.createObjectURL(blob);
        console.log('🔗 Object URL created:', objectUrl);
        
        // Test by creating an image element
        const img = new Image();
        img.onload = () => {
            console.log('✅ Image loaded successfully from blob!');
            console.log('📐 Image dimensions:', img.width, 'x', img.height);
            URL.revokeObjectURL(objectUrl); // Cleanup
        };
        img.onerror = () => {
            console.log('❌ Image failed to load from blob');
            URL.revokeObjectURL(objectUrl); // Cleanup
        };
        img.src = objectUrl;
    }
})
.catch(error => {
    console.error('💥 Test failed:', error);
});

console.log('⏳ Test initiated... check console for results');