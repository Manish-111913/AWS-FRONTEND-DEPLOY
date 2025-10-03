import React, { useState } from 'react';
import { Plus, Pencil, Star, Trash2 } from 'lucide-react';

export default function TableConfigurationStep({ formData, updateFormData }) {
  const [tableCount, setTableCount] = useState(formData.tableCount || 1);
  const [tables, setTables] = useState(formData.tableConfiguration || []);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const sync = (newTables, newCount) => {
    setTables(newTables);
    setTableCount(newCount);
    updateFormData({ tableCount: newCount, tableConfiguration: newTables });
  };

  const updateCount = (n) => {
    if (n < 1) return;
    setTableCount(n);
    if (n > tables.length) {
      const nt = tables.slice();
      for (let i = tables.length; i < n; i++) nt.push({ id: 'table-' + (i + 1), name: 'Table ' + (i + 1), isBestSpot: false });
      sync(nt, n);
    } else {
      const nt = tables.slice(0, n);
      sync(nt, n);
    }
  };

  const startEdit = (id, name) => {
    setEditingId(id);
    setEditName(name);
  };
  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const nt = tables.map((t) => (t.id === editingId ? { ...t, name: editName.trim() } : t));
    setEditingId(null);
    setEditName('');
    sync(nt, nt.length);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const toggleBest = (id) => {
    const nt = tables.map((t) => (t.id === id ? { ...t, isBestSpot: !t.isBestSpot } : t));
    sync(nt, nt.length);
  };
  const removeTable = (id) => {
    const nt = tables.filter((t) => t.id !== id);
    sync(nt, nt.length);
  };
  // Find the next available sequential number (fill gaps)
  const computeNextNumber = () => {
    // Extract existing numeric suffixes from name pattern "Table X" if present
    const used = new Set();
    tables.forEach(t => {
      // Prefer explicit sequence derived from stored originalIndex if we later add it; fallback parse
      const m = /^(?:Table\s+)?(\d+)$/.exec(t.name.replace(/^Table\s+/i,'').trim()) ?
        /^(?:Table\s+)?(\d+)$/.exec(t.name.replace(/^Table\s+/i,'').trim()) : null;
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) used.add(n);
      } else {
        // Attempt to parse from id if pattern table-N
        const mid = /^table-(\d+)$/.exec(t.id || '');
        if (mid) {
          const n = parseInt(mid[1], 10); if (!isNaN(n)) used.add(n);
        }
      }
    });
    let n = 1;
    while (used.has(n)) n++;
    return n;
  };

  const addTable = () => {
    const nextNum = computeNextNumber();
    const newId = `table-${nextNum}`; // Stable predictable id
    const displayName = `Table ${nextNum}`;
    const nt = [...tables, { id: newId, name: displayName, isBestSpot: false }]
      // Sort by numeric order ascending
      .sort((a,b)=>{
        const na = parseInt(a.name.replace(/[^0-9]/g,''),10) || 0;
        const nb = parseInt(b.name.replace(/[^0-9]/g,''),10) || 0;
        return na-nb;
      });
    sync(nt, nt.length);
  };

  return (
    <div>
      <p className="qro-center" style={{ color: '#9CA3AF', lineHeight: '24px', marginBottom: '32px' }}>
        Configure your restaurant by setting up tables and identifying your best spots. Each table will get its own unique QR code.
      </p>

      <div className="qro-section">
        <div className="qro-center" style={{ fontWeight: 600, marginBottom: '8px' }}>Number of Tables</div>
        <div className="qro-counter">
          <button className="qro-btn-round" onClick={() => updateCount(tableCount - 1)}>−</button>
          <div className="qro-display">{String(tableCount)}</div>
          <button className="qro-btn-round" onClick={() => updateCount(tableCount + 1)}>+</button>
        </div>
      </div>

      <div className="qro-section">
        <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontWeight: 600 }}>Table Configuration</div>
          <button className="qro-btn qro-btn--primary" onClick={addTable}>
            <Plus size={16} /> Add Table
          </button>
        </div>

        <div className="qro-list">
          {tables.map((t, i) => (
            <div key={t.id} className="qro-table-item">
              <div className="qro-table-header">
                <div className="qro-table-num">{String(i + 1)}</div>
                <div style={{ flex: 1 }}>
                  {editingId === t.id ? (
                    <div>
                      <input
                        className="qro-input"
                        value={editName}
                        placeholder="Table name"
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <div className="qro-row" style={{ marginTop: 8 }}>
                        <button className="qro-btn qro-btn--success" onClick={saveEdit}>Save</button>
                        <button className="qro-btn" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div className="qro-badge">ID: {t.id}</div>
                    </div>
                  )}
                </div>
                {editingId !== t.id && (
                  <div className="qro-table-actions">
                    <button className="qro-btn" onClick={() => startEdit(t.id, t.name)}>
                      <Pencil size={16} /> Edit
                    </button>
                    <button className="qro-btn" onClick={() => toggleBest(t.id)}>
                      {t.isBestSpot ? (
                        <>
                          <Star size={16} /> Unmark Best
                        </>
                      ) : (
                        <>
                          <Star size={16} /> Mark Best
                        </>
                      )}
                    </button>
                    {tables.length > 1 && (
                      <button className="qro-btn qro-btn--danger" onClick={() => removeTable(t.id)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
              {t.isBestSpot && (
                <div className="qro-best-spot">
                  <i data-lucide="star" /> Best Spot - High Traffic Area
                </div>
              )}
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="qro-empty">
            <div>No tables configured</div>
            <div>Use the counter above or add custom tables</div>
          </div>
        )}
      </div>

      <div className="qro-card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Configuration Summary</div>
        <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div>Total Tables:</div>
          <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{String(tables.length)}</div>
        </div>
        <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div>Best Spots:</div>
          <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{String(tables.filter((x) => x.isBestSpot).length)}</div>
        </div>
        <div className="qro-row" style={{ justifyContent: 'space-between' }}>
          <div>QR Codes to Generate:</div>
          <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{String(tables.length)}</div>
        </div>
      </div>
    </div>
  );
}

