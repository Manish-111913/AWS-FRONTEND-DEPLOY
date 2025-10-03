import React, { useRef, useEffect, useState } from 'react';
import { FaChartPie, FaTable } from 'react-icons/fa';
import './OwnerFooterNav.css';

// Footer strictly for Owner POV pages to avoid clashing with global FooterNav.
// Expected screen ids: 'owner-dashboard', 'owner-analytics'.
export default function OwnerFooterNav({ current, goTo }) {
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [scales, setScales] = useState({ 'owner-dashboard': 1, 'owner-analytics': 1 });
  const maxScale = 1.4;
  const radius = 120;

  const compute = (x) => {
    const next = { 'owner-dashboard': 1, 'owner-analytics': 1 };
    Object.entries(itemRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const c = rect.left + rect.width / 2;
      const dist = Math.abs(x - c);
      const t = Math.max(0, 1 - dist / radius);
      const eased = t * t;
      next[id] = 1 + (maxScale - 1) * eased;
    });
    setScales(next);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0; let last = null;
    const onMove = (e) => { last = e.clientX; if (!raf) raf = requestAnimationFrame(() => { compute(last); raf = 0; }); };
    const onLeave = () => setScales({ 'owner-dashboard': 1, 'owner-analytics': 1 });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const isActive = (id) => id === current;
  const Item = ({ id, label, Icon }) => {
    const active = isActive(id);
    const setRef = (el) => { itemRefs.current[id] = el; };
    const scale = scales[id] || 1;
    return (
      <button
        ref={setRef}
        onClick={() => goTo(id)}
        className={`owner-footer-item ${active ? 'active' : ''}`}
        aria-label={label}
        style={{ '--scale': scale }}
      >
        <Icon className="owner-footer-icon" />
        <span className="owner-footer-label">{label}</span>
      </button>
    );
  };

  return (
    <div ref={containerRef} className="owner-footer-bar">
        <Item id="owner-dashboard" label="Dashboard" Icon={FaTable} />
        <Item id="owner-analytics" label="Analytics" Icon={FaChartPie} />
    </div>
  );
}
