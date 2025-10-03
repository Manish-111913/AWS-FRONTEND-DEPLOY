import React, { useMemo, useState, useEffect, useRef } from 'react';
import { http } from '../../services/apiClient';
// Base layout/styles for the onboarding flow
import './styles.css';

// Step-specific components and styles
import TableConfigurationStep from './TableConfigurationStep';
import BusinessModelStep from './BusinessModelStep';
import LoyaltyFeatureStep from './LoyaltyFeatureStep';
import QRGenerationStep from './QRGenerationStep';

function Progress({ step, allowJump, onJump }) {
  const items = [1,2,3,4];
  return (
    <div className="qro-progress qro-container">
      {items.map((n,i)=>{
        const active = step >= n;
        const done = step > n;
        const clickable = allowJump;
        return (
          <React.Fragment key={n}>
            <div
              className={`qro-dot${active ? ' qro-active' : ''}${clickable ? ' qro-clickable' : ''}`}
              style={clickable ? {cursor:'pointer'} : {}}
              onClick={() => clickable && onJump(n)}
              title={clickable ? `Go to Step ${n}` : ''}
            >{done ? '✓' : String(n)}</div>
            {i < items.length-1 && <div className={`qro-line${done ? ' qro-active' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function QRBillingOnboarding({ onComplete }) {
  const totalSteps = 4;
  const STORAGE_KEY = 'qr_billing_onboarding_persist_v1';
  const COMPLETION_KEY = 'onboarding_qr_billing_completed';
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tableCount: 0,
    tableConfiguration: [],
    businessModel: '',
    loyaltyEnabled: false,
    pointsPerDollar: 1,
    rewards: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const saveRef = useRef(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.formData) setFormData(f => ({ ...f, ...parsed.formData }));
          if (typeof parsed.currentStep === 'number') setCurrentStep(Math.min(parsed.currentStep, totalSteps));
        }
      }
    } catch(_) {}
    try { if (localStorage.getItem(COMPLETION_KEY) === 'true') setCompleted(true); } catch(_){}
    setHydrated(true);
  }, []);

  // Persist changes (debounced)
  useEffect(() => {
    if (!hydrated) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, formData })); } catch(_){}
    }, 250);
  }, [currentStep, formData, hydrated]);

  const updateFormData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const isStepValid = useMemo(() => {
    if (currentStep === 1) return formData.tableCount > 0 && (formData.tableConfiguration || []).length > 0;
    if (currentStep === 2) return !!formData.businessModel;
    if (currentStep === 3) return true; // loyalty is optional
    return true;
  }, [currentStep, formData]);

  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 1:
        return 'QR Billing Setup';
      case 2:
        return 'Business Model';
      case 3:
        return 'Loyalty Program';
      default:
        return 'QR Code Generation';
    }
  }, [currentStep]);

  // Icons are rendered via lucide-react components in step files; no window hooks needed.

  const content = useMemo(() => {
    if (currentStep === 1) return <TableConfigurationStep formData={formData} updateFormData={updateFormData} />;
    if (currentStep === 2) return <BusinessModelStep formData={formData} updateFormData={updateFormData} />;
    if (currentStep === 3) return <LoyaltyFeatureStep formData={formData} updateFormData={updateFormData} />;
    return <QRGenerationStep formData={formData} updateFormData={updateFormData} />;
  }, [currentStep, formData]);

  const onNext = () => {
    if (!isStepValid) return;
    setCurrentStep((s) => {
      if (s === totalSteps) {
        // Provision tables to backend before finishing
        const payload = { tables: formData.tableConfiguration || [] };
        // Persist chosen business model for owner dashboard color logic
        try { if (formData.businessModel) localStorage.setItem('qr_billing_business_model', formData.businessModel); } catch(_){}
        http.post('/qr/sync-config', payload).then(()=>{
          try { localStorage.setItem(COMPLETION_KEY,'true'); setCompleted(true); } catch(_){ }
          alert(completed ? 'Changes re-synced successfully.' : 'Setup Complete! You can revisit any step now.');
          if (!completed && typeof onComplete === 'function') onComplete();
        }).catch(e=>{
          console.error('Failed to sync tables', e);
          try { localStorage.setItem(COMPLETION_KEY,'true'); setCompleted(true); } catch(_){ }
          alert('Sync attempt finished with issues: ' + (e.message||'Error'));
          if (!completed && typeof onComplete === 'function') onComplete();
        });
        return s;
      }
      return s + 1;
    });
  };

  const onBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  if (!hydrated) return <div style={{padding:40,color:'#fff'}}>Loading...</div>;

  const allowJump = completed;
  const handleJump = (n) => { if (allowJump) setCurrentStep(n); };

  return (
    <div className="qr-onboarding-root">
      <div className="qro-header">
        <div className="qro-container">
          <div className="qro-logo">INVEXIS</div>
          <div className="qro-subtitle">QR Billing Setup</div>
        </div>
      </div>
      <Progress step={currentStep} allowJump={allowJump} onJump={handleJump} />
      <div className="qro-container qro-content">
        <h2 className="qro-title">{stepTitle}</h2>
        {content}
        {completed && <div style={{marginTop:12,fontSize:12,color:'#9ca3af'}}>Setup complete. Click any step above to review or adjust and press "Re-Sync & Save" on step 4 to apply changes.</div>}
      </div>
      <div className="qro-nav">
          {currentStep > 1 && (
            <button className="qro-btn" onClick={onBack}>
              Back
            </button>
          )}
          <button
            className={`qro-btn qro-btn--primary qro-flex-1${!isStepValid ? ' disabled' : ''}`}
            onClick={onNext}
            disabled={!isStepValid}
          >
            {currentStep === totalSteps ? (completed ? 'Re-Sync & Save' : 'Complete Setup') : 'Next'}
          </button>
      </div>
    </div>
  );
}
