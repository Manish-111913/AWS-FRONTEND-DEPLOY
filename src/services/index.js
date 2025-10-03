// Export all services for easy importing
export { default as HealthService } from './healthService';
export { default as StockInService } from './stockInService';
export { default as MenuService } from './menuService';
export { default as UsageService } from './usageService';
export { default as UnitMappingService } from './unitMappingService';
export { default as UserService } from './userService';
export { default as OCRService } from './ocrService';
export { default as WastageService } from './wastageService';
export { default as InventoryService } from './inventoryService';
export { default as DbStatusService } from './dbStatusService';

export { API_BASE_URL } from './apiClient';

// Service status checker
export class ServiceHealthChecker {
  static async checkAllServices() {
    // Import services dynamically to avoid circular dependencies
    const { default: HealthService } = await import('./healthService');
    const { default: StockInService } = await import('./stockInService');
    const { default: MenuService } = await import('./menuService');
    const { default: UsageService } = await import('./usageService');
    const { default: UnitMappingService } = await import('./unitMappingService');
    const { default: UserService } = await import('./userService');
    const { default: OCRService } = await import('./ocrService');
    const { default: WastageService } = await import('./wastageService');
    const { default: InventoryService } = await import('./inventoryService');

    const services = {
      health: HealthService.getHealth,
      stockIn: () => StockInService.getStockInRecords(1, 1),
      menu: MenuService.getMenuItems,
      usage: () => UsageService.getUsageRecords(1, 1),
      unitMapping: UnitMappingService.getUnitOptions,
      users: UserService.getUsers,
      ocr: () => OCRService.getUploadedImages(1, null, 1),
      wastage: WastageService.getWastageRecords,
      inventory: () => InventoryService.getInventoryItems(1, 1)
    };

    const results = {};
    
    for (const [serviceName, serviceMethod] of Object.entries(services)) {
      try {
        await serviceMethod();
        results[serviceName] = { status: 'healthy', error: null };
      } catch (error) {
        results[serviceName] = { status: 'error', error: error.message };
      }
    }
    
    return results;
  }
}