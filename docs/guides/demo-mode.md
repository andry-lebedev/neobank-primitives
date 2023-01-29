# Demo mode

Demo mode is the zero-configuration path through the application. It implements
the same `DataSource` contract used by live mode, so pages do not need separate
rendering logic.

## What it simulates

- customer and account loading
- recipient creation and selection
- bank and crypto transfers
- deposits and settlement timing
- KYC state transitions
- activity and balance updates

State lives in the browser and is designed for product walkthroughs. Use the
reset control when a demonstration needs to return to its initial state.

Demo mode is not a persistence layer and must not be presented as production
banking infrastructure. Its purpose is to make interaction design and adapter
integration testable before live credentials are introduced.
