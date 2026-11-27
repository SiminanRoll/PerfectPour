/* Perfect Pour V1.04.1 · Hold always pours; completed cups advance explicitly. */
(() => {
  'use strict';
  /**
   * Presentation policy only. Rust still owns every attempted/committed action.
   * Keeping this independent of DOM/input means a held pointer never changes
   * its job merely because a label updates while the cup is settling.
   */
  function resolve(input = {}) {
    const {mode, selectedSoda} = input;
    const hardcore = Boolean(input.hardcore);
    const attempted = Boolean(input.attempted);
    const holding = Boolean(input.holding);
    const recipeLocked = Boolean(input.recipeLocked);
    const isMix = Boolean(input.isMix);
    const firstPart = isMix && input.pourPart === 0;
    const partAttempted = isMix ? Boolean(input.partAttempted) : attempted;
    const activeName = String(input.activeName || 'soda').toUpperCase();
    const editable = mode === 'preparing' && !attempted && !holding && !recipeLocked;
    const result = {
      action: 'none', label: '', hint: '', disabled: true,
      showRecipe: editable, showPressure: editable,
      showMode: editable || mode === 'store',
      showEasyAction: !hardcore && ['preparing','playing'].includes(mode),
      easyDisabled: mode !== 'playing' || !partAttempted || holding,
      easyLabel: firstPart ? 'NEXT SODA' : 'SERVE',
      stage: 'other'
    };
    const primary = (action, label, hint, stage, disabled = false) =>
      ({...result, action, label, hint, stage, disabled});

    if (mode === 'preparing') {
      if (!editable) return primary('wait', 'RECIPE LOCKED', 'Finish this cup first', 'prep', true);
      if (!Number.isInteger(selectedSoda) || selectedSoda < 0 || selectedSoda > 3)
        return primary('choose', 'CHOOSE A BASE', 'Pick a soda above', 'prep', true);
      return primary('pour', isMix ? 'HOLD '+activeName+' · 1/2' : 'HOLD TO POUR', hardcore ? (firstPart ? 'Release to switch' : 'Release to serve') : 'Release to pause', 'prep');
    }
    if (mode === 'playing') {
      if (holding) return primary('pour', 'POURING'+(isMix?' '+activeName:'')+'…',
        hardcore ? (firstPart ? 'Release to switch' : 'Release to serve') : 'Release to pause', 'pouring');
      // This is also a defensive presentation guard for a committed Hardcore
      // attempt before the renderer has switched to its settling state.
      if (hardcore && partAttempted) return primary('wait', 'SETTLING…', 'Watch your soda settle', 'settling', true);
      if (!Number.isInteger(selectedSoda) || selectedSoda < 0 || selectedSoda > 3)
        return primary('choose', 'CHOOSE A BASE', 'Pick a soda above', 'prep', true);
      return primary('pour', isMix ? 'HOLD '+activeName+' · '+(firstPart?'1/2':'2/2') : 'HOLD TO POUR',
        hardcore ? (firstPart ? 'Release to switch' : 'Release to serve') : 'Release to pause', !hardcore && partAttempted ? 'topup' : 'ready');
    }
    if (mode === 'settling')
      return primary('wait', 'SETTLING…', 'Watch your soda settle', 'settling', true);
    if (mode === 'finished')
      return primary('next', input.lastCustomer ? 'CLOSE THE DAY' : 'NEXT CUSTOMER', 'Enter or tap', 'finished');
    if (mode === 'result')
      return primary('none', 'REVIEW DETAILS', '', 'review', true);
    if (mode === 'summary')
      return primary('nextDay', 'OPEN NEXT DAY', 'Enter or tap', 'closed');
    return result;
  }
  window.PourFlow = Object.freeze({resolve});
})();
