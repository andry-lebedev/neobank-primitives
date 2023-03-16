# Data sources

Pages work against the `DataSource` contract in `src/data/types.ts`. Demo and
live implementations satisfy the same interface and return shared domain types.

## Boundary rules

- transport details stay inside a data-source implementation
- pages do not import live API modules directly
- demo behavior mirrors domain outcomes, not HTTP response shapes
- mapping errors are handled before values enter application state
- a new backend starts as another `DataSource` implementation

This boundary keeps the product testable without credentials and makes adapter
replacement a contained task.

When extending the contract, begin with the domain operation the interface must
express. Update both implementations and their tests before wiring a new page to
the method.
