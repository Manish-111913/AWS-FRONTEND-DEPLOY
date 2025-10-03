import React, { useState, useEffect, useRef } from 'react';
import { faPenToSquare, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StandardSearch } from '../styles/standardStyles';
import UnitMappingService from '../services/unitMappingService';
import RecipesService from '../services/recipesService';
import MenuItemSelector from './MenuItemSelector';
import InventoryService from '../services/inventoryService';
import RecipeLibraryService from '../services/recipeLibraryService';
import './itemmap.css';
import { FaArrowLeft } from "react-icons/fa";
import { API_ORIGIN } from '../services/apiClient';

// styles moved to itemmap.css

// Helpers: name normalization and Levenshtein distance (module scope so they are always defined)
function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(th|dh|bh)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  a = normalizeName(a); b = normalizeName(b);
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// Custom, fully-stylable select component
const NiceSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex(o => o.value === value)));
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const idx = options.findIndex(o => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [value, options]);

  const selectByIndex = (idx) => {
    const opt = options[idx];
    if (!opt) return;
    onChange && onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActiveIndex(i => Math.min(options.length - 1, (i ?? -1) + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActiveIndex(i => Math.max(0, (i ?? options.length) - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); selectByIndex(activeIndex >= 0 ? activeIndex : 0); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const selected = options.find(o => o.value === value);

  return (
    <div
      ref={wrapRef}
      className={`nice-select-custom${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
      style={{ width: fullWidth ? '100%' : undefined, ...style }}
    >
      <div
        className="ns-control"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={onKeyDown}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? selected?.value ?? placeholder}
        </span>
        <span className="ns-arrow" />
      </div>
      {open && !disabled && (
        <div className="ns-menu" role="listbox">
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`ns-option${opt.value === value ? ' selected' : ''}${idx === activeIndex ? ' active' : ''}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => { e.preventDefault(); }}
              onClick={() => selectByIndex(idx)}
            >
              {opt.label ?? opt.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Searchable dropdown (with inline filter input) used for unit selection
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Search unit...',
  disabled = false,
  style,
  visibleCount = 4,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const controlRef = useRef(null);
  const [menuWidth, setMenuWidth] = useState(undefined);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    (o.label || o.value || '').toLowerCase().includes(query.toLowerCase())
  );

  // When opening or when options/filter change, measure widest option and size menu accordingly
  useEffect(() => {
    if (!open) return;
    const ctrl = controlRef.current;
    if (!ctrl) return;
    const computeWidth = () => {
      const testEl = document.createElement('div');
      const cs = window.getComputedStyle(ctrl);
      testEl.style.position = 'fixed';
      testEl.style.left = '-9999px';
      testEl.style.top = '-9999px';
      testEl.style.visibility = 'hidden';
      testEl.style.whiteSpace = 'nowrap';
      testEl.style.fontFamily = cs.fontFamily || 'Inter, Arial, sans-serif';
      testEl.style.fontSize = '16px';
      testEl.style.fontWeight = '400';
      document.body.appendChild(testEl);
      let max = 0;
      const source = filtered.length ? filtered : options;
      for (const opt of source) {
        testEl.textContent = String(opt.label ?? opt.value ?? '');
        max = Math.max(max, testEl.clientWidth);
      }
      document.body.removeChild(testEl);
      const triggerW = ctrl.getBoundingClientRect().width;
      // Add generous padding and scrollbar allowance
      let needed = max + 60; // text + padding
      needed = Math.max(needed, triggerW);
      const maxViewport = Math.max(340, Math.floor(window.innerWidth * 0.9));
      setMenuWidth(Math.min(needed, maxViewport));
    };
    computeWidth();
    // Recompute on window resize while open
    const onResize = () => computeWidth();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, options, filtered]);

  const optionHeight = 36; // px per option row for height math
  const listMaxHeight = Math.max(1, visibleCount) * optionHeight;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', ...(style || {}) }}>
      <div
        ref={controlRef}
        onClick={() => !disabled && setOpen(o => !o)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          background: disabled ? '#f5f5f5' : '#fff',
          padding: '0 10px',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? selected?.value ?? 'g'}
        </span>
        <span style={{ border: 'solid #111', borderWidth: '0 2px 2px 0', display: 'inline-block', padding: 3, transform: 'rotate(45deg)' }} />
      </div>
      {open && !disabled && (
    <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 42,
      left: 0,
            zIndex: 50,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            padding: 8,
      width: menuWidth || 'max-content',
      minWidth: menuWidth || 'auto',
      maxWidth: '90vw',
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginBottom: 8,
              outline: 'none'
            }}
          />
          <div style={{ maxHeight: listMaxHeight, overflowY: 'auto', overflowX: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 12, color: '#777', fontSize: 13 }}>No matches</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => { onChange && onChange(opt.value); setOpen(false); setQuery(''); }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: opt.value === value ? '#f3f4f6' : 'transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap', // stay on one line
                    wordBreak: 'keep-all',
                  }}
                >
                  {opt.label ?? opt.value}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RecipeListScreen = ({ goTo }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredientList, setIngredientList] = useState([]);
  // Two-step input flow: first 10 plates, then 100 plates
  const [plateStep, setPlateStep] = useState(10); // 10 or 100
  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null);
  const [formData, setFormData] = useState({ name: '', quantity: 1, unit: 'g' });
  const [unitOptions, setUnitOptions] = useState([]);
  const [ingredientToolUnitsMap, setIngredientToolUnitsMap] = useState({}); // name -> [{symbol,label}]
  const [showNewRecipeForm, setShowNewRecipeForm] = useState(false);
  const [newRecipeData, setNewRecipeData] = useState({ name: '', category: 'Vegetarian', price: 0, servings: 1 });
  const [capturedImage, setCapturedImage] = useState(null);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState([]);
  const ocrMenuInputRef = useRef(null);
  const [showMenuSelector, setShowMenuSelector] = useState(false);
  const [categories, setCategories] = useState([]);
  const [savingIngredients, setSavingIngredients] = useState(false);

  // Inventory items map for standard units (name -> unit symbol)
  const [inventoryStdUnitMap, setInventoryStdUnitMap] = useState({});

  // Transient toast popup (auto hide after 1.5s)
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setToastMessage('');
      toastTimerRef.current = null;
    }, 1500);
  };
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // Auto-open file picker when OCR modal opens (for Scan Menu)
  useEffect(() => {
    if (showOCRModal && !ocrProcessing && ocrResults.length === 0) {
      // slight delay to ensure input is rendered
      const t = setTimeout(() => {
        try { ocrMenuInputRef.current && ocrMenuInputRef.current.click(); } catch {}
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showOCRModal, ocrProcessing, ocrResults.length]);

  // Load recipes, unit options, and inventory std units from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const recipesData = await RecipesService.getRecipes();
        const normalized = recipesData.map(r => ({ ...r })); // Normalize recipes data
        setRecipes(normalized);
        // Build categories from backend data
        const uniqueCats = Array.from(new Set(normalized.map(r => r.category).filter(Boolean)));
        setCategories(uniqueCats);

  const unitOptionsData = await UnitMappingService.getUnitOptions();
        // Build a minimal, global base list only (do NOT include custom Count units)
        // Keep mapping dropdown clean; ingredient-specific tools are merged later per item.
  // Base units (global for all) + common kitchen tools (use 'pcs' only, no 'pc')
  const allowedBase = ['g', 'kg', 'ml', 'L', 'pcs', 'tsp', 'tbsp', 'cup', 'bowl'];
        const bySymbol = new Map();
        for (const group of ['kitchen', 'supplier', 'container']) {
          for (const u of unitOptionsData[group] || []) {
            const sym = (u.unit_symbol || '').trim();
            if (!sym) continue;
            if (!bySymbol.has(sym)) bySymbol.set(sym, u);
          }
        }
        const baseUnits = allowedBase
          .filter(sym => sym && (bySymbol.has(sym) || true))
          .map(sym => ({ value: sym, label: sym }));
        setUnitOptions(baseUnits);

        // Fetch ingredient-scoped kitchen conversions and build a lookup for per-ingredient extra options
        try {
          const businessId = UnitMappingService.getBusinessId();
          const convs = await UnitMappingService.getIngredientKitchenUnits(businessId);
          // convs: [{ item, kitchen_tool, unit, quantity }]
          const byItem = {};
          for (const r of convs || []) {
            const itemName = (r.item || '').trim();
            const toolSym = (r.kitchen_tool || '').trim();
            const outUnit = (r.unit || '').trim();
            if (!itemName || !toolSym || !outUnit) continue;
            // Represent tool symbol itself as a selectable unit in mapping UI
            const key = itemName.toLowerCase();
            if (!byItem[key]) byItem[key] = new Map();
            // Avoid duplicates; prefer lowercase label
            if (!byItem[key].has(toolSym.toLowerCase())) byItem[key].set(toolSym.toLowerCase(), { value: toolSym.toLowerCase(), label: toolSym.toLowerCase() });
          }
          // Convert maps to arrays
          const finalized = {};
          Object.keys(byItem).forEach(k => finalized[k] = Array.from(byItem[k].values()));
          setIngredientToolUnitsMap(finalized);
        } catch (e) {
          console.warn('Failed to load ingredient kitchen units (optional):', e);
        }

        // Fetch inventory items to know each item's standard unit (e.g., ml/L for liquids)
        try {
          const inv = await InventoryService.getInventoryItems(1, 500);
          const map = {};
          for (const it of inv.data || []) {
            if (it?.name) map[it.name.trim().toLowerCase()] = it.standardUnit || null;
          }
          setInventoryStdUnitMap(map);
        } catch (e) {
          console.warn('Failed to fetch inventory items for standard units', e);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load ingredients for selected recipe
  const loadRecipeIngredients = async (recipeId) => {
    try {
      const ingredients = await RecipesService.getRecipeIngredients(recipeId);
      return ingredients;
    } catch (error) {
      console.error('Failed to load recipe ingredients:', error);
      return [];
    }
  };

  const filteredRecipes = recipes.filter((r) => {
    const matchName = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === 'All' || r.category === filter;
    return matchName && matchCat;
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        setShowNewRecipeForm(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const createNewRecipe = async () => {
    if (!newRecipeData.name.trim()) {
      alert('Recipe name is required');
      return;
    }
    try {
      const recipeData = {
        name: newRecipeData.name,
        category: newRecipeData.category,
        price: parseFloat(newRecipeData.price) || 0,
        servings: parseInt(newRecipeData.servings) || 1,
        ingredients: []
      };
      await RecipesService.createRecipe(recipeData);
      const refreshedRecipes = await RecipesService.getRecipes();
      setRecipes(refreshedRecipes);
      setShowNewRecipeForm(false);
      setNewRecipeData({ name: '', category: 'Vegetarian', price: 0, servings: 1 });
      setCapturedImage(null);
      alert('New recipe created successfully!');
    } catch (error) {
      console.error('Failed to create recipe:', error);
      alert('Failed to create recipe');
    }
  };

  // Keep units as entered; no auto-conversion for clarity in 10/100 step entry
  const normalizeQty = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  // Unit conversion helper: supports g<->kg, ml<->L, and weight<->volume with 1:1 density fallback
  const convertQuantity = (value, fromUnit, toUnit) => {
    if (!fromUnit || !toUnit || fromUnit === toUnit) return Number(value) || 0;
    const w = ['g', 'kg'];
    const v = ['ml', 'L'];
    const inW = w.includes(fromUnit);
    const inV = v.includes(fromUnit);
    const outW = w.includes(toUnit);
    const outV = v.includes(toUnit);

    let val = Number(value) || 0;

    // First, normalize to base small unit (g or ml)
    if (fromUnit === 'kg') val = val * 1000;
    if (fromUnit === 'L') val = val * 1000;

    // If crossing dimensions (g<->ml), assume 1:1 density
    // At this point val is in base small unit (g or ml). If source was weight and target is volume (or vice versa), keep val as-is.

    // Now convert from base to target
    if (toUnit === 'kg') return val / 1000;   // g -> kg
    if (toUnit === 'L') return val / 1000;    // ml -> L
    // toUnit is 'g' or 'ml': already in base
    return val;
  };

  // Normalize within same dimension: 1000 ml -> 1 L, 1000 g -> 1 kg; also reverse if <1 L/kg
  const normalizeToPreferredUnit = (value, unit) => {
    let u = unit || 'g';
    let v = Number(value) || 0;
    if (u === 'ml' && v >= 1000) { return { value: Math.round(v / 1000), unit: 'L' }; }
    if (u === 'L' && v < 1 && v > 0) { return { value: Math.round(v * 1000), unit: 'ml' }; }
    if (u === 'g' && v >= 1000) { return { value: Math.round(v / 1000), unit: 'kg' }; }
    if (u === 'kg' && v < 1 && v > 0) { return { value: Math.round(v * 1000), unit: 'g' }; }
    return { value: Math.round(v), unit: u };
  };

  const updateQuantity = (index, value) => {
    // Prevent rapid successive updates that might cause race conditions
    setIngredientList(prevList => {
      // Ensure we have a valid index
      if (index < 0 || index >= prevList.length) {
        console.warn('Invalid index in updateQuantity:', index, 'Array length:', prevList.length);
        return prevList;
      }
      
      const updated = [...prevList];
      const currentItem = updated[index];
      
      // Ensure the item exists
      if (!currentItem) {
        console.warn('Item not found at index:', index);
        return prevList;
      }
      
      const qty = normalizeQty(value);
      const prevUnit = currentItem.unit || 'g';
      
      // Apply normalization relative to current unit
      const norm = normalizeToPreferredUnit(qty, prevUnit);
      const unitChanged = norm.unit !== prevUnit;
      
      // Create a new item object to avoid mutation
      const newItem = { ...currentItem };
      
      // Update the specific quantity based on plateStep
      if (plateStep === 10) {
        newItem.qty10 = norm.value;
      } else {
        newItem.qty100 = norm.value;
      }
      
      // If unit changed, convert the other step to maintain consistency
      if (unitChanged) {
        if (plateStep === 10) {
          newItem.qty100 = Number(convertQuantity(newItem.qty100 || 0, prevUnit, norm.unit).toFixed(4));
        } else {
          newItem.qty10 = Number(convertQuantity(newItem.qty10 || 0, prevUnit, norm.unit).toFixed(4));
        }
        newItem.unit = norm.unit;
      }
      
      // Replace the item at the specific index
      updated[index] = newItem;
      
      return updated;
    });
  };

  const startEditingIngredient = (index) => {
    const ingredient = ingredientList[index];
    if (!ingredient) return;
    setEditingIngredientIndex(index);
    const qty = plateStep === 10 ? ingredient.qty10 : ingredient.qty100;
    setFormData({ name: ingredient.name || 'New Ingredient', quantity: qty ?? 1, unit: ingredient.unit || 'g' });
  };

  // Autocomplete suggestions for inventory items
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  useEffect(() => {
    let active = true;
    const run = async () => {
      const term = formData.name?.trim();
      if (!editingIngredientIndex && editingIngredientIndex !== 0) return;
      if (!term || term === 'New Ingredient') { setNameSuggestions([]); return; }
      try {
        const items = await InventoryService.searchInventoryItems(term, 1, 200);
        if (active) setNameSuggestions(items);
      } catch (e) {
        console.warn('searchInventoryItems failed', e);
      }
    };
    run();
    return () => { active = false; };
  }, [formData.name, editingIngredientIndex]);

  const pickNameSuggestion = (s) => {
    setFormData(prev => ({ ...prev, name: s.name }));
    if (s.standardUnit) setFormData(prev => ({ ...prev, unit: s.standardUnit }));
    setShowNameSuggestions(false);
  };

  // Price auto-calculation removed per new flow

  const saveIngredient = async () => {
    if (!formData.name.trim()) {
      alert('Ingredient name cannot be empty');
      return;
    }

    // If the typed name is new, create inventory item first so recipes API can reference it
    try {
      const matches = nameSuggestions?.filter(i => i.name?.toLowerCase() === formData.name.trim().toLowerCase());
      if (!matches || matches.length === 0) {
        await InventoryService.createInventoryItem({
          name: formData.name.trim(),
          unit_symbol: formData.unit || 'g',
          business_id: 1,
          source: 'ingredient_mapping'  // Track that this item was added via ingredient mapping
        });
      }
    } catch (e) {
      console.error('createInventoryItem failed (continuing):', e);
    }

    // Ensure unit defaults to inventory standard unit if available (favor ml/L for liquids)
    const nameKey = formData.name.trim().toLowerCase();
    const std = inventoryStdUnitMap[nameKey];
    let unitToUse = formData.unit || std || 'g';
    if ((unitToUse === 'g' || unitToUse === 'kg') && (std === 'ml' || std === 'L')) {
      unitToUse = std;
    }

    const updated = [...ingredientList];
    const base = { name: formData.name, unit: unitToUse };
    const qty = normalizeQty(formData.quantity);
    updated[editingIngredientIndex] = plateStep === 10 ? { ...base, qty10: qty, qty100: updated[editingIngredientIndex]?.qty100 ?? 0 } : { ...base, qty10: updated[editingIngredientIndex]?.qty10 ?? 0, qty100: qty };
    setIngredientList(updated);
    setEditingIngredientIndex(null);
    setFormData({ name: '', quantity: 1, unit: 'g' });
  };

  const cancelEditing = () => {
  // (helpers moved to module scope)

    setEditingIngredientIndex(null);
    setFormData({ name: '', quantity: 1, unit: 'g' });
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.REACT_APP_API_URL || API_ORIGIN}/api/ocr/process-image`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success && data.data.items) {
        const ingredients = data.data.items.map(item => ({
          name: item.item_name || item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'g',
          category: item.category || 'Uncategorized'
        }));

        setOcrResults(ingredients);
      } else {
        alert('Failed to extract ingredients from receipt');
        setShowOCRModal(false);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Error processing receipt. Please try again.');
      setShowOCRModal(false);
    } finally {
      setOcrProcessing(false);
    }
  };

  const addOCRIngredientsToRecipe = async () => {
    try {
      const mapped = ocrResults.map(item => ({
        name: item.name,
        unit: item.unit || 'g',
        qty10: plateStep === 10 ? Number(item.quantity) : 0,
        qty100: plateStep === 100 ? Number(item.quantity) : 0
      }));
      const existing = ingredientList.filter(i => i.name !== 'New Ingredient');
      setIngredientList([...existing, ...mapped]);
      setShowOCRModal(false);
      setOcrResults([]);
    } catch (error) {
      console.error('Failed to add OCR ingredients:', error);
      alert('Failed to add ingredients. Please try again.');
    }
  };

  const savePerPlateToDB = async () => {
    setSavingIngredients(true);
    try {
      // Prefer quantities from 100-plate step; fallback to 10-plate if 100 not provided
      const perPlateRaw = ingredientList
        .filter(i => (i.name || '').trim() && (i.qty10 > 0 || i.qty100 > 0) && i.name !== 'New Ingredient')
        .map(i => ({
          name: i.name,
          unit: i.unit || 'g',
          quantity: Number(((i.qty100 && i.qty100 > 0 ? i.qty100 / 100 : (i.qty10 || 0) / 10)).toFixed(4))
        }));
      // Merge duplicates by name+unit (sum quantities); if same name appears with different unit, keep the first and convert others into it
      const merged = [];
      for (const ing of perPlateRaw) {
        const keyIdx = merged.findIndex(x => x.name.trim().toLowerCase() === ing.name.trim().toLowerCase());
        if (keyIdx === -1) {
          merged.push({ ...ing });
        } else {
          const target = merged[keyIdx];
          // Convert ing to target unit if needed
          const addQty = convertQuantity(ing.quantity, ing.unit, target.unit);
          target.quantity = Number((target.quantity + addQty).toFixed(4));
        }
      }
      await RecipesService.updateRecipeIngredients(selectedRecipe.id, merged);
      // Persist confirmed status and refresh list
      try { await RecipesService.setRecipeStatus(selectedRecipe.id, 'confirmed'); } catch (e) { console.warn('Failed to persist status, continuing', e); }
      const refreshed = await RecipesService.getRecipes();
      setRecipes(refreshed);
      setSelectedRecipe(null);
      setEditingIngredientIndex(null);
      showToast('Recipe saved successfully!');
    } catch (error) {
      console.error('Failed to save per-plate ingredients:', error);
      showToast('Failed to save recipe changes');
    } finally {
      setSavingIngredients(false);
    }
  };

  const squareBtnStyle = {
    // Match TSR complementary quantity button styling
    width: 24,
    height: 24,
    borderRadius: 4,
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  };

  // Capsule container similar to TSR complementary item styling
  const controlsBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    background: '#fff',
    border: 'none',
    borderRadius: 6,
    width: 28, height: 28, borderRadius: 6, border: '1px solid #F3F4F6', backgroundColor: '#F3F4F6',
    fontWeight: 'bold', fontSize: 18, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 0,
  };

  if (selectedRecipe) {
    return (
      <>
        <div className="itemmap-container editor">
          {/* Top header with back button and page title */}
          <div className="itemmap-header">
            <button
              className="back-btn"
              onClick={() => { setSelectedRecipe(null); setEditingIngredientIndex(null); }}
            >
              <FaArrowLeft
                size={20}
                style={{ cursor: "pointer" }}
              />
            </button>
            <h3 className="page-title">Ingredient Mapping</h3>
          </div>

          <div className="recipe-titlebar">
            <div className="recipe-title">
              {selectedRecipe.name}
            </div>
          </div>


          <img
            // Local placeholder fallback
            src={selectedRecipe.image || require('../assets/placeholder-menu-item.png')}
            onError={(e)=>{ if(!e.target.dataset.fallback){ e.target.dataset.fallback='1'; e.target.src=require('../assets/placeholder-menu-item.png'); }}}
            alt="Dish"
            className="recipe-hero"
          />


          <div className="step-indicator">
            {plateStep === 10 ? 'Step 1 of 2' : 'Step 2 of 2'}
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <h4 className="panel-title" style={{textAlign:'left', fontSize:'1.4rem'}}>Ingredients</h4>
            {ingredientList.map((item, idx) => (
              <div key={`${item.name || 'ingredient'}-${idx}`} className={`ingredient-row ${editingIngredientIndex === idx ? 'editing' : ''}`}>
                {editingIngredientIndex === idx ? (
                  <>
                    {/* Name on the left, same as normal row */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setShowNameSuggestions(true); }}
                        placeholder="Ingredient Name"
                        className="text-input"
                        style={{ fontWeight: 500, width: '100%' }}
                      />
                      {showNameSuggestions && nameSuggestions?.length > 0 && (
                        <div className="suggestions">
                          {nameSuggestions.slice(0, 8).map(s => (
                            <div key={s.id || s.name} onClick={() => pickNameSuggestion(s)} className="suggestion-item">
                              <span>{s.name}</span>
                              {s.standardUnit && <span className="suggestion-unit">{s.standardUnit}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Controls on the right, EXACT same cluster as normal rows */}
                    <div className="controls-inline">
                      <button
                        className="square-btn"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: normalizeQty((prev.quantity || 0) - 1) }))}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="number-input"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        onBlur={() => {
                          const norm = normalizeToPreferredUnit(formData.quantity, formData.unit);
                          setFormData(prev => ({ ...prev, quantity: norm.value, unit: norm.unit }));
                        }}
                        onWheel={(e) => e.target.blur()}
                      />
                      <button
                        className="square-btn"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: normalizeQty((prev.quantity || 0) + 1) }))}
                      >
                        ＋
                      </button>
                      <SearchableSelect
                        value={formData.unit}
                        onChange={(newUnit) => {
                          const prevUnit = formData.unit || 'g';
                          const converted = Number(convertQuantity(formData.quantity, prevUnit, newUnit).toFixed(4));
                          setFormData({ ...formData, unit: newUnit, quantity: converted });
                        }}
                        options={(unitOptions && unitOptions.length > 0)
                          ? unitOptions
                          : [
                              { value: 'g', label: 'g (Gram)' },
                              { value: 'kg', label: 'kg (Kilogram)' },
                              { value: 'ml', label: 'ml (Milliliter)' },
                              { value: 'L', label: 'L (Liter)' },
                              { value: 'tsp', label: 'tsp (Teaspoon)' },
                              { value: 'tbsp', label: 'tbsp (Tablespoon)' },
                              { value: 'cup', label: 'cup (Cup)' },
                              { value: 'pcs', label: 'pcs (Pieces)' },
                            ]}
                        placeholder="Search unit..."
                        style={{ width: 110 }}
                      />
                    </div>
                    {/* Inline actions placed to the immediate right so controls cluster width matches other rows */}
                    <div className="edit-actions edit-actions--block">
                      <button onClick={saveIngredient} className="btn btn--primary btn--sm">Save</button>
                      <button onClick={cancelEditing} className="btn btn--secondary btn--sm">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{fontSize:'1.1rem'}} className={`ingredient-name ${item.name === 'New Ingredient' ? 'clickable' : ''}`} onClick={() => item.name === 'New Ingredient' && startEditingIngredient(idx)}>{item.name}</div>
                    {item.name !== 'New Ingredient' && (
                      <div className="controls-inline">
                        <button 
                          onClick={() => {
                            const currentQty = plateStep === 10 ? (item.qty10 || 0) : (item.qty100 || 0);
                            const newQty = Math.max(0, currentQty - 1);
                            console.log(`Decreasing item ${idx} (${item.name}) from ${currentQty} to ${newQty}`);
                            updateQuantity(idx, newQty);
                          }} 
                          className="square-btn"
                        >
                          −
                        </button>
                        <input 
                          type="number" 
                          className="number-input" 
                          value={plateStep === 10 ? 
                            Math.round(item.qty10 ?? 0) : 
                            Math.round(item.qty100 ?? 0)
                          } 
                          onChange={(e) => {
                            console.log(`Input change for item ${idx} (${item.name}):`, e.target.value);
                            updateQuantity(idx, e.target.value);
                          }} 
                          onBlur={(e) => updateQuantity(idx, e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          min="0"
                          step="0.001"
                        />
                        <button 
                          onClick={() => {
                            const currentQty = plateStep === 10 ? (item.qty10 || 0) : (item.qty100 || 0);
                            const newQty = currentQty + 1;
                            console.log(`Increasing item ${idx} (${item.name}) from ${currentQty} to ${newQty}`);
                            updateQuantity(idx, newQty);
                          }} 
                          className="square-btn"
                        >
                          ＋
                        </button>
                        <SearchableSelect
                          value={item.unit || 'g'}
                          onChange={(newUnit) => {
                            setIngredientList(prevList => {
                              const updated = [...prevList];
                              const prevUnit = updated[idx].unit || 'g';
                              
                              if (plateStep === 10) {
                                const cur = updated[idx].qty10 || 0;
                                updated[idx].qty10 = Number(convertQuantity(cur, prevUnit, newUnit).toFixed(4));
                              } else {
                                const cur = updated[idx].qty100 || 0;
                                updated[idx].qty100 = Number(convertQuantity(cur, prevUnit, newUnit).toFixed(4));
                              }
                              updated[idx].unit = newUnit;
                              return updated;
                            });
                          }}
                          options={(() => {
                            // Merge base units with ingredient-specific kitchen tools for this item only
                            const rawName = (item.name || '').trim();
                            const nameKey = rawName.toLowerCase();
                            let extras = ingredientToolUnitsMap[nameKey] || [];
                            if (!extras.length) {
                              const normRaw = normalizeName(rawName);
                              const candidates = Object.keys(ingredientToolUnitsMap || {});
                              let best = { key: null, dist: Infinity };
                              for (const k of candidates) {
                                const d = levenshtein(normRaw, normalizeName(k));
                                if (d < best.dist) best = { key: k, dist: d };
                              }
                              if (best.key && (best.dist <= 2 || normalizeName(best.key).includes(normalizeName(rawName)) || normalizeName(rawName).includes(normalizeName(best.key)))) {
                                extras = ingredientToolUnitsMap[best.key] || [];
                              }
                            }
                            const base = unitOptions || [];
                            const seen = new Set();
                            const merged = [];
                            for (const u of [...base, ...extras]) {
                              const v = (u.value || '').toLowerCase();
                              if (!v || seen.has(v)) continue;
                              seen.add(v);
                              merged.push(u);
                            }
                            return merged.length > 0 ? merged : [{ value: 'g', label: 'g' }];
                          })()}
                          placeholder="Search unit..."
                          style={{ width: 90 }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="add-ingredient-button" onClick={() => {
                const newIngredient = { name: 'New Ingredient', unit: 'g', qty10: plateStep === 10 ? 1 : 0, qty100: plateStep !== 10 ? 1 : 0 };
                const updatedIngredients = [...ingredientList, newIngredient];
                setIngredientList(updatedIngredients);
                setEditingIngredientIndex(updatedIngredients.length - 1);
                setFormData({ name: 'New Ingredient', quantity: 1, unit: 'g' });
              }} style={{ flex: 1, fontSize:'1.1rem' }}>
                Add Ingredient
              </button>
              {/* Scan Receipt removed as requested */}
            </div>
          </div>
          <div className="footer-actions">
            {plateStep === 10 ? (
              <button style={{height:'3.3rem', cursor:'pointer'}} className="btn--continue" onClick={() => {
                // auto-fill 100-plate values using x10 of 10-plate inputs if qty100 empty
                const next = ingredientList.map(i => {
                  const existing100 = (i.qty100 && i.qty100 > 0) ? i.qty100 : Number(((i.qty10 || 0) * 10).toFixed(4));
                  const norm = normalizeToPreferredUnit(existing100, i.unit || 'g');
                  // If unit changes, convert qty10 too
                  if (norm.unit !== (i.unit || 'g')) {
                    const convertedTen = Number(convertQuantity(i.qty10 || 0, i.unit || 'g', norm.unit).toFixed(4));
                    return { ...i, unit: norm.unit, qty10: convertedTen, qty100: norm.value };
                  }
                  return { ...i, qty100: norm.value };
                });
                setIngredientList(next);
                setPlateStep(100);
                showToast('Now enter for 100 plates');
              }}>
                Confirm and continue for 10 plates
              </button>
            ) : (
              <>
                <button className="btn--save" onClick={savePerPlateToDB}>
                  Save (stores per plate)
                </button>
              </>
            )}
          </div>
          {toastVisible && (
            <div className="toast">
              <div className="toast-text">{toastMessage}</div>
            </div>
          )}
          {savingIngredients && (
            <div className="saving-overlay">
              <div className="saving-card">
                <div className="spinner">🔄</div>
                <div className="saving-title">Saving Ingredient List</div>
                <div className="saving-subtitle">Please wait while we save your recipe ingredients...</div>
              </div>
            </div>
          )}
          {showOCRModal && (
            <div className="modal-overlay">
              <div className="modal-card modal-card--wide">
                <div className="modal-header">
                  <h3 style={{ margin: 0 }}>Scan Receipt for Ingredients</h3>
                  <button className="modal-close" onClick={() => { setShowOCRModal(false); setOcrResults([]); setOcrProcessing(false); }}>✕</button>
                </div>
                {!ocrProcessing && ocrResults.length === 0 && (
                  <div>
                    <label htmlFor="ocr-upload" className="dropzone">
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Upload Receipt Image</div>
                      <div style={{ fontSize: 14, color: '#666' }}>JPG, PNG, or PDF files supported</div>
                    </label>
                    <input id="ocr-upload" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleOCRUpload} />
                  </div>
                )}
                {ocrProcessing && (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>🔄</div>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Processing Receipt...</div>
                    <div style={{ fontSize: 14, color: '#666' }}>Extracting ingredients using AI</div>
                  </div>
                )}
                {ocrResults.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 16 }}>✅ Found {ocrResults.length} ingredients:</div>
                    <div style={{ marginBottom: 16 }}>
                      {ocrResults.map((item, idx) => (
                        <div key={idx} className="modal-list-item">
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{item.quantity} {item.unit} • {item.category}</div>
                          </div>
                          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 12, color: '#28a745' }} />
                        </div>
                      ))}
                    </div>
                    <div className="modal-actions">
                      <button onClick={() => { setShowOCRModal(false); setOcrResults([]); }} className="btn btn--secondary" style={{ flex: 1 }}>Cancel</button>
                      <button onClick={addOCRIngredientsToRecipe} className="btn btn--primary" style={{ flex: 2 }}>✅ Add All Ingredients</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="status-container">
        <div style={{ padding: 40 }}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>Loading recipes...</div>
          <div style={{ fontSize: 14, color: '#666' }}>Please wait while we fetch your recipes</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div style={{ padding: 40 }}>
          <div style={{ fontSize: 18, marginBottom: 10, color: '#d32f2f' }}>Error</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  if (showNewRecipeForm) {
    return (
      <div className="newrecipe-container">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => { setShowNewRecipeForm(false); setCapturedImage(null); }} className="back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h3 style={{ margin: 0 }}>Create New Recipe</h3>
        </div>
        {capturedImage && <img src={capturedImage} alt="Captured menu" className="recipe-hero" />}
        <div className="card">
          <div className="form-row">
            <label className="form-label">Recipe Name</label>
            <input type="text" value={newRecipeData.name} onChange={(e) => setNewRecipeData({ ...newRecipeData, name: e.target.value })} placeholder="Enter recipe name" className="text-input" style={{ width: '100%' }} />
          </div>
          <div className="form-row">
            <label className="form-label">Category</label>
            <div className="nocaret" style={{ width: '100%' }}>
              <NiceSelect
                value={newRecipeData.category}
                onChange={(val) => setNewRecipeData({ ...newRecipeData, category: val })}
                options={[
                  { value: 'Vegetarian', label: 'Vegetarian' },
                  { value: 'Non-Vegetarian', label: 'Non-Vegetarian' },
                  { value: 'Beverages', label: 'Beverages' },
                  { value: 'Desserts', label: 'Desserts' },
                ]}
                fullWidth
              />
            </div>
            <select value={newRecipeData.category} onChange={(e) => setNewRecipeData({ ...newRecipeData, category: e.target.value })} className="select-input" style={{ width: '100%' }}>
              <option value="Vegetarian">Vegetarian</option><option value="Non-Vegetarian">Non-Vegetarian</option><option value="Beverages">Beverages</option><option value="Desserts">Desserts</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="form-col">
              <label className="form-label">Price (₹)</label>
              <input type="number" value={newRecipeData.price} onChange={(e) => setNewRecipeData({ ...newRecipeData, price: e.target.value })} className="text-input" style={{ width: '100%' }} />
            </div>
            <div className="form-col">
              <label className="form-label">Servings</label>
              <input type="number" value={newRecipeData.servings} onChange={(e) => setNewRecipeData({ ...newRecipeData, servings: e.target.value })} className="text-input" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={() => { setShowNewRecipeForm(false); setCapturedImage(null); }} className="btn btn--secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={createNewRecipe} className="btn btn--primary" style={{ flex: 1 }}>Create Recipe</button>
          </div>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="status-container">
        <div style={{ padding: 40 }}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>No Recipes Found</div>
          <div style={{ fontSize: 14, color: '#666' }}>Start by adding your first recipe</div>
        </div>
      </div>
    );
  }

  return (
    <div className="itemmap-container">
      <div className="itemmap-header">
        <button onClick={() => goTo && goTo('map3')} className="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h3 className="page-title">Recipe List</h3>
      </div>
      <div className="search-wrap">
        <StandardSearch
          value={search}
          onChange={setSearch}
          placeholder="Search ingredients..."
        />
      </div>
      <div className="action-tiles">
        <div className="action-tile scan-full" style={{ padding: 0 }}>
          <button onClick={() => setShowOCRModal(true)} className="tile-btn">
            <div className="scan-card scan-card--filled">
              <div className="camera-icon-container">
                <div className="camera-icon" aria-hidden>
                  <svg className="scan-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 19V7a2 2 0 0 0-2-2h-3.2l-.6-1.2A2 2 0 0 0 13.4 3H10.6a2 2 0 0 0-1.8 1.8L8.2 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" fill="#ffffff"/>
                    <circle cx="12" cy="13" r="3" fill="#0b0f13" />
                  </svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="scan-title">Scan Menu</div>
                <div className="scan-subtitle">Take a photo of your menu</div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="category-chips">
        {['All', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`chip ${filter === c ? 'active' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>
      {filteredRecipes.map((r) => {
        const isEditing = r.editing;
        const handleUpdateRecipeField = async (id, field, value) => {
          setRecipes((prev) => prev.map((rec) => rec.id === id ? { ...rec, [field]: value } : rec));
          if (field === 'price') {
            try {
              const recipe = recipes.find(r => r.id === id);
              const updatedData = { name: recipe.name, price: parseFloat(value) || 0, servings: parseFloat(recipe.servings) || 1 };
              await RecipesService.updateRecipe(id, updatedData);
            } catch (error) {
              console.error('Failed to auto-save price:', error);
            }
          }
        };
        const saveRecipeChanges = async (id) => {
          try {
            const recipe = recipes.find(r => r.id === id);
            const updatedData = { name: recipe.name, price: parseFloat(recipe.price) || 0, servings: parseFloat(recipe.servings) || 1 };
            const result = await RecipesService.updateRecipe(id, updatedData);
            setRecipes((prev) => prev.map((rec) => rec.id === id ? { ...rec, ...result } : rec));
            console.log('Recipe updated successfully');
          } catch (error) {
            console.error('Failed to update recipe:', error);
            alert('Failed to save recipe changes');
            try {
              const recipesData = await RecipesService.getRecipes();
              setRecipes(recipesData);
            } catch (reloadError) {
              console.error('Failed to reload recipes:', reloadError);
            }
          }
        };
        const toggleEditMode = (id) => {
          setRecipes((prev) => prev.map((rec) => rec.id === id ? { ...rec, editing: !rec.editing } : rec));
        };
        return (
          <div key={r.id} className="recipe-card">
            <FontAwesomeIcon
              icon={faPenToSquare}
              onClick={(e) => { e.stopPropagation(); toggleEditMode(r.id); }}
              className="edit-icon"
            />
            {isEditing ? (
              <div>
                <h4 style={{ marginBottom: 10 }}>Edit Recipe</h4>
                <label style={{ display: 'block', marginBottom: 4 }}>Item Name</label>
                <input type="text" value={r.name} onChange={(e) => handleUpdateRecipeField(r.id, 'name', e.target.value)} style={{ fontWeight: 'bold', fontSize: 16, width: '100%', marginBottom: 8, padding: 6, borderRadius: 6 }} />
                <label style={{ display: 'block', marginBottom: 4 }}>Servings</label>
                <input type="number" value={r.servings} onChange={(e) => handleUpdateRecipeField(r.id, 'servings', parseInt(e.target.value))} style={{ fontSize: 14, width: '100%', marginBottom: 8, padding: 6, borderRadius: 6 }} />
                <label style={{ display: 'block', marginBottom: 4 }}>Price (₹)</label>
                <input type="number" value={r.price} onChange={(e) => handleUpdateRecipeField(r.id, 'price', parseInt(e.target.value))} style={{ fontSize: 14, width: '100%', marginBottom: 8, padding: 6, borderRadius: 6 }} />
                <label style={{ display: 'block', marginBottom: 4 }}>No. of Ingredients</label>
                <input type="number" value={r.ingredientsCount} onChange={(e) => handleUpdateRecipeField(r.id, 'ingredientsCount', parseInt(e.target.value))} style={{ fontSize: 14, width: '100%', marginBottom: 8, padding: 6, borderRadius: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleEditMode(r.id); }} style={{ padding: 6, borderRadius: 6, background: '#ccc', color: '#000', border: 'none', fontWeight: 'bold', flex: 1, marginRight: 10 }}>Cancel</button>
                  <button onClick={async (e) => { e.stopPropagation(); await saveRecipeChanges(r.id); toggleEditMode(r.id); }} style={{ padding: 6, borderRadius: 6, background: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', flex: 1 }}>✅ Save</button>
                </div>
              </div>
            ) : (
              <div
                onClick={async () => {
                  setSelectedRecipe({ ...r });
                  setPlateStep(10);
                  const ingredients = await loadRecipeIngredients(r.id);
                  const list = (ingredients.length > 0
                    ? ingredients.map(ing => {
                      const nameKey = (ing.name || '').trim().toLowerCase();
                      const std = inventoryStdUnitMap[nameKey];
                      let unitSym = ing.unit || std || 'g';
                      let perPlateQty = ing.quantity; // backend per-plate
                      if ((ing.unit === 'g' || ing.unit === 'kg') && (std === 'ml' || std === 'L')) {
                        unitSym = std;
                        perPlateQty = convertQuantity(ing.quantity, ing.unit || 'g', std);
                      }
                      if ((ing.unit === 'ml' || ing.unit === 'L') && (std === 'g' || std === 'kg')) {
                        unitSym = std;
                        perPlateQty = convertQuantity(ing.quantity, ing.unit || 'ml', std);
                      }
                      const tenQty = Number((perPlateQty * 10).toFixed(4));
                      const norm = normalizeToPreferredUnit(tenQty, unitSym);
                      return {
                        name: ing.name,
                        unit: norm.unit,
                        qty10: norm.value,
                        qty100: 0
                      };
                    })
                    : [{ name: 'New Ingredient', unit: 'g', qty10: 1, qty100: 0 }]);
                  setIngredientList(list);
                  showToast('Enter ingredients for 10 plates');
                }}
              >
                <div className="card-title">{r.name}</div>
                <div className="recipe-meta">
                  {r.servings} servings ・ {r.ingredientscount || r.ingredientsCount || 0} ingredients
                </div>
                <div className={`recipe-status ${r.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                  {r.status === 'confirmed' ? '✔ Confirmed' : 'Status'}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {(() => {
        const total = recipes.length;
        const confirmed = recipes.filter(r => r.status === 'confirmed').length;
        const allConfirmed = total > 0 && confirmed === total;
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 8 }}>
              {confirmed}/{total} items confirmed
            </div>
            <button
              disabled={!allConfirmed}
              onClick={() => allConfirmed && goTo && goTo('dashboard')}
              style={{
                width: '100%',
                padding: 14,
                background: allConfirmed ? '#111' : '#ccc',
                color: allConfirmed ? '#fff' : '#666',
                fontWeight: 'bold',
                borderRadius: 10,
                border: 'none',
                cursor: allConfirmed ? 'pointer' : 'not-allowed'
              }}
            >
              Finish
            </button>
          </div>
        );
      })()}

      {/* Menu Item Selector */}
      {showMenuSelector && (
        <MenuItemSelector
          onSelectMenuItem={async (newRecipe) => {
            try {
              const refreshedRecipes = await RecipesService.getRecipes();
              setRecipes(refreshedRecipes);
              setShowMenuSelector(false);
              alert(`Recipe "${newRecipe.name}" created successfully with pre-mapped ingredients!`);
            } catch (error) {
              console.error('Failed to refresh recipes:', error);
              setShowMenuSelector(false);
            }
          }}
          onClose={() => setShowMenuSelector(false)}
        />
      )}

      {/* OCR to Library Modal */}
  {showOCRModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>OCR to Library</h3>
              <button className="modal-close" onClick={() => { setShowOCRModal(false); setOcrResults([]); setOcrProcessing(false); }}>✕</button>
            </div>
            {!ocrProcessing && ocrResults.length === 0 && (
              <div>
                <label htmlFor="ocr-menu-upload" className="dropzone">
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Upload Menu Image</div>
                  <div style={{ fontSize: 14, color: '#666' }}>JPG, PNG, or PDF files supported</div>
                </label>
        <input ref={ocrMenuInputRef} id="ocr-menu-upload" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setOcrProcessing(true);
                  try {
                    const formData = new FormData();
                    formData.append('image', file);
                    formData.append('scan_type', 'Menu');
                    const response = await fetch(`${process.env.REACT_APP_API_URL || API_ORIGIN}/api/ocr/process-menu`, { method: 'POST', body: formData });
                    const data = await response.json();
                    if (data.success) {
                      const items = (data.data?.menu_items || []).map(x => ({ name: x.name || x, score: x.score || 1 }));
                      setOcrResults(items);
                    } else {
                      alert('Failed to process menu image');
                      setShowOCRModal(false);
                    }
                  } catch (err) {
                    console.error('OCR menu error', err);
                    alert('Error processing menu');
                    setShowOCRModal(false);
                  } finally {
                    setOcrProcessing(false);
                  }
                }} />
              </div>
            )}
            {ocrProcessing && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🔄</div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Processing Menu...</div>
                <div style={{ fontSize: 14, color: '#666' }}>Extracting dishes from the image</div>
              </div>
            )}
            {!ocrProcessing && ocrResults.length > 0 && (
              <div>
                <div className="modal-list-compact">Suggested dishes from OCR</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
                  {ocrResults.slice(0, 12).map((sug, i) => (
                    <OCRLibrarySuggestion key={`${sug.name}-${i}`} name={sug.name} onImport={async (dishName) => {
                      try {
                        const matches = await RecipeLibraryService.search(dishName);
                        const best = matches?.[0];
                        if (!best) { alert('No library match found'); return; }
                        const created = await RecipeLibraryService.importByName(best.name);
                        const refreshed = await RecipesService.getRecipes();
                        setRecipes(refreshed);
                        setShowOCRModal(false);
                        // Auto-open editor for the imported item
                        const newR = refreshed.find(r => r.name.toLowerCase() === best.name.toLowerCase());
                        if (newR) {
                          setSelectedRecipe({ ...newR });
                          const ingredients = await loadRecipeIngredients(newR.id);
                          const list = ingredients.map(ing => ({ name: ing.name, unit: ing.unit || 'g', qty10: Number((ing.quantity * 10).toFixed(4)), qty100: 0 }));
                          setIngredientList(list.length ? list : [{ name: 'New Ingredient', unit: 'g', qty10: 1, qty100: 0 }]);
                          showToast('Enter ingredients for 10 plates');
                        }
                      } catch (e) {
                        console.error('Import error', e);
                        alert('Failed to import from library');
                      }
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Lightweight suggestion item component
const OCRLibrarySuggestion = ({ name, onImport }) => (
  <div className="modal-list-item">
    <div style={{ fontWeight: 600 }}>{name}</div>
    <button onClick={() => onImport(name)} className="btn btn--primary">Use Suggested</button>
  </div>
);

export default RecipeListScreen;