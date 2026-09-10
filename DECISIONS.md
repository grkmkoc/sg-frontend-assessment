# Engineering decisions

- **Plain CSS with a small token layer.** This app is intentionally small. I am
  comfortable with Tailwind, SCSS, CSS Modules, design systems, and tokenized
  component styling, but introducing a heavier styling layer here would add
  ceremony without improving the core assessment. Styling stays simple while
  shared colors, spacing, radii, typography, borders, and surfaces use a small
  set of custom properties.

- **A pure `domain/` module.** Movement, ordering, deletion behavior, and state
  invariants are application rules rather than React concerns. Pure transitions
  are deterministic, reusable, and easy to test without rendering UI or
  simulating drag events.

- **`useReducer` instead of Redux.** The editor is one bounded local aggregate
  with predictable transitions. Redux would add infrastructure without solving
  a problem this application has.

- **dnd-kit for interaction, not business rules.** dnd-kit provides focused
  sortable primitives and keyboard support. Drag events resolve a destination
  and call the same domain operation used everywhere else.

- **Non-drag controls are first-class.** Drag-and-drop should not be the only
  interaction path. Move and ordering controls provide a discoverable keyboard
  fallback and reuse the exact same domain transition.

- **Generated IDs, not filenames.** Filenames are neither unique nor stable
  identity. Immutable item IDs make JSON-to-file multipart references
  deterministic and collision-safe, including for duplicate filenames.

- **Category deletion preserves images.** The specification does not define
  deletion semantics. Returning the category's items to the Item List, in order,
  is the safer assumption because it does not silently destroy user data.

- **A deliberately minimal API receiver.** The included endpoint makes the
  exercise self-contained and verifies the multipart contract end-to-end. It
  parses the request, matches references to files, and returns a summary; it is
  not a production backend and performs no persistence or authentication.

- **One Docker container.** The built frontend and demonstration receiver share
  a small Node runtime to provide a zero-configuration reviewer experience. This
  is an assessment packaging choice, not a proposed multi-service production
  topology.
