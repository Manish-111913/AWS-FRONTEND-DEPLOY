import React, { useEffect, useRef, useState } from 'react';
import { FaHome, FaBox, FaFileAlt, FaTruck } from 'react-icons/fa';

export default function FooterNav({ current, goTo }) {
  // Dock-like animation state (magnify icons near cursor)
  const containerRef = useRef(null);
  const itemRefs = useRef({}); // id -> element
  const [scales, setScales] = useState({ dashboard: 1, inventory: 1, reports: 1, vendors: 1 });
  const maxScale = 1.5; // keep subtle to fit existing 56px height
  const radius = 120;   // px influence radius similar to Dock distance
  const baseScale = 1;

  const computeScales = (mouseClientX) => {
    const next = { dashboard: 1, inventory: 1, reports: 1, vendors: 1 };
    Object.keys(itemRefs.current).forEach((id) => {
      const el = itemRefs.current[id];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(mouseClientX - centerX);
      const t = Math.max(0, 1 - dist / radius); // 0..1
      // Ease-out curve for smoother peak (quadratic)
      const eased = t * t;
      next[id] = baseScale + (maxScale - baseScale) * eased;
    });
    setScales(next);
  };

  // Reset scales when leaving the bar
  const resetScales = () => setScales({ dashboard: 1, inventory: 1, reports: 1, vendors: 1 });

  // RAF throttle for smoother updates
  const rafRef = useRef(0);
  const lastXRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e) => {
      lastXRef.current = e.clientX;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        computeScales(lastXRef.current);
        rafRef.current = 0;
      });
    };
    const onLeave = () => {
      resetScales();
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Treat related screens as part of a primary tab so the correct item is highlighted
  const isActive = (id) => {
    const groups = {
      dashboard: ['dashboard', 'overview'],
      inventory: ['inventory', 'stock-in', 'stock-out', 'usage', 'minimal-stock', 'create-reorder', 'itemmap', 'map', 'map1', 'map2', 'map3'],
      reports: ['reports', 'sales-report', 'todays-sales-report'],
      vendors: ['vendors']
    };
    const list = groups[id] || [id];
    return list.includes(current);
  };

  const Item = ({ id, label, Icon, disabled, onClick }) => {
    const active = isActive(id);
    const setRef = (el) => { itemRefs.current[id] = el; };
    const iconScale = scales[id] || 1;
    return (
      <button
        ref={setRef}
        onClick={() => { if (!disabled) (onClick ? onClick() : goTo(id)); }}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          padding: '10px 6px',
          color: disabled ? '#cbd5e1' : (active ? '#111827' : '#9ca3af'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        aria-label={label}
        disabled={disabled}
      >
        <Icon
          style={{
            fontSize: 20,
            color: disabled ? '#cbd5e1' : (active ? '#111827' : '#9ca3af'),
            transform: `scale(${iconScale})`,
            transition: 'transform 120ms ease-out',
            willChange: 'transform',
          }}
        />
        <span style={{ fontSize: 12 }}>{label}</span>
      </button>
    );
  };

  return (
    <div ref={containerRef} style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      background: '#fff',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      maxWidth: 600,
      margin: '0 auto',
      height: 56,
      zIndex: 100,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8
    }}>
      <div style={{ display: 'flex', width: '100%' }}>
  <Item id="dashboard" label="Home" Icon={FaHome} />
  <Item id="inventory" label="Inventory" Icon={FaBox} />
  <Item id="reports" label="Reports" Icon={FaFileAlt} />
  <Item id="vendors" label="Vendors" Icon={FaTruck} onClick={() => goTo('create-reorder')} />
      </div>
    </div>
  );
}
