import React, { useState, useEffect } from 'react';
import './App.css';
import InventoryOverview from './components/InventoryOverview';
import Abc from './components/abc';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import OnboardingPage from './components/OnboardingPage';
import Notification from "./components/notifications";
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
import authService from './services/authService';
import MinimalStock from './components/MinimalStock';
import CreateReorder from './components/CreateReorder';
import ChefPage from './components/CHEF POINT OF VIEW/ChefPage';
import QrBillingApp from './components/CHEF POINT OF VIEW/QrBillingApp';


function App() {
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  // Vendor selection state for CreateReorder workflow
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isSelectingVendor, setIsSelectingVendor] = useState(false);
  // Track whether onboarding is in progress to hide global chrome like footer
  const isAuthFlow = screen === 'login' || screen === 'signup' || screen === 'forgot';
  const isOnboarding = screen === 'onboarding';
  const isMappingFlow = screen === 'map' || screen === 'map1' || screen === 'map2' || screen === 'map3';

  useEffect(() => {
    // Log startup information and check database status
    logStartupInfo();

    // Check for existing user session
    const existingUser = authService.getCurrentUser();
    if (existingUser && authService.isAuthenticated()) {
      setCurrentUser(existingUser);
      setScreen('dashboard'); // Go directly to dashboard if logged in
    }

    // Check database status after a short delay to ensure backend is ready
    const checkDB = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await checkDatabaseStatus();
    };

    checkDB();
  }, []);

  // Vendor selection handlers
  const handleNavigateToVendors = () => {
    setIsSelectingVendor(true);
    setScreen('vendors');
  };

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setIsSelectingVendor(false);
    setScreen('create-reorder');
  };

  const handleClearSelectedVendor = () => {
    setSelectedVendor(null);
  };

  const handleVendorManagementBack = () => {
    if (isSelectingVendor) {
      setIsSelectingVendor(false);
      setScreen('create-reorder');
    } else {
      setScreen('dashboard');
    }
  };

  return (
    <div className="App">
    {/* Top Navigation - show after auth across all screens */}
  {!isAuthFlow && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Navigation currentScreen={screen} goTo={setScreen} />
        </div>
      )}

  <main className="app-main">
        {screen === 'login' && (
          <div>
            <LoginScreen
              onLogin={(userData) => {
                setCurrentUser(userData);
                setScreen('onboarding');
              }}
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
          <OnboardingPage onContinue={() => setScreen('map')} />
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
        {screen === 'dashboard' && <Dashboard goTo={setScreen} currentUser={currentUser} />}
        {screen === 'notifications' && <Notification goTo={setScreen} />}
        {screen === 'overview' && <InventoryOverview goTo={setScreen} />}
  {screen === 'inventory' && <InventoryOverview goTo={setScreen} />}
  {screen === 'abc' && <Abc />}
  {screen === 'stock-in-scan' && <InventoryOverview goTo={setScreen} initialTab="stock-in" />}
  {screen === 'stock-in' && <StockInForm goTo={setScreen} />}
        {screen === 'stock-out' && <StockOutForm goTo={setScreen} />}
        {screen === 'usage' && <Usage goTo={setScreen} />}
        {screen === 'todays-sales-report' && <TodaysSalesReport goTo={setScreen} />}
        {screen === 'ocr' && <OCRUpload goTo={setScreen} />}
        {screen === 'vendors' && (
          <VendorManagement 
            onNavigateBack={handleVendorManagementBack}
            isSelectingMode={isSelectingVendor}
            onSelectVendor={handleVendorSelect}
          />
        )}
  {screen === 'minimal-stock' && <MinimalStock goTo={setScreen} />}
        {screen === 'create-reorder' && (
          <CreateReorder 
            onNavigateBack={() => setScreen('minimal-stock')} 
            onNavigateToVendor={handleNavigateToVendors}
            selectedVendor={selectedVendor}
            onClearSelectedVendor={handleClearSelectedVendor}
          />
        )}
        {screen === 'settings' && <SettingsPage goTo={setScreen} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        {screen === 'reports' && <ReportsScreen goTo={setScreen} />}
        {screen === 'sales-report' && <SalesReport goTo={setScreen} />}
        {screen === 'chef' && <ChefPage />}
        {screen === 'qr-billing' && <QrBillingApp />}
      </main>

      {/* Fixed Footer Navigation across the project after login */}
  {!isAuthFlow && !isOnboarding && !isMappingFlow && (
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
