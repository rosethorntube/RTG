(() => {
  'use strict';
  const preference = 'rosethorn.fieldguide.faction';
  function saved() {
    try { return localStorage.getItem(preference) === 'Alliance' ? 'Alliance' : 'Horde'; }
    catch { return 'Horde'; }
  }
  let name = saved();
  window.GuideFaction = {
    preference,
    get name() { return name; },
    get alliance() { return name === 'Alliance'; },
    storageKey(key) { return name === 'Alliance' ? key + '.alliance' : key; },
    select(next) {
      if (!['Alliance', 'Horde'].includes(next) || next === name) return;
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
