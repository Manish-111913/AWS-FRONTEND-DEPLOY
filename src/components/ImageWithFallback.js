import React, { useState, useEffect } from 'react';

/**
 * Unified ImageWithFallback component used across Waste (StockOutForm) and Usage flows.
 * Props:
 *  - src: primary image URL
 *  - alt: alt text
 *  - fallback: secondary image URL to try if primary fails
 *  - fallbacks: array of additional fallbacks to cycle through
 *  - placeholder: data URI or final static placeholder
 *  - onResolved: optional callback({finalSrc, attempts, hadError})
 */
const ImageWithFallback = ({ src, alt, fallback, fallbacks = [], placeholder, onResolved, style, ...rest }) => {
  const [current, setCurrent] = useState(src);
  const [stage, setStage] = useState(0); // 0 primary, 1 fallback, 2+ extra fallbacks, 98 placeholder, 99 generated
  const [extraIndex, setExtraIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // When the primary src changes, reset state so we iterate fallbacks from start
    setCurrent(src || '');
    setStage(0);
    setExtraIndex(0);
    setLoading(true);
  }, [src]);

  const finalize = (finalSrc, hadError) => {
    setLoading(false);
    if (onResolved) onResolved({ finalSrc, attempts: stage + 1, hadError });
  };

  const handleError = () => {
    if (stage === 0 && fallback && fallback !== current) {
      setCurrent(fallback);
      setStage(1);
      return;
    }
    // Try through additional fallbacks list
    if ((stage === 1 || stage >= 2) && extraIndex < fallbacks.length) {
      const next = fallbacks[extraIndex];
      if (next && next !== current) {
        setCurrent(next);
        setExtraIndex(extraIndex + 1);
        setStage(stage + 1);
        return;
      }
    }
    if (placeholder && placeholder !== current) {
      setCurrent(placeholder);
      setStage(98);
    } else {
      // Generate simple canvas placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 140;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(0,0,200,140);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = (alt || 'Item').substring(0,14);
      ctx.fillText(text, 100, 70);
      const data = canvas.toDataURL('image/png');
      setCurrent(data);
      setStage(99);
      finalize(data, true);
    }
  };

  const handleLoad = () => finalize(current, false);

  return (
    <img
      src={current}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      style={{
        objectFit: 'cover',
        backgroundColor: loading ? '#f2f2f2' : 'transparent',
        opacity: loading ? 0.75 : 1,
        transition: 'opacity .3s ease',
        borderRadius: 8,
        width: '100%',
        height: '100%',
        ...style
      }}
      {...rest}
    />
  );
};

export default ImageWithFallback;
