# Interview frontend: React + REST

The dashboard uses the Python backend's REST API with standard `fetch` calls.

See the [root setup instructions](../README.md#setup) to install dependencies and start the servers.

## Components and API client

| File | Purpose |
| --- | --- |
| `src/app/layout.tsx` | Shared HTML wrapper, global styles, and page metadata |
| `src/app/page.tsx` | Home page entry point; renders the accounts dashboard |
| `src/app/accounts/[accountId]/page.tsx` | Account detail route |
| `src/lib/api.ts` | TypeScript response types and REST requests |
| `src/lib/money.ts` | Cents ↔ dollars formatting/parsing helpers |
| `src/components/AccountsDashboard.tsx` | Lists all accounts with their balance, links to detail pages |
| `src/components/AccountDetail.tsx` | Shows one account's balance, a transfer-money form, and its transfer log |

This is a peer-to-peer transfer demo; see [docs/features/001-p2p-transfer-service.md](../docs/features/001-p2p-transfer-service.md) for the full design.

## State and request flow

Both dashboard and detail components are client components using React state for loading/error/data, following the same pattern:

1. On mount, an effect calls the relevant `lib/api.ts` function and stores the result in state. Its cleanup aborts the request if the component is removed.
2. Loading, error, and loaded states render accordingly.

Request functions live in `src/lib/api.ts`, whose `API_URL` points to `http://localhost:8080/api`:

- `GET /api/accounts/` to list all accounts (used by `AccountsDashboard`, and by `AccountDetail` to populate the transfer form's destination dropdown, excluding the current account).
- `GET /api/accounts/{id}` to load a single account (used by `AccountDetail`; also called again after a successful transfer to refresh the displayed balance).
- `GET /api/accounts/{id}/transfers` via `getAccountTransfers` to load the transfer log (used by `AccountDetail`; also refreshed after a successful transfer). Each row's direction (Sent/Received) and counterparty name are derived client-side by comparing `from_account_id`/`to_account_id` against the current account and the accounts list.
- `POST /api/transfers/` via `createTransfer` (used by `AccountDetail`'s transfer form). Sends a fresh `crypto.randomUUID()` as the `Idempotency-Key` header on every submit.

REST responses use `balance_cents`/`amount_cents` (formatted via `formatCents` in `lib/money.ts`; the form parses dollar input back to cents via `dollarsToCents`) and `created_at`. Request failures — including backend validation errors like insufficient funds or a self-transfer — surface their `detail` message inline on the page.

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
