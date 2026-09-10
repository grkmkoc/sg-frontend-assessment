# Tier List Builder

A compact React and TypeScript application for creating an image-based tier
list. Images can be selected or dropped into the Item List, then reordered or
moved between containers by dragging, keyboard dragging, or conventional
controls.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development
server includes the demonstration multipart receiver, so Save works without
additional setup.

Useful checks:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

`npm start` serves a completed build at
[http://localhost:8080](http://localhost:8080).

## Docker

The image contains the built frontend and the same small demonstration API in a
single Node runtime:

```sh
docker build -t tier-list-builder .
docker run --rm -p 8080:8080 tier-list-builder
```

Then open [http://localhost:8080](http://localhost:8080). Saving works without
another service or container.

## Architecture

- `src/domain` contains pure, immutable tier-list transitions and invariants.
- `useTierListController` connects the domain to React and owns browser-only
  concerns such as object URL cleanup and request state.
- The Item List and categories use one `ContainerRef` model and one generic
  `moveItem` operation. Drag/drop and the accessible movement controls dispatch
  that same operation.
- `src/infrastructure` owns multipart serialization and the HTTP client.
- `server` contains only the multipart contract receiver and static runtime
  server. Vite imports the same receiver during development.

`Item` identity is a generated UUID, never a filename or array position.
Preview URLs are deliberately excluded from domain state because they are
temporary browser resources.

## Multipart contract

The browser posts to `/api/tier-lists` by default. The request contains a JSON
text field named `payload` plus one actual file part per categorized item:

```text
payload = {"categories":[{"name":"A","items":["image_<item-id>"]}]}
image_<item-id> = <binary image file>
```

References are deterministic and collision-safe because they derive from the
immutable item ID. Original filenames may be duplicated. The browser is left
to set `Content-Type`, including the required multipart boundary.

The included receiver parses the multipart body, checks the payload shape,
verifies that payload references and uploaded file fields match, and returns a
concise summary with `201`. It does not persist files or model a production
backend. Malformed or unmatched requests return `400`.

For a real deployment, set the API URL at build time:

```sh
VITE_TIER_LIST_API_URL=https://api.example.com/tier-lists npm run build
```

or for Docker:

```sh
docker build \
  --build-arg VITE_TIER_LIST_API_URL=https://api.example.com/tier-lists \
  -t tier-list-builder .
```

## Product assumptions

- The application starts empty.
- New images always enter the Item List and must have an `image/*` MIME type.
- Category names are trimmed and cannot be empty; duplicates are allowed.
- Removing a category appends its items to the Item List in their existing
  order. Removing an image deletes it from the current in-memory session.
- Saving requires at least one category, at least one image, and no unassigned
  items. Empty categories are allowed.
- Editing and drag/drop are disabled while a request is in progress. Failed
  requests preserve the board; successful requests leave it visible.

## Testing and trade-offs

Tests concentrate on movement/order transitions, invariants, safe category and
item removal, deterministic multipart mapping, duplicate filenames, preview URL
cleanup, and key UI save flows. Pointer-coordinate drag behavior is intentionally
not unit-tested; dnd-kit supplies that mechanism while the resulting domain
transition is tested directly.

State is intentionally in memory. A production version would replace the demo
receiver, enforce upload policy on the server, add persisted drafts and
optimistic concurrency, and consider virtualization/direct-to-object-storage
uploads for very large lists.
