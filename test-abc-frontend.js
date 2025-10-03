/**
 * Frontend test script to check ABC category distribution from API
 * This script calls the backend API and analyzes the response
 */

async function testFrontendABCCategories() {
    console.log('🔍 Testing ABC Category Distribution from Frontend API\n');
    
    try {
        // Call the same endpoint the frontend uses
        const response = await fetch('http://localhost:5000/api/abc-analysis/calculate?businessId=1', {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.data || !data.data.analysis_results) {
            throw new Error('Invalid API response format');
        }
        
        const analysisResults = data.data.analysis_results;
        console.log(`📊 API returned ${analysisResults.length} items total\n`);
        
        // Group by abc_category as returned by API
        const apiCategories = { A: [], B: [], C: [], UNKNOWN: [] };
        
        analysisResults.forEach(item => {
            const category = item.abc_category;
            if (category === 'A' || category === 'B' || category === 'C') {
                apiCategories[category].push({
                    id: item.item_id,
                    name: item.item_name,
                    consumption_value: parseFloat(item.consumption_value || 0),
                    is_manual_override: item.is_manual_override || false
                });
            } else {
                apiCategories.UNKNOWN.push({
                    id: item.item_id,
                    name: item.item_name,
                    category: category,
                    consumption_value: parseFloat(item.consumption_value || 0),
                    is_manual_override: item.is_manual_override || false
                });
            }
        });
        
        // Display results
        console.log('📈 API Response Category Distribution:');
        console.log('='.repeat(40));
        
        ['A', 'B', 'C'].forEach(cat => {
            console.log(`${cat} Category: ${apiCategories[cat].length} items`);
            if (apiCategories[cat].length > 0) {
                apiCategories[cat]
                    .sort((a, b) => b.consumption_value - a.consumption_value)
                    .forEach(item => {
                        const manualFlag = item.is_manual_override ? ' [MANUAL]' : '';
                        console.log(`   - ${item.name} (ID: ${item.id}, Value: ₹${item.consumption_value.toFixed(2)})${manualFlag}`);
                    });
            }
            console.log('');
        });
        
        if (apiCategories.UNKNOWN.length > 0) {
            console.log(`UNKNOWN Category: ${apiCategories.UNKNOWN.length} items`);
            apiCategories.UNKNOWN.forEach(item => {
                console.log(`   - ${item.name} (ID: ${item.id}, Category: ${item.category})`);
            });
            console.log('');
        }
        
        // Simulate frontend bucketing logic
        console.log('🎯 Frontend Bucketing Simulation:');
        console.log('='.repeat(35));
        
        // Check if API provides categories
        const hasServerCats = analysisResults.some(it => {
            const c = it?.abc_category;
            return c === 'A' || c === 'B' || c === 'C';
        });
        
        console.log(`Has server categories: ${hasServerCats}`);
        
        if (hasServerCats) {
            console.log('✅ Frontend will use server categories directly');
            console.log('Frontend buckets will match API response shown above');
        } else {
            console.log('⚠️  Frontend will use AI/local classification');
            console.log('Frontend buckets may differ from any persisted categories');
        }
        
        // Summary for comparison
        console.log('\n📊 Summary for Comparison:');
        console.log('='.repeat(30));
        console.log(`A: ${apiCategories.A.length} items`);
        console.log(`B: ${apiCategories.B.length} items`);
        console.log(`C: ${apiCategories.C.length} items`);
        if (apiCategories.UNKNOWN.length > 0) {
            console.log(`UNKNOWN: ${apiCategories.UNKNOWN.length} items`);
        }
        
        return {
            total: analysisResults.length,
            distribution: {
                A: apiCategories.A.length,
                B: apiCategories.B.length,
                C: apiCategories.C.length,
                UNKNOWN: apiCategories.UNKNOWN.length
            },
            hasServerCategories: hasServerCats,
            items: apiCategories
        };
        
    } catch (error) {
        console.error('❌ Error testing frontend ABC categories:', error);
        throw error;
    }
}

// Export for use in other scripts or direct execution
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testFrontendABCCategories };
} else {
    // Browser execution
    testFrontendABCCategories().then((result) => {
        console.log('✅ Frontend ABC Category test completed');
        console.log('Result available in browser console as:', result);
    }).catch(error => {
        console.error('❌ Frontend test failed:', error);
    });
}
