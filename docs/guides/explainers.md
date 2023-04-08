# Flow explainers

The explainer turns product actions into a readable account of what the system
is doing. Content lives in `src/explainers.ts` and is opened by typed action
events rather than page-specific conditionals.

Good explainer copy answers three questions:

1. What did the user ask the product to do?
2. Which financial primitive or integration handles it?
3. What state change or follow-up should the user expect?

Use plain language before protocol terminology. Distinguish simulated demo
behavior from live requests, and never imply that session entry is customer
authentication.

When adding a flow, verify that automatic opening is useful rather than
disruptive and that the drawer remains readable on narrow screens.
