const expressionDisplay = document.querySelector('#expression');
const resultDisplay = document.querySelector('#result');
const statusLabel = document.querySelector('#status-label');
const keypad = document.querySelector('#keypad');
const extraKeys = document.querySelector('#extra-keys');
const expandToggle = document.querySelector('#expand-toggle');

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
  button.addEventListener('click', () => action ? runAction(action) : enter(value));
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

function formatNumber(number) {
  return Number(number.toPrecision(10)).toString();
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
      expression = formatNumber(value);
      justCalculated = true;
    } catch (error) {
      statusLabel.textContent = error.message === 'Cannot divide by zero' ? 'UNDEFINED' : 'CHECK EXPRESSION';
      resultDisplay.textContent = '\u00a0';
      return;
    }
  }
  render();
}

// Recursive descent parser: supports +, −, ×, ÷, parentheses, unary signs, and postfix percent.
function evaluate(source) {
  if (!source || !source.trim()) return null;
  const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[()+\-*/%]/g) || [];
  if (tokens.join('') !== source.replace(/\s/g, '')) throw new Error('Invalid expression');
  let position = 0;
  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  function primary() {
    if (peek() === '+' || peek() === '-') {
      const sign = consume() === '-' ? -1 : 1;
      return { value: sign * primary().value, isPercent: false };
    }
    if (peek() === '(') {
      consume();
      const value = sum();
      if (consume() !== ')') throw new Error('Unclosed parenthesis');
      return { value, isPercent: false };
    }
    const token = consume();
    if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Expected a number');
    let value = Number(token);
    let isPercent = false;
    if (peek() === '%') {
      consume();
      value /= 100;
      isPercent = true;
    }
    return { value, isPercent };
  }
  function product() {
    let result = primary();
    while (peek() === '*' || peek() === '/') {
      const operator = consume();
      const right = primary().value;
      result = {
        value: operator === '*' ? result.value * right : result.value / right,
        isPercent: false
      };
    }
    return result;
  }
  function sum() {
    let value = product().value;
    while (peek() === '+' || peek() === '-') {
      const operator = consume();
      // In addition/subtraction, a percent is relative to the running total:
      // 100 + 10% means 100 + (100 * 0.10). In multiplication/division,
      // percent remains a fraction (for example, 200 * 10% = 20).
      const right = product();
      const adjustedRight = right.isPercent ? value * right.value : right.value;
      value = operator === '+' ? value + adjustedRight : value - adjustedRight;
    }
    return value;
  }

  const result = sum();
  if (position !== tokens.length) throw new Error('Unexpected input');
  return result;
}

expandToggle.addEventListener('click', () => {
  const expanded = expandToggle.getAttribute('aria-expanded') === 'true';
  expandToggle.setAttribute('aria-expanded', String(!expanded));
  extraKeys.hidden = expanded;
  expandToggle.querySelector('span').textContent = expanded ? 'More functions' : 'Fewer functions';
});

document.querySelector('#theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (/^[0-9.]$/.test(event.key)) enter(event.key);
  else if ('+-*/%()'.includes(event.key)) enter(event.key);
  else if (event.key === 'Enter' || event.key === '=') runAction('calculate');
  else if (event.key === 'Backspace') runAction('backspace');
  else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') runAction('clear');
  else return;
  event.preventDefault();
});

render();
