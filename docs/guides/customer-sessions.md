# Customer sessions

Customer selection is session entry, not authentication. The starter uses a
customer identifier to choose which live financial data to load after an API
connection has been established.

## Responsibilities

- `resolveCustomerId` may restore a previously selected customer
- `setCustomerId` may persist a new selection for the host application
- the live entry screen handles explicit selection when restoration is absent
- disconnecting clears the active live session

Do not add passwords, OAuth callbacks, or identity claims to this flow. A
production host should authenticate its user separately and provide an
authorized customer mapping through the integration seam.

Display enough context to prevent accidental customer switching, but avoid
exposing unnecessary personal or account information in selection controls.
