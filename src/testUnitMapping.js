// Simple test to verify frontend can connect to backend
import UnitMappingService from './services/unitMappingService';

async function testFrontendConnection() {
  console.log('🧪 Testing Frontend to Backend Connection...');
  
  try {
    // Test 1: Get unit options
    console.log('1. Testing getUnitOptions...');
    const units = await UnitMappingService.getUnitOptions();
    console.log('✅ Unit options fetched successfully:', {
      kitchen: units.kitchen.length,
      supplier: units.supplier.length,
      container: units.container.length
    });

    // Test 2: Get kitchen units
    console.log('2. Testing getKitchenUnits...');
    const kitchenUnits = await UnitMappingService.getKitchenUnits(1);
    console.log('✅ Kitchen units fetched successfully:', kitchenUnits);

    // Test 3: Get inventory items
    console.log('3. Testing getInventoryItems...');
    const inventoryItems = await UnitMappingService.getInventoryItems(1);
    console.log('✅ Inventory items fetched successfully:', inventoryItems.length, 'items');

    console.log('🎉 All frontend tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Frontend test failed:', error);
    return false;
  }
}

// Export for use in React components
export default testFrontendConnection;