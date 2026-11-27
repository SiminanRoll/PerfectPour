/* Perfect Pour V1.03 · A single primary action follows the cup through service. */
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
      if (holding) return primary('pour', hardcore ? 'RELEASE TO SERVE' : 'RELEASE TO PAUSE',
        hardcore ? 'Your one pour' : 'Then top up or serve', 'pouring');
      // This is also a defensive presentation guard for a committed Hardcore
      // attempt before the renderer has switched to its settling state.
      if (hardcore && attempted) return primary('wait', 'SETTLING…', 'Watch your soda settle', 'settling', true);
      if (!Number.isInteger(selectedSoda) || selectedSoda < 0 || selectedSoda > 3)
        return primary('choose', 'CHOOSE A BASE', 'Pick a soda above', 'prep', true);
      if (!hardcore && attempted)
        return primary('easyServe', 'SERVE DRINK', 'Tap to serve · hold to top up', 'topup');
      return primary('pour', 'HOLD TO POUR', 'Space or hold', 'ready');
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
