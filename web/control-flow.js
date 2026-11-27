/* Perfect Pour V1.04 · A single primary action follows every soda through service. */
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
      stage: 'other'
    };
    const primary = (action, label, hint, stage, disabled = false) =>
      ({...result, action, label, hint, stage, disabled});

    if (mode === 'preparing') {
      if (!editable) return primary('wait', 'RECIPE LOCKED', 'Finish this cup first', 'prep', true);
      if (!Number.isInteger(selectedSoda) || selectedSoda < 0 || selectedSoda > 3)
        return primary('choose', 'CHOOSE A BASE', 'Pick a soda above', 'prep', true);
      return primary('ready', 'READY TO POUR', 'Enter or tap', 'prep');
    }
    if (mode === 'playing') {
      if (holding) return primary('pour', hardcore ? (firstPart ? 'RELEASE TO SWITCH' : 'RELEASE TO SERVE') : 'RELEASE TO PAUSE',
        hardcore ? (firstPart ? 'Next: '+(input.nextName || 'soda') : isMix ? 'Your final pour' : 'Your one pour') : firstPart ? 'Then top up or switch' : 'Then top up or serve', 'pouring');
      // This is also a defensive presentation guard for a committed Hardcore
      // attempt before the renderer has switched to its settling state.
      if (hardcore && partAttempted) return primary('wait', 'SETTLING…', 'Watch your soda settle', 'settling', true);
      if (!Number.isInteger(selectedSoda) || selectedSoda < 0 || selectedSoda > 3)
        return primary('choose', 'CHOOSE A BASE', 'Pick a soda above', 'prep', true);
      if (!hardcore && partAttempted)
        return primary('easyServe', firstPart ? 'NEXT SODA' : 'SERVE DRINK', firstPart ? 'Tap to switch · hold to top up' : 'Tap to serve · hold to top up', 'topup');
      return primary('pour', isMix ? 'HOLD '+activeName+' · '+(firstPart?'1/2':'2/2') : 'HOLD TO POUR', 'Space or hold', 'ready');
    }
    if (mode === 'settling')
      return primary('wait', 'SETTLING…', 'Watch your soda settle', 'settling', true);
    if (mode === 'finished')
      return primary('review', 'SEE REVIEW', 'Enter or tap', 'finished');
    if (mode === 'result')
      return primary('next', input.lastCustomer ? 'CLOSE THE DAY' : 'NEXT CUSTOMER', 'Enter or tap', 'review');
    if (mode === 'summary')
      return primary('nextDay', 'OPEN NEXT DAY', 'Enter or tap', 'closed');
    return result;
  }
  window.PourFlow = Object.freeze({resolve});
})();
