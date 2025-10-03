import React, { useState, useEffect, useRef, useCallback } from 'react';
import { faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faCalendar as faCalendarRegular } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './StockInForm-module.css';
import { matchItem, matchItemWithSuggestions } from '../utils/matchHelpers.js';
import { http } from '../services/apiClient';
import UnitMappingService from '../services/unitMappingService';

// API calls now use centralized api client

const genUid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const emptyItem = () => ({
  uid: genUid(),
  item_name: '',
  lastStableName: '', // track last confirmed name to prevent unintended overwrites
  original_ocr_name: '', // preserve original OCR extracted text
  category: '',
  quantity: '',
  unit: '',
  unit_price: '',
  batch_number: '',
  expiry_date: '',
  time: new Date().toTimeString().slice(0, 5),
  matchStatus: 'pending' // Don't mark as 'none' until user finishes typing
});

// Calendar custom select (Usage-style dropdown) extracted to module scope to preserve state across re-renders
const CalendarSelect = ({ options, value, onChange, width = 140 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div
      className="calendar-select"
      ref={ref}
      style={{ width }}
      onMouseDown={(e) => {
        // Prevent overlay from seeing this interaction
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Contain clicks within the popup
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        className="calendar-select-trigger"
        onClick={() => setOpen(v => !v)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span>{current?.label}</span>
        <span className="calendar-select-caret">▾</span>
      </button>
      {open && (
        <div
          className="calendar-select-menu"
          style={{ width }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="calendar-select-list standard-scrollbar">
            {options.map(opt => (
              <div
                key={opt.value}
                className={`calendar-select-option${opt.value === value ? ' selected' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Usage-style dropdown (matches Usage.css shift dropdown)
// Generic component to render a styled dropdown with label/right text support
const UsageStyleDropdown = ({
  options = [], // array of { value, label, rightText? } or strings
  value,
  onChange,
  placeholder = 'Select',
  style = {},
  className = '',
  contained = false // when true, menu should stay inside parent card (no absolute overlay)
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [flipUp, setFlipUp] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(240);

  const normalized = options.map(opt =>
    typeof opt === 'string'
      ? { value: opt, label: opt }
      : { value: opt.value ?? opt.label, label: opt.label ?? String(opt.value ?? ''), rightText: opt.rightText || opt.time }
  );

  const current = normalized.find(o => o.value === value) || null;

  useEffect(() => {
    const onDocDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // When opened, compute if dropdown would overflow item-box and adjust
  useEffect(() => {
    if (!open) return;
    const triggerEl = ref.current;
    const menuEl = menuRef.current;
    if (!triggerEl || !menuEl) return;
    // Find nearest item-box ancestor
    const itemBox = triggerEl.closest('.item-box');
    if (!itemBox) return; // fallback: do nothing
    const boxRect = itemBox.getBoundingClientRect();
    const triggerRect = triggerEl.getBoundingClientRect();
    const viewportBottom = boxRect.bottom; // we only care inside box
    const spaceBelow = viewportBottom - triggerRect.bottom - 4; // 4px gap
  const desired = 200; // reduced desired height to keep menu shorter inside card
    if (spaceBelow >= 140) { // enough space to show downward
      setFlipUp(false);
      setMenuMaxHeight(Math.min(desired, spaceBelow));
    } else {
      // Try flipping upwards inside box
      const spaceAbove = triggerRect.top - boxRect.top - 4;
      if (spaceAbove > spaceBelow) {
        setFlipUp(true);
        setMenuMaxHeight(Math.min(desired, spaceAbove));
      } else {
        setFlipUp(false);
        setMenuMaxHeight(Math.max(120, Math.min(desired, spaceBelow)));
      }
    }
  }, [open]);

  return (
    <div className={`relative ${className} ${contained ? 'dropdown-contained-wrapper' : ''}`} ref={ref} style={{ position: 'relative', ...(style || {}) }}>
      <div className="shift-select" onClick={() => setOpen(o => !o)}>
        <div className="input-text-wrapper">
          <span className="shift-details">
            {current ? (
              <>
                <span className="shift-name">{current.label}</span>
                {current.rightText && <span className="shift-time">{current.rightText}</span>}
              </>
            ) : (
              <span className="shift-name" style={{ color: '#888' }}>{placeholder}</span>
            )}
          </span>
        </div>
        <span className="chevron-down" />
      </div>
      {open && (
        <div
          ref={menuRef}
          className={`shift-dropdown-options ${contained ? 'contained' : ''} ${flipUp ? 'flip-up' : ''}`}
          style={!contained ? { maxHeight: menuMaxHeight + 40 } : undefined}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e)=>e.stopPropagation()}
        >
          <div className="select-list" style={{ maxHeight: menuMaxHeight }}>
            {normalized.map(opt => (
              <div
                key={String(opt.value)}
                className="shift-option"
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="shift-name">{opt.label}</span>
                {opt.rightText && <span className="shift-time">{opt.rightText}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
const StockInForm = ({ ocrData = null, onBack = null, onSuccess = null }) => {
  // Vendor info state
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [currentShift, setCurrentShift] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [totalCost, setTotalCost] = useState(0);
  const [batchCounter, setBatchCounter] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Expiry custom calendar state
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [expiryPickerIndex, setExpiryPickerIndex] = useState(null);
  const [expiryViewDate, setExpiryViewDate] = useState(new Date());
  // Undo / revert state
  const [originalItems, setOriginalItems] = useState([]); // snapshot of OCR loaded or initial manual
  const [itemErrors, setItemErrors] = useState({}); // idx -> array of error strings
  // Track which names the user has locked (selected via suggestion or manual edit after which we freeze)
  const [lockedNames, setLockedNames] = useState(new Set()); // store item.uid values that are locked

  // Helpers for calendar
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const openExpiryPicker = (idx) => {
    setExpiryPickerIndex(idx);
    const cur = items[idx]?.expiry_date;
    setExpiryViewDate(cur ? new Date(cur) : new Date());
    setShowExpiryPicker(true);
  };
  const closeExpiryPicker = () => setShowExpiryPicker(false);
  const navigateExpiryMonth = (direction) => {
    const d = new Date(expiryViewDate);
    d.setMonth(d.getMonth() + direction);
    setExpiryViewDate(d);
  };
  const handleExpiryDateClick = (day) => {
    if (expiryPickerIndex == null) return;
    const sel = new Date(expiryViewDate.getFullYear(), expiryViewDate.getMonth(), day);
    const ymd = sel.toLocaleDateString('en-CA');
    const copy = [...items];
    copy[expiryPickerIndex] = { ...copy[expiryPickerIndex], expiry_date: ymd };
    setItems(copy);
    setShowExpiryPicker(false);
  };
  const renderExpiryCalendar = () => {
    const daysInMonth = getDaysInMonth(expiryViewDate);
    const firstDay = getFirstDayOfMonth(expiryViewDate);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(expiryViewDate.getFullYear(), expiryViewDate.getMonth(), day);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today; // no past expiry
      days.push(
        <div
          key={day}
          className={`calendar-day${isPast ? ' disabled' : ''}`}
          onClick={!isPast ? () => handleExpiryDateClick(day) : undefined}
        >
          {day}
        </div>
      );
    }
    return days;
  };


  const categories = ['Meat', 'Seafood', 'Vegetables', 'Dairy', 'Spices', 'Grains', 'Beverages', 'Oils'];
  const units = ['gram', 'kilogram', 'liter', 'milliliter', 'piece', 'dozen', 'box', 'packet'];
  const shifts = ['Morning', 'Afternoon', 'Evening', 'Night'];

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    let detectedShift = 'Night';
    if (hour >= 6 && hour < 12) detectedShift = 'Morning';
    else if (hour >= 12 && hour < 17) detectedShift = 'Afternoon';
    else if (hour >= 17 && hour < 22) detectedShift = 'Evening';
    setCurrentShift(detectedShift);
    setProductionDate(now.toISOString().split('T')[0]);

    setItems(prev => prev.map(it => ({ ...it, batch_number: '', time: now.toTimeString().slice(0, 5) })));

    // Prefill vendor info from OCR (accept both top-level and nested fields)
    if (ocrData) {
      const vn = (ocrData.vendor_name || (ocrData.vendor && (ocrData.vendor.name || ocrData.vendor.vendor_name)) || '').trim();
      const vp = (ocrData.vendor_phone || (ocrData.vendor && (ocrData.vendor.phone || ocrData.vendor.vendor_phone)) || '').trim();
      if (vn) setVendorName(vn);
      if (vp) setVendorPhone(vp);
      // If vendor name still missing after OCR, nudge user to fill in
      if (!vn) {
        // Delay slightly to avoid being overridden by the OCR success toast
        setTimeout(() => {
          showModalMessage('Vendor not detected from receipt. Please enter the Vendor Name and Phone Number.', 'error');
        }, 400);
      }
    }
  }, [ocrData]);

  useEffect(() => {
    const total = items.reduce((sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0)), 0);
    setTotalCost(total);
  }, [items]);

  useEffect(() => {
    if (!ocrData || !Array.isArray(ocrData.items) || ocrData.items.length === 0) return;

    const normalize = (s) => String(s || '').trim().toLowerCase();
    const singularize = (s) => {
      const t = normalize(s);
      if (t.endsWith('s') && t.length > 1) return t.slice(0, -1);
      return t;
    };
    const symbolToName = (sym) => {
      const m = { kg: 'kilogram', g: 'gram', ml: 'milliliter', l: 'liter' };
      return m[normalize(sym)] || sym;
    };

    (async () => {
      // Load supplier conversions and build a fast lookup
      let conversions = [];
      try {
        const businessId = UnitMappingService.getBusinessId();
        conversions = await UnitMappingService.getSupplierConversions(businessId);
      } catch (e) {
        console.warn('Could not load supplier conversions, proceeding without auto-convert:', e.message);
      }

      const convMap = new Map();
      const convByItem = new Map(); // item -> unique conversion (if exactly one)
      // Key: `${itemName}|${containerSymbol}` in lowercase
      conversions.forEach((c) => {
        // Extract item from description if not provided by backend join
        let item = normalize(c.item || c.name || c.item_name);
        if (!item && c.description) {
          const desc = String(c.description);
          const m = desc.match(/Supplier conversion:\s*(.*?)\s*-\s*1\s+/i);
          if (m && m[1]) item = normalize(m[1]);
        }
        const container = normalize(c.containerType || c.from_unit_symbol);
        if (!item || !container) return;
        convMap.set(`${item}|${container}`, {
          factor: parseFloat(c.quantity || c.conversion_factor) || 0,
          toSymbol: normalize(c.unit || c.to_unit_symbol)
        });

        // Track per-item conversions to allow fallback when OCR unit doesn't match container term
        const existing = convByItem.get(item) || [];
        existing.push({
          container,
          factor: parseFloat(c.quantity || c.conversion_factor) || 0,
          toSymbol: normalize(c.unit || c.to_unit_symbol)
        });
        convByItem.set(item, existing);
      });

      const prepared = ocrData.items.map(it => {
        const batch = generateBatchNumber(it.item_name || 'ITEM');
        const { status, catalogueItem } = matchItem(it.item_name || '');
        const processed = {
          ...emptyItem(),
          ...it,
          batch_number: batch,
          time: new Date().toTimeString().slice(0, 5),
          matchStatus: status
        };
        processed.original_ocr_name = it.item_name || processed.item_name || '';

        // Try auto-conversion using supplier conversions when OCR detected a container unit
        const itemKey = normalize(it.item_name);
        const ocrUnit = singularize(it.unit);
        const key = `${itemKey}|${ocrUnit}`;
        let conv = convMap.get(key) || convMap.get(`${itemKey}|${normalize(it.unit)}`);
        // Fallback: if no container match but exactly one conversion exists for this item, use it
        if (!conv) {
          const list = convByItem.get(itemKey) || [];
          if (list.length === 1) conv = list[0];
        }
        // Fuzzy fallback: try includes matching on item names across conversions
        if (!conv && conversions && conversions.length) {
          const candidates = conversions.map(c => {
            // same extraction as above
            let nm = normalize(c.item || c.name || c.item_name);
            if (!nm && c.description) {
              const m2 = String(c.description).match(/Supplier conversion:\s*(.*?)\s*-\s*1\s+/i);
              if (m2 && m2[1]) nm = normalize(m2[1]);
            }
            return {
              nm,
              container: normalize(c.containerType || c.from_unit_symbol),
              factor: parseFloat(c.quantity || c.conversion_factor) || 0,
              toSymbol: normalize(c.unit || c.to_unit_symbol)
            };
          }).filter(x => x.nm);

          const byName = candidates.filter(x => x.nm.includes(itemKey) || itemKey.includes(x.nm));
          // Prefer container match among byName
          let chosen = byName.find(x => x.container === ocrUnit) || byName[0];
          if (chosen) {
            conv = { factor: chosen.factor, toSymbol: chosen.toSymbol };
          }
        }
        if (conv && processed.quantity) {
          const factor = conv.factor > 0 ? conv.factor : 0;
          if (factor > 0) {
            processed.quantity = parseFloat(processed.quantity) * factor;
            processed.unit = symbolToName(conv.toSymbol);
          }
        }

        // Normalize quantity display (strip trailing .00 by rounding when whole)
        if (processed.quantity !== undefined && processed.quantity !== null && processed.quantity !== '') {
          const qNum = parseFloat(processed.quantity) || 0;
          processed.quantity = Math.abs(qNum - Math.round(qNum)) < 1e-9 ? Math.round(qNum) : qNum;
        }

        if (status === 'exact' && catalogueItem) {
          processed.category = catalogueItem.category || processed.category;
          // If unit not converted above, fall back to catalogue default
          if (!processed.unit) processed.unit = catalogueItem.unit || processed.unit;
          if (!processed.expiry_date && catalogueItem.expiryDays) {
            const d = new Date(); d.setDate(d.getDate() + catalogueItem.expiryDays);
            processed.expiry_date = d.toISOString().split('T')[0];
          }
        }
        return processed;
      });

      setItems(prepared);
      setOriginalItems(prepared.map(p => ({ ...p }))); // snapshot for revert
      setBatchCounter(prev => prev + prepared.length);

      // Initialize suggestions for OCR items that are not exact matches
      const initialSuggestions = {};
      prepared.forEach((item, idx) => {
        if (item.matchStatus !== 'exact' && item.item_name && item.item_name.length > 2) {
          const { suggestions } = matchItemWithSuggestions(item.item_name, 5);
          if (suggestions && suggestions.length > 0) {
            initialSuggestions[idx] = suggestions;
          }
        }
      });
      setSuggestionsMap(initialSuggestions);

      const exactMatches = prepared.filter(p => p.matchStatus === 'exact').length;
      const partialMatches = prepared.filter(p => p.matchStatus === 'partial').length;
      const newItems = prepared.filter(p => p.matchStatus === 'none').length;
      let message = 'Successfully Done';
      const hasVendorFromOCR = !!((ocrData && (ocrData.vendor_name || (ocrData.vendor && (ocrData.vendor.name || ocrData.vendor.vendor_name)))))
      if (hasVendorFromOCR) {
        showModalMessage(message, 'success');
      }
    })();
  }, [ocrData]);

  const generateBatchNumber = (itemName = '') => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const letters = (String(itemName).replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 4) || 'ITEM').padEnd(4, 'X');
    const num = String(batchCounter).padStart(4, '0');
    return `${letters}-${day}${month}-${num}`;
  };

  const normalizeName = (val) => (val || '').toLowerCase();
  const handleInputChange = (index, field, value) => {
    const copy = [...items];
    const uid = copy[index]?.uid;
    
    // If item is locked and someone tries to change the name, prevent it
    if (field === 'item_name' && uid && lockedNames.has(uid)) {
      return; // Do nothing - name is locked
    }
    
    copy[index] = { ...copy[index], [field]: value };

    if (field === 'item_name') {
      const raw = value || '';
      const lowered = normalizeName(raw);
      
      // Use the proper matching logic with debugging
      let matchResult;
      try {
        matchResult = matchItem(raw); // Pass raw value instead of lowered
        console.log('🔍 Match check for:', raw, '→ Status:', matchResult.status);
      } catch (error) {
        console.warn('❌ Match error for:', raw, error);
        matchResult = { status: 'none', catalogueItem: null };
      }
      
      const { status, catalogueItem } = matchResult;
      copy[index].matchStatus = status;
      
      if (!lockedNames.has(uid)) {
        // Only enrich if not locked yet
        copy[index].lastStableName = raw;
        if (status === 'exact' && catalogueItem) {
          if (!copy[index].category) copy[index].category = catalogueItem.category;
          if (!copy[index].unit) copy[index].unit = catalogueItem.unit;
          if (!copy[index].expiry_date && catalogueItem.expiryDays) {
            const d = new Date(); d.setDate(d.getDate() + catalogueItem.expiryDays);
            copy[index].expiry_date = d.toISOString().split('T')[0];
          }
        }
      }
      // If locked, don't update lastStableName or allow any enrichment

      // Don't auto-generate batch number on every keystroke - only when finalizing
    }

    setItems(copy);
  };

  // Suggestion fetching (debounced) for auto-correct
  const suggestionTimeout = useRef(null);
  const [suggestionsMap, setSuggestionsMap] = useState({}); // index -> suggestions array
  const fetchSuggestions = useCallback((index, name) => {
    // Auto-correct always enabled (Google AI backend)
    const lowered = (name || '').toLowerCase();
    if (!lowered || lowered.length < 2) {
      setSuggestionsMap(prev => ({ ...prev, [index]: [] }));
      return;
    }
    const { suggestions } = matchItemWithSuggestions(lowered, 5);
    console.log(`🔍 Fetched ${suggestions?.length || 0} suggestions for "${name}":`, suggestions?.map(s => s.name));
    setSuggestionsMap(prev => ({ ...prev, [index]: suggestions || [] }));
  }, []);

  const handleNameChange = (idx, val) => {
    handleInputChange(idx, 'item_name', val);
    
    // Don't fetch suggestions for locked items, but allow for OCR items being edited
    const item = items[idx];
    if (item && lockedNames.has(item.uid)) return;
    
    // Set to pending status while typing short text
    if (val && val.length > 0 && val.length <= 2) {
      setItems(prev => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = { ...next[idx], matchStatus: 'pending' };
        }
        return next;
      });
    }
    
    // Clear timeout and fetch new suggestions
    if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    suggestionTimeout.current = setTimeout(() => fetchSuggestions(idx, val), 180);
  };

  const applySuggestion = (idx, suggestion) => {
    if (!suggestion) return;
    
    // Clear any pending suggestion timeouts
    if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    
    const name = suggestion.name || '';
    
    // Directly update the item and lock it
    setItems(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx].item_name = name;
        next[idx].lastStableName = name;
        next[idx].client_lock = true;
        // Generate batch number for the new name
        if (!next[idx].batch_number) {
          next[idx].batch_number = generateBatchNumber(name);
          setBatchCounter(b => b + 1);
        }
      }
      return next;
    });
    
    // Lock this item by uid so AI / auto enrichment can no longer change it
    setLockedNames(prev => {
      const s = new Set(prev);
      const item = items[idx];
      if (item?.uid) s.add(item.uid);
      return s;
    });
    
    // After applying suggestion remove suggestions list for that row
    setSuggestionsMap(prev => ({ ...prev, [idx]: [] }));
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  // Revert single item to original snapshot if available
  const revertItem = (idx) => {
    setItems(prev => {
      if (!originalItems[idx]) return prev;
      const copy = [...prev];
      // restore OCR original if available
      const o = originalItems[idx];
      copy[idx] = { ...o, item_name: o.original_ocr_name || o.item_name, lastStableName: o.original_ocr_name || o.item_name };
      return copy;
    });
    setItemErrors(prev => ({ ...prev, [idx]: undefined }));
    
    // Remove lock when reverting
    const item = items[idx];
    if (item?.uid) {
      setLockedNames(prev => {
        const s = new Set(prev);
        s.delete(item.uid);
        return s;
      });
    }
  };

  // Revert all items to snapshot
  const revertAll = () => {
    if (originalItems.length === 0) return;
    setItems(originalItems.map(o => ({ ...o })));
    setItemErrors({});
    setLockedNames(new Set()); // Clear all locks when reverting all
  };

  const showModalMessage = (message, type = 'success') => { setModalMessage(message); setModalType(type); setShowModal(true); };

  // Validate a single item with AI (Gemini-backed endpoint) on blur
  const handleAIValidate = async (index) => {
    const it = items[index];
    if (!it) return;
    const name = (it.item_name || '').trim();
    if (!name) return; // nothing to validate
    
    // Don't validate if item is locked
    if (lockedNames.has(it.uid)) return;
    
    try {
      const res = await http.post('/stock-in/validate-items', {
        items: [{ 
          item_name: name, 
          category: it.category || '',
          client_lock: true, // Tell backend this is locked
          original_ocr_name: it.original_ocr_name || name
        }]
      }, { timeoutMs: 12000 });
      if (res && res.success && res.data && Array.isArray(res.data.results) && res.data.results[0]) {
        const r = res.data.results[0];
        const copy = [...items];
        // If already exact from catalogue, keep exact; else use AI verdict
        if (copy[index].matchStatus !== 'exact') {
          copy[index].matchStatus = r.valid ? 'partial' : 'none';
        }
        // If no category chosen and AI suggests one, set it
        if (!copy[index].category && r.suggested_category) {
          const sug = String(r.suggested_category).trim();
          // Ensure suggestion is one of our known categories to avoid showing a blank option
          if (categories.includes(sug)) {
            copy[index].category = sug;
          }
        }
        setItems(copy);
      }
    } catch (e) {
      // Silent fail; keep current status
      // Optionally could log: console.debug('AI validation skipped:', e.message);
    }
  };

  // Lock name on blur if user manually entered text (prevents later AI overwrite)
  const lockIfNeeded = (idx) => {
    const item = items[idx];
    if (!item || !item.item_name || lockedNames.has(item.uid)) return;
    
    setItems(prev => {
      const next = [...prev];
      const it = next[idx];
      if (it && it.item_name) {
        it.lastStableName = it.item_name;
        it.client_lock = true;
        // Generate batch number for manually entered name if not already set
        if (!it.batch_number) {
          it.batch_number = generateBatchNumber(it.item_name);
          setBatchCounter(b => b + 1);
        }
      }
      return next;
    });
    
    setLockedNames(prev => {
      const s = new Set(prev);
      s.add(item.uid);
      return s;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!currentShift) newErrors.global = ['Please select a shift'];
    if (!items || items.length === 0) newErrors.global = [...(newErrors.global||[]), 'At least one item is required'];
    const seenBatch = new Set();
    const today = new Date().toISOString().split('T')[0];
    const nameMap = new Map(); // lower->indexes
    items.forEach((it, idx) => {
      const errs = [];
      const n = (it.item_name || '').trim();
      if (!n) errs.push('Name required');
      if (n.length > 255) errs.push('Name too long');
      const lower = n.toLowerCase();
      if (!nameMap.has(lower)) nameMap.set(lower, []);
      nameMap.get(lower).push(idx);
      if (!it.category) errs.push('Category required');
      const qty = parseFloat(it.quantity);
      if (!it.quantity || isNaN(qty) || qty <= 0) errs.push('Quantity invalid');
      const up = parseFloat(it.unit_price);
      if (it.unit_price === '' || isNaN(up) || up < 0) errs.push('Unit price invalid');
      const bn = (it.batch_number || '').trim();
      if (!bn) errs.push('Batch required');
      if (bn.length > 100) errs.push('Batch too long');
      if (seenBatch.has(bn)) errs.push('Duplicate batch');
      seenBatch.add(bn);
      if (!it.expiry_date) errs.push('Expiry required');
      if (it.expiry_date && it.expiry_date < today) errs.push('Expiry in past');
      if (errs.length) newErrors[idx] = errs;
    });
    // Duplicate names case-insensitive
    nameMap.forEach((arr) => { if (arr.length > 1) arr.forEach(i => { newErrors[i] = [...(newErrors[i]||[]), 'Duplicate name']; }); });
    setItemErrors(newErrors);
    if (Object.keys(newErrors).length) {
      const globalErr = newErrors.global ? newErrors.global.join(', ') : 'Fix highlighted errors';
      throw new Error(globalErr);
    }
  };

  const makeApiCall = async (endpoint, data) => {
    try {
      const result = await http.post(`/stock-in${endpoint}`, data, { timeoutMs: 30000 });
      if (!result.success) throw new Error(result.error || 'Request failed');
      return result;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timed out');
      throw err;
    }
  };

  const handleSaveDraft = async () => {
    if (!vendorName.trim()) {
      showModalMessage('Vendor not detected. Please enter the Vendor Name and Phone Number (phone optional).', 'error');
      return;
    }
    setIsSubmitting(true); showModalMessage('Saving draft...', 'loading');
    try {
      validateForm();
      const payload = {
        vendor_name: vendorName.trim(),
        vendor_phone: vendorPhone.trim(),
        shift: currentShift,
        items: items.map(it => ({
          item_name: (it.item_name || '').trim(),
          category: it.category,
          quantity: Number(parseFloat(it.quantity) || 0),
          unit: it.unit,
          unit_price: Number(parseFloat(it.unit_price) || 0),
          batch_number: (it.batch_number || '').trim(),
          expiry_date: it.expiry_date,
          time: it.time,
          client_lock: lockedNames.has(it.uid),
          original_ocr_name: it.original_ocr_name || ''
        }))
      };
      const r = await makeApiCall('/draft', payload);
      showModalMessage(`Draft saved. ID: ${r.data.stock_in_id}`, 'success');
    } catch (e) { showModalMessage(`Error: ${e.message}`, 'error'); } finally { setIsSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!vendorName.trim()) {
      showModalMessage('Vendor not detected. Please enter the Vendor Name and Phone Number (phone optional).', 'error');
      return;
    }
    setIsSubmitting(true); showModalMessage('Submitting...', 'loading');
    try {
      validateForm();
      // Pre-submit Python parser validation for food-related items
      try {
        const payloadForValidation = {
          items: items.map(it => ({ item_name: (it.item_name || '').trim(), category: it.category }))
        };
        const validationRes = await http.post('/stock-in/validate-items', payloadForValidation, { timeoutMs: 15000 });
        if (validationRes && validationRes.success && validationRes.data && Array.isArray(validationRes.data.results)) {
          const invalids = validationRes.data.results.filter(r => r && r.valid === false);
          if (invalids.length > 0) {
            // Update UI to red for those rows
            const copy = [...items];
            invalids.forEach(r => {
              if (r.index !== undefined && copy[r.index]) copy[r.index].matchStatus = 'none';
            });
            setItems(copy);
            // Show required popup
            showModalMessage('invalid item : Give a correct input', 'error');
            // Focus first invalid item input if possible
            setTimeout(() => {
              const firstIdx = invalids[0]?.index ?? 0;
              const container = document.querySelectorAll('.item-box')[firstIdx];
              if (container) {
                const input = container.querySelector('input[name="item_name"]');
                if (input) input.focus();
              }
            }, 100);
            return; // stop submission
          }
          // Align categories with AI suggestions (primary) when available
          const results = validationRes.data.results;
          const copy2 = [...items];
          let changed = false;
          results.forEach(r => {
            if (!r) return;
            const idx = r.index ?? -1;
            if (idx >= 0 && copy2[idx]) {
              const sug = (r.suggested_category || '').trim();
              if (sug && categories.includes(sug) && copy2[idx].category !== sug) {
                copy2[idx].category = sug;
                // If not exact catalogue match, mark as partial (yellow)
                if (copy2[idx].matchStatus !== 'exact') copy2[idx].matchStatus = 'partial';
                changed = true;
              }
            }
          });
          if (changed) setItems(copy2);
        }
      } catch (pvErr) {
        throw pvErr;
      }
      const payload = {
        vendor_name: vendorName.trim(),
        vendor_phone: vendorPhone.trim(),
        shift: currentShift,
        items: items.map(it => ({
          item_name: (it.item_name || '').trim(),
          category: it.category,
          quantity: Number(parseFloat(it.quantity) || 0),
          unit: it.unit,
          unit_price: Number(parseFloat(it.unit_price) || 0),
          batch_number: (it.batch_number || '').trim(),
          expiry_date: it.expiry_date,
          time: it.time,
          client_lock: lockedNames.has(it.uid),
          original_ocr_name: it.original_ocr_name || ''
        }))
      };
      const r = await makeApiCall('', payload);
      showModalMessage(`Submitted. ID: ${r.data.stock_in_id}`, 'success');

      // Trigger notifications refresh in parent component
      if (onSuccess) onSuccess();

      // Dispatch manual entry event to refresh inventory overview
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('manualEntryAdded'));
          console.log('📝 Dispatched manualEntryAdded event');
        }
      }, 500);

      // Small delay to let notification system process, then refresh notifications UI
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }
      }, 1000);

      setTimeout(() => { setItems([emptyItem()]); setTotalCost(0); }, 1500);
    } catch (e) { showModalMessage(`Error: ${e.message}`, 'error'); } finally { setIsSubmitting(false); }
  };

  const Modal = ({ show, message, type, onClose }) => {
    if (!show) return null;
    return (
      <div className="stock-in-modal-overlay" onClick={onClose}>
        <div className="stock-in-modal-box" onClick={e => e.stopPropagation()}>
          <FontAwesomeIcon
            icon={type === 'success' ? faCheck : type === 'error' ? faTimes : faSpinner}
            className={`checkmark ${type === 'success' ? 'green' : type === 'error' ? 'red' : 'orange'}`}
            spin={type === 'processing'}
          />
          <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
          {type !== 'loading' && <button className="ok-btn" onClick={onClose}>OK</button>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div>
        {onBack && <div className="form-header"><button className="back-button" onClick={onBack}>← Back to Scanner</button>{ocrData && <div className="ocr-indicator">📄 Data from OCR scan</div>}</div>}

        {ocrData && ocrData.previewImage && (
          <div className="bill-image-preview">
            <h4 className="bill-image-title">Original Bill Image</h4>
            <div className="bill-image-container">
              <img src={ocrData.previewImage} alt="bill" className="bill-image" />
            </div>
            {ocrData.items && ocrData.items.length === 0 && (
              <div className="ocr-failed-message">
                <p>OCR processing failed, but you can still enter items manually.</p>
                <p>Use the image above as a reference.</p>
              </div>
            )}
          </div>
        )}

        <div className="stock-in-form-box">
          {/* Vendor Info Section */}
          <div className="vendor-info-row">
            <div className="form-group vendor-field">
              <label>Vendor Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                placeholder="Vendor Name from Bill"
                className="vendor-input"
                maxLength={100}
              />
            </div>
            <div className="form-group vendor-field">
              <label>Phone Number</label>
              <input
                type="text"
                value={vendorPhone}
                onChange={e => setVendorPhone(e.target.value)}
                placeholder="Vendor Phone (if available)"
                className="vendor-input"
                maxLength={20}
              />
            </div>
          </div>
          <div className="production-date-container"><label>Production Date:</label><input type="date" value={productionDate} onChange={e => setProductionDate(e.target.value)} /></div>
          <div className="form-group"><label>Shift</label>
            <UsageStyleDropdown
              options={shifts}
              value={currentShift}
              onChange={setCurrentShift}
              placeholder="Select Shift"
            />
          </div>

          <div className="items-header">
            <h3 style={{fontSize:'1.3rem'}}>Items</h3>
            {originalItems.length > 0 && (
              <button
                type="button"
                className="revert-all-btn revert-all-btn--header"
                onClick={revertAll}
                title="Revert all items to original OCR text"
              >
                ↺ Revert All
              </button>
            )}
          </div>
          {items.map((it, idx) => {
            const errs = itemErrors[idx] || [];
            return (
            <div key={idx} className={`item-box ${it.matchStatus === 'exact' ? 'exact-match' : it.matchStatus === 'partial' ? 'partial-match' : (it.matchStatus === 'none' && (it.item_name || '').trim().length > 2 ? 'none-match' : '')} ${errs.length ? 'has-errors' : ''}`}>
              {items.length > 1 && <button onClick={() => removeItem(idx)} className="delete-button" type="button">×</button>}
              {it.matchStatus === 'exact' && <FontAwesomeIcon icon={faCheck} className="match-indicator exact" />}
              {it.matchStatus === 'partial' && <span className="match-indicator partial">⚠</span>}
              {it.matchStatus === 'none' && (it.item_name || '').trim().length > 2 && <span className="match-indicator none">×</span>}

              <div className="form-group"><label>Item Name</label>
                <input
                  type="text"
                  name="item_name"
                  placeholder="Enter Item Name"
                  value={it.item_name}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  onBlur={() => { lockIfNeeded(idx); handleAIValidate(idx); }}
                  className={`item-name-input ${it.matchStatus}`}
                  style={{ textTransform: 'none' }}
                />
                {suggestionsMap[idx] && suggestionsMap[idx].length > 0 && (
                  <div className="suggestions-row">
                    {suggestionsMap[idx].map(s => (
                      <button
                        type="button"
                        key={s.name}
                        className="suggestion-chip"
                        onClick={() => applySuggestion(idx, s)}
                        title={`Apply: ${s.name}`}
                      >{s.name}</button>
                    ))}
                  </div>
                )}
                {errs.length > 0 && (
                  <ul className="item-error-list">
                    {errs.map((er,i2) => <li key={i2}>{ er }</li>)}
                  </ul>
                )}
              </div>

              <div className="form-group"><label>Category</label>
                <UsageStyleDropdown
                  options={categories}
                  value={it.category}
                  onChange={(val) => handleInputChange(idx, 'category', val)}
                  placeholder="Select Category"
                />
              </div>

              <div className="triple-inline"><div className="form-group"><label>Quantity</label><input type="number" placeholder="Enter Quantity" value={it.quantity} onChange={e => handleInputChange(idx, 'quantity', e.target.value)} step="0.001" min="0" /></div>
                <div className="form-group"><label>Unit</label>
                  <UsageStyleDropdown
                    options={units}
                    value={it.unit}
                    onChange={(val) => handleInputChange(idx, 'unit', val)}
                    placeholder="Select Unit"
                  />
                </div>
                <div className="form-group"><label>Unit Price</label><input type="number"  placeholder="Enter Unit Price " value={it.unit_price} onChange={e => handleInputChange(idx, 'unit_price', e.target.value)} step="0.01" min="0" /></div></div>

              <div className="inline-fields"><div className="batch-field"><label>Batch Number</label><input type="text" value={it.batch_number} onChange={e => handleInputChange(idx, 'batch_number', e.target.value)} placeholder="Batch Number" /></div>
                <div className="expiry-field"><label>Expiry Date</label>
                  <div className="date-picker-wrap">
                    <input type="date" value={it.expiry_date} onChange={e => handleInputChange(idx, 'expiry_date', e.target.value)} min={new Date().toLocaleDateString('en-CA')} />
                    <button type="button" className="date-picker-button" aria-label="Open calendar" onClick={() => openExpiryPicker(idx)}>
                      <FontAwesomeIcon icon={faCalendarRegular} />
                    </button>
                  </div>
                </div></div>
            </div>
          );})}

          {/* Expiry date calendar overlay */}
          {showExpiryPicker && (
            <div className="date-picker-overlay" onClick={closeExpiryPicker}>
              <div className="date-picker-popup" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="calendar-header">
                  <button onClick={() => navigateExpiryMonth(-1)}>‹</button>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CalendarSelect
                      options={monthNames.map((m, i) => ({ label: m, value: i }))}
                      value={expiryViewDate.getMonth()}
                      onChange={(val) => { const d = new Date(expiryViewDate); d.setMonth(val); setExpiryViewDate(d); }}
                      width={130}
                    />
                    <CalendarSelect
                      options={Array.from({ length: 21 }, (_, k) => new Date().getFullYear() - 10 + k).map(y => ({ label: String(y), value: y }))}
                      value={expiryViewDate.getFullYear()}
                      onChange={(val) => { const d = new Date(expiryViewDate); d.setFullYear(val); setExpiryViewDate(d); }}
                      width={90}
                    />
                  </div>
                  <button onClick={() => navigateExpiryMonth(1)}>›</button>
                </div>
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="weekday">{d}</div>
                  ))}
                </div>
                <div className="calendar-grid">
                  {renderExpiryCalendar()}
                </div>
              </div>
            </div>
          )}

          <div className="batch-actions-bar">
            <button onClick={addItem} className="add-button">+ Add More Items</button>
          </div>

          <div className="total-cost-card"><span className="label">Total Cost of Raw Materials</span><span className="amount">₹{totalCost.toFixed(2)}</span></div>

          <div className="button-group"><button onClick={handleSaveDraft} className="stock-in-draft-btn" disabled={isSubmitting}> {isSubmitting ? 'Saving...' : 'Save as Draft'}</button><button onClick={handleSubmit} className="stock-in-submit-btn" disabled={isSubmitting}> {isSubmitting ? 'Submitting...' : 'Submit'}</button></div>
        </div>

        <Modal show={showModal} message={modalMessage} type={modalType} onClose={() => setShowModal(false)} />
      </div>
    </div>
  );
};

export default StockInForm;
