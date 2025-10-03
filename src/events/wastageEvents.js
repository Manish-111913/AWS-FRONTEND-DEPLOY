// Simple event emitter for wastage updates
// Components that create a wastage record should call emitWastageCreated(payload)
// Dashboard listens via onWastageCreated(cb)

const listeners = new Set();

export function emitWastageCreated(data) {
  for (const cb of listeners) {
    try { cb(data); } catch (e) { console.error('wastage listener error', e); }
  }
}

export function onWastageCreated(cb) {
  if (typeof cb !== 'function') return () => {};
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Optional convenience for test/manual trigger in console:
// window.__emitWastageTest && window.__emitWastageTest();
if (typeof window !== 'undefined') {
  window.__emitWastageTest = () => emitWastageCreated({ test: true, at: Date.now() });
}
