import { evaluate, formatNumber } from './calculator-core.mjs';

export function createCalculatorState(expression = '', justCalculated = false) {
  return { expression, justCalculated };
}

export function enterValue(state, value) {
  if (!value) return state;
  let { expression, justCalculated } = state;
  const last = expression.slice(-1);

  if (/\d/.test(value) || value === '.') {
    if (justCalculated) expression = '';
    justCalculated = false;
    if (value === '.') {
      const currentNumber = expression.split(/[+\-*/()%]/).pop();
      if (currentNumber.includes('.')) return state;
      if (!currentNumber) expression += '0';
    }
    expression += value;
  } else if (value === '(') {
    // Opening a group after a result continues the expression, e.g. 5 = then (2) -> 5*(2).
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
  } else {
    return state;
  }

  return createCalculatorState(expression, justCalculated);
}

export function applyCalculatorAction(state, action) {
  let expression = state.expression;
  let justCalculated = state.justCalculated;

  if (action === 'clear') {
    return { state: createCalculatorState(), historyEntry: null };
  }
  if (action === 'backspace') {
    return { state: createCalculatorState(expression.slice(0, -1), false), historyEntry: null };
  }
  if (action === 'sign') {
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
    return { state: createCalculatorState(expression, justCalculated), historyEntry: null };
  }
  if (action !== 'calculate') return { state, historyEntry: null };

  try {
    const value = evaluate(expression);
    if (value === null) return { state, historyEntry: null };
    if (!Number.isFinite(value)) return { state, historyEntry: null, errorStatus: 'UNDEFINED' };

    const historyEntry = state.justCalculated ? null : { expression, result: formatNumber(value) };
    return {
      state: createCalculatorState(formatNumber(value), true),
      historyEntry
    };
  } catch {
    return { state, historyEntry: null, errorStatus: 'CHECK EXPRESSION' };
  }
}

export function restoreHistoryResult(state, result) {
  return createCalculatorState(String(result), true);
}
