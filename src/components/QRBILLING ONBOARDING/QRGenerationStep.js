import React, { useEffect, useState } from 'react';
import { Star, QrCode, Link, Copy, Download, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/apiClient';
import { getTenant } from '../../services/tenantContext';

export default function QRGenerationStep({ formData, updateFormData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratedOnce, setIsGeneratedOnce] = useState(false); // ever generated or existing found
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qrResults, setQrResults] = useState([]); // { table_number, qr_code_id, scan_url, png }
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [regenMode, setRegenMode] = useState(false); // force regeneration

    const bestSpots=(formData.tableConfiguration||[]).filter(t=>t.isBestSpot);

    const extractTableNumber = (t, idx) => {
      const name = t.name || '';
      const m = name.match(/(\d+)/) || (t.id && String(t.id).match(/(\d+)/));
      return m ? m[1] : String(idx+1);
    };

    const loadExisting = async (withPng=false) => {
      setLoadingExisting(true);
      setError('');
      try {
        const sp = new URLSearchParams(window.location.search);
        const bidFromUrl = sp.get('businessId') || sp.get('bid') || sp.get('b');
        const businessId = Number(getTenant?.() || formData.businessId || bidFromUrl || 1);
        const resp = await fetch(`${API_BASE_URL}/qr/list?businessId=${encodeURIComponent(businessId)}&includePng=${withPng?1:0}`);
        const data = await resp.json();
        if (!resp.ok) {
          const msg = `${data.error || 'Failed to load existing QRs'}${data.detail?`: ${data.detail}`:''}`;
          throw new Error(msg);
        }
        const sorted = (data.qrs||[]).slice().sort((a,b)=> parseInt((a.numeric_table||a.table_number)||0)-parseInt((b.numeric_table||b.table_number)||0));
        setQrResults(sorted);
        if (sorted.length) setIsGeneratedOnce(true);
        // Map into formData.tableConfiguration
        const enriched = (formData.tableConfiguration||[]).map((t, idx)=>{
          const num = extractTableNumber(t, idx);
          const found = sorted.find(q=> String(q.numeric_table||q.table_number) === String(num));
            return { ...t, anchor_url: found?.scan_url, qr_id: found?.qr_id };
        });
        updateFormData({ tableConfiguration: enriched });
        return { count: sorted.length, migrated: !!data.migrated };
      } catch(e) {
        console.error('loadExisting failed', e);
        setError(e.message);
        return { count: 0, migrated: false };
      } finally { setLoadingExisting(false); }
    };

  useEffect(()=>{ 
      (async () => {
        const { count, migrated } = await loadExisting(false);
        if (count === 0 && !migrated && (formData.tableConfiguration||[]).length) {
          await generate(true); // initial creation
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const generate = async (forceAll=false) => {
      if (isGenerating) return;
      setError('');
      setIsGenerating(true);
      try {
        // Determine desired tables 1..tableCount (or derived names) and which are missing
        const config = (formData.tableConfiguration||[]);
        const desired = config.map((t, idx)=> extractTableNumber(t, idx));
  const existingNums = new Set(qrResults.map(q=> String(q.numeric_table||q.table_number)));
        let toGenerate = forceAll ? desired : desired.filter(n=> !existingNums.has(String(n)));
        toGenerate = Array.from(new Set(toGenerate)); // dedupe
        if (!toGenerate.length && !forceAll) {
          setIsGeneratedOnce(true);
          // If user wants PNGs but existing list had no png, reload with PNG.
          if (!qrResults.some(q=> q.png)) await loadExisting(true);
          return;
        }
        const sp = new URLSearchParams(window.location.search);
        const bidFromUrl = sp.get('businessId') || sp.get('bid') || sp.get('b');
        const businessId = Number(getTenant?.() || formData.businessId || bidFromUrl || 1);
        const payload = { businessId, tables: toGenerate, includePng: true };
        try { console.log('[QRGeneration] bulk-generate payload', payload, 'API:', API_BASE_URL); } catch(_) {}
        const resp = await fetch(`${API_BASE_URL}/qr/bulk-generate`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (!resp.ok) {
          const msg = `${data.error || 'Failed to bulk generate'}${data.detail?`: ${data.detail}`:''}${data.code?` [${data.code}]`:''}`;
          throw new Error(msg);
        }
        const merged = [...qrResults];
        for (const q of (data.qrs||[])) {
          const qKey = String(q.numeric_table||q.table_number);
          const idxExisting = merged.findIndex(x=> String(x.numeric_table||x.table_number)===qKey);
          if (idxExisting>=0) merged[idxExisting]=q; else merged.push(q);
        }
        const allSorted = merged.slice().sort((a,b)=> parseInt((a.numeric_table||a.table_number)||0)-parseInt((b.numeric_table||b.table_number)||0));
        setQrResults(allSorted);
        setIsGeneratedOnce(true);
        // Update formData
        const enriched = config.map((t, idx)=>{
          const num = extractTableNumber(t, idx);
          const found = allSorted.find(q=> String(q.numeric_table||q.table_number)===String(num));
          return { ...t, anchor_url: found?.scan_url, qr_id: found?.qr_id };
        });
        updateFormData({ tableConfiguration: enriched });
      } catch(e) {
        console.error('generate failed', e);
        setError(e.message || 'Generation failed');
      } finally { setIsGenerating(false); }
    };

    const download = async () => {
      if (!qrResults.length) return;
      setDownloading(true);
      try {
        for (const qr of qrResults) {
          if (!qr.png) continue;
          const a = document.createElement('a');
          a.href = qr.png;
          a.download = `QR-Table-${qr.table_number}.png`;
          a.click();
          await new Promise(r=> setTimeout(r,100));
        }
      } catch (e) { console.error('Download failed', e); setError('Some downloads failed: ' + e.message); }
      finally { setDownloading(false); }
    };

  const openModal=(t)=>{ setSelected(t); setModalOpen(true); };
    const closeModal=()=>{ setModalOpen(false); setSelected(null); };

    const businessModelText = formData.businessModel==='pay-first'? 'Pay First, Eat Later' : 'Eat First, Pay Later';

  useEffect(() => {
    // refresh icons upon (re)render of this component
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  });

  useEffect(() => {
    if (modalOpen && selected && window.QRCode && document.getElementById('qr-box')) {
      const el = document.getElementById('qr-box');
      el.innerHTML = '';
      const url = `https://restaurant.app/table/${selected.id}`;
      try {
        window.QRCode.toCanvas(url, { width: 200, margin: 2 }, function (err, canvas) {
          if (!err) {
            el.appendChild(canvas);
          }
        });
      } catch (e) {
        el.textContent = 'QR could not be generated';
      }
    }
  }, [modalOpen, selected]);

  return (
    <div>
      <p className="qro-center" style={{ color: '#9CA3AF', lineHeight: '24px', marginBottom: '24px' }}>
        {'Review your configuration and generate unique QR codes for each table. Each QR code will be linked to your restaurant\'s billing system.'}
      </p>

      <div className="qro-card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Configuration Summary</div>
        <div style={{ marginBottom: 12, color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Restaurant Setup
        </div>
        <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <div>Total Tables:</div>
          <div style={{ fontWeight: 600 }}>{String(formData.tableCount || 0)}</div>
        </div>
        <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <div>Business Model:</div>
          <div style={{ fontWeight: 600 }}>{businessModelText}</div>
        </div>
        <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <div>Best Spots:</div>
          <div style={{ fontWeight: 600 }}>{String(bestSpots.length)}</div>
        </div>
        {formData.loyaltyEnabled && (
          <div>
            <div style={{ marginTop: 12, color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Loyalty Program
            </div>
            <div className="qro-row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <div>Points per $1:</div>
              <div style={{ fontWeight: 600 }}>{String(formData.pointsPerDollar || 1)}</div>
            </div>
            <div className="qro-row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <div>Rewards Available:</div>
              <div style={{ fontWeight: 600 }}>{String((formData.rewards || []).length)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="qro-card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Tables & QR Codes</div>
        <div style={{ color: '#9CA3AF', marginBottom: 12 }}>Each table will get a unique QR code for customer access</div>
        {(formData.tableConfiguration || []).map((t, i) => {
          const numMatch = /(\d+)$/.exec(t.name || t.id || '');
          const backendMatch = qrResults.find(q=> {
            const key = String(numMatch ? numMatch[1] : '');
            return String(q.numeric_table || q.table_number) === key;
          });
          const hasQr = !!backendMatch;
          return (
          <div key={t.id} className="qro-table-item">
            <div className="qro-table-header">
              <div className="qro-table-num">{String(i + 1)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div className="qro-badge">{hasQr ? `QR Ready` : `Pending`}</div>
              </div>
              <div className="qro-row">
                {t.isBestSpot && (
                  <div className="qro-badge" style={{ gap: 4 }}>
                    <Star size={14} />
                  </div>
                )}
                <button className="qro-btn" disabled={!hasQr} onClick={() => openModal({ ...t, anchor_url: backendMatch?.scan_url, qr_id: backendMatch?.qr_id, png: backendMatch?.png })}>
                  <QrCode size={16} /> {hasQr ? 'Show QR' : 'Waiting...'}
                </button>
              </div>
            </div>
          </div>
        ); })}
      </div>

      <div className="qro-card" style={{ marginBottom: 24 }}>
  {error && <div style={{ color:'#F87171', marginBottom:12, fontSize:14 }}>{error}</div>}
        {!isGeneratedOnce ? (
          <>
            <button className="qro-btn qro-btn--primary" onClick={()=>generate(false)} disabled={isGenerating||loadingExisting}>
              {isGenerating ? 'Generating...' : 'Generate Missing QR Codes'}
            </button>
            <button className="qro-btn" style={{marginLeft:8}} onClick={()=>loadExisting(true)} disabled={isGenerating||loadingExisting}>{loadingExisting ? 'Loading...' : 'Fetch Existing'}</button>
          </>
        ) : (
          <div className="qro-center" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{ color: '#10B981', fontWeight: 600, marginBottom: 6 }}>QR Codes Ready</div>
            <div style={{ color: '#9CA3AF', marginBottom: 12, textAlign:'center' }}>Missing tables are generated automatically; you can refresh, download, or force full regeneration.</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center'}}>
              <button className="qro-btn" onClick={download} disabled={downloading}>{downloading ? 'Preparing...' : 'Download All PNGs'}</button>
              <button className="qro-btn" onClick={()=>generate(false)} disabled={isGenerating}>{isGenerating ? 'Updating...' : 'Generate Missing'}</button>
              <button className="qro-btn" onClick={()=>generate(true)} disabled={isGenerating} title="Force regeneration for all tables"><RefreshCw size={14}/> {isGenerating ? 'Working...' : 'Regenerate All'}</button>
              <button className="qro-btn" onClick={()=>loadExisting(true)} disabled={loadingExisting||isGenerating}>{loadingExisting ? 'Refreshing...' : 'Refresh List'}</button>
            </div>
          </div>
        )}
      </div>

      <div className="qro-card">
        <div className="qro-row" style={{ gap: 8, marginBottom: 12 }}>
          <div className="qro-badge">ℹ</div>
          <div style={{ fontWeight: 600 }}>Next Steps</div>
        </div>
        <div className="qro-list">
          {[
            'Download and print the QR codes PDF',
            'Place each QR code on its corresponding table',
            'Test the QR codes with your mobile device',
            'Your QR billing system is ready to use!',
          ].map((t, i) => (
            <div key={i} className="qro-row" style={{ gap: 12 }}>
              <div className="qro-table-num" style={{ width: 24, height: 24, borderRadius: 12 }}>{String(i + 1)}</div>
              <div style={{ color: '#D1D5DB' }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`qro-modal${modalOpen ? ' qro-open' : ''}`}>
        <div className="qro-modal-content">
          <div className="qro-modal-header">
            <div className="qro-modal-title">{(selected && selected.name) || 'Table QR Code'}</div>
            <button className="qro-btn" onClick={closeModal}>Close</button>
          </div>
          {selected && selected.anchor_url ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              {selected.png ? (
                <img src={selected.png} alt={selected.anchor_url} style={{width:220,height:220, background:'#fff', padding:4, borderRadius:4}} />
              ) : (
                <div style={{width:220,height:220,display:'flex',alignItems:'center',justifyContent:'center',background:'#1f2937',color:'#9CA3AF',fontSize:12}}>PNG not available</div>
              )}
              <div style={{ width:'100%', background:'#111827', color:'#F9FAFB', padding:12, borderRadius:8, fontSize:14 }}>
                <div style={{ fontWeight:600, marginBottom:6 }}>Details</div>
                <div style={{ marginBottom:4 }}>Table: {selected.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <Link size={14} /> <span style={{ wordBreak:'break-all' }}>{selected.anchor_url}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="qro-btn" onClick={()=>{ navigator.clipboard.writeText(selected.anchor_url).then(()=>{}); }}><Copy size={14}/> Copy URL</button>
                <button className="qro-btn" onClick={async()=>{
                  try {
                    if (selected.png) {
                      const a = document.createElement('a');
                      a.href = selected.png;
                      a.download = `QR-${selected.name.replace(/\s+/g,'-')}.png`;
                      a.click();
                    }
                  } catch (e) { console.error(e); }
                }}><Download size={14}/> Download</button>
              </div>
            </div>
          ) : (
            <div style={{ padding:32, textAlign:'center' }}>QR not ready yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

