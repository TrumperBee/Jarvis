/**
 * AEGIS State Machine — drives the 4 living states of the OS
 * 
 * IDLE         → soft glow, slow particles, low UI intensity
 * ACTIVE       → voice/command triggered, UI brightness, panels expand, waveform active
 * NEURAL_SYNC  → Wake/Protocol Seven, full-screen transition, hex pulse, particle convergence
 * EXECUTION    → AI response, panel highlights, terminal scroll, core reaction wave
 */

const STATES = {
  IDLE:         'IDLE',
  ACTIVE:       'ACTIVE',
  NEURAL_SYNC:  'NEURAL_SYNC',
  EXECUTION:    'EXECUTION',
};

const STATE_CLASSES = {
  IDLE:         'state-idle',
  ACTIVE:       'state-active',
  NEURAL_SYNC:  'state-neural-sync',
  EXECUTION:    'state-execution',
};

let _currentState = STATES.IDLE;
let _listeners = [];
let _history = [];
let _stateStartTime = performance.now();
let _prevClass = '';

function _applyBodyClass(state) {
  const cls = STATE_CLASSES[state] || 'state-idle';
  if (_prevClass) document.body.classList.remove(_prevClass);
  document.body.classList.add(cls);
  _prevClass = cls;
}

function _notify(state, prevState, data) {
  const detail = { state, prevState, time: performance.now() - _stateStartTime, data };
  document.dispatchEvent(new CustomEvent('aegisstatechange', { detail }));
  _listeners.forEach(fn => fn(state, prevState, data));
}

function enter(state, data = {}) {
  const prev = _currentState;
  if (state === prev && state === STATES.IDLE) return;
  _currentState = state;
  _stateStartTime = performance.now();
  _applyBodyClass(state);
  _history.push({ state, timestamp: Date.now(), data });
  _notify(state, prev, data);
}

function getState() { return _currentState; }

function isIdle()         { return _currentState === STATES.IDLE; }
function isActive()       { return _currentState === STATES.ACTIVE; }
function isNeuralSync()   { return _currentState === STATES.NEURAL_SYNC; }
function isExecution()    { return _currentState === STATES.EXECUTION; }

function onChange(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

function getHistory() { return [..._history]; }

function getTimeInState() {
  return performance.now() - _stateStartTime;
}

export const AEGISState = {
  STATES,
  enter,
  getState,
  isIdle, isActive, isNeuralSync, isExecution,
  onChange,
  getHistory,
  getTimeInState,
};

export default AEGISState;
