# 001 — Peer-to-peer transfer service

## Status

Implementing (Checkpoint 1 in progress).

## Goal and scope

Repurpose the Hello World starter into a small peer-to-peer money-transfer demo with three user-facing features:

1. Transfer money from one account to another.
2. View an account's current balance (accounts start at $1000).
3. View an account's transfer log.

Local demo only (no auth, no prod/test split, local SQLite). Authentication/authorization is mocked: there is no `User` entity or login — the dashboard lists all accounts, and clicking into one acts as "you are this account holder." Despite being a demo, money-movement correctness is a first-class requirement: atomicity, idempotent retries, protection against concurrent double-spend, and a proper double-entry ledger backing balances.

The existing `messages` feature (model/schema/route/seed/frontend dashboard) is removed and replaced by this feature.

## Requirements and acceptance criteria

- [ ] Accounts are listed on a dashboard with name + current balance; each has a detail page.
- [ ] An account's balance is always the sum of its ledger entries (no separate mutable counter to drift out of sync).
- [ ] A transfer atomically debits the sender and credits the receiver, or fails entirely (no partial writes).
- [ ] Transfers reject: non-positive amounts, self-transfers, insufficient funds, unknown accounts.
- [ ] Transfers are idempotent via a client-supplied `Idempotency-Key` header: same key + same payload replays the original result; same key + different payload is a conflict.
- [ ] Concurrent transfers that would collectively overdraw an account cannot both succeed — no double-spend race.
- [ ] Each account has a transfer log (sent + received, newest first) that is read-only (insert-only tables, no update/delete routes).

## Questions and decisions

### Open questions

None outstanding. Two rounds of clarification were resolved before implementation (see Decisions).

### Decisions

- **Accounts model:** accounts only, no `User` entity. Mocked auth = no login; navigating into an account's detail page acts as that account holder.
- **Idempotency:** client-supplied `Idempotency-Key` header (Stripe-style), stored on the `Transfer` row (unique constraint). Same key + same payload → replay original result (`200`). Same key + different payload → `409`. A commit-time unique-constraint race is caught and turned into a replay rather than an error.
- **Concurrency control:** SQLite has no real row-level `SELECT ... FOR UPDATE`. Every DB transaction acquires a `BEGIN IMMEDIATE` write lock up front (via a pysqlite event-listener recipe in `database/session.py`), serializing writes so a read-then-decide balance check can't race. A busy `timeout` is set so a blocked request waits instead of immediately failing with "database is locked".
- **Ledger design:** proper double-entry ledger. `Account` has no balance column at all. Every transfer writes two immutable, signed `LedgerEntry` rows (debit sender, credit receiver) sharing a `transfer_id`, in the same DB transaction as the `Transfer` row. Balance is always `SUM(ledger_entries.amount_cents)` for that account — a single source of truth that cannot drift, chosen over a cached balance column for correctness/simplicity at this (tiny) demo scale.
- **Additional guarantees:** non-negative balance enforcement (checked against the computed balance before debiting); immutable ledger/transfer history (insert-only, no update/delete routes ever defined); self-transfer prevention.
- **Money representation:** integer `*_cents` everywhere in the backend/API; the frontend converts to/from dollars only at the display/input boundary.
- **Seed data:** 4 demo accounts ("Alice", "Bob", "Carol", "Dave"), each seeded with one `LedgerEntry` of `+100000` cents (`transfer_id = NULL`, representing initial capitalization rather than a peer transfer). Re-seeded on every backend start/reload, matching current boilerplate behavior.
- **Transfer log scope:** per-account only, backed by the `Transfer` table (not a raw ledger dump). No global/admin-wide log.

## Design

### Data model

- **`Account`**: `id` (UUID pk), `name`, `created_at`/`updated_at`. No balance column.
- **`Transfer`**: `id` (UUID pk), `from_account_id` (FK), `to_account_id` (FK), `amount_cents` (`CHECK > 0`), `idempotency_key` (unique), `created_at`. Insert-only.
- **`LedgerEntry`**: `id` (UUID pk), `account_id` (FK), `transfer_id` (FK, nullable for seed entries), `amount_cents` (signed, `CHECK != 0`), `created_at`. Insert-only. Exactly two rows per transfer (debit + credit), same `transfer_id`.

### Concurrency

`database/session.py`: disable pysqlite's implicit transaction handling on `connect`, issue `BEGIN IMMEDIATE` on `begin` instead of the default `BEGIN`, and set a busy `timeout` in `connect_args`. Applies to every session/transaction; no per-endpoint special-casing.

### Idempotency + ledger-write flow (`POST /api/transfers/`)

1. Validate `from_account_id != to_account_id` (`400`) and `amount_cents > 0` (`422`).
2. Look up `Transfer` by `idempotency_key`: match → replay (`200`); mismatch → `409`; absent → continue.
3. Inside one locked transaction: confirm both accounts exist (`404`); compute sender balance via `SUM(ledger_entries)`; insufficient → `400`, rollback; otherwise insert `Transfer` + two `LedgerEntry` rows; commit together.
4. Unique-constraint race on `idempotency_key` at commit time → rollback, re-fetch, return as replay.
5. First execution → `201`.

### API contract

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/accounts/` | List accounts with computed balances |
| GET | `/api/accounts/{account_id}` | Single account + computed balance; `404` if missing |
| GET | `/api/accounts/{account_id}/transfers` | Account's transfer log, newest first; `404` if account missing |
| POST | `/api/transfers/` | Create a transfer; body `{from_account_id, to_account_id, amount_cents}`, header `Idempotency-Key` |

### Frontend

- `lib/api.ts`: `getAccounts`, `getAccount`, `getAccountTransfers`, `createTransfer` (sends `Idempotency-Key`, generated fresh per user submit action via `crypto.randomUUID()`).
- `lib/money.ts`: `formatCents` / `dollarsToCents` helpers, single place for cents↔dollars conversion.
- `components/AccountsDashboard.tsx` (replaces `HelloWorldDashboard.tsx`): account list + links to detail pages.
- `app/accounts/[accountId]/page.tsx` + `components/AccountDetail.tsx`: balance, transfer form, transfer log table.
- `app/page.tsx`: renders `AccountsDashboard`.

## Implementation plan and progress

### Checkpoint 1 — Accounts, ledger, & balance viewing (feature 2)

- [x] `Account` + `LedgerEntry` models; remove `Message` model. (`Transfer` model/table also added now, since `LedgerEntry.transfer_id` FKs to it — the `POST /api/transfers/` route itself is still Checkpoint 2 scope.)
- [x] `schemas/account.py`; remove `schemas/message.py`.
- [x] `api/accounts.py` (`GET /`, `GET /{id}`, computed balances); remove `api/messages.py`.
- [x] `database/seed.py`: seed 4 accounts + seed ledger entries; remove message seeding.
- [x] `main.py`: swap router registration.
- [x] `tests/conftest.py`: seeded-accounts fixture (`seeded_client`) for the per-test DB.
- [x] `tests/test_accounts.py`: list/get/404/zero-balance/empty-db cases.
- [x] Frontend: `lib/api.ts`, `lib/money.ts`, `AccountsDashboard.tsx`, `app/accounts/[accountId]/page.tsx`, `AccountDetail.tsx` (balance only), `app/page.tsx`; remove `HelloWorldDashboard.tsx`.
- [x] Frontend tests: `AccountsDashboard.test.tsx`, `AccountDetail.test.tsx` (balance-only scope).
- [x] Run backend tests/static checks; run frontend typecheck/tests.
- [x] Manual smoke test.
- [x] Update `backend-python/README.md` / `frontend/README.md` for this checkpoint's surface.

### Checkpoint 2 — Transfer money (feature 1)

- [ ] `Transfer` model.
- [ ] `session.py`: `BEGIN IMMEDIATE` concurrency recipe.
- [ ] `api/transfers.py`: idempotent, atomic, ledger-writing `POST /api/transfers/`.
- [ ] `tests/test_transfers.py`: happy path, validation errors, insufficient funds, missing account, idempotent replay, idempotency conflict, concurrency/double-spend test.
- [ ] Frontend: transfer form on `AccountDetail`, same-account/amount validation.
- [ ] Frontend tests: submit success/error paths, form validation.
- [ ] Run tests/static checks; manual smoke test; update READMEs.

### Checkpoint 3 — Transfer log (feature 3)

- [ ] `GET /api/accounts/{id}/transfers`.
- [ ] `tests/test_accounts.py` (or new file): log ordering, direction, empty state, unknown account.
- [ ] Frontend: transfer log table on `AccountDetail`.
- [ ] Frontend tests: log rendering, empty state.
- [ ] Run tests/static checks; manual smoke test; update READMEs.

## Verification

### Automated tests

| Case or check | Command/test | Result |
| --- | --- | --- |
| Checkpoint 1 backend unit/integration | `poetry run pytest` (from `backend-python`) | Pass — 5/5 (list w/ balances, get by id, 404, empty-db list, zero-ledger-entry balance) |
| Checkpoint 1 frontend unit | `npm test` (from `frontend`) | Pass — 4/4 (`AccountsDashboard` list/error, `AccountDetail` load/error) |
| Checkpoint 2 backend: happy/validation/idempotency/concurrency | `poetry run pytest` | Not run |
| Checkpoint 2 frontend | `npm test` | Not run |
| Checkpoint 3 backend: log ordering/empty/404 | `poetry run pytest` | Not run |
| Checkpoint 3 frontend | `npm test` | Not run |
| Static checks (Checkpoint 1 files) | `poetry run black`/`isort` (new files only, pre-existing `session.py`/`models/base.py` already fail `black` unrelated to this change); `poetry run mypy src`; `npm run typecheck`; `npm run lint` | Pass |

### Manual smoke test

| Steps | Expected result | Observed result |
| --- | --- | --- |
| Checkpoint 1: dashboard + balance | 4 seeded accounts @ $1000, detail page shows balance | **Pass.** Backend: `curl /api/accounts/` → 4 accounts (Alice/Bob/Carol/Dave) @ 100000 cents each; `GET /api/accounts/{id}` → 200; unknown id → 404. Frontend (localhost:3000, Chrome via claude-in-chrome): dashboard lists all 4 with `$1,000.00`; clicking "Alice" navigates to `/accounts/{id}` showing name + `$1,000.00` balance. Both dev servers were already running; backend `--reload` picked up the changes automatically. Run 2026-09-25. |
| Checkpoint 2: transfer + retry + over-limit | Balances update once; retry no-ops; over-limit rejected | Not run |
| Checkpoint 3: transfer log | Both sender and receiver see the transfer in their log | Not run |

## Progress and handoff

- Completed work: plan approved; feature doc created; **Checkpoint 1 implemented and verified** (accounts + double-entry ledger seed data, `GET /api/accounts/` and `GET /api/accounts/{id}` with computed balances, dashboard + detail UI, backend/frontend tests, static checks, manual smoke test, README updates). Hello World feature fully removed.
- Remaining work and blockers: Checkpoints 2 (transfer money) and 3 (transfer log) not started. Paused here for user review before starting Checkpoint 2, per staged-implementation agreement.
- Next concrete step: implement Checkpoint 2 — `POST /api/transfers/` with idempotency, `BEGIN IMMEDIATE` concurrency control, and double-entry ledger writes; transfer form on `AccountDetail`.
- Known limitations or follow-up work: single-process demo (the `BEGIN IMMEDIATE` concurrency approach doesn't extend to multiple SQLite writer processes); no reconciliation job (not needed since balance is always computed live from the ledger, not cached).
