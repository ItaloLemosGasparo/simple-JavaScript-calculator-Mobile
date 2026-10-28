import { evaluate, formatNumber } from './calculator-core.mjs';
import { applyCalculatorAction, createCalculatorState, enterValue, restoreHistoryResult } from './calculator-state.mjs';
import { createHistoryStore } from './history-store.mjs';
import { createInputDiagnostics } from './input-debug.mjs';

const expressionDisplay = document.querySelector('#expression');
const resultDisplay = document.querySelector('#result');
const statusLabel = document.querySelector('#status-label');
const keypad = document.querySelector('#keypad');
const extraKeys = document.querySelector('#extra-keys');
const expandToggle = document.querySelector('#expand-toggle');
const historyToggle = document.querySelector('#history-toggle');
const historyPanel = document.querySelector('#history-panel');
const historyList = document.querySelector('#history-list');
const historyEmpty = document.querySelector('#history-empty');
const historyClear = document.querySelector('#history-clear');
const inputDiagnostics = createInputDiagnostics(document.querySelector('#input-log-download'));
const historyStore = createHistoryStore();

const TOUCH_CLICK_SUPPRESSION_MS = 1500;
let calculatorState = createCalculatorState();
const touchKeyAnimations = new WeakMap();
const handledTouchPointers = new Map();
let touchPointerToken = 0;

const mainKeys = [
  { label: 'AC', action: 'clear', kind: 'utility' },
  { label: '⌫', action: 'backspace', kind: 'utility', aria: 'Delete last character' },
  { label: '%', value: '%', kind: 'utility' },
  { label: '÷', value: '/', kind: 'operator' },
  { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '×', value: '*', kind: 'operator' },
  { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '−', value: '-', kind: 'operator' },
  { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '+', value: '+', kind: 'operator' },
  { label: '±', action: 'sign', kind: 'utility', aria: 'Change sign' }, { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '=', action: 'calculate', kind: 'equals' }
];

function makeButton({ label, value, action, kind = '', aria }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `key ${kind}`.trim();
  button.textContent = label;
  button.setAttribute('aria-label', aria || label);
  button.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    animateTouchKey(button);
    if (action === 'calculate') return;
    const token = ++touchPointerToken;
    handledTouchPointers.set(event.pointerId, token);
    // Android can emit a click after pointercancel, so keep suppression through the full tap sequence.
    setTimeout(() => {
      if (handledTouchPointers.get(event.pointerId) === token) handledTouchPointers.delete(event.pointerId);
    }, TOUCH_CLICK_SUPPRESSION_MS);
    activateKey(action, value, event, 'pointerdown');
  });
  button.addEventListener('click', (event) => {
    if (handledTouchPointers.has(event.pointerId) && (event.pointerType === 'touch' || !event.pointerType && event.detail > 0)) {
      handledTouchPointers.delete(event.pointerId);
      inputDiagnostics.log(event, { phase: 'pointerdown-click-suppressed', value });
      return;
    }
    activateKey(action, value, event, 'click');
  });
  return button;
}

mainKeys.forEach((key) => keypad.append(makeButton(key)));
[
  { label: '(', value: '(', kind: 'extra-key' },
  { label: ')', value: ')', kind: 'extra-key' }
].forEach((key) => extraKeys.append(makeButton(key)));

function formatExpression(value) {
  return value.replaceAll('*', '×').replaceAll('/', '÷').replaceAll('-', '−');
}

function render() {
  expressionDisplay.textContent = formatExpression(calculatorState.expression || '0');
  statusLabel.textContent = calculatorState.justCalculated ? 'RESULT' : 'READY';
  try {
    const preview = calculatorState.expression ? evaluate(calculatorState.expression) : null;
    resultDisplay.textContent = preview === null || !Number.isFinite(preview) ? '\u00a0' : `= ${formatNumber(preview)}`;
  } catch {
    resultDisplay.textContent = '\u00a0';
  }
  expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
}

function activateKey(action, value, event, trigger) {
  inputDiagnostics.log(event, { phase: 'calculator-handler', trigger, action: action || 'enter', value });
  if (action) runAction(action);
  else enter(value);
  inputDiagnostics.log(event, { phase: 'calculator-state', trigger, expression: calculatorState.expression });
}

function animateTouchKey(button) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  touchKeyAnimations.get(button)?.cancel();
  const animation = button.animate(
    [
      { transform: 'scale(.94)', filter: 'brightness(1.05)' },
      { transform: 'scale(1.03)', filter: 'brightness(1.3)', offset: 0.3 },
      { transform: 'scale(1)', filter: 'brightness(1)' }
    ],
    { duration: 260, easing: 'ease-out' }
  );
  touchKeyAnimations.set(button, animation);
  animation.onfinish = () => {
    if (touchKeyAnimations.get(button) === animation) touchKeyAnimations.delete(button);
  };
}

function renderHistory() {
  const historyEntries = historyStore.getAll();
  historyList.replaceChildren();
  historyEmpty.hidden = historyEntries.length > 0;
  historyClear.disabled = historyEntries.length === 0;

  historyEntries.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.className = 'history-use';
    useButton.setAttribute('aria-label', `${entry.expression} equals ${entry.result}. Use result`);

    const source = document.createElement('span');
    source.className = 'history-expression';
    source.textContent = entry.expression;
    const result = document.createElement('span');
    result.className = 'history-result';
    result.textContent = `= ${entry.result}`;
    useButton.append(source, result);
    useButton.addEventListener('click', () => {
      calculatorState = restoreHistoryResult(calculatorState, entry.result);
      historyPanel.hidden = true;
      historyToggle.setAttribute('aria-expanded', 'false');
      render();
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'history-delete';
    deleteButton.setAttribute('aria-label', `Delete calculation ${entry.expression} equals ${entry.result}`);
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => {
      historyStore.remove(index);
      renderHistory();
    });
    item.append(useButton, deleteButton);
    historyList.append(item);
  });
}

function enter(value) {
  if (!value) return;
  const nextState = enterValue(calculatorState, value);
  if (nextState === calculatorState) return;
  calculatorState = nextState;
  render();
}

function runAction(action) {
  const result = applyCalculatorAction(calculatorState, action);
  calculatorState = result.state;
  if (result.errorStatus) {
    statusLabel.textContent = result.errorStatus;
    resultDisplay.textContent = '\u00a0';
    return;
  }
  if (result.historyEntry) {
    historyStore.add({
      expression: formatExpression(result.historyEntry.expression),
      result: result.historyEntry.result
    });
    renderHistory();
  }
  render();
}
expandToggle.addEventListener('click', () => {
  const expanded = expandToggle.getAttribute('aria-expanded') === 'true';
  expandToggle.setAttribute('aria-expanded', String(!expanded));
  extraKeys.hidden = expanded;
  expandToggle.querySelector('span').textContent = expanded ? 'More functions' : 'Fewer functions';
});

historyToggle.addEventListener('click', () => {
  const expanded = historyToggle.getAttribute('aria-expanded') === 'true';
  historyToggle.setAttribute('aria-expanded', String(!expanded));
  historyPanel.hidden = expanded;
});

historyClear.addEventListener('click', () => {
  historyStore.clear();
  renderHistory();
});

document.querySelector('#theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape' && !historyPanel.hidden) {
    historyPanel.hidden = true;
    historyToggle.setAttribute('aria-expanded', 'false');
    event.preventDefault();
    return;
  }
  if (!historyPanel.hidden) return;
  if (/^[0-9.]$/.test(event.key)) enter(event.key);
  else if ('+-*/%()'.includes(event.key)) enter(event.key);
  else if (event.key === 'Enter' || event.key === '=') runAction('calculate');
  else if (event.key === 'Backspace') runAction('backspace');
  else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') runAction('clear');
  else return;
  event.preventDefault();
});

renderHistory();
render();
