export function formatNumber(number) {
  return Number(number.toPrecision(10)).toString();
}

// Recursive descent parser: supports +, -, *, /, parentheses, unary signs, and postfix percent.
export function evaluate(source) {
  if (!source || !source.trim()) return null;
  const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[()+\-*/%]/g) || [];
  if (tokens.join('') !== source.replace(/\s/g, '')) throw new Error('Invalid expression');
  let position = 0;
  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  function primary(percentBase) {
    if (peek() === '+' || peek() === '-') {
      const sign = consume() === '-' ? -1 : 1;
      return sign * primary(percentBase);
    }
    if (peek() === '(') {
      consume();
      const value = sum();
      if (consume() !== ')') throw new Error('Unclosed parenthesis');
      return value;
    }
    const token = consume();
    if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Expected a number');
    let value = Number(token);
    if (peek() === '%') {
      consume();
      value = (percentBase ?? 1) * value / 100;
    }
    return value;
  }

  function product(leadingPercentBase) {
    let result = primary(leadingPercentBase);
    while (peek() === '*' || peek() === '/') {
      const operator = consume();
      const right = primary();
      result = operator === '*' ? result * right : result / right;
    }
    return result;
  }

  function sum() {
    let value = product();
    while (peek() === '+' || peek() === '-') {
      const operator = consume();
      // A leading percentage on the right of + or - uses the running total as its base.
      const right = product(value);
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  const result = sum();
  if (position !== tokens.length) throw new Error('Unexpected input');
  return result;
}
