# Engineering decisions

- **Plain CSS with a small token layer.** The assessment uses plain CSS
  intentionally because the application is small and bounded. Rather than
  introducing Tailwind, Sass, CSS Modules, or a component framework purely for
  structural appearance, the styling uses a small primitive-to-semantic token
  layer for the application palette. This keeps the implementation
  lightweight while retaining consistent typography, color, spacing, surfaces,
  focus states, and component hierarchy. The final visual direction uses a warm
  light canvas, white surfaces, restrained teal accents, and soft neutral borders.
  Modest radii and shallow shadows give major regions clear hierarchy without
  turning the workspace into a landing page. Inter Variable provides the full
  sans-serif hierarchy for headings, body copy, and controls. Teal is reserved
  for Save, focus, active dragging, and small specification labels. Dashed drop
  outlines provide feedback beyond color alone.
  In a larger application these tokens could naturally become the foundation
  for CSS Modules, Sass architecture, Tailwind configuration, or a shared
  component/design-system package.

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

- **Item List remains an unsubmitted backlog.** Save requires at least one
  categorized image but does not require every imported image to be assigned.
  The multipart payload includes only category items, so large working sets can
  be submitted incrementally without repetitive organization work.

- **A deliberately minimal API receiver.** The included endpoint makes the
  exercise self-contained and verifies the multipart contract end-to-end. It
  parses the request, matches references to files, and returns a summary; it is
  not a production backend and performs no persistence or authentication.

- **One Docker container.** The built frontend and demonstration receiver share
  a small Node runtime to provide a zero-configuration reviewer experience. This
  is an assessment packaging choice, not a proposed multi-service production
  topology.
