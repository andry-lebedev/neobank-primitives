# Action events

Financial actions emit typed events through `src/lib/events.ts`. The tracked data
source in `src/data/tracked.ts` decorates domain operations so observability does
not leak into each page.

An event should describe the user-visible operation and its outcome. It should
not include API keys, full bank details, wallet secrets, or unnecessary personal
data.

## Adding an event

1. Define the event name and payload type.
2. Emit it at the domain-operation boundary.
3. Map it to explainer content when the action should be narrated.
4. Forward it through the `track` integration slot when analytics are enabled.
5. Test success and failure outcomes separately.

Keep payloads small and stable. Analytics destinations can change; the product's
event vocabulary should remain understandable without a vendor dashboard.
