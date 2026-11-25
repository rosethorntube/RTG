(() => {
  'use strict';
  const preference = 'rosethorn.fieldguide.faction';
  const available = new Set(['Horde']);
  function saved() {
    try {
      const faction = localStorage.getItem(preference);
      return available.has(faction) ? faction : 'Horde';
    }
    catch { return 'Horde'; }
  }
  let name = saved();
  window.GuideFaction = {
    preference,
    get name() { return name; },
    get alliance() { return name === 'Alliance'; },
    storageKey(key) { return name === 'Alliance' ? key + '.alliance' : key; },
    select(next) {
      if (!available.has(next) || next === name) return;
      name = next;
      try { localStorage.setItem(preference, name); } catch {}
      window.dispatchEvent(new Event('guidefactionchange'));
    },
    sync() {
      if (saved() !== name) {
        name = saved();
        window.dispatchEvent(new Event('guidefactionchange'));
      }
    }
  };
})();
