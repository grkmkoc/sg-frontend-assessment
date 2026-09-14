# Engineering decisions

## Architecture

- **React, TypeScript, and Vite.** The application is a small, bounded frontend.
  This stack provides typed UI code, a fast development loop, and a straightforward
  production build without adding application-level infrastructure.

- **Domain transitions are independent of React.** Creating, renaming, moving,
  reordering, and deleting items or categories are pure functions in `src/domain`.
  This keeps invariants testable without rendering components or simulating drag
  events.

- **A controller hook and `useReducer` manage the editor.** The tier list is one
  local aggregate with explicit transitions. Redux would introduce another state
  model and dependency without addressing a problem in this scope. The controller
  owns browser concerns such as object URLs, request state, and cancellation.

- **The Unassigned Pool uses the same movement model as categories.** Both are
  represented by `ContainerRef`, and drag-and-drop, arrow controls, and the
  destination select all call the same `moveItem` transition. There is no separate
  set of pool-specific ordering rules.

- **Generated IDs provide stable identity.** Filenames can be duplicated and may
  change. Immutable item IDs support reliable React keys, movement, and deterministic
  multipart field names. Preview URLs remain outside domain state because they are
  temporary browser resources.

- **Multipart serialization is separate from the UI.** `buildSubmission` validates
  state and creates the JSON-to-file mapping. Components do not know field naming or
  request details. Only categorized images are submitted; the Unassigned Pool can
  remain a working backlog.

- **The receiver is intentionally narrow.** The Express endpoint parses the
  multipart request, checks that payload references match uploaded files, and
  returns a summary. It exists to make Save demonstrable end to end, not as a model
  for a production backend.

- **Accessibility has a non-drag path.** dnd-kit supplies pointer and keyboard drag
  behavior. Every movement is also available through native buttons and a select,
  with visible focus states and status/error announcements.

- **Plain CSS is sufficient for this scope.** A small primitive-to-semantic token
  layer keeps typography, spacing, surfaces, borders, states, and hierarchy
  consistent. Tailwind, Sass, CSS Modules, or a UI framework would add structure
  that this application does not yet need. These tokens could later feed any of
  those approaches or a shared design-system package.

- **Destructive actions preserve user work.** Deleting a category returns its items
  to the Unassigned Pool in order rather than silently deleting the images. Removing
  an image remains an explicit separate action.

- **Docker is the reviewer path.** One multi-stage image builds the frontend and
  runs the static server plus demonstration receiver. This gives reviewers a
  zero-configuration path without implying a single-container production topology.

## AI-assisted development

I used Codex in an agentic workflow for implementation and iterative review. I
defined the requirements and constraints, chose the architecture, reviewed plans
and generated code, and challenged suggestions that did not fit the assessment. I
also reviewed behavior manually, inspected network requests in DevTools, and refined
product assumptions when the resulting UX did not hold up—for example, allowing a
categorized subset to be submitted while other images remain unassigned.

AI was most useful for repetitive setup, tests derived from explicit invariants,
refactoring large components into focused responsibilities, edge-case review,
documentation, and Docker/runtime setup. I simplified or rejected proposals for
save revision/snapshot tracking, additional backend layers, arbitrary image-size
validation, and premature styling or framework infrastructure.

The loop was closer to pair programming than one-shot generation: define intent,
inspect and challenge the plan, implement, verify manually and automatically, then
refine. AI increased execution speed; architecture, trade-offs, validation, and
final quality remained my responsibility.

## Time and scope

I prioritized the work in this order:

1. Domain correctness and state invariants
2. The multipart contract
3. Testability
4. Accessible interaction paths
5. Docker and self-contained evaluation
6. Visual polish

I deliberately kept persistence, authentication, a database, production backend
architecture, large design-system infrastructure, exhaustive test coverage, and
framework abstraction outside the take-home. Each would be reasonable only with
product or operational requirements that justify it.

## What I would do next

- Persist drafts and saved lists behind a real API with server-side validation.
- Add production upload limits, content inspection, storage, and authorization.
- Run deeper screen-reader and usability testing across browsers and devices.
- Virtualize item rendering and revisit the upload flow if lists become large.
