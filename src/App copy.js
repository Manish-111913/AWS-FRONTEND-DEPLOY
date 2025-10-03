import React, { useState, useEffect } from 'react';
import './App.css';
import InventoryOverview from './components/InventoryOverview';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import OnboardingPage from './components/OnboardingPage';
// import Notification from "./components/notifications"; // Commented out - not used
import MapStep1 from './components/map';
import KitchenUnitsStep from './components/map1';
import SupplierConversions from './components/map2';
import UnitMappingComplete from './components/map3';
import RecipeListScreen from './components/itemmap';
import ReportsScreen from './components/reportscreen';
import SalesReport from './components/SalesReport';
import TestUnitMapping from './components/TestUnitMapping';
import StockInForm from './components/StockInForm';
import StockOutForm from './components/StockOutForm';
import Usage from './components/Usage';
import OCRUpload from './components/OCRUpload';
import VendorManagement from './components/VendorManagement';
import TodaysSalesReport from './components/TodaysSalesReport';
import Navigation from './components/Navigation';
import FooterNav from './components/FooterNav';
import SettingsPage from './components/SettingsPage';
import ServiceTester from './components/ServiceTester';
import { checkDatabaseStatus, logStartupInfo } from './services/dbStatusService';


function App() {
  const [screen, setScreen] = useState('login');
  // Track whether onboarding is in progress to hide global chrome like footer
  const isAuthFlow = screen === 'login' || screen === 'signup' || screen === 'forgot';
  const isOnboarding = screen === 'onboarding';

  useEffect(() => {
    // Log startup information and check database status
    logStartupInfo();

    // Check database status after a short delay to ensure backend is ready
    const checkDB = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await checkDatabaseStatus();
    };

    checkDB();
  }, []);

  return (
    <div className="App">
      {/* Top Navigation - only show after login; keep width capped */}
  {!isAuthFlow && !isOnboarding && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Navigation currentScreen={screen} goTo={setScreen} />
        </div>
      )}

  <main className="app-main">
        {screen === 'login' && (
          <div>
            <LoginScreen
      onLogin={() => setScreen('onboarding')}
              onForgotPassword={() => setScreen('forgot')}
              onSignUp={() => setScreen('signup')}
            />
            <div style={{ position: 'fixed', top: '10px', right: '10px' }}>
              <button
                onClick={() => setScreen('test')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🧪 Test API
              </button>
            </div>
          </div>
        )}
        {screen === 'onboarding' && (
          <OnboardingPage onContinue={() => setScreen('dashboard')} />
        )}
        {screen === 'signup' && (
          <SignUpScreen
            onBack={() => setScreen('login')}
            onSignUp={(data) => alert('Sign up pressed (no backend): ' + JSON.stringify(data))}
          />
        )}
        {screen === 'forgot' && (
          <ForgotPasswordScreen
            onBack={() => setScreen('login')}
            onSendReset={(email) => alert('Reset link sent to: ' + email)}
          />
        )}
        {screen === 'test' && <TestUnitMapping />}
        {screen === 'service-test' && <ServiceTester goTo={setScreen} />}
        {screen === 'map' && <MapStep1 goTo={setScreen} />}
        {screen === 'map1' && <KitchenUnitsStep goTo={setScreen} />}
        {screen === 'map2' && <SupplierConversions goTo={setScreen} />}
        {screen === 'map3' && <UnitMappingComplete goTo={setScreen} />}
        {screen === 'itemmap' && <RecipeListScreen goTo={setScreen} />}
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'overview' && <InventoryOverview />}
        {screen === 'inventory' && <InventoryOverview />}
        {screen === 'stock-in' && <StockInForm goTo={setScreen} />}
        {screen === 'stock-out' && <StockOutForm goTo={setScreen} />}
        {screen === 'usage' && <Usage goTo={setScreen} />}
        {screen === 'todays-sales-report' && <TodaysSalesReport goTo={setScreen} />}
        {screen === 'ocr' && <OCRUpload goTo={setScreen} />}
        {screen === 'vendors' && <VendorManagement goTo={setScreen} />}
        {screen === 'settings' && <SettingsPage goTo={setScreen} />}
        {screen === 'reports' && <ReportsScreen goTo={setScreen} />}
        {screen === 'sales-report' && <SalesReport goTo={setScreen} />}
      </main>

      {/* Fixed Footer Navigation across the project after login */}
  {!isAuthFlow && !isOnboarding && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0 }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <FooterNav current={screen} goTo={setScreen} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
