# Accessibility

Financial interfaces must remain understandable when color, animation, pointer
input, or a wide viewport is unavailable.

## Review checklist

- every control has an accessible name
- forms associate labels, descriptions, and errors with inputs
- keyboard focus follows visual order and remains visible
- status is communicated with text or icons as well as color
- dialogs and drawers restore focus when closed
- motion respects reduced-motion preferences
- money values and account details have readable copy behavior
- narrow layouts do not hide required actions

Test the primary deposit, transfer, customer-selection, and disconnect flows by
keyboard. Automated checks are useful, but they do not replace reading the flow
with a screen reader and inspecting focus behavior manually.
