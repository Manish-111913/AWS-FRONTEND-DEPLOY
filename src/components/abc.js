import { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTimes, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { StandardScrollStyles, smartSearch, highlightMatch, defaultTextSizes, standardScrollStyles, StandardCard } from '../styles/standardStyles';
import AnimatedList from './AnimatedList';
import './AnimatedList.css';
import './abc.css';
import './abc-modern.css'; // new modern style (matches provided HTML design)
import ABCVideo from './ABC.mp4';
import { buildUrl, categorizeError, http } from '../services/apiClient';

export default function Abc({ goTo }) {
  // Handler for back button
  const handleBack = () => {
    if (typeof goTo === 'function') {
      goTo('create-reorder');
    } else {
      window.history.back();
    }
  };

  const [view, setView] = useState("list");
  // Intro overlay progress state
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [videoFadingOut, setVideoFadingOut] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("A");
  const [showPopup, setShowPopup] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
  const [items, setItems] = useState({ A: [], B: [], C: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState({ A: [], B: [], C: [] });
  const lastGoodDataRef = useRef(null);
  const fetchAbortRef = useRef(null);
  const [refreshTick, setRefreshTick] = useState(0); // trigger manual refresh when needed
  // Stability helpers
  const lastSignatureRef = useRef(null);
  const lastFetchAtRef = useRef(0);
  const sseDebounceRef = useRef(null);
  // Connection failure tracking
  const connectionFailures = useRef(0);
  const lastFailureTime = useRef(0);
  const maxFailures = 5;
  // Live loading progress
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadLabel, setLoadLabel] = useState('Initializing…');

  // Ref for search input to maintain focus
  const searchInputRef = useRef(null);

  // Handle search input change - simplified to work with StandardSearch
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Clear search input
  const clearSearch = () => {
    setSearchTerm('');
    // Keep focus on input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle key events
  const handleKeyDown = (e) => {
    // Prevent any unwanted behaviors
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  // Using standardized smart search from standardStyles

  // Using standardized highlighting from standardStyles

  // Helper function to format quantity with proper units
  const formatQuantity = useCallback((quantity, unitSymbol) => {
    if (!quantity || quantity === 0) return '0 units';

    const numQuantity = parseFloat(quantity);
    const unit = unitSymbol || 'units';

    // Format based on the quantity size and unit type
    if (unit === 'kg' && numQuantity < 1) {
      return `${(numQuantity * 1000).toFixed(0)} g`;
    } else if (unit === 'L' && numQuantity < 1) {
      return `${(numQuantity * 1000).toFixed(0)} ml`;
    } else if (numQuantity < 1) {
      return `${numQuantity.toFixed(3)} ${unit}`;
    } else if (numQuantity < 10) {
      return `${numQuantity.toFixed(2)} ${unit}`;
    } else {
      return `${numQuantity.toFixed(0)} ${unit}`;
    }
  }, []);

  // Helper to format currency in INR
  const formatCurrencyINR = useCallback((value) => {
    const num = Number(value || 0);
    try {
      return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
    } catch {
      return `₹${num.toFixed(2)}`;
    }
  }, []);

  // Build a small signature to detect real changes and avoid unnecessary re-renders
  const buildSignature = useCallback((dataByCat) => {
    try {
      const parts = ['A','B','C'].map(cat =>
        (dataByCat[cat] || [])
          .map(i => `${i.id ?? 'x'}|${i.qty}|${i.value}|${i.stockStatus}|${i.currentStock}`)
          .join(',')
      );
      return parts.join('||');
    } catch { return Math.random().toString(36); }
  }, []);

  // Helper: call Gemini to compute ABC categories using the ABC logic
  const classifyWithGemini = useCallback(async (baseItems) => {
    const key = process.env.REACT_APP_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('Missing REACT_APP_GOOGLE_API_KEY');

    // Keep payload compact: pass only fields required by logic
    const payloadItems = baseItems.map(i => ({
      item_id: i.item_id,
      item_name: i.item_name,
      total_quantity_used: Number(i.total_quantity_used || 0),
      avg_unit_cost: Number(i.avg_unit_cost || 0),
      consumption_value: Number(i.consumption_value || 0),
      is_manual_override: !!i.is_manual_override,
      manual_or_backend_category: i.abc_category || null
    }));

    const systemLogic = `You are an ABC inventory analyzer. Follow these strict steps:
1) For each item, compute consumption_value = total_quantity_used * avg_unit_cost. If consumption_value is provided, trust it.
2) Sort items by consumption_value descending.
3) Compute total_inventory_value = sum(consumption_value).
4) Walk the sorted list and compute running cumulative percentage = (running_value / total_inventory_value) * 100.
5) Assign categories:
   - A: items while running cumulative percentage <= 80%
   - B: next items while running cumulative percentage <= 95%
   - C: all remaining items
6) If is_manual_override is true, use manual_or_backend_category as the final category for that item.
7) Output only strict JSON in this schema (no markdown, no prose):\n{
  "categories": {"A": [<item_id>...], "B": [<item_id>...], "C": [<item_id>...]},
  "totals": {"total_inventory_value": <number>, "count": <number>}
}`;

    const request = {
      contents: [
        { role: 'user', parts: [{ text: systemLogic }] },
        { role: 'user', parts: [{ text: JSON.stringify({ items: payloadItems }) }] }
      ]
    };

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}`);
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first >= 0 && last > first) {
        json = JSON.parse(text.slice(first, last + 1));
      } else {
        throw new Error('Invalid AI response');
      }
    }
    if (!json?.categories) throw new Error('AI categories missing');
    return json;
  }, []);

  // Deterministic local ABC classifier (fallback when AI is rate-limited/unavailable)
  const classifyLocally = useCallback((baseItems) => {
    const items = (baseItems || []).map((i) => {
      const calc = Number(i.total_quantity_used || 0) * Number(i.avg_unit_cost || 0);
      const baseVal = (i.consumption_value ?? calc);
      const consumption = Number(baseVal || 0);
      return {
        item_id: Number(i.item_id),
        consumption_value: consumption,
        is_manual_override: !!i.is_manual_override,
        manual_or_backend_category: i.abc_category || i.manual_or_backend_category || null,
      };
    });
    // Sort by consumption value desc
    items.sort((a, b) => b.consumption_value - a.consumption_value);
    const total = items.reduce((s, it) => s + (Number(it.consumption_value) || 0), 0) || 0;
    const out = { A: [], B: [], C: [] };
    let running = 0;
    for (const it of items) {
      let cat;
      if (it.is_manual_override && (it.manual_or_backend_category === 'A' || it.manual_or_backend_category === 'B' || it.manual_or_backend_category === 'C')) {
        cat = it.manual_or_backend_category;
      } else if (total <= 0) {
        // Edge: no value data; bucket as C by default
        cat = 'C';
      } else {
        running += it.consumption_value;
        const pct = (running / total) * 100;
        if (pct <= 80) cat = 'A';
        else if (pct <= 95) cat = 'B';
        else cat = 'C';
      }
      if (Number.isFinite(it.item_id)) out[cat].push(it.item_id);
    }
    return { categories: out, totals: { total_inventory_value: total, count: items.length } };
  }, []);

  // Fetch base data then let Gemini compute ABC
  const fetchABCData = useCallback(async (opts = { background: false }) => {
    try {
      // Throttle background refreshes to at most one every 5s
      const now = Date.now();
      if (opts.background && now - lastFetchAtRef.current < 5000) {
        return;
      }
      lastFetchAtRef.current = now;
      // In background refresh, don't block UI
      if (!opts.background) {
        setLoading(true);
        setLoadProgress(5);
        setLoadLabel('Starting…');
      }
      setError(null);

      // Cancel any in-flight request
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
      }
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      if (!opts.background) {
        setLoadProgress(10);
        setLoadLabel('Preparing request…');
      }

      // Get base metrics from backend; ignore backend categories (AI will classify)
      let response;
      try {
        // Check if we should proceed (respect circuit breaker from apiClient)
        const healthCheck = await http.get('/health', {
          signal: controller.signal,
          timeout: 5000
        }).catch(() => null);
        
        if (!healthCheck || !healthCheck.success) {
          throw new Error('ERR_CONNECTION_REFUSED: Backend server is not available');
        }
        
        response = await http.get('/abc-analysis/calculate?businessId=1', {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-store' }
        });
      } catch (fetchError) {
        // Handle network/connection errors specifically
        if (fetchError.message && fetchError.message.includes('Cannot connect to server')) {
          throw new Error(`ERR_CONNECTION_REFUSED: Cannot connect to backend server at ${process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api'}`);
        }
        if (fetchError.name === 'AbortError') {
          console.log('ABC Analysis request was aborted');
          return; // Exit gracefully for aborted requests
        }
        throw fetchError;
      }

      if (!response || !response.success) {
        throw new Error(`API error! ${response?.error || 'Unknown error'}`);
      }
      if (!opts.background) {
        setLoadProgress(40);
        setLoadLabel('Downloading data…');
      }

      const data = response.data || response;
      if (!opts.background) {
        setLoadProgress(50);
        setLoadLabel('Analyzing items…');
      }

      if (data.success && data.data && data.data.analysis_results) {
        const analysisResults = data.data.analysis_results;

        // Prefer backend categories if present to ensure consistency and manual moves stick
        const hasServerCats = analysisResults.some(it => {
          const c = it?.abc_category;
          return c === 'A' || c === 'B' || c === 'C';
        });

        let buckets;
        if (hasServerCats) {
          if (!opts.background) {
            setLoadProgress(70);
            setLoadLabel('Using server categories…');
          }
          buckets = { A: [], B: [], C: [] };
          for (const item of analysisResults) {
            const idNum = item.item_id != null ? Number(item.item_id) : NaN;
            const hasValidId = Number.isFinite(idNum);
            const base = {
              id: hasValidId ? idNum : null,
              name: item.item_name || 'Unknown Item',
              type: 'Inventory Item',
              canManage: hasValidId,
              qty: formatQuantity(item.current_stock ?? item.total_quantity_used, item.unit_symbol),
              supplier: 'Various',
              location: 'Warehouse',
              expiry: 'N/A',
              lowStock: 'N/A',
              value: formatCurrencyINR(item.inventory_value ?? item.consumption_value ?? 0),
              usagePercent: Math.round(parseFloat(item.percentage_of_total || 0)),
              usageQty: formatQuantity(item.monthly_usage_qty ?? item.total_quantity_used ?? 0, item.unit_symbol),
              monthlyUsageQty: formatQuantity(item.monthly_usage_qty ?? 0, item.unit_symbol),
              monthlyUsageValue: formatCurrencyINR(item.monthly_usage_value ?? 0),
              waste: 'N/A',
              consumptionValue: parseFloat(item.consumption_value || 0),
              quantityUsed: parseFloat(item.total_quantity_used || 0),
              unitSymbol: item.unit_symbol || 'units',
              currentStock: parseFloat(item.current_stock ?? 0),
              stockStatus: item.stock_status || 'sufficient',
              wasteMonthQty: formatQuantity(item.waste_month_qty ?? 0, item.unit_symbol),
              wasteMonthValue: formatCurrencyINR(item.waste_month_value ?? 0),
              latestUnitCost: parseFloat(item.latest_unit_cost ?? 0),
              lastReceivedDate: item.last_received_date || null
            };
            const cat = (item.abc_category === 'A' || item.abc_category === 'B' || item.abc_category === 'C') ? item.abc_category : 'C';
            buckets[cat].push({ ...base, category: cat });
          }
          // Sort within categories by consumption value desc
          Object.keys(buckets).forEach(k => buckets[k].sort((a,b) => b.consumptionValue - a.consumptionValue));
        } else {
          // Ask Gemini/local to classify, with robust fallback
          if (!opts.background) {
            setLoadProgress(60);
            setLoadLabel('Invoking AI classifier…');
          }
          let ai;
          try {
            ai = await classifyWithGemini(analysisResults);
          } catch (e) {
            const msg = String(e?.message || e || '');
            if (!opts.background) {
              setLoadLabel(msg.includes('429') ? 'AI rate-limited — using local classification' : 'AI unavailable — using local classification');
            }
            ai = classifyLocally(analysisResults);
          }
          if (!opts.background) {
            setLoadProgress(85);
            setLoadLabel('Bucketing results…');
          }
          const catA = new Set(ai?.categories?.A || []);
          const catB = new Set(ai?.categories?.B || []);
          const catC = new Set(ai?.categories?.C || []);
          buckets = { A: [], B: [], C: [] };
          for (const item of analysisResults) {
            const idNum = item.item_id != null ? Number(item.item_id) : NaN;
            const hasValidId = Number.isFinite(idNum);
            const base = {
              id: hasValidId ? idNum : null,
              name: item.item_name || 'Unknown Item',
              type: 'Inventory Item',
              canManage: hasValidId,
              qty: formatQuantity(item.current_stock ?? item.total_quantity_used, item.unit_symbol),
              supplier: 'Various',
              location: 'Warehouse',
              expiry: 'N/A',
              lowStock: 'N/A',
              value: formatCurrencyINR(item.inventory_value ?? item.consumption_value ?? 0),
              usagePercent: Math.round(parseFloat(item.percentage_of_total || 0)),
              usageQty: formatQuantity(item.monthly_usage_qty ?? item.total_quantity_used ?? 0, item.unit_symbol),
              monthlyUsageQty: formatQuantity(item.monthly_usage_qty ?? 0, item.unit_symbol),
              monthlyUsageValue: formatCurrencyINR(item.monthly_usage_value ?? 0),
              waste: 'N/A',
              consumptionValue: parseFloat(item.consumption_value || 0),
              quantityUsed: parseFloat(item.total_quantity_used || 0),
              unitSymbol: item.unit_symbol || 'units',
              currentStock: parseFloat(item.current_stock ?? 0),
              stockStatus: item.stock_status || 'sufficient',
              wasteMonthQty: formatQuantity(item.waste_month_qty ?? 0, item.unit_symbol),
              wasteMonthValue: formatCurrencyINR(item.waste_month_value ?? 0),
              latestUnitCost: parseFloat(item.latest_unit_cost ?? 0),
              lastReceivedDate: item.last_received_date || null
            };
            let cat = 'C';
            if (catA.has(idNum)) cat = 'A'; else if (catB.has(idNum)) cat = 'B'; else if (catC.has(idNum)) cat = 'C';
            buckets[cat].push({ ...base, category: cat });
          }
          Object.keys(buckets).forEach(k => buckets[k].sort((a,b) => b.consumptionValue - a.consumptionValue));
        }

        const sig = buildSignature(buckets);
        if (sig !== lastSignatureRef.current) {
          setItems(buckets);
          lastGoodDataRef.current = buckets;
          lastSignatureRef.current = sig;
        }
        if (!opts.background) {
          setLoadProgress(95);
          setLoadLabel('Finalizing…');
        }

        // Cache data (annotate source)
        try {
          localStorage.setItem('abc-data-cache', JSON.stringify({
            data: buckets,
            timestamp: Date.now(),
            version: hasServerCats ? '3.0-server' : '2.0-ai'
          }));
        } catch (e) {
          console.warn('Failed to cache ABC data:', e);
        }

        if (showIntro && (buckets.A.length + buckets.B.length + buckets.C.length >= 0)) {
          // Start fade out animation
          setVideoFadingOut(true);
          // Hide intro after fade out completes
          setTimeout(() => setShowIntro(false), 500);
        }

      } else {
        throw new Error('Invalid response format from ABC analysis API');
      }

    } catch (error) {
      if (error.name === 'AbortError') return; // ignored due to refresh
      
      console.error('❌ Error fetching ABC data:', error);
      
      // Use improved error categorization
      const errorInfo = categorizeError(error);
      let userErrorMessage = 'Failed to load ABC analysis data';
      let showRetryButton = true;
      
      // Track connection failures for exponential backoff
      if (errorInfo.type === 'connection' || errorInfo.type === 'network' || errorInfo.type === 'timeout') {
        connectionFailures.current++;
        lastFailureTime.current = Date.now();
        
        console.log(`ABC Analysis connection failure ${connectionFailures.current}/${maxFailures}`);
        
        // Implement exponential backoff for retries
        const baseInterval = 10000; // 10 seconds
        const maxInterval = 120000; // 2 minutes
        const backoffMultiplier = Math.min(Math.pow(2, connectionFailures.current - 1), 12);
        const retryInterval = Math.min(baseInterval * backoffMultiplier, maxInterval);
        
        console.log(`Next ABC retry in ${retryInterval/1000}s (${backoffMultiplier}x backoff)`);
      }
      
      switch (errorInfo.type) {
        case 'cancelled':
          return; // Don't show error for cancelled requests
        
        case 'circuit_breaker':
          userErrorMessage = 'Too many connection failures. Please wait a moment before trying again.';
          showRetryButton = true;
          break;
        
        case 'connection':
        case 'network':
          userErrorMessage = 'Cannot connect to the server. Please make sure the backend is running on port 5001.';
          break;
        
        case 'timeout':
          userErrorMessage = 'Request timed out. The server may be overloaded.';
          break;
        
        case 'not_found':
          userErrorMessage = 'ABC analysis endpoint not found. Please check the server configuration.';
          break;
        
        default:
          if (error.message && error.message.includes('Invalid response format')) {
            userErrorMessage = 'Server returned invalid data format. Please check the backend logs.';
            showRetryButton = false;
          } else {
            userErrorMessage = errorInfo.userFriendly ? errorInfo.message : `${userErrorMessage}: ${errorInfo.message}`;
          }
      }
      
      setError(userErrorMessage);
      
      // Store retry function for potential retry button
      if (showRetryButton) {
        window.retryABCAnalysis = () => {
          setError(null);
          fetchABCData({ background: false });
        };
      }
      
      // Keep showing last good data if available (no jarring empty state)
      if (lastGoodDataRef.current) {
        setItems(lastGoodDataRef.current);
      } else {
        setItems({ A: [], B: [], C: [] });
      }
    } finally {
      if (!opts.background) {
        setLoadProgress(100);
        setLoadLabel('Done');
        setTimeout(() => setLoading(false), 150);
      }
    }
  }, [buildSignature, formatQuantity, formatCurrencyINR, showIntro, classifyWithGemini]);

  // Load cached data immediately for faster perceived performance
  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem('abc-data-cache');
      if (cached) {
        const { data, timestamp, version } = JSON.parse(cached);
        const age = Date.now() - timestamp;
  // Use cache if less than 5 minutes old
  if (age < 5 * 60 * 1000 && (version === '3.0-server' || version === '2.0-ai' || version === '1.0') && data) {
          const sig = buildSignature(data);
          if (sig !== lastSignatureRef.current) {
            setItems(data);
            lastGoodDataRef.current = data;
            lastSignatureRef.current = sig;
            setLoading(false);
            // Start fade out animation and hide intro overlay
            setVideoFadingOut(true);
            setTimeout(() => setShowIntro(false), 500);
            // Also consider data available
            lastGoodDataRef.current = data;
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached ABC data:', e);
    }
    return false;
  }, [buildSignature]);

  useEffect(() => {
    // Try to load cached data first for instant display
    const hasCachedData = loadCachedData();
    
    // Kick off a short, smooth intro progress animation (~1s max, or until data loads)
    let rafId;
    const start = performance.now();
    const duration = hasCachedData ? 400 : 1000; // Shorter if we have cached data
    const animate = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic for nicer feel
      const eased = 1 - Math.pow(1 - t, 3);
      setIntroProgress(Math.round(eased * 100));
      if (t < 1 && showIntro) {
        rafId = requestAnimationFrame(animate);
      } else if (showIntro) {
        // Do not auto-hide if we have no data yet; keep until fetch completes
        if (lastGoodDataRef.current) {
          setTimeout(() => setShowIntro(false), 280);
        }
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [showIntro]);

  useEffect(() => {
    // Load cached data first, then fetch fresh data
    const hasCachedData = loadCachedData();
    
    // Always fetch fresh data, but in background if we have cache
    fetchABCData({ background: hasCachedData });
    // Background refresh every 30s; further throttled in fetchABCData
    const id = setInterval(() => fetchABCData({ background: true }), 30000);
    
    // SSE subscription for instant invalidations with improved error handling
    let es;
    let sseErrorCount = 0;
    let maxSSEErrors = 3;
    let sseReconnectTimeout;
    
    const initializeSSE = () => {
      try {
        es = new EventSource(buildUrl('abc-analysis/stream?businessId=1'));
        
        const debouncedBgFetch = () => {
          if (sseDebounceRef.current) clearTimeout(sseDebounceRef.current);
          sseDebounceRef.current = setTimeout(() => fetchABCData({ background: true }), 600);
        };
        
        es.addEventListener('abc.invalidate', debouncedBgFetch);
        // If server restarts, revalidate
        es.addEventListener('hello', debouncedBgFetch);
        
        es.onopen = () => {
          // Reset error count on successful connection
          sseErrorCount = 0;
          console.log('SSE connection established');
        };
        
        es.onerror = (error) => {
          sseErrorCount++;
          console.log(`SSE connection error ${sseErrorCount}/${maxSSEErrors}:`, error);
          
          // If too many errors, stop trying to reconnect for a while
          if (sseErrorCount >= maxSSEErrors) {
            console.log('Too many SSE errors, stopping reconnection attempts for 5 minutes');
            es?.close?.();
            
            // Try again after 5 minutes
            sseReconnectTimeout = setTimeout(() => {
              console.log('Retrying SSE connection after cooldown');
              sseErrorCount = 0;
              initializeSSE();
            }, 5 * 60 * 1000); // 5 minutes
          } else {
            // Implement exponential backoff for earlier failures
            const baseDelay = 2000; // 2 seconds
            const maxDelay = 30000; // 30 seconds  
            const backoffMultiplier = Math.min(Math.pow(2, sseErrorCount - 1), 15);
            const retryDelay = Math.min(baseDelay * backoffMultiplier, maxDelay);
            
            console.log(`SSE reconnecting in ${retryDelay/1000}s (${backoffMultiplier}x backoff)`);
            
            es?.close?.();
            sseReconnectTimeout = setTimeout(() => {
              if (sseErrorCount < maxSSEErrors) {
                initializeSSE();
              }
            }, retryDelay);
          }
        };
        
      } catch (sseError) {
        console.log('Failed to establish SSE connection:', sseError.message);
        // SSE is optional for real-time updates, so don't fail the component
      }
    };
    
    // Initialize SSE connection
    initializeSSE();
    
    return () => {
      clearInterval(id);
      clearTimeout(sseReconnectTimeout);
      try { 
        es?.close?.(); 
      } catch {}
      if (sseDebounceRef.current) clearTimeout(sseDebounceRef.current);
    };
  }, []); // Empty dependency array to run only once

  // Maintain focus on search input
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      // Only focus if user was actively searching
      if (searchTerm.length > 0) {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            // Set cursor to end of input
            const length = searchInputRef.current.value.length;
            searchInputRef.current.setSelectionRange(length, length);
          }
        }, 0);
      }
    }
  }, [searchTerm]); // Only depend on searchTerm, not filteredItems

  // Enhanced filter items based on search term with priority-based results
  // Debounce search calculation for responsiveness
  useEffect(() => {
    const run = () => {
      if (!searchTerm.trim()) {
        setFilteredItems(items);
      } else {
        const filtered = {};
        Object.keys(items).forEach(category => {
          filtered[category] = smartSearch(items[category], searchTerm, ['name', 'category', 'type', 'supplier']);
        });
        setFilteredItems(filtered);
      }
    };
    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [searchTerm, items]);

  const openDetails = (item) => {
    // Only allow details for A category items
    if (!item || item.category !== 'A') return; // ignore B/C
    setSelectedItem(item);
    setView("details");
  };

  const handleTapToManage = (item) => {
    if (!item || !item.id) {
      alert('Cannot manage this item because it has no valid ID.');
      return;
    }
    setItemToMove(item);
    setShowPopup(true);
  };

  const moveToA = async () => {
    if (!itemToMove) return;

    try {
      // Optimistic update: move the item in UI immediately
  if (!itemToMove.id) return; // safety
  setItems(prev => {
        const next = { A: [...prev.A], B: [...prev.B], C: [...prev.C] };
        // Remove from B if present
        next.B = next.B.filter(i => i.id !== itemToMove.id);
        // Ensure category A and push
        const moved = { ...itemToMove, category: 'A' };
        next.A = [moved, ...next.A];
        return next;
      });

      // Call the backend API to update the category (use promote endpoint which also triggers SSE)
      const response = await fetch(buildUrl('abc-analysis/promote'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: Number(itemToMove.id),
          businessId: 1
        })
      });

      const result = await response.json();

      if (result.success) {
  // Clear cache so stale buckets don't repopulate
  try { localStorage.removeItem('abc-data-cache'); } catch {}
  // Force a fresh non-background fetch so server category reflects immediately
  await fetchABCData({ background: false });
        alert(`✅ ${itemToMove.name} successfully moved to Category A and data refreshed`);
        // Switch to A tab so the user sees the moved item immediately
        setActiveTab('A');
      } else {
        console.error('❌ Failed to update category:', result);
        alert(`❌ Failed to move item: ${result.message}`);
        // Revert optimistic update by refetching last good data
        fetchABCData({ background: false });
      }

    } catch (error) {
      console.error('❌ Error updating category:', error);
      alert('❌ Error updating category. Please try again.');
      // Reconcile state
      fetchABCData({ background: true });
    } finally {
      setShowPopup(false);
      setItemToMove(null);
    }
  };

  /*  const handleDeleteConfirm = () => {
      const category = selectedItem.category;
      const updated = items[category].filter((i) => i.id !== selectedItem.id);
      setItems({ ...items, [category]: updated });
      setView("list");
      setSelectedItem(null);
      setShowDeletePopup(false);
    };*/

  const containerClass = 'abc-container';

  const ListView = () => (
    <div className={containerClass}>
      <StandardScrollStyles />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0, marginTop: 18 }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginRight: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Back"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" style={{ color: '#222', fontSize: 22 }} />
        </button>
        <div className="abc-title" style={{ margin: 0 }}>
          Inventory Management
        </div>
      </div>
      <div className="abc-subtitle">ABC Analysis</div>
      
      {/* Error Banner - shown when there's cached data but current connection fails */}
      {error && lastGoodDataRef.current && (
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "4px",
          padding: "12px",
          margin: "10px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ fontSize: "14px", color: "#856404" }}>
            ⚠️ {error} (Showing cached data)
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchABCData({ background: false });
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}
      
      {/* test seeding UI removed */}

      {/* Tabs */}
      <div className="abc-tabs">
        {["A", "B", "C"].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`abc-tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}-Items
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div
        className="abc-search"
        onClick={() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="abc-search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="abc-search-input"
        />
        {searchTerm && (
          <FontAwesomeIcon icon={faTimes} onClick={clearSearch} className="abc-search-clear" />
        )}
      </div>

      {/* Item cards (animated) */}
      <div className="abc-list" style={standardScrollStyles}>
        {filteredItems[activeTab].length === 0 ? (
          <div className="abc-empty">
            <div className="abc-empty-emoji">📊</div>
            <div className="abc-empty-title">
              {searchTerm ? `No ${activeTab}-category items found matching "${searchTerm}"` : `No ${activeTab}-category items found`}
            </div>
            <div className="abc-empty-desc">
              {!searchTerm && activeTab === 'A' && "High-value items will appear here"}
              {!searchTerm && activeTab === 'B' && "Medium-value items will appear here"}
              {!searchTerm && activeTab === 'C' && "Low-value items will appear here"}
              {searchTerm && "Try adjusting your search terms"}
            </div>
          </div>
        ) : (
          <AnimatedList
            items={filteredItems[activeTab]}
            onItemSelect={(item) => openDetails(item)}
            showGradients={true}
            enableArrowNavigation={true}
            displayScrollbar={true}
            getItemKey={(item, idx) => item.id ?? `${activeTab}-${idx}`}
            renderItem={(item, idx) => (
              <StandardCard
                className="abc-item-card standard-card--no-hover"
                hover={false}
                // Add visual disable state for non-A categories (no pointer and lower opacity on hover intention)
                style={activeTab !== 'A' ? { cursor: 'default' } : undefined}
              >
                <div>
                  <div className="name">
                    {highlightMatch(item.name, searchTerm)}
                  </div>
                </div>
                <div className="abc-card-right">
                  <div className="qty">
                    {item.qty}
                  </div>
                  {activeTab === "A" && (
                    <div className="tag-high">
                      High-Value Item
                    </div>
                  )}
                  {activeTab === "B" && item.canManage && (
                    <div
                      className="tap-manage"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTapToManage(item);
                      }}
                    >
                      Tap to manage
                    </div>
                  )}
                  {activeTab === "B" && !item.canManage && (
                    <div className="tap-manage" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      Not manageable
                    </div>
                  )}
                  {activeTab === "C" && (
                    <div className="tag-basic">
                      Basic Item
                    </div>
                  )}
                </div>
              </StandardCard>
            )}
          />
        )}
      </div>

      {/* Popup for move */}
      {showPopup && (
        <div className="abc-popup-overlay">
          <div className="abc-popup-content">
            <p>Move to category A?</p>
            <div className="abc-popup-actions">
              <button onClick={moveToA} className="btn btn-primary">
                Move
              </button>
              <button onClick={() => setShowPopup(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const DetailsView = () => {
    const item = selectedItem || {};
    return (
      <div className={containerClass}>
        <div className="abc-details-header">
          <FontAwesomeIcon
            icon={faArrowLeft}
            style={{ cursor: "pointer", fontSize: 20 }}
            onClick={() => setView("list")}
          />
          <span className="abc-details-title">Item Details</span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}></div>
        </div>

        {/* Main card */}
        <div className="abc-main-card">
          <div style={{ marginBottom: "12px" }}>
            <div className="title" style={defaultTextSizes}>
              {searchTerm
                ? highlightMatch(item.name, searchTerm)
                : item.name
              } <span style={{ fontWeight: "normal", ...defaultTextSizes }}>{item.qty}</span>
            </div>
            {Number.isFinite(item.latestUnitCost) && (
              <div className="subtle">
                Latest Price: <strong>₹{(item.latestUnitCost || 0).toFixed(2)}</strong>
                {item.lastReceivedDate && (
                  <span style={{ color: '#777' }}> (as of {new Date(item.lastReceivedDate).toLocaleDateString()})</span>
                )}
              </div>
            )}
          </div>

          <div style={{ fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#777" }}>Primary Supplier</span>
              <span>{item.supplier}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#777" }}>Expiry Date</span>
              <span style={{ color: "#e53935", fontWeight: "bold" }}>{item.expiry}</span>
            </div>
          </div>
        </div>

  {/* Low Stock and Value */}
        <div className="abc-info-grid">
          <div className="tile">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: "bold" }}>Low Stock</div>
              {(item.stockStatus === 'critical' || item.stockStatus === 'low') && (
                <div className={`status-badge ${item.stockStatus === 'critical' ? 'status-critical' : 'status-low'}`}>
                  {item.stockStatus === 'critical' ? 'Alert' : 'Low'}
                </div>
              )}
            </div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {formatQuantity(item.currentStock ?? 0, item.unitSymbol)}
            </div>
            <div className="status">
              {item.stockStatus === 'critical' ? 'At/Below safety stock' : item.stockStatus === 'low' ? 'Below reorder point' : 'Sufficient'}
            </div>
          </div>
          <div className="tile">
            <div style={{ fontWeight: "bold" }}>Value</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{item.value}</div>
            <div style={{ fontSize: "12px", color: "#777" }}>Total Inventory</div>
          </div>
        </div>

  {/* Usage and Waste (Monthly) */}
        <div className="abc-info-grid">
          <div className="tile">
            <div style={{ fontWeight: "bold" }}>Usage</div>
            <div className="usage-circle" style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
              {(() => {
                const pct = Number.isFinite(item.usagePercent) ? Math.max(0, Math.min(100, item.usagePercent)) : 0;
                return (
                  <svg viewBox="0 0 36 36" style={{ width: "64px", height: "64px" }}>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      stroke="#e5e5e5"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      stroke="#673ab7"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${pct}, 100`}
                      strokeLinecap="round"
                    />
                    <text x="18" y="20.35" textAnchor="middle" fontSize="9" fill="#673ab7" fontWeight="600">
                      {pct}%
                    </text>
                  </svg>
                );
              })()}
            </div>
            <div style={{ fontSize: "12px", color: "#777", textAlign: "center", marginTop: "6px" }}>
              {`This month: ${item.monthlyUsageQty || item.usageQty || '0'}`}
            </div>
            {item.monthlyUsageValue && (
              <div className="status" style={{ textAlign: "center" }}>{item.monthlyUsageValue}</div>
            )}
          </div>
          <div className="tile">
            <div style={{ fontWeight: "bold" }}>Waste (This month)</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{item.wasteMonthQty || '0'}</div>
            <div className="status">{item.wasteMonthValue || ''}</div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state on first mount only; show video overlay
  // Keep intro overlay until we actually have a resolved fetch result (items loaded or confirmed empty)
  if (showIntro || (loading && !lastGoodDataRef.current)) {
    return (
      <div className={`abc-video-overlay ${videoFadingOut ? 'fading-out' : ''}`} style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: '#000', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 9999,
        animation: videoFadingOut ? 'videoFadeOut 500ms ease forwards' : undefined 
      }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        >
          <source src={ABCVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Optional loading text overlay */}
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          <div>Loading ABC Analysis...</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            {loadLabel || 'Preparing data...'}
          </div>
        </div>
      </div>
    );
  }

  if (loading && !lastGoodDataRef.current) {
    return (
      <div className={containerClass}>
        <div className="abc-title">Inventory Management</div>
        <div className="abc-subtitle">ABC Analysis</div>
        <div className="abc-loading-overlay">
          <div className="abc-loading-modal">
            <div className="abc-loading-title">Loading ABC Analysis…</div>
            <div className="abc-loading-desc">{loadLabel}</div>
            <div style={{ width: '100%', marginTop: 12 }}>
              <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, loadProgress))}%`, background: 'linear-gradient(90deg,#7c3aed,#6366f1,#06b6d4)', transition: 'width 200ms ease' }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#666', marginTop: 6 }}>{Math.max(0, Math.min(100, loadProgress))}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Error state only when no previous data exists
  if (error && !lastGoodDataRef.current) {
    return (
      <div className={containerClass}>
        <div className="abc-title">Inventory Management</div>
        <div className="abc-subtitle">ABC Analysis</div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          flexDirection: "column",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <div style={{ fontSize: "18px", marginBottom: "16px", color: "#856404" }}>⚠️ Error Loading Data</div>
          <div style={{ fontSize: "14px", color: "#856404", textAlign: "center", marginBottom: "16px" }}>
            {error}
          </div>
          <button
            onClick={() => fetchABCData()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="abc-main-container">
        <ListView />
      </div>
    );
  } else {
    return (
      <div className="abc-main-container">
        <DetailsView />
      </div>
    );
  }
}