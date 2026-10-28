import { evaluate, formatNumber } from './calculator-core.mjs';
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

const HISTORY_STORAGE_KEY = 'simple-calculator-mobile-history';
const HISTORY_LIMIT = 50;
const TOUCH_CLICK_SUPPRESSION_MS = 1500;
let historyEntries = [];
const touchKeyAnimations = new WeakMap();
const handledTouchPointers = new Map();
let touchPointerToken = 0;

try {
  const savedHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
  if (Array.isArray(savedHistory)) {
    historyEntries = savedHistory
      .filter((entry) => entry && typeof entry.expression === 'string' && typeof entry.result === 'string')
      .slice(0, HISTORY_LIMIT);
  }
} catch {
  // Keep the calculator usable when storage is unavailable or contains invalid data.
}

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

let expression = '';
let justCalculated = false;

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
  expressionDisplay.textContent = formatExpression(expression || '0');
  statusLabel.textContent = justCalculated ? 'RESULT' : 'READY';
  try {
    const preview = expression ? evaluate(expression) : null;
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
  inputDiagnostics.log(event, { phase: 'calculator-state', trigger, expression });
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

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
  } catch {
    // The history still works for the current session if persistent storage is unavailable.
  }
}

function renderHistory() {
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
      expression = entry.result;
      justCalculated = true;
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
      historyEntries.splice(index, 1);
      saveHistory();
      renderHistory();
    });
    item.append(useButton, deleteButton);
    historyList.append(item);
  });
}

function addHistoryEntry(source, value) {
  historyEntries.unshift({ expression: formatExpression(source), result: formatNumber(value) });
  historyEntries = historyEntries.slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

function enter(value) {
  if (!value) return;
  const last = expression.slice(-1);
  if (/\d/.test(value) || value === '.') {
    if (justCalculated) expression = '';
    justCalculated = false;
    if (value === '.') {
      const currentNumber = expression.split(/[+\-*/()%]/).pop();
      if (currentNumber.includes('.')) return;
      if (!currentNumber) expression += '0';
    }
    expression += value;
  } else if (value === '(') {
    // Keep a displayed result when opening a group after "="; e.g. 5 = then (2) becomes 5×(2).
    justCalculated = false;
    if (/\d|\)|%/.test(last)) expression += '*';
    expression += '(';
  } else if (value === ')') {
    const open = (expression.match(/\(/g) || []).length;
    const close = (expression.match(/\)/g) || []).length;
    if (open > close && /\d|\)|%/.test(last)) expression += ')';
    justCalculated = false;
  } else if (value === '%') {
    if (/\d|\)/.test(last)) expression += '%';
    justCalculated = false;
  } else if ('+-*/'.includes(value)) {
    if (justCalculated) justCalculated = false;
    if (!expression && value !== '-') expression = '0';
    if (/[+\-*/.]$/.test(expression)) expression = expression.slice(0, -1);
    expression += value;
  }
  render();
}

function runAction(action) {
  if (action === 'clear') {
    expression = '';
    justCalculated = false;
  } else if (action === 'backspace') {
    expression = expression.slice(0, -1);
    justCalculated = false;
  } else if (action === 'sign') {
    if (justCalculated) justCalculated = false;
    if (expression) {
      const match = expression.match(/(\d+(?:\.\d*)?|\.\d+)%?$/);
      if (match) {
        const start = match.index;
        const prefix = expression.slice(0, start);
        const token = match[0];
        expression = prefix.endsWith('-') && (prefix.length === 1 || /[+*/(]$/.test(prefix.slice(0, -1)))
          ? prefix.slice(0, -1) + token
          : `${prefix}-(${token})`;
      }
    }
  } else if (action === 'calculate') {
    try {
      const value = evaluate(expression);
      if (value === null) return;
      if (!Number.isFinite(value)) throw new Error('Cannot divide by zero');
      const completedExpression = expression;
      const wasAlreadyResult = justCalculated;
      expression = formatNumber(value);
      justCalculated = true;
      if (!wasAlreadyResult) addHistoryEntry(completedExpression, value);
    } catch (error) {
      statusLabel.textContent = error.message === 'Cannot divide by zero' ? 'UNDEFINED' : 'CHECK EXPRESSION';
      resultDisplay.textContent = '\u00a0';
      return;
    }
  }
  render();
}

// Recursive descent parser: supports +, −, ×, ÷, parentheses, unary signs, and postfix percent.
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
  historyEntries = [];
  saveHistory();
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
