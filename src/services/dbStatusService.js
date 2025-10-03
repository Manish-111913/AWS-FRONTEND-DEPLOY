import { http } from './apiClient';

export const checkDatabaseStatus = async () => {
  try {
    const data = await http.get('/health/db-status', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (data.success) {
      const dbType = data.isOnlineDB ? '🌐 ONLINE DATABASE' : '💻 LOCAL DATABASE';
      
      console.log(`%c🗄️ DATABASE CONNECTION STATUS`, 'color: #4CAF50; font-weight: bold; font-size: 14px;');
      console.log(`%c${dbType}`, `color: ${data.isOnlineDB ? '#2196F3' : '#FF9800'}; font-weight: bold; font-size: 12px;`);
      
      return data;
    }
  } catch (error) {
    // Silent failure - no error logs
    return null;
  }
};

export const logStartupInfo = () => {
  // No startup info - only database status will be shown
};

const DbStatusService = {
  checkDatabaseStatus,
  logStartupInfo
};

export default DbStatusService;