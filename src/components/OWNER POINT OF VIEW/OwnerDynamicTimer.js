import React, { useState, useEffect } from 'react';
import './OwnerDynamicTimer.css';

// Props: startTime string like '1hr', '1.5hr', '45m', '0m'
export default function OwnerDynamicTimer({ startTime }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const parseInitialTime = (t) => {
      if (!t) return { h: 0, m: 0, s: 0 };
      if (t.includes('hr')) {
        const match = t.match(/(\d+(?:\.\d+)?)hr/);
        if (match) {
          const total = parseFloat(match[1]);
          const h = Math.floor(total);
            const m = Math.round((total - h) * 60);
          return { h, m, s: 0 };
        }
      } else if (t.includes('m')) {
        const match = t.match(/(\d+)m/);
        if (match) return { h: 0, m: parseInt(match[1], 10), s: 0 };
      }
      return { h: 0, m: 0, s: 0 };
    };
    setTime(parseInitialTime(startTime));
  }, [startTime]);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s += 1;
        if (s === 60) { s = 0; m += 1; }
        if (m === 60) { m = 0; h += 1; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => n.toString().padStart(2, '0');

  return (
    <div className="odt-timer">
      <div className="odt-block">
        <div className="odt-number">{pad(time.h)}</div>
        <div className="odt-label">Hours</div>
      </div>
      <div className="odt-block">
        <div className="odt-number">{pad(time.m)}</div>
        <div className="odt-label">Minutes</div>
      </div>
      <div className="odt-block">
        <div className="odt-number">{pad(time.s)}</div>
        <div className="odt-label">Seconds</div>
      </div>
    </div>
  );
}
