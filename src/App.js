import React, { useState, useEffect, useRef } from 'react';
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
import ApiConnectionTest from './components/ApiConnectionTest';
import { checkDatabaseStatus, logStartupInfo } from './services/dbStatusService';
import './utils/apiDebug'; // Temporary debug import
import authService from './services/authService';
import { setTenant } from './services/tenantContext';
import { debugTenantContext } from './services/tenantDebug';
import MinimalStock from './components/MinimalStock';
import CreateReorder from './components/CreateReorder';
import ComplementaryItems from './components/ComplementaryItems';
import QrBillingApp from './components/CHEF POINT OF VIEW/QrBillingApp';
import QRManagement from './components/QRManagement';
import MenuCard from './components/CHEF POINT OF VIEW/MenuCard';
// OwnerApp provides internal tab navigation; no separate OwnerFooterNav needed
import OwnerApp from './components/OWNER POINT OF VIEW/OwnerApp';
import QRBillingOnboarding from './components/QRBILLING ONBOARDING/QRBillingOnboarding';
import InventoryCalculator from './components/InventoryCalculator';
import WastageThresholds from './components/WastageThresholds';


function App() {
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const ensuredRef = useRef(false);
  // Track where the unit mapping flow was opened from: 'onboarding' | 'settings' | null
  const [mappingOrigin, setMappingOrigin] = useState(null);
  // Vendor selection state for CreateReorder workflow
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isSelectingVendor, setIsSelectingVendor] = useState(false);
  // Track whether onboarding is in progress to hide global chrome like footer
  const isAuthFlow = screen === 'login' || screen === 'signup' || screen === 'forgot';
  const isOnboarding = screen === 'onboarding' || screen === 'qr-onboarding';
  const isMappingFlow = screen === 'map' || screen === 'map1' || screen === 'map2' || screen === 'map3';

  // Toggle global CSS scope class on body depending on screen
  useEffect(() => {
    const shouldApplyGlobal = !(isAuthFlow || isOnboarding || isMappingFlow);
    const body = document.body;
    if (shouldApplyGlobal) {
      body.classList.add('app-global');
    } else {
      body.classList.remove('app-global');
    }
    // Toggle onboarding background theme similar to Chef/Owner shells
    if (screen === 'qr-onboarding') {
      document.body.classList.add('app-onboarding-active');
    } else {
      document.body.classList.remove('app-onboarding-active');
    }
    // Cleanup not strictly necessary; keep state-driven
  }, [isAuthFlow, isOnboarding, isMappingFlow, screen]);

  useEffect(() => {
    // Debug tenant context
    const currentTenant = debugTenantContext();
    
    // Initialize tenant context for development - try legacy format first
    setTenant('1');
    
    console.log('🏗️ App initialized with tenant:', currentTenant);
    
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

  // Ensure dining session when landing with table & businessId in the URL.
  // This lets the Amplify site create an active session on the same backend the dashboards use (Render by default).
  useEffect(() => {
    try {
      if (ensuredRef.current) return;
      const sp = new URLSearchParams(window.location.search);
      const table = sp.get('table') || sp.get('t');
      const bid = sp.get('businessId') || sp.get('bid') || sp.get('b');
      const sessionsBaseParam = sp.get('sessionsApiBase') || sp.get('apiBase');
      if (sessionsBaseParam) {
        try { localStorage.setItem('qr.sessionsApiBaseOverride', sessionsBaseParam.replace(/\/$/, '')); } catch(_) {}
        try { localStorage.setItem('qr.apiBaseOverride', sessionsBaseParam.replace(/\/$/, '')); } catch(_) {}
      }
      if (!table || !bid) return;
      ensuredRef.current = true;
      const sessionsBase = (sessionsBaseParam
        || localStorage.getItem('qr.sessionsApiBaseOverride')
        || localStorage.getItem('qr.apiBaseOverride')
        || process.env.REACT_APP_SESSIONS_API_BASE
        || process.env.REACT_APP_API_URL
        || '').replace(/\/$/, '');
      if (!sessionsBase) return;
      const url = `${sessionsBase}/api/qr/ensure-session`;
      const body = { businessId: Number(bid), tableNumber: String(table).trim() };
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok) throw new Error((data && (data.error||data.message)) || `HTTP ${r.status}`);
          console.log('[AMPLIFY][ENSURE_SESSION] ok', data);
        })
        .catch((e) => console.warn('[AMPLIFY][ENSURE_SESSION] failed', e?.message || e));
    } catch(_) {}
  }, []);

  // State for vendor category filtering
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState('All');

  // Vendor selection handlers
  const handleNavigateToVendors = (category = 'All') => {
    console.log('🔵 App.handleNavigateToVendors called with category:', category);
    setVendorCategoryFilter(category);
    setIsSelectingVendor(true);
    setScreen('vendors');
  };

  const handleVendorSelect = (vendor) => {
    console.log('🔵 App.handleVendorSelect called with vendor:', vendor);
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

  <div className="app-main">
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
          </div>
        )}
        {screen === 'onboarding' && (
          <OnboardingPage
            onContinue={(payload) => {
              // payload: { businessType, numWorkers, machineType, businessSizeName }
              // If QR is selected, go through QR Billing onboarding first; otherwise go to Unit Mapping directly
              const machine = (payload && payload.machineType) || '';
              if (machine === 'QR') {
                setScreen('qr-onboarding');
              } else {
                setMappingOrigin('onboarding');
                setScreen('map');
              }
            }}
          />
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
        {screen === 'qr-onboarding' && (
          <QRBillingOnboarding
            onComplete={() => {
              // After finishing QR Billing onboarding, continue with Unit Mapping flow
              setMappingOrigin('onboarding');
              setScreen('map');
            }}
          />
        )}
        {screen === 'test' && <TestUnitMapping />}
        {screen === 'api-test' && <ApiConnectionTest />}
        {screen === 'service-test' && <ServiceTester goTo={setScreen} />}
        {screen === 'map' && <MapStep1 goTo={setScreen} />}
        {screen === 'map1' && (
          <KitchenUnitsStep 
            goTo={setScreen} 
            mappingOrigin={mappingOrigin}
            clearMappingOrigin={() => setMappingOrigin(null)}
          />
        )}
        {screen === 'map2' && <SupplierConversions goTo={setScreen} />}
        {screen === 'map3' && <UnitMappingComplete goTo={setScreen} />}
        {screen === 'itemmap' && <RecipeListScreen goTo={setScreen} />}
        {screen === 'dashboard' && <Dashboard goTo={setScreen} currentUser={currentUser} />}
        {screen === 'notifications' && <Notification goTo={setScreen} />}
        {screen === 'overview' && <InventoryOverview goTo={setScreen} />}
  {screen === 'inventory' && <InventoryOverview goTo={setScreen} />}
  {screen === 'abc' && <Abc goTo={setScreen} />}
  {screen === 'stock-in-scan' && <InventoryOverview goTo={setScreen} initialTab="stock-in" />}
  {screen === 'stock-in' && <StockInForm goTo={setScreen} />}
        {screen === 'stock-out' && <StockOutForm goTo={setScreen} />}
        {screen === 'usage' && <Usage goTo={setScreen} />}
        {screen === 'todays-sales-report' && <TodaysSalesReport goTo={setScreen} />}
        {screen === 'ocr' && <OCRUpload goTo={setScreen} />}
  {screen === 'qr-billing' && <QrBillingApp />}
  {screen === 'qr-management' && <QRManagement goTo={setScreen} />}
  {screen === 'menu-card' && <MenuCard goTo={setScreen} />}
  {screen === 'inventory-calculator' && <InventoryCalculator goTo={setScreen} />}
  {screen === 'wastage-thresholds' && <WastageThresholds goTo={setScreen} />}
  {screen === 'owner-dashboard' && <OwnerApp />}
  {screen === 'complimentary-items' && <ComplementaryItems />}
        {screen === 'vendors' && (
          <VendorManagement 
            onNavigateBack={handleVendorManagementBack}
            isSelectingMode={isSelectingVendor}
            onSelectVendor={handleVendorSelect}
            initialCategoryFilter={vendorCategoryFilter}
          />
        )}
  {screen === 'minimal-stock' && <MinimalStock goTo={setScreen} />}
        {screen === 'create-reorder' && (
          <CreateReorder 
            onNavigateBack={() => setScreen('minimal-stock')} 
            onNavigateToVendor={handleNavigateToVendors}
            selectedVendor={selectedVendor}
            onClearSelectedVendor={handleClearSelectedVendor}
            goTo={setScreen}
          />
        )}
        {screen === 'reports' && <ReportsScreen goTo={setScreen} />}
        {screen === 'sales-report' && <SalesReport goTo={setScreen} />}
        {screen === 'settings' && <SettingsPage goTo={setScreen} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
      </div>

    {/* Fixed Footer Navigation across the project after login (hide inside QR Billing to avoid double footers) */}
  {/* Show global footer except for chef app & owner POV specialized pages */}
  {!isAuthFlow && !isOnboarding && !isMappingFlow && screen !== 'qr-billing' && screen !== 'owner-dashboard' && (
      <FooterNav current={screen} goTo={setScreen} />
    )}
  {/* OwnerApp has its own internal tab bar; global footer hidden when owner-dashboard */}
    </div>
  );
}
export default App;
