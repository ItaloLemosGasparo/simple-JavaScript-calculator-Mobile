# Input and touch diagnostics

Use these opt-in diagnostics when investigating keypad taps that appear to be missed. Logging is off by default and keeps the most recent 300 events in memory.

## Enable logging

For browser testing, open the app with `?debugInput=1`, for example:

    http://localhost:8000/?debugInput=1

The console records pointer, touch, and click events, along with whether the calculator processed a key. The **Download input log** button saves the records as JSON. In developer tools, logging can also be enabled with:

    window.setCalculatorInputDebug(true)

The current records are available as `window.__CALC_INPUT_LOG__`.

## Read the event sequence

- `pointerdown` is the start of a pointer interaction. Touch keys except `=` are processed immediately at this point.
- `pointerup` is a normal end of the pointer interaction.
- `pointercancel` means the browser canceled that pointer event stream, often because the contact became a gesture. It does not necessarily mean the finger was never lifted; a `touchend` may still follow.
- `pointerdown-click-suppressed` marks a touch-generated click ignored after its key was already processed on `pointerdown`.
- `calculator-handler` and `calculator-state` show when the app processed an input and the resulting expression.

Mouse and physical keyboard input still use click/keyboard events. The `=` key waits for a complete click on touch as well.
