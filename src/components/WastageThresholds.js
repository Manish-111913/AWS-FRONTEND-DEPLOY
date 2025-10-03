import React, { useEffect, useMemo, useRef, useState } from 'react';
import './WastageThresholds.css';
import './StockInForm-module.css';
import { StandardCard, StandardSearch, StandardScrollStyles } from '../styles/standardStyles';

// Usage-style dropdown copied to match StockIn exact styles
const UsageStyleDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select',
  style = {},
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);

  const normalized = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
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

  return (
    <div
      className={`relative ${className}`}
      ref={ref}
      style={{ position: 'relative', width: '100%', ...(style || {}) }}
    >
      <div className="shift-select" onClick={() => setOpen(o => !o)}>
        <div className="input-text-wrapper">
          <span className="shift-details">
            {current ? (
              <>
                <span className="shift-name">{current.label}</span>
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
          className="shift-dropdown-options"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e)=>e.stopPropagation()}
        >
          <div className="select-list" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {normalized.map(opt => (
              <div
                key={String(opt.value)}
                className="shift-option"
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="shift-name">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const demoItems = [
  { id: 1, name: 'Signature House Burger', unit: 'Plates', limit: 5, img: 'https://picsum.photos/seed/burger/80/80' },
  { id: 2, name: 'Margherita Pizza', unit: 'Plates', limit: 3, img: 'https://picsum.photos/seed/pizza/80/80' },
  { id: 3, name: 'Green Salad', unit: 'Plates', limit: 2, img: 'https://picsum.photos/seed/salad/80/80' },
];

export default function WastageThresholds({ goTo }) {
  const [category, setCategory] = useState('All Categories');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(demoItems);
  const [dirty, setDirty] = useState(false);
  const searchInputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const onLimitChange = (id, next) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, limit: next } : r)));
    setDirty(true);
  };

  return (
    <div className="wt-page">
      <StandardScrollStyles />
      <div className="wt-title-wrap">
        <h2 className="wt-title">Wastage Threshold Customization Interface</h2>
      </div>

      <div className="wt-toolbar">
        <UsageStyleDropdown
          value={category}
          onChange={setCategory}
          options={['All Categories', 'Mains', 'Starters', 'Beverages']}
          placeholder="Select Category"
        />
        <button className={`wt-save ${dirty ? 'active' : ''}`} disabled={!dirty} onClick={() => setDirty(false)}>
          Save Changes
        </button>
        <div className="wt-toolbar-row2">
          <StandardSearch
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            placeholder="Search items..."
            inputRef={searchInputRef}
          />
          <div />
        </div>
      </div>

      <StandardCard className="wt-table-card">
        <div className="wt-thead">
          <div>S. No.</div>
          <div>Item</div>
          <div style={{ textAlign: 'right' }}>Item Limit</div>
        </div>
        <div
          className={filtered.length > 6 ? 'standard-scrollbar' : ''}
          style={filtered.length > 6 ? { maxHeight: 360, overflowY: 'auto' } : undefined}
        >
          {filtered.map((r, idx) => (
            <div key={r.id} className="wt-row">
              <div>{idx + 1}.</div>
              <div className="wt-cell">
                <img className="wt-item-thumb" src={r.img} alt={r.name} />
                <div>
                  <div className="wt-item-name">{r.name}</div>
                </div>
              </div>
              <div className="wt-limit">
                <input
                  type="number"
                  value={r.limit}
                  min={0}
                  onChange={(e) => onLimitChange(r.id, Number(e.target.value))}
                />
                <span>({r.unit})</span>
              </div>
            </div>
          ))}
        </div>
      </StandardCard>

    </div>
  );
}
