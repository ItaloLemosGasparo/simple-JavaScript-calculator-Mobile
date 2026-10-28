# Calculator behavior

The calculator accepts decimal numbers, addition, subtraction, multiplication, division, parentheses, unary signs, and postfix percentages. It previews valid partial expressions as you type.

## Expression rules

- Implicit multiplication is inserted when a group opens after a number, closing parenthesis, or percentage. For example, `2(3 + 4)` evaluates to `14`.
- A percentage after `+` or `-` uses the current running total as its base. This also applies when the percentage is followed by multiplication: `200 + 50% * -(1)` evaluates to `100`.
- For direct multiplication, a percentage is a fraction: `200 * 10%` evaluates to `20`.
- Division by zero is shown as an undefined result. Incomplete or invalid expressions do not show a live preview.
- The parser validates the full expression and never executes it as JavaScript.

## After a calculation

- Pressing `=` replaces the expression with its formatted result. Entering an operator continues from that result; starting a new number begins a new expression.
- A successful calculation is added to the history. The history stores the 50 most recent calculations locally, supports deleting individual entries or clearing all entries, and lets you reuse a result.

## Input

The keypad supports touch, mouse, and physical keyboard input. On touch, keys act on `pointerdown` to respond immediately; `=` waits for a complete click. The app also supports digits, decimal point, arithmetic operators, parentheses, `%`, Enter/`=`, Backspace, Escape, and `c` on a physical keyboard.
