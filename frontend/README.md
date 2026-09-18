# Interview frontend: React + REST

The dashboard uses the Python backend's REST API with standard `fetch` calls.

See the [root setup instructions](../README.md#setup) to install dependencies and start the servers.

## Components and API client

| File | Purpose |
| --- | --- |
| `src/app/layout.tsx` | Shared HTML wrapper, global styles, and page metadata |
| `src/app/page.tsx` | Home page entry point; renders the dashboard |
| `src/lib/api.ts` | TypeScript response types and REST requests |
| `src/components/HelloWorldDashboard.tsx` | Page behavior and rendering |

## State and request flow

The dashboard is a client component. It uses React state to track the message list, initial loading, message creation, and success/error notifications.

1. On mount, an effect calls `getLatestMessages()` and stores the result in state. Its cleanup aborts the request if the component is removed.
2. Clicking the create button calls `createMessage("Hello World")`, then fetches the updated list.
3. State updates render the new list and notification. The button is disabled while creation is in progress.

Both request functions live in `src/lib/api.ts`, whose `API_URL` points to `http://localhost:8080/api`.

The dashboard currently uses:

- `GET /api/messages/latest/?limit=10` to load recent messages.
- `POST /api/messages/` with JSON `{"content":"Hello World"}` to create a message, followed by a refresh of the list.

REST responses use `created_at` for the timestamp. Request failures appear on the dashboard.

## Adding a UI feature

1. Implement and try the endpoint using the [backend guide](../backend-python/README.md#where-to-work).
2. Add a request function and response type in `src/lib/api.ts`.
3. Call the function from a component's event handler or loading effect.
4. Store the result in state and render loading, success, and error states.

The TypeScript response types describe expected JSON; they do not validate responses at runtime.

## Check frontend types

Run from `frontend`:

```sh
npm run typecheck
npm test
```

Vitest and React Testing Library are configured for component tests in `src/**/*.test.tsx`.
