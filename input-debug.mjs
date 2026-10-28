const LOG_LIMIT = 300;
const EVENT_TYPES = [
  'pointerdown', 'pointerup', 'pointercancel', 'pointerout',
  'touchstart', 'touchend', 'touchcancel', 'click'
];

export function createInputDiagnostics(downloadButton) {
  if (typeof window.__CALC_INPUT_DEBUG__ !== 'boolean') {
    window.__CALC_INPUT_DEBUG__ = new URLSearchParams(window.location.search).get('debugInput') === '1';
  }

  const records = Array.isArray(window.__CALC_INPUT_LOG__) ? window.__CALC_INPUT_LOG__ : [];
  window.__CALC_INPUT_LOG__ = records;
  let sequence = Number(records.at(-1)?.sequence) || 0;

  function setEnabled(enabled) {
    window.__CALC_INPUT_DEBUG__ = Boolean(enabled);
    downloadButton.hidden = !window.__CALC_INPUT_DEBUG__;
  }

  function log(event, details = {}) {
    if (!window.__CALC_INPUT_DEBUG__) return;

    const target = event.target instanceof Element ? event.target : null;
    const key = target?.closest('.key');
    const touch = event.changedTouches?.[0] || event.touches?.[0];
    const record = {
      sequence: ++sequence,
      time: Math.round(performance.now() * 10) / 10,
      type: event.type,
      target: target?.tagName.toLowerCase(),
      targetId: target?.id || undefined,
      key: key?.textContent.trim() || undefined,
      pointerType: event.pointerType || undefined,
      pointerId: event.pointerId || undefined,
      isPrimary: event.isPrimary,
      x: event.clientX ?? touch?.clientX,
      y: event.clientY ?? touch?.clientY,
      clickDetail: event.detail || undefined,
      trusted: event.isTrusted,
      ...details
    };

    records.push(record);
    if (records.length > LOG_LIMIT) records.splice(0, records.length - LOG_LIMIT);
    console.log('[calculator input]', record);
  }

  EVENT_TYPES.forEach((type) => document.addEventListener(type, (event) => log(event), true));
  downloadButton.addEventListener('click', () => {
    const logFile = {
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      events: records
    };
    const blob = new Blob([JSON.stringify(logFile, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `simple-calculator-input-log-${Date.now()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  });

  window.setCalculatorInputDebug = setEnabled;
  setEnabled(window.__CALC_INPUT_DEBUG__);
  return { log };
}
